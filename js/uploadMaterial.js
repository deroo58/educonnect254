// uploadMaterial.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    // Only teachers can upload
    if (userSnap.exists() && userSnap.data().role === "teacher") {
        document.querySelectorAll(".topic").forEach((topicCard) => {
            const title = topicCard.querySelector("h3").textContent.trim();
            const buttonsDiv = topicCard.querySelector(".topic-buttons");

            // Add upload button beside existing ones
            const uploadBtn = document.createElement("button");
            uploadBtn.textContent = "📤 Upload Material";
            uploadBtn.classList.add("btn");
            buttonsDiv.appendChild(uploadBtn);

            uploadBtn.addEventListener("click", async () => {
                const subject = document.title.split(" | ")[0]; // e.g., "Mathematics Form I"
                const form = subject.match(/Form\s(\w+)/)?.[1] || "Unknown";

                const fileInput = document.createElement("input");
                fileInput.type = "file";
                fileInput.accept = ".pdf,.docx,.pptx";
                fileInput.click();

                fileInput.addEventListener("change", async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const filePath = `materials/${user.uid}/${Date.now()}_${file.name}`;
                    const storageRef = ref(storage, filePath);

                    try {
                        await uploadBytes(storageRef, file);
                        const fileURL = await getDownloadURL(storageRef);

                        await addDoc(collection(db, "materials"), {
                            teacherId: user.uid,
                            teacherName: userSnap.data().username || user.email,
                            subject,
                            form,
                            topic: title,
                            fileName: file.name,
                            fileURL,
                            status: "pending",
                            timestamp: serverTimestamp(),
                        });

                        alert("✅ Material uploaded successfully for review!");
                    } catch (error) {
                        console.error("Upload failed:", error);
                        alert("❌ Failed to upload material. Try again.");
                    }
                });
            });
        });
    }
});
