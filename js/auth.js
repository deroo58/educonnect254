// js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBwgRzr0A8qR2lzOlLP_B1mCiJ90IS2Nms",
    authDomain: "educonnect-2b680.firebaseapp.com",
    projectId: "educonnect-2b680",
    storageBucket: "educonnect-2b680.appspot.com",
    messagingSenderId: "438989414011",
    appId: "1:438989414011:web:c21fe944e6da56094b0cde",
    measurementId: "G-KW63Z7E1CK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------------- LOGIN ----------------
const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value.trim();
        const loader = document.getElementById("loader");
        loader.style.display = "flex";

        try {
            const userCred = await signInWithEmailAndPassword(auth, email, password);
            const user = userCred.user;

            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();

                // Save to localStorage
                localStorage.setItem("eduUser", JSON.stringify({
                    uid: user.uid,
                    username: userData.username,
                    photoURL: userData.photoURL || "",
                    role: userData.role || "student"
                }));

                loader.style.display = "none";

                // Redirect based on role
                if (userData.role === "admin") {
                    window.location.href = "admin/index.html";
                } else if (userData.role === "teacher") {
                    window.location.href = "teacher-dashboard.html";
                } else {
                    window.location.href = "dashboard.html";
                }

            } else {
                loader.style.display = "none";
                alert("⚠️ No user data found. Please contact support.");
            }

        } catch (err) {
            loader.style.display = "none";
            alert("❌ Login failed: " + err.message);
        }
    });
}

// ---------------- SIGNUP ----------------
const signupForm = document.getElementById("signup-form");
if (signupForm) {
    const usernameInput = document.getElementById("signup-username");
    const usernameError = document.getElementById("username-error");
    let usernameAvailable = false;

    // ✅ Check username availability
    usernameInput.addEventListener("input", async () => {
        const username = usernameInput.value.trim();
        usernameError.textContent = "";

        if (username.length < 3) {
            usernameError.textContent = "Username must be at least 3 characters.";
            usernameError.style.color = "red";
            usernameAvailable = false;
            return;
        }

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            usernameError.textContent = "❌ Username is already taken.";
            usernameError.style.color = "red";
            usernameAvailable = false;
        } else {
            usernameError.textContent = "✅ Username is available.";
            usernameError.style.color = "green";
            usernameAvailable = true;
        }
    });

    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("signup-email").value.trim();
        const password = document.getElementById("signup-password").value.trim();
        const confirmPassword = document.getElementById("signup-confirm-password").value.trim();
        const username = document.getElementById("signup-username").value.trim();
        const role = document.getElementById("signup-role").value;
        const loader = document.getElementById("loader");

        if (!usernameAvailable) {
            alert("❌ Please choose a different username.");
            return;
        }

        if (password !== confirmPassword) {
            alert("❌ Passwords do not match!");
            return;
        }

        loader.style.display = "flex";

        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCred.user;

            await setDoc(doc(db, "users", user.uid), {
                username,
                email,
                role,
                photoURL: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            });

            localStorage.setItem("eduUser", JSON.stringify({
                uid: user.uid,
                username,
                role,
                photoURL: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }));

            loader.style.display = "none";

            // Redirect based on role
            if (role === "admin") {
                window.location.href = "admin/index.html";
            } else if (role === "teacher") {
                window.location.href = "teacher-dashboard.html";
            } else {
                window.location.href = "dashboard.html";
            }

        } catch (err) {
            loader.style.display = "none";
            alert("❌ Signup failed: " + err.message);
        }
    });
}

// ---------------- LISTEN FOR AUTH STATE ----------------
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("✅ Logged in:", user.email);
    } else {
        console.log("⚠️ No user logged in.");
    }
});
