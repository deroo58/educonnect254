// ✅ Firebase Comment System – Final Version (Local user + Firestore data + Sidebar UI)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    doc,
    getDoc,
    deleteDoc,
    updateDoc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// --- Firebase Config ---
const firebaseConfig = {
    apiKey: "AIzaSyBwgRzr0A8qR2lzOlLP_B1mCiJ90IS2Nms",
    authDomain: "educonnect-2b680.firebaseapp.com",
    projectId: "educonnect-2b680",
    storageBucket: "educonnect-2b680.appspot.com",
    messagingSenderId: "438989414011",
    appId: "1:438989414011:web:c21fe944e6da56094b0cde",
    measurementId: "G-KW63Z7E1CK",
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;
window.currentTopic = "default";

// --- Restore user from localStorage if available ---
const savedUser = localStorage.getItem("educonnectUser");
if (savedUser) {
    try {
        currentUser = JSON.parse(savedUser);
        console.log("✅ Loaded user from localStorage:", currentUser.email);
    } catch (e) {
        console.warn("⚠️ Failed to parse localStorage user.");
    }
}

// --- Track user login state ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("✅ Logged in:", user.email);
        localStorage.setItem("user", JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "Unknown"
        }));
    } else {
        currentUser = null;
        console.log("❌ No user logged in");
        localStorage.removeItem("user");
    }
});


// --- Sidebar toggle ---
window.toggleCommentsSidebar = function (topicName) {
    if (topicName) {
        window.currentTopic = topicName;
        document.getElementById("topicTitle").textContent = `Comments - ${topicName}`;
    }

    const sidebar = document.getElementById("commentsSidebar");
    sidebar.classList.toggle("open");

    if (sidebar.classList.contains("open")) loadComments();
};

// --- Load Comments ---
import { onSnapshot } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

let unsubscribeComments = null;

window.loadComments = function () {
    const list = document.getElementById("commentsList");
    list.innerHTML = "<p>Loading comments...</p>";

    // Remove any previous listener
    if (unsubscribeComments) unsubscribeComments();

    // Create scroll buttons if not present
    let scrollContainer = document.getElementById("scrollButtons");
    if (!scrollContainer) {
        scrollContainer = document.createElement("div");
        scrollContainer.id = "scrollButtons";
        scrollContainer.innerHTML = `
            <button id="scrollTopBtn" class="scroll-btn">⬆️</button>
            <button id="scrollBottomBtn" class="scroll-btn">⬇️</button>
        `;
        list.parentElement.appendChild(scrollContainer);

        // Scroll actions
        document.getElementById("scrollTopBtn").onclick = () => list.scrollTo({ top: 0, behavior: "smooth" });
        document.getElementById("scrollBottomBtn").onclick = () => list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
    }

    try {
        const q = query(
            collection(db, "comments"),
            where("topic", "==", window.currentTopic),
            orderBy("timestamp", "asc")
        );

        unsubscribeComments = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                list.innerHTML = "<p>No comments yet. Be the first!</p>";
                return;
            }

            list.innerHTML = "";

            snapshot.forEach((docSnap) => {
                const c = docSnap.data();
                const time = c.timestamp?.toDate?.().toLocaleString() || "Just now";
                const div = document.createElement("div");
                div.className = "comment-item";
                div.innerHTML = `
                    <div class="comment-content">
                        <img src="${c.profilePic || "https://i.ibb.co/2K1sZqX/default-avatar.png"}" />
                        <div class="comment-body">
                            <strong>${c.username || "Anonymous"}</strong>
                            <small>${time}</small>
                            <div>${c.text}</div>
                        </div>
                    </div>
                `;
                list.appendChild(div);
            });

            // Auto-scroll to bottom for new comments
            list.scrollTop = list.scrollHeight;
        });

        // Show or hide buttons dynamically
        list.addEventListener("scroll", () => {
            const topBtn = document.getElementById("scrollTopBtn");
            const bottomBtn = document.getElementById("scrollBottomBtn");

            if (!topBtn || !bottomBtn) return;

            const atTop = list.scrollTop <= 50;
            const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight <= 50;

            topBtn.style.display = atTop ? "none" : "block";
            bottomBtn.style.display = atBottom ? "none" : "block";
        });

    } catch (err) {
        console.error("Error loading comments:", err);
        list.innerHTML = "<p>⚠️ Failed to load comments.</p>";
    }
};




// Scroll to bottom after loading comments
const list = document.getElementById("commentsList");
list.scrollTop = list.scrollHeight;


// --- Post Comment ---
window.postComment = async function () {
    const textArea = document.getElementById("commentText");
    const text = textArea.value.trim();
    if (!text) return alert("Enter a comment first.");

    if (!currentUser) return alert("You must be logged in to comment.");

    try {
        // 🔹 Fetch user profile directly by UID
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);

        let username = "Anonymous";
        let profilePic = "";

        if (userSnap.exists()) {
            const data = userSnap.data();
            username = data.username || username;
            profilePic = data.profilePic || "";
        }

        await addDoc(collection(db, "comments"), {
            topic: window.currentTopic,
            text,
            username,
            profilePic,
            userId: currentUser.uid,
            timestamp: serverTimestamp(),
        });

        textArea.value = "";
        loadComments();
    } catch (err) {
        console.error("❌ Failed to post comment:", err);
        alert("Failed to post comment. Please check Firestore rules or permissions.");
    }
};

// --- Edit Comment ---
window.editComment = async function (id, oldText) {
    const newText = prompt("Edit your comment:", oldText);
    if (!newText || newText.trim() === "") return;

    try {
        const ref = doc(db, "comments", id);
        await updateDoc(ref, { text: newText.trim() });
        loadComments();
    } catch (err) {
        console.error("Failed to edit comment:", err);
    }
};

// --- Delete Comment ---
window.deleteComment = async function (id) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
        const ref = doc(db, "comments", id);
        await deleteDoc(ref);
        loadComments();
    } catch (err) {
        console.error("Failed to delete comment:", err);
    }
};

// --- Debug Helper ---
window.showLocalUser = function () {
    console.log("🧠 Local user data:", JSON.parse(localStorage.getItem("educonnectUser") || "{}"));
};

// 🔍 Debug helper to check user data in localStorage or Firebase Auth
window.checkUserStorage = function () {
    console.log("🧩 Checking localStorage...");
    console.log(localStorage);

    const user = JSON.parse(localStorage.getItem("user"));
    console.log("👤 User in localStorage:", user);

    if (currentUser) {
        console.log("✅ Firebase Auth user:", {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
        });
    } else {
        console.log("⚠️ No Firebase Auth user detected.");
    }
};
