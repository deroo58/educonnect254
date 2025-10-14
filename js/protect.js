// js/protect.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBwgRzr0A8qR2lzOlLP_B1mCiJ90IS2Nms",
    authDomain: "educonnect-2b680.firebaseapp.com",
    projectId: "educonnect-2b680",
    storageBucket: "educonnect-2b680.firebasestorage.app",
    messagingSenderId: "438989414011",
    appId: "1:438989414011:web:c21fe944e6da56094b0cde",
    measurementId: "G-KW63Z7E1CK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Check login state
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Not logged in → redirect to login page
        window.location.href = "login.html";
    } else {
        console.log("✅ Logged in as:", user.email);
    }
});

// Logout button functionality
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        signOut(auth).then(() => {
            window.location.href = "login.html";
        }).catch((error) => {
            console.error("Logout failed:", error);
        });
    });
}
