// js/profile.js — handles profile viewing & editing with upload progress

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
    getFirestore, doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
    getAuth, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
    getStorage, ref, uploadBytesResumable, getDownloadURL
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

// ---------- Elements ----------
const nameInput = document.getElementById("profile-name");
const usernameInput = document.getElementById("profile-username");
const bioInput = document.getElementById("profile-bio");
const profileImg = document.getElementById("profile-img");
const fileInput = document.getElementById("profile-file");
const updateBtn = document.getElementById("update-profile-btn");
const loader = document.getElementById("loader");
const progressContainer = document.getElementById("upload-progress-container");
const progressBar = document.getElementById("upload-progress-bar");
const progressText = document.getElementById("upload-progress-text");

let uploadedFile = null;

// ---------- Loader ----------
function showLoader(msg = "Updating...") {
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

// ---------- Load profile ----------
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        alert("⚠️ Please log in first!");
        window.location.href = "login.html";
        return;
    }

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const data = userSnap.data();
        nameInput.value = data.name || "";
        usernameInput.value = data.username || "";
        bioInput.value = data.bio || "";
        profileImg.src = data.photoURL || "assets/default-avatar.png";
    }
});

// ---------- Handle profile image selection ----------
fileInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        uploadedFile = file;
        const reader = new FileReader();
        reader.onload = () => {
            profileImg.src = reader.result; // Instant preview
        };
        reader.readAsDataURL(file);
    }
});

// ---------- Update profile ----------
updateBtn?.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
        alert("⚠️ Not logged in!");
        return;
    }

    showLoader("Updating profile...");

    const name = nameInput.value.trim();
    const username = usernameInput.value.trim();
    const bio = bioInput.value.trim();

    try {
        let photoURL = profileImg.src;

        // Upload with progress tracking
        if (uploadedFile) {
            const photoRef = ref(storage, `profilePictures/${user.uid}.jpg`);
            const uploadTask = uploadBytesResumable(photoRef, uploadedFile);

            if (progressContainer && progressBar && progressText) {
                progressContainer.style.display = "block";
                progressText.style.display = "block";
            }

            await new Promise((resolve, reject) => {
                uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        if (progressBar) progressBar.style.width = `${progress}%`;
                        if (progressText) progressText.textContent = `Uploading: ${progress.toFixed(0)}%`;
                    },
                    (error) => reject(error),
                    async () => {
                        photoURL = await getDownloadURL(uploadTask.snapshot.ref);
                        if (progressText) progressText.textContent = "Upload complete ✅";
                        setTimeout(() => {
                            if (progressContainer) progressContainer.style.display = "none";
                            if (progressText) progressText.style.display = "none";
                        }, 1500);
                        resolve();
                    }
                );
            });
        }

        // Update Firestore
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            name,
            username,
            bio,
            photoURL
        });

        // Update Firebase Auth if photo changed
        if (uploadedFile) {
            await updateProfile(user, { photoURL });
            profileImg.src = photoURL; // update instantly
            uploadedFile = null;
        }

        alert("✅ Profile updated successfully!");
    } catch (err) {
        console.error("Profile update error:", err);
        alert("❌ " + err.message);
    } finally {
        hideLoader();
    }
});
