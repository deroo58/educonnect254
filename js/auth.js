// js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
    getAuth,
    setPersistence,
    browserSessionPersistence,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBwgRzr0A8qR2lzOlLP_B1mCiJ90IS2Nms",
    authDomain: "educonnect-2b680.firebaseapp.com",
    projectId: "educonnect-2b680",
    storageBucket: "educonnect-2b680.firebasestorage.app",
    messagingSenderId: "438989414011",
    appId: "1:438989414011:web:c21fe944e6da56094b0cde",
    measurementId: "G-KW63Z7E1CK",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Force session-based login (logs out when browser closes)
setPersistence(auth, browserSessionPersistence).then(() => {
    console.log("✅ Using session persistence mode");
});

// --- LOGIN FUNCTION ---
const loginBtn = document.getElementById("login-btn");
if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert("Login successful!");
            window.location.href = "index.html";
        } catch (error) {
            alert("❌ " + error.message);
        }
    });
}

// --- SIGNUP FUNCTION ---
const signupBtn = document.getElementById("signup-btn");
if (signupBtn) {
    signupBtn.addEventListener("click", async () => {
        const email = document.getElementById("signup-email").value;
        const password = document.getElementById("signup-password").value;

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert("Account created successfully!");
            window.location.href = "index.html";
        } catch (error) {
            alert("❌ " + error.message);
        }
    });
}

// --- REDIRECT HANDLING ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("✅ Logged in as:", user.email);
    } else {
        console.log("🚪 User signed out or session expired");
    }
});
