// js/adminAuthGuard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc
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

// ✅ Check if user is logged in and an admin
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // No user — send to login page
        window.location.href = "login.html";
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();

            if (userData.role !== "admin") {
                alert("⚠️ Access denied. Admins only.");
                window.location.href = "dashboard.html"; // student page
            }
        } else {
            alert("⚠️ User data not found.");
            await signOut(auth);
            window.location.href = "login.html";
        }
    } catch (err) {
        console.error("Error checking admin access:", err);
        await signOut(auth);
        window.location.href = "login.html";
    }
});
