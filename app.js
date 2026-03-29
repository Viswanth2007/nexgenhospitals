const API_BASE = window.location.protocol === "file:"
    ? "http://localhost:3000"
    : window.location.origin;
const STORAGE_KEYS = {
    patient: "nexgen_patient",
    profile: "nexgen_profile",
    doctor: "nexgen_doctor",
    employee: "nexgen_employee",
    appointments: "nexgen_appointments",
    bills: "nexgen_bills"
};

function getStoredValue(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
}

function setStoredValue(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getStoredList(key) {
    return getStoredValue(key) || [];
}

function showMessage(element, message, type = "") {
    if (!element) {
        return;
    }

    element.textContent = message;
    element.className = `status-message ${type}`.trim();
}

function getLoggedInPatient() {
    return getStoredValue(STORAGE_KEYS.patient);
}

function getPatientProfile() {
    return getStoredValue(STORAGE_KEYS.profile);
}

function setLoggedInPatient(patient) {
    setStoredValue(STORAGE_KEYS.patient, patient);
}

function setPatientProfile(patient) {
    setStoredValue(STORAGE_KEYS.profile, patient);
}

async function tryPost(endpoint, payload) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : await response.text();
    return { ok: response.ok, data };
}

async function tryPut(endpoint, payload) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : await response.text();
    return { ok: response.ok, data };
}

async function tryDelete(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "DELETE"
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : await response.text();
    return { ok: response.ok, data };
}

async function tryGet(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`);
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : await response.text();
    return { ok: response.ok, data };
}

function ensureLoggedIn(redirectTarget = "dashboard.html") {
    if (!getLoggedInPatient()) {
        window.location.href = `login.html?redirect=${encodeURIComponent(redirectTarget)}`;
        return false;
    }
    return true;
}

function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
}

function getDoctorDepartment(doctor) {
    return doctor.department || doctor.specialization || doctor.speciality || doctor.dept || "";
}

function getEmployeeRole(employee) {
    return employee.role || employee.designation || employee.employee_role || "";
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatTimeForInput(date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

function getNextAvailableAppointmentDate(now = new Date()) {
    const nextDate = new Date(now);
    if (now.getHours() >= 18) {
        nextDate.setDate(nextDate.getDate() + 1);
    }
    return formatDateForInput(nextDate);
}

function updateAppointmentDateTimeLimits() {
    const dateInput = document.getElementById("appointmentDate");
    const timeInput = document.getElementById("appointmentTime");
    if (!dateInput || !timeInput) {
        return;
    }

    const now = new Date();
    const today = formatDateForInput(now);
    const minBookableDate = getNextAvailableAppointmentDate(now);
    const selectedDate = dateInput.value || minBookableDate;

    dateInput.min = minBookableDate;
    if (!dateInput.value || dateInput.value < minBookableDate) {
        dateInput.value = minBookableDate;
    }

    timeInput.min = "09:00";
    timeInput.max = "18:00";

    if (selectedDate === today) {
        const currentTime = formatTimeForInput(now);
        timeInput.min = currentTime > "09:00" ? currentTime : "09:00";
    }

    if (timeInput.value) {
        if (timeInput.value < timeInput.min || timeInput.value > timeInput.max) {
            timeInput.value = "";
        }
    }
}

function isValidAppointmentSlot(dateValue, timeValue) {
    if (!dateValue || !timeValue) {
        return false;
    }

    const now = new Date();
    const today = formatDateForInput(now);
    const minBookableDate = getNextAvailableAppointmentDate(now);

    if (dateValue < minBookableDate) {
        return false;
    }

    if (timeValue < "09:00" || timeValue > "18:00") {
        return false;
    }

    if (dateValue === today) {
        const currentTime = formatTimeForInput(now);
        if (timeValue < (currentTime > "09:00" ? currentTime : "09:00")) {
            return false;
        }
    }

    return true;
}

function isBillingRole(role) {
    const normalized = normalizeText(role);
    return normalized.includes("billing");
}

function isCashierRole(role) {
    const normalized = normalizeText(role);
    return normalized.includes("cashier") || normalized.includes("payment");
}

function initProtectedLinks() {
    document.querySelectorAll("[data-protected-link]").forEach((button) => {
        button.addEventListener("click", () => {
            const target = button.getAttribute("data-protected-link");
            window.location.href = getLoggedInPatient()
                ? target
                : `login.html?redirect=${encodeURIComponent(target)}`;
        });
    });
}

function initLoginPage() {
    const patientForm = document.getElementById("patientLoginForm");
    if (!patientForm) {
        return;
    }

    const doctorForm = document.getElementById("doctorLoginForm");
    const employeeForm = document.getElementById("employeeLoginForm");
    const messageEl = document.getElementById("authMessage");
    const redirectTarget = new URLSearchParams(window.location.search).get("redirect") || "dashboard.html";

    document.querySelectorAll("[data-role-tab]").forEach((tab) => {
        tab.addEventListener("click", () => {
            const selectedRole = tab.getAttribute("data-role-tab");
            document.querySelectorAll("[data-role-tab]").forEach((item) => item.classList.toggle("is-active", item === tab));
            patientForm.classList.toggle("hidden", selectedRole !== "patient");
            doctorForm.classList.toggle("hidden", selectedRole !== "doctor");
            employeeForm.classList.toggle("hidden", selectedRole !== "employee");
            showMessage(messageEl, "");
        });
    });

    patientForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(patientForm);
        const phone = formData.get("phone").trim();
        const password = formData.get("password").trim();
        const savedProfile = getPatientProfile();

        if (!phone || !password) {
            showMessage(messageEl, "Enter your registered phone number and password.", "error");
            return;
        }

        try {
            const result = await tryPost("/login", { phone, password });
            if (result.ok && (
                (typeof result.data === "string" && /successful/i.test(result.data)) ||
                (typeof result.data === "object" && result.data.patient)
            )) {
                const patient = typeof result.data === "object" && result.data.patient
                    ? result.data.patient
                    : savedProfile && savedProfile.phone === phone
                        ? savedProfile
                        : { name: "Patient", phone, age: "--", gender: "--", email: "" };
                setLoggedInPatient(patient);
                showMessage(messageEl, "Login successful. Redirecting...", "success");
                window.setTimeout(() => {
                    window.location.href = redirectTarget;
                }, 900);
                return;
            }
        } catch (error) {
            // Fall back to local registration data for preview mode.
        }

        if (savedProfile && savedProfile.phone === phone && savedProfile.password === password) {
            setLoggedInPatient(savedProfile);
            showMessage(messageEl, "Login successful. Redirecting...", "success");
            window.setTimeout(() => {
                window.location.href = redirectTarget;
            }, 900);
        } else {
            showMessage(messageEl, "Patient not registered. Please register first before logging in.", "error");
        }
    });

    doctorForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(doctorForm);
        const doctorId = formData.get("doctorId").trim();
        const password = formData.get("password").trim();

        if (!doctorId || !password) {
            showMessage(messageEl, "Enter doctor ID and password.", "error");
            return;
        }

        try {
            const result = await tryPost("/doctor-login", { doctorId, password });
            if (result.ok) {
                const doctorData = typeof result.data === "object" && result.data.doctor
                    ? result.data.doctor
                    : { doctor_id: doctorId, name: "Doctor" };
                setStoredValue(STORAGE_KEYS.doctor, doctorData);
                showMessage(messageEl, "Doctor login successful. Redirecting...", "success");
                window.setTimeout(() => {
                    window.location.href = "doctor-dashboard.html";
                }, 900);
                return;
            }
        } catch (error) {
            showMessage(messageEl, "Doctor login failed. Check doctor ID, password, or doctors table data.", "error");
            return;
        }

        showMessage(messageEl, "Doctor login was not accepted by the backend.", "error");
    });

    employeeForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(employeeForm);
        const employeeId = formData.get("employeeId").trim();
        const password = formData.get("password").trim();

        if (!employeeId || !password) {
            showMessage(messageEl, "Enter employee ID and password.", "error");
            return;
        }

        try {
            const result = await tryPost("/employee-login", { employeeId, password });
            if (result.ok) {
                const employeeData = typeof result.data === "object" && result.data.employee
                    ? result.data.employee
                    : { employee_id: employeeId, name: "Employee" };
                setStoredValue(STORAGE_KEYS.employee, employeeData);
                showMessage(messageEl, "Employee login successful. Redirecting...", "success");
                window.setTimeout(() => {
                    window.location.href = "employee-dashboard.html";
                }, 900);
                return;
            }
        } catch (error) {
            showMessage(messageEl, "Employee login failed. Check employee credentials or employee table data.", "error");
            return;
        }

        showMessage(messageEl, "Employee login was not accepted by the backend.", "error");
    });
}

function initRegisterPage() {
    const registerForm = document.getElementById("registerForm");
    if (!registerForm) {
        return;
    }

    const messageEl = document.getElementById("registerMessage");

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(registerForm);
        const patient = {
            name: formData.get("name").trim(),
            age: formData.get("age").trim(),
            gender: formData.get("gender").trim(),
            phone: formData.get("phone").trim(),
            email: formData.get("email").trim(),
            password: formData.get("password").trim()
        };

        if (!patient.name || !patient.age || !patient.gender || !patient.phone || !patient.password) {
            showMessage(messageEl, "Please fill in all required patient details.", "error");
            return;
        }

        try {
            await tryPost("/register", {
                name: patient.name,
                age: patient.age,
                gender: patient.gender,
                phone: patient.phone,
                password: patient.password
            });
        } catch (error) {
            // Keep local registration available for preview mode.
        }

        setPatientProfile(patient);
        setLoggedInPatient(null);
        localStorage.removeItem(STORAGE_KEYS.patient);
        showMessage(messageEl, "Registration completed. You can now log in as a patient.", "success");
        registerForm.reset();
        window.setTimeout(() => {
            window.location.href = "login.html";
        }, 1200);
    });
}

async function renderAppointments() {
    const container = document.getElementById("appointmentsList");
    const patient = getLoggedInPatient();
    if (!container || !patient) {
        return;
    }

    let appointments = [];
    try {
        const result = await tryGet(`/patient-appointments/${patient.patient_id}`);
        if (result.ok && Array.isArray(result.data)) {
            appointments = result.data;
        }
    } catch (error) {
        appointments = [];
    }

    if (!appointments.length) {
        container.innerHTML = '<div class="record-item"><h4>No appointments yet</h4><p>Your booked consultations will appear here after submission.</p></div>';
        return;
    }

    container.innerHTML = appointments.map((appointment) => `
        <article class="record-item">
            <h4>${appointment.department}</h4>
            <p>${appointment.doctor_name || "Assigned doctor"}</p>
            <p>${String(appointment.appointment_date).slice(0, 10)} at ${String(appointment.appointment_time).slice(0, 5)}</p>
            <p>Status: ${appointment.status}</p>
        </article>
    `).join("");
}

async function renderBills() {
    const container = document.getElementById("billingList");
    const patient = getLoggedInPatient();
    if (!container || !patient) {
        return;
    }

    let bills = [];
    try {
        const result = await tryGet(`/patient-bills/${patient.patient_id}`);
        if (result.ok && Array.isArray(result.data)) {
            bills = result.data;
        }
    } catch (error) {
        bills = [];
    }

    if (!bills.length) {
        container.innerHTML = '<div class="billing-card"><h3>No bills generated yet</h3><p>The bill appears here only after the billing desk creates it after treatment or consultation.</p></div>';
        return;
    }

    container.innerHTML = bills.map((bill) => `
        <article class="billing-card">
            <h3>${bill.department}</h3>
            <p>Amount: Rs. ${bill.amount}</p>
            <p>Status: ${bill.payment_status}</p>
            <p>Payment Mode: Offline only</p>
            <p>Treatment: ${bill.problem || "Consultation"}</p>
        </article>
    `).join("");
}

function updateLocalAppointmentStatus(appointmentId, status) {
    const appointments = getStoredList(STORAGE_KEYS.appointments).map((appointment) =>
        String(appointment.id) === String(appointmentId)
            ? { ...appointment, status }
            : appointment
    );
    setStoredValue(STORAGE_KEYS.appointments, appointments);
}

function updateLocalBillStatus(billId, status) {
    const bills = getStoredList(STORAGE_KEYS.bills).map((bill) =>
        String(bill.billId) === String(billId)
            ? { ...bill, status }
            : bill
    );
    setStoredValue(STORAGE_KEYS.bills, bills);
}

async function renderDoctorAppointments() {
    const container = document.getElementById("doctorAppointmentsList");
    if (!container) {
        return;
    }

    const doctor = getStoredValue(STORAGE_KEYS.doctor);
    let appointments = [];
    try {
        const result = await tryGet(`/doctor-appointments/${doctor.doctor_id}`);
        if (result.ok && Array.isArray(result.data)) {
            appointments = result.data;
        }
    } catch (error) {
        appointments = [];
    }

    if (!appointments.length) {
        container.innerHTML = '<div class="record-item"><h4>No department appointments yet</h4><p>Only appointments matching your department are shown here.</p></div>';
        return;
    }

    container.innerHTML = appointments.map((appointment) => `
        <article class="record-item">
            <div class="panel-header">
                <div>
                    <h4>${appointment.department}</h4>
                    <p>Patient: ${appointment.patient_name} (${appointment.patient_phone})</p>
                </div>
                <span class="status-badge">${appointment.status}</span>
            </div>
            <p>Date: ${String(appointment.appointment_date).slice(0, 10)}</p>
            <p>Time: ${String(appointment.appointment_time).slice(0, 5)}</p>
            <p>Problem: ${appointment.problem}</p>
            ${appointment.status === "Pending" ? `
                <div class="record-item-actions">
                    <button class="mini-button accept" type="button" data-appointment-action="Accepted" data-appointment-id="${appointment.appointment_id}">Accept</button>
                    <button class="mini-button reject" type="button" data-appointment-action="Rejected" data-appointment-id="${appointment.appointment_id}">Reject</button>
                </div>
            ` : ""}
        </article>
    `).join("");
}

function renderProfile() {
    const patient = getLoggedInPatient();
    const welcomeHeading = document.getElementById("welcomeHeading");
    const overviewProblem = document.getElementById("overviewProblem");
    const profileCard = document.getElementById("profileCard");

    if (!patient || !profileCard) {
        return;
    }

    welcomeHeading.textContent = `Welcome, ${patient.name}`;
    overviewProblem.textContent = `Registered profile: ${patient.age} years old, ${patient.gender || "gender not provided"}.`;
    profileCard.innerHTML = `
        <div class="profile-row"><span>Patient Name</span><span>${patient.name}</span></div>
        <div class="profile-row"><span>Age</span><span>${patient.age}</span></div>
        <div class="profile-row"><span>Gender</span><span>${patient.gender || "Not provided"}</span></div>
        <div class="profile-row"><span>Phone</span><span>${patient.phone}</span></div>
        <div class="profile-row"><span>Email</span><span>${patient.email || "Not provided"}</span></div>
    `;

    const form = document.getElementById("patientProfileForm");
    if (form) {
        form.elements.namedItem("name").value = patient.name || "";
        form.elements.namedItem("age").value = patient.age || "";
        form.elements.namedItem("gender").value = patient.gender || "Male";
        form.elements.namedItem("phone").value = patient.phone || "";
        form.elements.namedItem("password").value = patient.password || "";
    }
}

function initDashboardPage() {
    const appointmentForm = document.getElementById("appointmentForm");
    if (!appointmentForm) {
        return;
    }

    if (!ensureLoggedIn("dashboard.html")) {
        return;
    }

    renderProfile();
    renderAppointments();
    renderBills();

    const appointmentMessage = document.getElementById("appointmentMessage");
    const patient = getLoggedInPatient();
    const appointmentDateInput = document.getElementById("appointmentDate");
    const patientProfileForm = document.getElementById("patientProfileForm");
    const patientProfileMessage = document.getElementById("patientProfileMessage");

    updateAppointmentDateTimeLimits();
    appointmentDateInput.addEventListener("change", updateAppointmentDateTimeLimits);

    appointmentForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        updateAppointmentDateTimeLimits();
        const formData = new FormData(appointmentForm);
        const appointment = {
            id: Date.now(),
            phone: patient.phone,
            department: formData.get("department").trim(),
            appointmentDate: formData.get("appointmentDate"),
            appointmentTime: formData.get("appointmentTime"),
            visitMode: formData.get("visitMode"),
            problem: formData.get("problem").trim(),
            status: "Pending"
        };

        if (!isValidAppointmentSlot(appointment.appointmentDate, appointment.appointmentTime)) {
            showMessage(appointmentMessage, "Appointments can only be booked from today onward, during hospital hours from 9:00 AM to 6:00 PM.", "error");
            return;
        }

        try {
            const result = await tryPost("/book", {
                patient_id: patient.patient_id,
                department: appointment.department,
                problem: appointment.problem,
                appointment_date: appointment.appointmentDate,
                appointment_time: appointment.appointmentTime
            });

            if (!result.ok) {
                const errorMessage = typeof result.data === "object" && result.data.message
                    ? result.data.message
                    : "Unable to book appointment right now.";
                showMessage(appointmentMessage, errorMessage, "error");
                return;
            }
        } catch (error) {
            showMessage(appointmentMessage, "Unable to book appointment right now.", "error");
            return;
        }

        appointmentForm.reset();
        showMessage(appointmentMessage, "Appointment request sent successfully.", "success");
        renderAppointments();
        renderBills();
    });

    document.getElementById("logoutButton").addEventListener("click", () => {
        localStorage.removeItem(STORAGE_KEYS.patient);
        window.location.href = "index.html";
    });

    patientProfileForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(patientProfileForm);
        const updatedPatient = {
            ...getLoggedInPatient(),
            name: formData.get("name").trim(),
            age: formData.get("age").trim(),
            gender: formData.get("gender").trim(),
            phone: formData.get("phone").trim(),
            password: formData.get("password").trim()
        };

        try {
            if (updatedPatient.patient_id) {
                await tryPut(`/patient-profile/${updatedPatient.patient_id}`, updatedPatient);
            }
        } catch (error) {
            // Keep UI state editable if backend update is temporarily unavailable.
        }

        setLoggedInPatient(updatedPatient);
        setPatientProfile(updatedPatient);
        renderProfile();
        showMessage(patientProfileMessage, "Patient profile updated successfully.", "success");
    });

    document.getElementById("deletePatientAccountButton").addEventListener("click", async () => {
        const currentPatient = getLoggedInPatient();
        const confirmed = window.confirm("Are you sure you want to delete your patient account?");
        if (!confirmed) {
            return;
        }

        try {
            if (currentPatient && currentPatient.patient_id) {
                await tryDelete(`/patient-profile/${currentPatient.patient_id}`);
            }
        } catch (error) {
            // Continue cleanup locally if backend deletion fails.
        }

        localStorage.removeItem(STORAGE_KEYS.patient);
        localStorage.removeItem(STORAGE_KEYS.profile);
        window.location.href = "register.html";
    });
}

function initDoctorDashboardPage() {
    const doctorHeading = document.getElementById("doctorWelcomeHeading");
    if (!doctorHeading) {
        return;
    }

    const doctor = getStoredValue(STORAGE_KEYS.doctor);
    if (!doctor) {
        window.location.href = "login.html";
        return;
    }

    const doctorName = doctor.name || doctor.doctor_name || "Doctor";
    const doctorId = doctor.doctor_id || doctor.id || "-";
    const doctorDepartment = getDoctorDepartment(doctor) || "Not assigned";

    doctorHeading.textContent = `Welcome, ${doctorName}`;
    document.getElementById("doctorNameValue").textContent = doctorName;
    document.getElementById("doctorIdValue").textContent = doctorId;
    document.getElementById("doctorDepartmentValue").textContent = doctorDepartment;
    renderDoctorAppointments();

    const doctorProfileForm = document.getElementById("doctorProfileForm");
    doctorProfileForm.elements.namedItem("name").value = doctor.name || "";
    doctorProfileForm.elements.namedItem("specialization").value = doctor.specialization || doctorDepartment || "";
    doctorProfileForm.elements.namedItem("phone").value = doctor.phone || "";
    doctorProfileForm.elements.namedItem("password").value = doctor.password || "";

    const messageEl = document.getElementById("doctorAppointmentMessage");
    const doctorProfileMessage = document.getElementById("doctorProfileMessage");
    const appointmentList = document.getElementById("doctorAppointmentsList");

    appointmentList.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-appointment-action]");
        if (!button) {
            return;
        }

        const appointmentId = button.getAttribute("data-appointment-id");
        const status = button.getAttribute("data-appointment-action");

        try {
            await tryPut(`/update-status/${appointmentId}`, { status });
        } catch (error) {
            // Keep doctor workflow active for local preview data.
        }

        renderDoctorAppointments();
        showMessage(messageEl, `Appointment ${status.toLowerCase()} successfully.`, "success");
    });

    document.getElementById("doctorLogoutButton").addEventListener("click", () => {
        localStorage.removeItem(STORAGE_KEYS.doctor);
        window.location.href = "index.html";
    });

    doctorProfileForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(doctorProfileForm);
        const updatedDoctor = {
            ...doctor,
            name: formData.get("name").trim(),
            specialization: formData.get("specialization").trim(),
            phone: formData.get("phone").trim(),
            password: formData.get("password").trim()
        };

        try {
            await tryPut(`/doctor-profile/${doctor.doctor_id}`, updatedDoctor);
        } catch (error) {
            // Keep local profile editable even if backend is temporarily unreachable.
        }

        setStoredValue(STORAGE_KEYS.doctor, updatedDoctor);
        document.getElementById("doctorNameValue").textContent = updatedDoctor.name;
        document.getElementById("doctorDepartmentValue").textContent = updatedDoctor.specialization;
        showMessage(doctorProfileMessage, "Doctor profile updated successfully.", "success");
    });
}

async function renderBillingDeskAppointments() {
    const container = document.getElementById("billingAppointmentsList");
    if (!container) {
        return;
    }

    let appointments = [];
    try {
        const result = await tryGet("/billing-queue");
        if (result.ok && Array.isArray(result.data)) {
            appointments = result.data;
        }
    } catch (error) {
        appointments = [];
    }

    if (!appointments.length) {
        container.innerHTML = '<div class="record-item"><h4>No appointments ready for billing</h4><p>Accepted appointments without a bill will appear here for billing desk processing.</p></div>';
        return;
    }

    container.innerHTML = appointments.map((appointment) => `
        <article class="record-item">
            <h4>${appointment.department}</h4>
            <p>Patient: ${appointment.patient_name} (${appointment.patient_phone})</p>
            <p>Date: ${String(appointment.appointment_date).slice(0, 10)}</p>
            <p>Problem: ${appointment.problem}</p>
            <div class="record-item-actions">
                <input class="bill-amount-input" type="number" min="0" placeholder="Enter bill amount" data-bill-input="${appointment.appointment_id}">
                <button class="mini-button accept" type="button" data-generate-bill="${appointment.appointment_id}">Generate Bill</button>
            </div>
        </article>
    `).join("");
}

async function renderEmployeeBills() {
    const container = document.getElementById("employeeBillsList");
    if (!container) {
        return;
    }

    let bills = [];
    try {
        const result = await tryGet("/cashier-bills");
        if (result.ok && Array.isArray(result.data)) {
            bills = result.data;
        }
    } catch (error) {
        bills = [];
    }

    if (!bills.length) {
        container.innerHTML = '<div class="record-item"><h4>No cashier payments pending</h4><p>Billing desk must generate a bill first. Only then will it appear here for cashier payment acceptance.</p></div>';
        return;
    }

    container.innerHTML = bills.map((bill) => `
        <article class="record-item">
            <div class="panel-header">
                <div>
                    <h4>${bill.department}</h4>
                    <p>Patient: ${bill.patient_name} (${bill.patient_phone})</p>
                </div>
                <span class="status-badge">${bill.payment_status}</span>
            </div>
            <p>Bill Amount: Rs. ${bill.amount}</p>
            <p>Payment Mode: Offline only</p>
            <p>Treatment: ${bill.problem || "Consultation"}</p>
            ${bill.payment_status !== "Paid" ? `
                <div class="record-item-actions">
                    <button class="mini-button accept" type="button" data-bill-action="Paid" data-bill-id="${bill.bill_id}">Accept Payment</button>
                </div>
            ` : ""}
        </article>
    `).join("");
}

function initEmployeeDashboardPage() {
    const employeeHeading = document.getElementById("employeeWelcomeHeading");
    if (!employeeHeading) {
        return;
    }

    const employee = getStoredValue(STORAGE_KEYS.employee);
    if (!employee) {
        window.location.href = "login.html";
        return;
    }

    const employeeName = employee.name || employee.employee_name || "Employee";
    const employeeId = employee.employee_id || employee.id || "-";
    const employeeRole = getEmployeeRole(employee) || "billing / cashier";
    const billingSection = document.getElementById("billing-desk");
    const cashierSection = document.getElementById("cashier-desk");

    employeeHeading.textContent = `Welcome, ${employeeName}`;
    document.getElementById("employeeNameValue").textContent = employeeName;
    document.getElementById("employeeIdValue").textContent = employeeId;
    document.getElementById("employeeRoleValue").textContent = employeeRole;

    const employeeProfileForm = document.getElementById("employeeProfileForm");
    employeeProfileForm.elements.namedItem("name").value = employee.name || "";
    employeeProfileForm.elements.namedItem("designation").value = employee.designation || employeeRole || "";
    employeeProfileForm.elements.namedItem("phone").value = employee.phone || "";
    employeeProfileForm.elements.namedItem("password").value = employee.password || "";

    if (isBillingRole(employeeRole) && !isCashierRole(employeeRole)) {
        cashierSection.classList.add("hidden");
    } else if (isCashierRole(employeeRole) && !isBillingRole(employeeRole)) {
        billingSection.classList.add("hidden");
    }

    renderBillingDeskAppointments();
    renderEmployeeBills();

    const billingMessageEl = document.getElementById("billingDeskMessage");
    const cashierMessageEl = document.getElementById("cashierDeskMessage");
    const employeeProfileMessage = document.getElementById("employeeProfileMessage");
    const billingAppointmentsList = document.getElementById("billingAppointmentsList");
    const billList = document.getElementById("employeeBillsList");

    billingAppointmentsList.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-generate-bill]");
        if (!button) {
            return;
        }

        const appointmentId = button.getAttribute("data-generate-bill");
        const amountInput = document.querySelector(`[data-bill-input="${appointmentId}"]`);
        const amount = Number(amountInput ? amountInput.value : 0);
        if (!amount || amount <= 0) {
            showMessage(billingMessageEl, "Enter a valid bill amount before generating the bill.", "error");
            return;
        }

        try {
            const result = await tryPost("/generate-bill", {
                appointment_id: appointmentId,
                amount
            });
            if (!result.ok) {
                showMessage(billingMessageEl, "Unable to generate bill right now.", "error");
                return;
            }
        } catch (error) {
            showMessage(billingMessageEl, "Unable to generate bill right now.", "error");
            return;
        }

        renderBillingDeskAppointments();
        renderEmployeeBills();
        renderBills();
        showMessage(billingMessageEl, "Bill generated successfully and now visible to the patient and cashier.", "success");
    });

    billList.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-bill-action]");
        if (!button) {
            return;
        }

        const billId = button.getAttribute("data-bill-id");
        const status = button.getAttribute("data-bill-action");

        try {
            await tryPut(`/payment/${billId}`, { status });
        } catch (error) {
            // Keep payment desk preview flow working without backend connectivity.
        }

        renderEmployeeBills();
        renderBills();
        showMessage(cashierMessageEl, `Billing status updated to ${status}.`, "success");
    });

    document.getElementById("employeeLogoutButton").addEventListener("click", () => {
        localStorage.removeItem(STORAGE_KEYS.employee);
        window.location.href = "index.html";
    });

    employeeProfileForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(employeeProfileForm);
        const updatedEmployee = {
            ...employee,
            name: formData.get("name").trim(),
            designation: formData.get("designation").trim(),
            phone: formData.get("phone").trim(),
            password: formData.get("password").trim()
        };

        try {
            await tryPut(`/employee-profile/${employee.emp_id}`, updatedEmployee);
        } catch (error) {
            // Keep local profile editable even if backend is temporarily unreachable.
        }

        setStoredValue(STORAGE_KEYS.employee, updatedEmployee);
        document.getElementById("employeeNameValue").textContent = updatedEmployee.name;
        document.getElementById("employeeRoleValue").textContent = updatedEmployee.designation;
        showMessage(employeeProfileMessage, "Employee profile updated successfully.", "success");
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initProtectedLinks();
    initLoginPage();
    initRegisterPage();
    initDashboardPage();
    initDoctorDashboardPage();
    initEmployeeDashboardPage();
});
