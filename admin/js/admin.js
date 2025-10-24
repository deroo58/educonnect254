import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const db = window.db;
    const auth = window.auth;

    if (!db || !auth) {
        console.error("Firebase not initialized correctly. Check Firebase config.");
        return;
    }

    // ----------- AUTH CHECK -----------
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            // Not logged in → send to landing/login page
            window.location.href = "../login.html";
            return;
        }

        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                console.error("User not found in database.");
                window.location.href = "../login.html";
                return;
            }

            const userData = userSnap.data();
            console.log("User role:", userData.role);


            if (userData.role !== "admin") {
                // Not an admin → redirect away
                alert("Access denied. Admins only.");
                window.location.href = "../index.html"; // your landing page
                return;
            }

            // ✅ User is admin → continue loading dashboard
            initializeDashboard();

        } catch (err) {
            console.error("Error checking admin status:", err);
            window.location.href = "../login.html";
        }
    });

    // ----------- DASHBOARD LOGIC -----------
    async function initializeDashboard() {
        // ---------- Fetch Counts ----------
        const collections = {
            users: "users",
            teachers: "teachers",
            notes: "notes",
            assignments: "assignments"
        };

        async function getCount(colName) {
            const colRef = collection(db, colName);
            const snapshot = await getDocs(colRef);
            return snapshot.size;
        }

        try {
            const [userCount, teacherCount, noteCount, assignmentCount] = await Promise.all([
                getCount(collections.users),
                getCount(collections.teachers),
                getCount(collections.notes),
                getCount(collections.assignments)
            ]);

            document.getElementById("totalUsers").textContent = userCount;
            document.getElementById("totalTeachers").textContent = teacherCount;
            document.getElementById("totalNotes").textContent = noteCount;
            document.getElementById("totalAssignments").textContent = assignmentCount;
        } catch (error) {
            console.error("Error fetching data:", error);
        }

        // ---------- Chart ----------
        const ctx = document.getElementById('userGrowthChart');
        const userGrowthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                datasets: [{
                    label: 'User Growth',
                    data: [10, 25, 40, 70, 100, 128],
                    borderColor: '#00a2ff',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        ticks: { color: '#fff' },
                        grid: { color: '#333' }
                    },
                    y: {
                        ticks: { color: '#fff' },
                        grid: { color: '#333' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#fff' }
                    }
                }
            }
        });

        // ---------- Recent Activity ----------
        const activityTable = document.getElementById('activityTable');
        const activities = [];

        try {
            const actSnap = await getDocs(collection(db, "activity"));
            actSnap.forEach(doc => {
                activities.push(doc.data());
            });
        } catch (err) {
            console.error("Error loading activity:", err);
        }

        if (activities.length === 0) {
            activityTable.innerHTML = `<tr><td colspan="3">No recent activity</td></tr>`;
        } else {
            activityTable.innerHTML = activities.slice(0, 5).map(act => `
                <tr>
                    <td>${act.user || "Unknown"}</td>
                    <td>${act.action || "N/A"}</td>
                    <td>${act.date || "-"}</td>
                </tr>
            `).join('');
        }
    }
});
