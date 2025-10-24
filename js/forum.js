import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    serverTimestamp,
    onSnapshot,
    getDocs,
    updateDoc,
    doc,
    arrayUnion,
    arrayRemove,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// 🔥 Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBwgRzr0A8qR2lzOlLP_B1mCiJ90IS2Nms",
    authDomain: "educonnect-2b680.firebaseapp.com",
    projectId: "educonnect-2b680",
    storageBucket: "educonnect-2b680.appspot.com",
    messagingSenderId: "438989414011",
    appId: "1:438989414011:web:c21fe944e6da56094b0cde",
    measurementId: "G-KW63Z7E1CK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sidebar toggle
const forumBtn = document.getElementById("forumBtn");
const forumSidebar = document.getElementById("forumSidebar");
const closeForum = document.getElementById("closeForum");
const postsDiv = document.getElementById("forumPosts");

forumBtn.addEventListener("click", () => {
    forumSidebar.classList.add("active");
    setTimeout(() => scrollToBottom(), 300);
});
closeForum.addEventListener("click", () => forumSidebar.classList.remove("active"));

let currentUser = null;

// Track login
onAuthStateChanged(auth, (user) => {
    currentUser = user;
});

// 🧭 Scroll helpers
function scrollToBottom() {
    postsDiv.scrollTo({
        top: postsDiv.scrollHeight,
        behavior: "smooth"
    });
}
function scrollToTop() {
    postsDiv.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// ➕ Create scroll buttons
const scrollDownBtn = document.createElement("button");
scrollDownBtn.id = "scrollDownBtn";
scrollDownBtn.innerHTML = "⬇️";
scrollDownBtn.title = "Scroll to latest message";
scrollDownBtn.style.cssText = `
  position: fixed;
  bottom: 170px;
  right: 30px;
  background: #007bff;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  display: none;
  z-index: 9999;
`;
document.body.appendChild(scrollDownBtn);
scrollDownBtn.addEventListener("click", scrollToBottom);

const scrollUpBtn = document.createElement("button");
scrollUpBtn.id = "scrollUpBtn";
scrollUpBtn.innerHTML = "⬆️";
scrollUpBtn.title = "Scroll to first message";
scrollUpBtn.style.cssText = `
  position: fixed;
  bottom: 220px;
  right: 30px;
  background: #28a745;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  display: none;
  z-index: 9999;
`;
document.body.appendChild(scrollUpBtn);
scrollUpBtn.addEventListener("click", scrollToTop);

// Hide/show scroll buttons with sidebar
forumSidebar.addEventListener("transitionend", () => {
    if (forumSidebar.classList.contains("active")) {
        scrollUpBtn.style.display = "flex";
        scrollDownBtn.style.display = "flex";
    } else {
        scrollUpBtn.style.display = "none";
        scrollDownBtn.style.display = "none";
    }
});

// Show/hide buttons on scroll
postsDiv.addEventListener("scroll", () => {
    const atBottom = postsDiv.scrollHeight - postsDiv.scrollTop === postsDiv.clientHeight;
    scrollDownBtn.style.display = atBottom ? "none" : "block";
    scrollUpBtn.style.display = postsDiv.scrollTop > 100 ? "block" : "none";
});

// 🔁 Load posts in real-time
function loadPostsRealtime() {
    const postsQuery = query(collection(db, "forum_posts"), orderBy("timestamp", "asc"));
    onSnapshot(
        postsQuery,
        (snapshot) => {
            if (snapshot.empty) {
                postsDiv.innerHTML = "<p>No posts yet. Be the first to share!</p>";
                return;
            }
            postsDiv.innerHTML = "";
            snapshot.forEach((docSnap) => {
                const post = docSnap.data();
                const postEl = document.createElement("div");
                postEl.classList.add("forum-post");

                const liked = currentUser && post.likedBy && post.likedBy.includes(currentUser.uid);

                postEl.innerHTML = `
                    <div class="author">${post.username || "Anonymous"}</div>
                    <div class="time">${post.timestamp ? post.timestamp.toDate().toLocaleString() : ""}</div>
                    <div class="message">${post.message}</div>
                    <div class="post-actions">
                        <button class="upvote ${liked ? "liked" : ""}" data-id="${docSnap.id}">
                            ${liked ? "❤️" : "🤍"} ${post.upvotes || 0}
                        </button>
                        <button class="reply">💬 Reply</button>
                    </div>
                    <div class="reply-section" id="replies-${docSnap.id}"></div>
                `;
                postsDiv.appendChild(postEl);

                // Load replies
                loadReplies(docSnap.id, postEl.querySelector(".reply-section"));

                // 🗳 Like system with animation
                const likeBtn = postEl.querySelector(".upvote");
                likeBtn.addEventListener("click", async () => {
                    if (!currentUser) return alert("Please log in to like posts.");

                    const postRef = doc(db, "forum_posts", docSnap.id);
                    const alreadyLiked = post.likedBy && post.likedBy.includes(currentUser.uid);

                    try {
                        if (alreadyLiked) {
                            await updateDoc(postRef, {
                                upvotes: post.upvotes - 1,
                                likedBy: arrayRemove(currentUser.uid)
                            });
                            likeBtn.classList.remove("liked");
                            likeBtn.innerHTML = `🤍 ${post.upvotes - 1}`;
                        } else {
                            await updateDoc(postRef, {
                                upvotes: post.upvotes + 1,
                                likedBy: arrayUnion(currentUser.uid)
                            });
                            likeBtn.classList.add("liked");
                            likeBtn.innerHTML = `❤️ ${post.upvotes + 1}`;

                            // ❤️ Heart burst animation
                            const heart = document.createElement("span");
                            heart.classList.add("heart-burst");
                            heart.textContent = "❤️";
                            likeBtn.appendChild(heart);
                            setTimeout(() => heart.remove(), 800);

                        }
                    } catch (err) {
                        console.error("❌ Error liking post:", err);
                        alert("Failed to like post. Check console for details.");
                    }
                });

                // 💬 Reply button
                const replyBtn = postEl.querySelector(".reply");
                replyBtn.addEventListener("click", () => {
                    const replySection = postEl.querySelector(".reply-section");
                    if (replySection.querySelector(".reply-form")) {
                        replySection.innerHTML = ""; // collapse
                        loadReplies(docSnap.id, replySection);
                        return;
                    }
                    const form = document.createElement("div");
                    form.classList.add("reply-form");
                    form.innerHTML = `
                        <textarea placeholder="Write a reply..."></textarea>
                        <button>Post Reply</button>
                    `;
                    replySection.appendChild(form);
                    const btn = form.querySelector("button");
                    btn.addEventListener("click", async () => {
                        const text = form.querySelector("textarea").value.trim();
                        if (!text) return alert("Enter a reply!");
                        let username = "Anonymous";

                        if (currentUser) {
                            const userDocRef = doc(db, "users", currentUser.uid);
                            const userSnap = await getDoc(userDocRef);
                            if (userSnap.exists()) {
                                const data = userSnap.data();
                                username = data.username || "Anonymous";
                            }
                        }

                        await addDoc(collection(db, "forum_replies"), {
                            postId: docSnap.id,
                            message: text,
                            username,
                            timestamp: serverTimestamp()
                        });

                        loadReplies(docSnap.id, replySection);
                        form.remove();
                        scrollToBottom();
                    });
                });
            });

            // Auto-scroll to bottom after posts load or update
            setTimeout(() => scrollToBottom(), 300);
        },
        (error) => {
            console.error("Error loading posts:", error);
            postsDiv.innerHTML = "<p>Failed to load posts. Try again later.</p>";
        }
    );
}

// 🗨️ Load replies
async function loadReplies(postId, container) {
    const repliesRef = collection(db, "forum_replies");
    const snapshot = await getDocs(repliesRef);
    container.innerHTML = "";
    snapshot.forEach((docSnap) => {
        const r = docSnap.data();
        if (r.postId === postId) {
            const div = document.createElement("div");
            div.classList.add("reply");
            div.innerHTML = `
                <div class="author">${r.username}</div>
                <div class="message">${r.message}</div>
            `;
            container.appendChild(div);
        }
    });
}

// ➕ Post new message
document.getElementById("postForumBtn").addEventListener("click", async () => {
    const msg = document.getElementById("newPostMessage").value.trim();
    if (!msg) return alert("Please enter a message.");

    let username = "Anonymous";

    try {
        if (currentUser) {
            const userDocRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
                const data = userSnap.data();
                username = data.username || "Anonymous";
            }
        }

        await addDoc(collection(db, "forum_posts"), {
            username,
            message: msg,
            upvotes: 0,
            likedBy: [],
            timestamp: serverTimestamp()
        });
        document.getElementById("newPostMessage").value = "";
        scrollToBottom();
    } catch (err) {
        console.error("Error posting forum message:", err);
        alert("Failed to post. Check console for details.");
    }
});

// Start real-time listener
window.addEventListener("load", loadPostsRealtime);
