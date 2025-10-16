// js/auth.js — Firebase Auth + Firestore + Default Profile Photo

// ---------- Imports ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";

import {
    getAuth,
    setPersistence,
    browserSessionPersistence,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

// ---------- Firebase config ----------
const firebaseConfig = {
    apiKey: "AIzaSyBwgRzr0A8qR2lzOlLP_B1mCiJ90IS2Nms",
    authDomain: "educonnect-2b680.firebaseapp.com",
    projectId: "educonnect-2b680",
    storageBucket: "educonnect-2b680.appspot.com",
    messagingSenderId: "438989414011",
    appId: "1:438989414011:web:c21fe944e6da56094b0cde",
    measurementId: "G-KW63Z7E1CK",
};

// ---------- Initialize ----------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ---------- Session persistence ----------
setPersistence(auth, browserSessionPersistence)
    .then(() => console.log("✅ Session persistence enabled"))
    .catch(err => console.warn("Persistence error:", err.message));

// ---------- Loader helpers ----------
const loader = document.getElementById("loader");
function showLoader(msg = "Please wait...") {
    if (loader) {
        loader.style.display = "flex";
        const p = loader.querySelector("p");
        if (p) p.textContent = msg;
    }
}
function hideLoader() {
    if (!loader) return;
    loader.classList.add("fade-out");
    setTimeout(() => {
        loader.style.display = "none";
        loader.classList.remove("fade-out");
    }, 400);
}

// ---------- Utility: normalize username ----------
function normalizeUsername(u) {
    return u.trim().toLowerCase();
}

// ---------- Default Profile Photo ----------
const DEFAULT_PROFILE_PHOTO =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

// ---------- SIGNUP (with unique username + default photo) ----------
const signupBtn = document.getElementById("signup-btn");
if (signupBtn) {
    signupBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const usernameInput = document.getElementById("signup-username");
        const usernameError = document.getElementById("username-error");
        const emailInput = document.getElementById("signup-email");
        const passwordInput = document.getElementById("signup-password");
        const roleSelect = document.getElementById("signup-role");

        usernameError && (usernameError.textContent = "");

        const rawUsername = usernameInput?.value || "";
        const username = normalizeUsername(rawUsername);
        const email = (emailInput?.value || "").trim();
        const password = (passwordInput?.value || "").trim();
        const role = roleSelect?.value || "";

        if (!username || !email || !password || !role) {
            alert("⚠️ Please fill in all fields.");
            return;
        }

        showLoader("Checking username...");

        try {
            // Check username uniqueness
            const usernameRef = doc(db, "usernames", username);
            const usernameSnap = await getDoc(usernameRef);
            if (usernameSnap.exists()) {
                hideLoader();
                if (usernameError)
                    usernameError.textContent = "❌ This username is already taken. Try another.";
                return;
            }

            // Create user account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Assign default profile photo
            await updateProfile(user, {
                displayName: username,
                photoURL: DEFAULT_PROFILE_PHOTO
            });

            // Save full user profile
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                username: username,
                email: user.email,
                role: role,
                name: username,
                progress: 0,
                photoURL: DEFAULT_PROFILE_PHOTO,
                createdAt: serverTimestamp()
            });

            // Add username->uid mapping for uniqueness
            await setDoc(usernameRef, { uid: user.uid, createdAt: serverTimestamp() });

            // Save local session info
            localStorage.setItem("educonnectUsername", username);
            localStorage.setItem("educonnectRole", role);
            localStorage.setItem("educonnectEmail", user.email);

            alert("🎉 Account created successfully!");
            window.location.href = "dashboard.html";
        } catch (err) {
            console.error("Signup error:", err);
            alert("❌ " + err.message);
        } finally {
            hideLoader();
        }
    });
}

// ---------- LOGIN (load user + store data locally) ----------
const loginBtn = document.getElementById("login-btn");
if (loginBtn) {
    loginBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const email = (document.getElementById("login-email")?.value || "").trim();
        const password = (document.getElementById("login-password")?.value || "").trim();

        if (!email || !password) {
            alert("⚠️ Please fill in both fields.");
            return;
        }

        showLoader("Logging you in...");

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Fetch user's Firestore data
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.username) localStorage.setItem("educonnectUsername", data.username);
                if (data.role) localStorage.setItem("educonnectRole", data.role);
                if (data.email) localStorage.setItem("educonnectEmail", data.email);
            }

            alert("✅ Login successful!");
            window.location.href = "dashboard.html";
        } catch (err) {
            console.error("Login error:", err);
            alert("❌ " + err.message);
        } finally {
            hideLoader();
        }
    });
}

// ---------- Auth State ----------
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Auth state: signed in:", user.email);
    } else {
        console.log("Auth state: signed out");
    }
});
