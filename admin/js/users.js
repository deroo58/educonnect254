// admin/js/users.js
import {
    collection,
    getDocs,
    updateDoc,
    doc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", async () => {
    const db = window.db;
    const auth = getAuth();
    const usersTab = document.getElementById("usersTab");
    const mainContent = document.querySelector(".main-content");

    if (!usersTab) return;

    usersTab.addEventListener("click", async () => {
        mainContent.innerHTML = `
            <header class="topbar">
                <h1>Manage Users</h1>
            </header>

            <div class="user-controls">
                <input type="text" id="userSearch" placeholder="🔍 Search by username or email..." />
                <div class="user-filters">
                    <button class="filter-btn active" data-role="all">All</button>
                    <button class="filter-btn" data-role="student">Students</button>
                    <button class="filter-btn" data-role="teacher">Teachers</button>
                    <button class="filter-btn" data-role="admin">Admins</button>
                </div>
            </div>

            <section class="users-section">
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <tr><td colspan="4">Loading users...</td></tr>
                    </tbody>
                </table>
            </section>

            <!-- User Modal -->
            <div id="userModal" class="modal" style="display:none;">
                <div class="modal-content">
                    <span class="close-btn">&times;</span>
                    <h2>User Profile</h2>
                    <div id="userDetails"></div>
                </div>
            </div>
        `;

        const usersTableBody = document.getElementById("usersTableBody");
        const searchInput = document.getElementById("userSearch");
        let allUsers = [];

        try {
            const usersSnapshot = await getDocs(collection(db, "users"));
            usersSnapshot.forEach(userDoc => {
                const user = userDoc.data();
                allUsers.push({
                    id: userDoc.id,
                    username: user.username || "Unknown",
                    email: user.email || "N/A",
                    role: user.role || "student"
                });
            });
            renderTable(allUsers);
        } catch (err) {
            console.error("Error loading users:", err);
            usersTableBody.innerHTML = `<tr><td colspan="4">Error loading users</td></tr>`;
        }

        // --- Filter buttons ---
        document.querySelectorAll(".filter-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                applyFilters();
            });
        });

        // --- Live search ---
        searchInput.addEventListener("input", () => {
            applyFilters();
        });

        function applyFilters() {
            const role = document.querySelector(".filter-btn.active").getAttribute("data-role");
            const term = searchInput.value.toLowerCase().trim();

            let filtered = allUsers;
            if (role !== "all") filtered = filtered.filter(u => u.role === role);
            if (term) {
                filtered = filtered.filter(u =>
                    u.username.toLowerCase().includes(term) ||
                    u.email.toLowerCase().includes(term)
                );
            }
            renderTable(filtered);
        }

        function renderTable(users) {
            if (users.length === 0) {
                usersTableBody.innerHTML = `<tr><td colspan="4">No users found.</td></tr>`;
                return;
            }

            usersTableBody.innerHTML = users.map(u => `
                <tr>
                    <td>${u.username}</td>
                    <td>${u.email}</td>
                    <td>${u.role}</td>
                    <td>
                        <button class="promote-btn" data-id="${u.id}" data-role="${u.role}">
                            ${u.role === "admin" ? "Demote" : "Promote"}
                        </button>
                        <button class="view-btn" data-id="${u.id}">View</button>
                        <button class="delete-btn" data-id="${u.id}">Delete</button>
                        <button class="reset-btn" data-email="${u.email}">Reset Password</button>
                    </td>
                </tr>
            `).join("");

            // --- Promote/Demote ---
            document.querySelectorAll(".promote-btn").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const uid = btn.getAttribute("data-id");
                    const currentRole = btn.getAttribute("data-role");
                    const newRole = currentRole === "admin" ? "student" : "admin";
                    if (!confirm(`Change this user's role to ${newRole}?`)) return;

                    await updateDoc(doc(db, "users", uid), { role: newRole });
                    alert("✅ User role updated successfully!");
                    allUsers = allUsers.map(u => u.id === uid ? { ...u, role: newRole } : u);
                    applyFilters();
                });
            });

            // --- View user ---
            document.querySelectorAll(".view-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    const uid = btn.getAttribute("data-id");
                    const user = allUsers.find(u => u.id === uid);
                    showUserModal(user);
                });
            });

            // --- Delete user ---
            document.querySelectorAll(".delete-btn").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const uid = btn.getAttribute("data-id");
                    if (!confirm("⚠️ Are you sure you want to delete this user?")) return;
                    await deleteDoc(doc(db, "users", uid));
                    alert("✅ User deleted successfully!");
                    allUsers = allUsers.filter(u => u.id !== uid);
                    applyFilters();
                });
            });

            // --- Reset password ---
            document.querySelectorAll(".reset-btn").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const email = btn.getAttribute("data-email");
                    if (!confirm(`Send password reset email to ${email}?`)) return;
                    try {
                        await sendPasswordResetEmail(auth, email);
                        alert("📩 Password reset email sent!");
                    } catch (error) {
                        alert("❌ Error sending email: " + error.message);
                    }
                });
            });
        }

        // --- User Modal Logic ---
        const modal = document.getElementById("userModal");
        const closeBtn = modal.querySelector(".close-btn");

        function showUserModal(user) {
            const detailsDiv = document.getElementById("userDetails");
            detailsDiv.innerHTML = `
                <p><strong>Username:</strong> ${user.username}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Role:</strong> ${user.role}</p>
                <p><strong>User ID:</strong> ${user.id}</p>
            `;
            modal.style.display = "flex";
        }

        closeBtn.onclick = () => (modal.style.display = "none");
        window.onclick = (e) => {
            if (e.target === modal) modal.style.display = "none";
        };
    });
});
