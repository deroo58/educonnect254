// admin/js/content.js
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp }
    from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject }
    from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { app } from "./firebaseConfig.js";

// ✅ Initialize services
const db = getFirestore(app);
const storage = getStorage(app);

const uploadForm = document.getElementById("uploadMaterialForm");
const tableBody = document.getElementById("materialsTableBody");
const subjectSelect = document.getElementById("subjectSelect");
const formSelect = document.getElementById("formSelect");
const topicSelect = document.getElementById("topicSelect");

// ================= TOPICS DATABASE =================
const topicsData = {
    mathematics: {
        form1: [
            "Natural Numbers",
            "Factors & Multiples",
            "Integers",
            "Fractions & Decimals",
            "Algebraic Expressions",
            "Linear Equations",
            "Mensuration",
            "Geometry & Angles"
        ],
        form2: [
            "Quadratic Equations",
            "Logarithms",
            "Trigonometry",
            "Coordinate Geometry"
        ]
    },
    english: {
        form1: [
            "Parts of Speech",
            "Comprehension",
            "Composition Writing",
            "Punctuation & Grammar"
        ],
        form2: [
            "Literature Analysis",
            "Summary Writing",
            "Speech Writing"
        ]
    },
    chemistry: {
        form1: [
            "Introduction to Chemistry",
            "Lab Safety",
            "Elements, Compounds & Mixtures"
        ]
    },
    physics: {
        form1: [
            "Measurements",
            "Force",
            "Work, Power & Energy",
            "Pressure"
        ]
    },
    history: {
        form1: [
            "Early Man",
            "Development of Agriculture",
            "The Kenyan Communities",
            "Contacts Between East Africa and the Outside World"
        ]
    },
    biology: {
        form1: [
            "Introduction to Biology",
            "Cell Structure and Function",
            "Classification I",
            "The Cell"
        ]
    }
};

// ================= UPDATE TOPICS ON CHANGE =================
function updateTopics() {
    const subject = subjectSelect.value?.toLowerCase().trim();
    const form = formSelect.value?.toLowerCase().trim();

    topicSelect.innerHTML = "<option value='' disabled selected>Select Topic</option>";

    if (topicsData[subject] && topicsData[subject][form]) {
        topicsData[subject][form].forEach(topic => {
            const option = document.createElement("option");
            option.value = topic;
            option.textContent = topic;
            topicSelect.appendChild(option);
        });
    } else {
        const opt = document.createElement("option");
        opt.disabled = true;
        opt.textContent = "No topics available for this selection";
        topicSelect.appendChild(opt);
    }
}

subjectSelect.addEventListener("change", updateTopics);
formSelect.addEventListener("change", updateTopics);

// ================= UPLOAD NEW MATERIAL =================
uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const subject = subjectSelect.value.trim();
    const form = formSelect.value.trim();
    const topic = topicSelect.value.trim();
    const file = document.getElementById("fileInput").files[0];

    if (!file) return alert("Please select a file.");
    if (!subject || !form || !topic) return alert("Please select subject, form, and topic.");

    const fileType = file.type.includes("pdf") ? "pdf"
        : file.type.includes("video") ? "video"
            : "other";

    const cleanTopic = topic.replace(/\s+/g, "_").toLowerCase();
    const uniqueName = `${Date.now()}_${file.name}`;
    const storagePath = `materials/${subject.toLowerCase()}/${form.toLowerCase()}/${cleanTopic}/${uniqueName}`;
    const storageRef = ref(storage, storagePath);

    try {
        await uploadBytes(storageRef, file);
        const fileURL = await getDownloadURL(storageRef);

        await addDoc(collection(db, "materials"), {
            subject,
            form,
            topic,
            fileType,
            fileURL,
            uploadedAt: serverTimestamp()
        });

        alert("✅ Material uploaded successfully!");
        uploadForm.reset();
        topicSelect.innerHTML = "<option value='' disabled selected>Select Topic</option>";
        loadMaterials();
    } catch (err) {
        console.error("Upload error:", err);
        alert("❌ Error uploading file.");
    }
});

// ================= LOAD MATERIALS =================
async function loadMaterials() {
    tableBody.innerHTML = "";
    const snapshot = await getDocs(collection(db, "materials"));

    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const row = document.createElement("tr");

        const fileLabel = data.fileType === "pdf"
            ? "📄 View PDF"
            : data.fileType === "video"
                ? "🎥 Watch Video"
                : "🔗 Open File";

        row.innerHTML = `
            <td>${data.subject}</td>
            <td>${data.form}</td>
            <td>${data.topic}</td>
            <td><a href="${data.fileURL}" target="_blank">${fileLabel}</a></td>
            <td><button class="deleteBtn" data-id="${docSnap.id}" data-url="${data.fileURL}">🗑️ Delete</button></td>
        `;
        tableBody.appendChild(row);
    });

    // ========== DELETE FUNCTIONALITY ==========
    document.querySelectorAll(".deleteBtn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-id");
            const fileURL = btn.getAttribute("data-url");

            if (!confirm("Are you sure you want to delete this material?")) return;

            try {
                const fileRef = ref(storage, fileURL);
                await deleteObject(fileRef);
                await deleteDoc(doc(db, "materials", id));
                alert("🗑️ Deleted successfully!");
                loadMaterials();
            } catch (err) {
                console.error("Delete error:", err);
                alert("❌ Error deleting file.");
            }
        });
    });
}

// Load on start
loadMaterials();
