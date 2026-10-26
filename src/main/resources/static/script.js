const API = {
    students: "/api/students",
    staff: "/api/staff",
    complaints: "/api/complaints",
    soap: "/ws"
};

let studentsCache = [];
let staffCache = [];
let complaintsCache = [];

// --------------------------------------------------
// GENERAL HELPERS
// --------------------------------------------------

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };
        return replacements[character];
    });
}

function showMessage(message, isError = false) {
    const box = document.getElementById("messageBox");

    box.textContent = message;
    box.classList.remove("hidden", "error");

    if (isError) {
        box.classList.add("error");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    clearTimeout(showMessage.timer);

    showMessage.timer = setTimeout(function () {
        box.classList.add("hidden");
    }, 6000);
}

async function apiRequest(url, options = {}) {
    const requestOptions = {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {})
        }
    };

    let response;

    try {
        response = await fetch(url, requestOptions);
    } catch (error) {
        throw new Error(
            "Cannot connect to the backend. Check that CampusCare is running on port 8082."
        );
    }

    const text = await response.text();

    let data = null;

    if (text.trim()) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    if (!response.ok) {
        let message = "";

        if (typeof data === "string") {
            message = data;
        } else if (data && typeof data === "object") {
            message = data.message || data.error || JSON.stringify(data);
        }

        throw new Error(
            message || `Request failed with HTTP status ${response.status}.`
        );
    }

    return data;
}

function formatValue(value) {
    return value === null || value === undefined || value === ""
        ? "—"
        : escapeHtml(value);
}

function displayDate(value) {
    if (!value) {
        return "—";
    }

    return escapeHtml(String(value).replace("T", " "));
}

function statusBadge(status) {
    const value = String(status || "UNKNOWN");
    const normalized = value.toUpperCase();

    let badgeClass = "badge";

    if (normalized === "SUBMITTED") {
        badgeClass += " badge-submitted";
    } else if (normalized === "ASSIGNED") {
        badgeClass += " badge-assigned";
    } else if (normalized === "IN_PROGRESS") {
        badgeClass += " badge-in-progress";
    } else if (normalized === "RESOLVED") {
        badgeClass += " badge-resolved";
    } else if (normalized === "CLOSED") {
        badgeClass += " badge-closed";
    }

    return `<span class="${badgeClass}">${escapeHtml(value.replaceAll("_", " "))}</span>`;
}

function priorityBadge(priority) {
    const value = String(priority || "MEDIUM");
    const normalized = value.toUpperCase();

    let badgeClass = "badge";

    if (normalized === "LOW") {
        badgeClass += " badge-low";
    } else if (normalized === "MEDIUM") {
        badgeClass += " badge-medium";
    } else if (normalized === "HIGH") {
        badgeClass += " badge-high";
    } else if (normalized === "URGENT") {
        badgeClass += " badge-urgent";
    }

    return `<span class="${badgeClass}">${escapeHtml(value)}</span>`;
}

function showEmptyRow(tableBodyId, columnCount, message) {
    document.getElementById(tableBodyId).innerHTML =
        `<tr><td colspan="${columnCount}" class="empty-state">${escapeHtml(message)}</td></tr>`;
}

function errorRow(tableBodyId, columnCount, error) {
    showEmptyRow(tableBodyId, columnCount, error.message || "Unable to load records.");
}

function getArray(data) {
    if (Array.isArray(data)) {
        return data;
    }

    // Supports a Spring Page response, if an endpoint returns one.
    if (data && Array.isArray(data.content)) {
        return data.content;
    }

    return [];
}

function resetFormSafely(formId) {
    document.getElementById(formId).reset();
}

// --------------------------------------------------
// NAVIGATION
// --------------------------------------------------

document.querySelectorAll(".nav-button").forEach(function (button) {
    button.addEventListener("click", function () {
        openSection(button.dataset.section);
    });
});

document.querySelectorAll("[data-go]").forEach(function (button) {
    button.addEventListener("click", function () {
        openSection(button.dataset.go);
    });
});

function openSection(sectionId) {
    document.querySelectorAll(".page-section").forEach(function (section) {
        section.classList.remove("active-section");
    });

    document.querySelectorAll(".nav-button").forEach(function (button) {
        button.classList.toggle("active", button.dataset.section === sectionId);
    });

    const section = document.getElementById(sectionId);

    if (section) {
        section.classList.add("active-section");
    }

    if (sectionId === "dashboard") {
        loadDashboard();
    } else if (sectionId === "students") {
        loadStudents();
    } else if (sectionId === "staff") {
        loadStaff();
    } else if (sectionId === "complaints") {
        loadComplaints();
    }
}

// --------------------------------------------------
// STUDENTS: GET ALL
// --------------------------------------------------

async function loadStudents() {
    const body = document.getElementById("studentsBody");

    body.innerHTML =
        '<tr><td colspan="6" class="empty-state">Loading students...</td></tr>';

    try {
        const data = await apiRequest(API.students);

        studentsCache = getArray(data);

        renderStudents(studentsCache);

        document.getElementById("studentCount").textContent =
            studentsCache.length;
    } catch (error) {
        errorRow("studentsBody", 6, error);
        showMessage("Unable to load students: " + error.message, true);
    }
}

function renderStudents(students) {
    const body = document.getElementById("studentsBody");

    if (!students.length) {
        showEmptyRow("studentsBody", 6, "No students found.");
        return;
    }

    body.innerHTML = students.map(function (student) {
        return `
            <tr>
                <td>${formatValue(student.id)}</td>
                <td>${formatValue(student.name)}</td>
                <td>${formatValue(student.email)}</td>
                <td>${formatValue(student.department)}</td>
                <td>${formatValue(student.phone)}</td>
                <td>
                    <div class="action-cell">
                        <button class="small-button" data-action="edit-student"
                            data-id="${escapeHtml(student.id)}">Edit</button>
                        <button class="small-button" data-action="find-student"
                            data-id="${escapeHtml(student.id)}">View</button>
                        <button class="danger-button" data-action="delete-student"
                            data-id="${escapeHtml(student.id)}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// --------------------------------------------------
// STUDENTS: POST AND PUT
// --------------------------------------------------

document.getElementById("studentForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("studentId").value;

    const student = {
        name: document.getElementById("studentName").value.trim(),
        email: document.getElementById("studentEmail").value.trim(),
        department: document.getElementById("studentDepartment").value.trim(),
        phone: document.getElementById("studentPhone").value.trim()
    };

    try {
        if (id) {
            await apiRequest(`${API.students}/${encodeURIComponent(id)}`, {
                method: "PUT",
                body: JSON.stringify(student)
            });

            showMessage("Student updated successfully.");
        } else {
            await apiRequest(API.students, {
                method: "POST",
                body: JSON.stringify(student)
            });

            showMessage("Student added successfully.");
        }

        resetStudentForm();
        await loadStudents();
    } catch (error) {
        showMessage("Student operation failed: " + error.message, true);
    }
});

function startStudentEdit(id) {
    const student = studentsCache.find(function (item) {
        return String(item.id) === String(id);
    });

    if (!student) {
        showMessage("Student not found in the current list. Refresh the list.", true);
        return;
    }

    document.getElementById("studentId").value = student.id;
    document.getElementById("studentName").value = student.name || "";
    document.getElementById("studentEmail").value = student.email || "";
    document.getElementById("studentDepartment").value = student.department || "";
    document.getElementById("studentPhone").value = student.phone || "";

    document.getElementById("studentFormTitle").textContent = "Update Student";
    document.getElementById("studentSubmitButton").textContent = "Save Changes";
    document.getElementById("cancelStudentEdit").hidden = false;

    openSection("students");
    document.getElementById("studentFormTitle").scrollIntoView({ behavior: "smooth" });
}

function resetStudentForm() {
    resetFormSafely("studentForm");

    document.getElementById("studentId").value = "";
    document.getElementById("studentFormTitle").textContent = "Add Student";
    document.getElementById("studentSubmitButton").textContent = "Add Student";
    document.getElementById("cancelStudentEdit").hidden = true;
}

document.getElementById("cancelStudentEdit").addEventListener("click", resetStudentForm);

document.getElementById("studentForm").addEventListener("reset", function () {
    setTimeout(function () {
        document.getElementById("studentId").value = "";
        document.getElementById("studentFormTitle").textContent = "Add Student";
        document.getElementById("studentSubmitButton").textContent = "Add Student";
        document.getElementById("cancelStudentEdit").hidden = true;
    }, 0);
});

// --------------------------------------------------
// STUDENTS: GET BY ID AND DELETE
// --------------------------------------------------

async function findStudent(id) {
    try {
        const student = await apiRequest(
            `${API.students}/${encodeURIComponent(id)}`
        );

        studentsCache = [
            student,
            ...studentsCache.filter(item => String(item.id) !== String(student.id))
        ];

        renderStudents([student]);
        showMessage("Student record retrieved successfully.");
    } catch (error) {
        showMessage("Could not retrieve student: " + error.message, true);
    }
}

async function deleteStudent(id) {
    const confirmed = confirm(`Are you sure you want to delete student ${id}?`);

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(`${API.students}/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });

        showMessage("Student deleted successfully.");
        await loadStudents();
    } catch (error) {
        showMessage("Could not delete student: " + error.message, true);
    }
}

document.getElementById("studentSearchForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("studentSearchId").value.trim();

    if (!id) {
        showMessage("Enter a student ID.", true);
        return;
    }

    await findStudent(id);
});

document.getElementById("showAllStudents").addEventListener("click", loadStudents);
document.getElementById("refreshStudents").addEventListener("click", loadStudents);

document.getElementById("studentsBody").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit-student") {
        startStudentEdit(id);
    } else if (action === "find-student") {
        findStudent(id);
    } else if (action === "delete-student") {
        deleteStudent(id);
    }
});

// --------------------------------------------------
// MAINTENANCE STAFF: GET ALL
// --------------------------------------------------

async function loadStaff() {
    const body = document.getElementById("staffBody");

    body.innerHTML =
        '<tr><td colspan="6" class="empty-state">Loading staff...</td></tr>';

    try {
        const data = await apiRequest(API.staff);

        staffCache = getArray(data);

        renderStaff(staffCache);

        document.getElementById("staffCount").textContent =
            staffCache.length;
    } catch (error) {
        errorRow("staffBody", 6, error);
        showMessage("Unable to load staff: " + error.message, true);
    }
}

function renderStaff(staffList) {
    const body = document.getElementById("staffBody");

    if (!staffList.length) {
        showEmptyRow("staffBody", 6, "No maintenance staff found.");
        return;
    }

    body.innerHTML = staffList.map(function (staff) {
        return `
            <tr>
                <td>${formatValue(staff.id)}</td>
                <td>${formatValue(staff.name)}</td>
                <td>${formatValue(staff.email)}</td>
                <td>${formatValue(staff.specialization)}</td>
                <td>${formatValue(staff.phone)}</td>
                <td>
                    <div class="action-cell">
                        <button class="small-button" data-action="edit-staff"
                            data-id="${escapeHtml(staff.id)}">Edit</button>
                        <button class="small-button" data-action="find-staff"
                            data-id="${escapeHtml(staff.id)}">View</button>
                        <button class="danger-button" data-action="delete-staff"
                            data-id="${escapeHtml(staff.id)}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// --------------------------------------------------
// MAINTENANCE STAFF: POST AND PUT
// --------------------------------------------------

document.getElementById("staffForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("staffId").value;

    const staff = {
        name: document.getElementById("staffName").value.trim(),
        email: document.getElementById("staffEmail").value.trim(),
        specialization: document.getElementById("staffSpecialization").value.trim(),
        phone: document.getElementById("staffPhone").value.trim()
    };

    try {
        if (id) {
            await apiRequest(`${API.staff}/${encodeURIComponent(id)}`, {
                method: "PUT",
                body: JSON.stringify(staff)
            });

            showMessage("Maintenance staff updated successfully.");
        } else {
            await apiRequest(API.staff, {
                method: "POST",
                body: JSON.stringify(staff)
            });

            showMessage("Maintenance staff added successfully.");
        }

        resetStaffForm();
        await loadStaff();
    } catch (error) {
        showMessage("Staff operation failed: " + error.message, true);
    }
});

function startStaffEdit(id) {
    const staff = staffCache.find(function (item) {
        return String(item.id) === String(id);
    });

    if (!staff) {
        showMessage("Staff member not found in the current list. Refresh the list.", true);
        return;
    }

    document.getElementById("staffId").value = staff.id;
    document.getElementById("staffName").value = staff.name || "";
    document.getElementById("staffEmail").value = staff.email || "";
    document.getElementById("staffSpecialization").value = staff.specialization || "";
    document.getElementById("staffPhone").value = staff.phone || "";

    document.getElementById("staffFormTitle").textContent = "Update Maintenance Staff";
    document.getElementById("staffSubmitButton").textContent = "Save Changes";
    document.getElementById("cancelStaffEdit").hidden = false;

    openSection("staff");
    document.getElementById("staffFormTitle").scrollIntoView({ behavior: "smooth" });
}

function resetStaffForm() {
    resetFormSafely("staffForm");

    document.getElementById("staffId").value = "";
    document.getElementById("staffFormTitle").textContent = "Add Maintenance Staff";
    document.getElementById("staffSubmitButton").textContent = "Add Staff";
    document.getElementById("cancelStaffEdit").hidden = true;
}

document.getElementById("cancelStaffEdit").addEventListener("click", resetStaffForm);

document.getElementById("staffForm").addEventListener("reset", function () {
    setTimeout(function () {
        document.getElementById("staffId").value = "";
        document.getElementById("staffFormTitle").textContent = "Add Maintenance Staff";
        document.getElementById("staffSubmitButton").textContent = "Add Staff";
        document.getElementById("cancelStaffEdit").hidden = true;
    }, 0);
});

// --------------------------------------------------
// MAINTENANCE STAFF: GET BY ID AND DELETE
// --------------------------------------------------

async function findStaff(id) {
    try {
        const staff = await apiRequest(
            `${API.staff}/${encodeURIComponent(id)}`
        );

        staffCache = [
            staff,
            ...staffCache.filter(item => String(item.id) !== String(staff.id))
        ];

        renderStaff([staff]);
        showMessage("Staff record retrieved successfully.");
    } catch (error) {
        showMessage("Could not retrieve staff: " + error.message, true);
    }
}

async function deleteStaff(id) {
    const confirmed = confirm(`Are you sure you want to delete staff member ${id}?`);

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(`${API.staff}/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });

        showMessage("Staff member deleted successfully.");
        await loadStaff();
    } catch (error) {
        showMessage("Could not delete staff: " + error.message, true);
    }
}

document.getElementById("staffSearchForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("staffSearchId").value.trim();

    if (!id) {
        showMessage("Enter a staff ID.", true);
        return;
    }

    await findStaff(id);
});

document.getElementById("showAllStaff").addEventListener("click", loadStaff);
document.getElementById("refreshStaff").addEventListener("click", loadStaff);

document.getElementById("staffBody").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit-staff") {
        startStaffEdit(id);
    } else if (action === "find-staff") {
        findStaff(id);
    } else if (action === "delete-staff") {
        deleteStaff(id);
    }
});

// --------------------------------------------------
// COMPLAINTS: GET ALL, STATUS, AND CATEGORY FILTERS
// --------------------------------------------------

async function loadComplaints() {
    const body = document.getElementById("complaintsBody");

    body.innerHTML =
        '<tr><td colspan="9" class="empty-state">Loading complaints...</td></tr>';

    try {
        const data = await apiRequest(API.complaints);

        complaintsCache = getArray(data);

        renderComplaints(complaintsCache);
        updateComplaintDashboard(complaintsCache);
    } catch (error) {
        errorRow("complaintsBody", 9, error);
        showMessage("Unable to load complaints: " + error.message, true);
    }
}

function renderComplaints(complaints) {
    const body = document.getElementById("complaintsBody");

    if (!complaints.length) {
        showEmptyRow("complaintsBody", 9, "No complaints found.");
        return;
    }

    body.innerHTML = complaints.map(function (complaint) {
        return `
            <tr>
                <td>${formatValue(complaint.id)}</td>
                <td>${formatValue(complaint.title)}</td>
                <td>${formatValue(complaint.studentId)}</td>
                <td>${formatValue(complaint.category)}</td>
                <td>${formatValue(complaint.location)}</td>
                <td>${priorityBadge(complaint.priority)}</td>
                <td>${statusBadge(complaint.status)}</td>
                <td>${formatValue(complaint.assignedStaffId)}</td>
                <td>
                    <div class="action-cell">
                        <button class="small-button" data-action="edit-complaint"
                            data-id="${escapeHtml(complaint.id)}">Edit</button>
                        <button class="small-button" data-action="find-complaint"
                            data-id="${escapeHtml(complaint.id)}">View</button>
                        <button class="small-button" data-action="complaint-history"
                            data-id="${escapeHtml(complaint.id)}">History</button>
                        <button class="danger-button" data-action="delete-complaint"
                            data-id="${escapeHtml(complaint.id)}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function updateComplaintDashboard(complaints) {
    document.getElementById("complaintCount").textContent = complaints.length;

    const resolved = complaints.filter(function (complaint) {
        return String(complaint.status || "").toUpperCase() === "RESOLVED";
    }).length;

    document.getElementById("resolvedCount").textContent = resolved;

    const recent = [...complaints].sort(function (a, b) {
        return Number(b.id || 0) - Number(a.id || 0);
    }).slice(0, 5);

    const body = document.getElementById("recentComplaintsBody");

    if (!recent.length) {
        showEmptyRow("recentComplaintsBody", 5, "No complaints found.");
        return;
    }

    body.innerHTML = recent.map(function (complaint) {
        return `
            <tr>
                <td>${formatValue(complaint.id)}</td>
                <td>${formatValue(complaint.title)}</td>
                <td>${formatValue(complaint.category)}</td>
                <td>${priorityBadge(complaint.priority)}</td>
                <td>${statusBadge(complaint.status)}</td>
            </tr>
        `;
    }).join("");
}

// --------------------------------------------------
// COMPLAINTS: POST AND PUT
// --------------------------------------------------

document.getElementById("complaintForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("complaintId").value;

    const complaint = {
        studentId: Number(document.getElementById("complaintStudentId").value),
        title: document.getElementById("complaintTitle").value.trim(),
        description: document.getElementById("complaintDescription").value.trim(),
        category: document.getElementById("complaintCategory").value,
        location: document.getElementById("complaintLocation").value.trim(),
        priority: document.getElementById("complaintPriority").value
    };

    try {
        if (id) {
            // Preserve fields that the edit form does not directly modify.
            const oldComplaint = complaintsCache.find(function (item) {
                return String(item.id) === String(id);
            });

            if (oldComplaint) {
                complaint.status = oldComplaint.status;
                complaint.assignedStaffId = oldComplaint.assignedStaffId;
                complaint.createdAt = oldComplaint.createdAt;
            }

            await apiRequest(`${API.complaints}/${encodeURIComponent(id)}`, {
                method: "PUT",
                body: JSON.stringify(complaint)
            });

            showMessage("Complaint updated successfully.");
        } else {
            await apiRequest(API.complaints, {
                method: "POST",
                body: JSON.stringify(complaint)
            });

            showMessage("Complaint submitted successfully.");
        }

        resetComplaintForm();
        await loadComplaints();
    } catch (error) {
        showMessage("Complaint operation failed: " + error.message, true);
    }
});

function startComplaintEdit(id) {
    const complaint = complaintsCache.find(function (item) {
        return String(item.id) === String(id);
    });

    if (!complaint) {
        showMessage("Complaint not found in the current list. Refresh the list.", true);
        return;
    }

    document.getElementById("complaintId").value = complaint.id;
    document.getElementById("complaintStudentId").value = complaint.studentId || "";
    document.getElementById("complaintTitle").value = complaint.title || "";
    document.getElementById("complaintDescription").value = complaint.description || "";
    document.getElementById("complaintCategory").value = complaint.category || "";
    document.getElementById("complaintLocation").value = complaint.location || "";
    document.getElementById("complaintPriority").value = complaint.priority || "MEDIUM";

    document.getElementById("complaintFormTitle").textContent = "Update Complaint";
    document.getElementById("complaintSubmitButton").textContent = "Save Changes";
    document.getElementById("cancelComplaintEdit").hidden = false;

    openSection("complaints");
    document.getElementById("complaintFormTitle").scrollIntoView({ behavior: "smooth" });
}

function resetComplaintForm() {
    resetFormSafely("complaintForm");

    document.getElementById("complaintId").value = "";
    document.getElementById("complaintFormTitle").textContent = "Submit Complaint";
    document.getElementById("complaintSubmitButton").textContent = "Submit Complaint";
    document.getElementById("cancelComplaintEdit").hidden = true;
}

document.getElementById("cancelComplaintEdit").addEventListener("click", resetComplaintForm);

document.getElementById("complaintForm").addEventListener("reset", function () {
    setTimeout(function () {
        document.getElementById("complaintId").value = "";
        document.getElementById("complaintFormTitle").textContent = "Submit Complaint";
        document.getElementById("complaintSubmitButton").textContent = "Submit Complaint";
        document.getElementById("cancelComplaintEdit").hidden = true;
    }, 0);
});

// --------------------------------------------------
// COMPLAINTS: GET BY ID AND DELETE
// --------------------------------------------------

async function findComplaint(id) {
    try {
        const complaint = await apiRequest(
            `${API.complaints}/${encodeURIComponent(id)}`
        );

        complaintsCache = [
            complaint,
            ...complaintsCache.filter(item => String(item.id) !== String(complaint.id))
        ];

        renderComplaints([complaint]);
        document.getElementById("actionComplaintId").value = complaint.id;

        showMessage("Complaint record retrieved successfully.");
    } catch (error) {
        showMessage("Could not retrieve complaint: " + error.message, true);
    }
}

async function deleteComplaint(id) {
    const confirmed = confirm(`Are you sure you want to delete complaint ${id}?`);

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(`${API.complaints}/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });

        showMessage("Complaint deleted successfully.");
        await loadComplaints();
    } catch (error) {
        showMessage("Could not delete complaint: " + error.message, true);
    }
}

document.getElementById("complaintSearchForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("complaintSearchId").value.trim();

    if (!id) {
        showMessage("Enter a complaint ID.", true);
        return;
    }

    await findComplaint(id);
});

document.getElementById("showAllComplaints").addEventListener("click", loadComplaints);
document.getElementById("refreshComplaints").addEventListener("click", loadComplaints);

document.getElementById("complaintsBody").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit-complaint") {
        startComplaintEdit(id);
    } else if (action === "find-complaint") {
        findComplaint(id);
    } else if (action === "delete-complaint") {
        deleteComplaint(id);
    } else if (action === "complaint-history") {
        document.getElementById("historyComplaintId").value = id;
        openSection("history");
        loadComplaintHistory(id);
    }
});

// --------------------------------------------------
// COMPLAINTS: FILTER BY STATUS OR CATEGORY
// --------------------------------------------------

document.getElementById("applyComplaintFilters").addEventListener("click", async function () {
    const status = document.getElementById("statusFilter").value;
    const category = document.getElementById("categoryFilter").value;

    try {
        let endpoint = API.complaints;

        if (status) {
            endpoint = `${API.complaints}/status/${encodeURIComponent(status)}`;
        } else if (category) {
            endpoint = `${API.complaints}/category/${encodeURIComponent(category)}`;
        }

        let data = await apiRequest(endpoint);
        let result = getArray(data);

        // If both filters are selected, combine the results client-side.
        if (status && category) {
            result = result.filter(function (complaint) {
                return String(complaint.category || "").toUpperCase() === category.toUpperCase();
            });
        }

        renderComplaints(result);
        showMessage(`Filter applied. ${result.length} complaint(s) found.`);
    } catch (error) {
        showMessage("Unable to filter complaints: " + error.message, true);
    }
});

// --------------------------------------------------
// COMPLAINTS: ASSIGN STAFF
// --------------------------------------------------

document.getElementById("assignStaffButton").addEventListener("click", async function () {
    const complaintId = document.getElementById("actionComplaintId").value.trim();
    const staffId = document.getElementById("assignStaffId").value.trim();

    if (!complaintId || !staffId) {
        showMessage("Enter both a complaint ID and a staff ID.", true);
        return;
    }

    try {
        await apiRequest(
            `${API.complaints}/${encodeURIComponent(complaintId)}/assign/${encodeURIComponent(staffId)}`,
            { method: "PUT" }
        );

        showMessage("Staff assigned to complaint successfully.");
        await loadComplaints();
    } catch (error) {
        showMessage("Could not assign staff: " + error.message, true);
    }
});

// --------------------------------------------------
// COMPLAINTS: UPDATE STATUS
// --------------------------------------------------

document.getElementById("updateComplaintStatusButton").addEventListener("click", async function () {
    const complaintId = document.getElementById("actionComplaintId").value.trim();
    const status = document.getElementById("newComplaintStatus").value;
    const remarks = document.getElementById("statusRemarks").value.trim();

    if (!complaintId) {
        showMessage("Enter a complaint ID before updating its status.", true);
        return;
    }

    const query = new URLSearchParams({
        status: status,
        remarks: remarks
    });

    try {
        await apiRequest(
            `${API.complaints}/${encodeURIComponent(complaintId)}/status?${query.toString()}`,
            { method: "PATCH" }
        );

        showMessage("Complaint status updated successfully.");
        document.getElementById("statusRemarks").value = "";

        await loadComplaints();
    } catch (error) {
        showMessage("Could not update complaint status: " + error.message, true);
    }
});

// --------------------------------------------------
// COMPLAINT HISTORY
// --------------------------------------------------

document.getElementById("historyForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("historyComplaintId").value.trim();

    if (!id) {
        showMessage("Enter a complaint ID.", true);
        return;
    }

    await loadComplaintHistory(id);
});

async function loadComplaintHistory(id) {
    const body = document.getElementById("historyBody");

    body.innerHTML =
        '<tr><td colspan="6" class="empty-state">Loading history...</td></tr>';

    try {
        const data = await apiRequest(
            `${API.complaints}/${encodeURIComponent(id)}/history`
        );

        const history = getArray(data);

        if (!history.length) {
            showEmptyRow("historyBody", 6, "No history records found for this complaint.");
            return;
        }

        body.innerHTML = history.map(function (item) {
            return `
                <tr>
                    <td>${formatValue(item.id)}</td>
                    <td>${formatValue(item.complaintId)}</td>
                    <td>${formatValue(item.oldStatus)}</td>
                    <td>${formatValue(item.newStatus)}</td>
                    <td>${formatValue(item.remarks)}</td>
                    <td>${displayDate(item.changedAt)}</td>
                </tr>
            `;
        }).join("");
    } catch (error) {
        errorRow("historyBody", 6, error);
        showMessage("Could not load complaint history: " + error.message, true);
    }
}

// --------------------------------------------------
// SOAP COMPLAINT STATISTICS
// --------------------------------------------------

document.getElementById("loadSoapStats").addEventListener("click", loadSoapStatistics);

async function loadSoapStatistics() {
    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:com="http://campuscare.com/soap/complaints">
    <soapenv:Header/>
    <soapenv:Body>
        <com:GetComplaintStatisticsRequest/>
    </soapenv:Body>
</soapenv:Envelope>`;

    document.getElementById("soapResponse").textContent = "Calling SOAP service...";

    try {
        const response = await fetch(API.soap, {
            method: "POST",
            headers: {
                "Content-Type": "text/xml; charset=UTF-8"
            },
            body: soapRequest
        });

        const responseText = await response.text();

        document.getElementById("soapResponse").textContent = responseText;

        if (!response.ok) {
            throw new Error(`SOAP request failed with HTTP status ${response.status}.`);
        }

        const parser = new DOMParser();
        const xml = parser.parseFromString(responseText, "text/xml");

        if (xml.querySelector("parsererror")) {
            throw new Error("The SOAP service returned invalid XML.");
        }

        function findXmlValue(localName) {
            const nodes = Array.from(xml.getElementsByTagName("*"));

            const node = nodes.find(function (element) {
                return element.localName === localName;
            });

            return node ? node.textContent.trim() : "—";
        }

        document.getElementById("soapTotal").textContent =
            findXmlValue("totalComplaints");

        document.getElementById("soapSubmitted").textContent =
            findXmlValue("submittedComplaints");

        document.getElementById("soapAssigned").textContent =
            findXmlValue("assignedComplaints");

        document.getElementById("soapInProgress").textContent =
            findXmlValue("inProgressComplaints");

        document.getElementById("soapResolved").textContent =
            findXmlValue("resolvedComplaints");

        document.getElementById("soapClosed").textContent =
            findXmlValue("closedComplaints");

        showMessage("SOAP complaint statistics loaded successfully.");
    } catch (error) {
        document.getElementById("soapResponse").textContent +=
            "\n\nError: " + error.message;

        showMessage(
            "Could not load SOAP statistics. Check the SOAP endpoint and configuration. " +
            error.message,
            true
        );
    }
}

// --------------------------------------------------
// DASHBOARD
// --------------------------------------------------

async function loadDashboard() {
    try {
        const results = await Promise.all([
            apiRequest(API.students),
            apiRequest(API.staff),
            apiRequest(API.complaints)
        ]);

        studentsCache = getArray(results[0]);
        staffCache = getArray(results[1]);
        complaintsCache = getArray(results[2]);

        document.getElementById("studentCount").textContent =
            studentsCache.length;

        document.getElementById("staffCount").textContent =
            staffCache.length;

        updateComplaintDashboard(complaintsCache);
    } catch (error) {
        showMessage("Could not refresh dashboard: " + error.message, true);
    }
}

document.getElementById("refreshDashboard").addEventListener("click", loadDashboard);

// --------------------------------------------------
// INITIAL LOAD
// --------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
    loadDashboard();
});