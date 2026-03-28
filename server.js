const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "hospital_db";
const DB_PORT = Number(process.env.DB_PORT || 3306);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// DB connection
const db = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT
});

db.connect(err => {
    if (err) {
        console.log("DB Connection Failed", err);
    } else {
        console.log("Connected to MySQL");
    }
});

// Test route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Register Patient
app.post("/register", (req, res) => {
    const { name, age, gender, phone, password } = req.body;

    const sql = "INSERT INTO patients (name, age, gender, phone, password) VALUES (?, ?, ?, ?, ?)";

    db.query(sql, [name, age, gender, phone, password], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send("Patient Registered Successfully");
        }
    });
});

// Patient Login
app.post("/login", (req, res) => {
    const { phone, password } = req.body;

    const sql = "SELECT * FROM patients WHERE phone = ? AND password = ?";

    db.query(sql, [phone, password], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            if (result.length > 0) {
                res.send("Login Successful");
            } else {
                res.send("Invalid Credentials");
            }
        }
    });
});

// Book Appointment
app.post("/book", (req, res) => {
    const { patient_id, doctor_id, problem, appointment_date, appointment_time } = req.body;

    const sql = `
        INSERT INTO appointments 
        (patient_id, doctor_id, problem, appointment_date, appointment_time, status) 
        VALUES (?, ?, ?, ?, ?, 'Pending')
    `;

    db.query(sql, [patient_id, doctor_id, problem, appointment_date, appointment_time], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send("Appointment Booked Successfully");
        }
    });
});

// View Appointments
app.get("/appointments", (req, res) => {
    const sql = `
        SELECT 
            a.appointment_id,
            p.name AS patient_name,
            d.name AS doctor_name,
            a.problem,
            a.appointment_date,
            a.appointment_time,
            a.status
        FROM appointments a
        JOIN patients p ON a.patient_id = p.patient_id
        JOIN doctors d ON a.doctor_id = d.doctor_id
    `;

    db.query(sql, (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(result);
        }
    });
});

// Update Appointment Status
app.put("/update-status/:id", (req, res) => {
    const { status } = req.body;
    const appointment_id = req.params.id;

    const sql = "UPDATE appointments SET status = ? WHERE appointment_id = ?";

    db.query(sql, [status, appointment_id], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send("Appointment Status Updated");
        }
    });
});

// Generate Bill
app.post("/generate-bill", (req, res) => {
    const { appointment_id, amount } = req.body;

    const sql = `
        INSERT INTO billing (appointment_id, amount, payment_status)
        VALUES (?, ?, 'Pending')
    `;

    db.query(sql, [appointment_id, amount], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send("Bill Generated Successfully");
        }
    });
});

// View Bills
app.get("/bills", (req, res) => {
    const sql = `
        SELECT 
            b.bill_id,
            p.name AS patient_name,
            d.name AS doctor_name,
            b.amount,
            b.payment_status
        FROM billing b
        JOIN appointments a ON b.appointment_id = a.appointment_id
        JOIN patients p ON a.patient_id = p.patient_id
        JOIN doctors d ON a.doctor_id = d.doctor_id
    `;

    db.query(sql, (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(result);
        }
    });
});

// Update Payment Status
app.put("/payment/:id", (req, res) => {
    const { status } = req.body;
    const bill_id = req.params.id;

    const sql = "UPDATE billing SET payment_status = ? WHERE bill_id = ?";

    db.query(sql, [status, bill_id], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send("Payment Updated");
        }
    });
});

// Doctor Login
app.post("/doctor-login", (req, res) => {
    const { doctorId, password } = req.body;

    const sql = "SELECT * FROM doctors WHERE (doctor_id = ? OR phone = ?) AND password = ?";

    db.query(sql, [doctorId, doctorId, password], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            if (result.length > 0) {
                res.json({
                    message: "Doctor Login Successful",
                    doctor: result[0]
                });
            } else {
                res.status(401).json({
                    message: "Invalid Doctor Credentials"
                });
            }
        }
    });
});

// Employee Login
app.post("/employee-login", (req, res) => {
    const { employeeId, password } = req.body;

    const sql = "SELECT * FROM employees WHERE (emp_id = ? OR phone = ?) AND password = ?";

    db.query(sql, [employeeId, employeeId, password], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            if (result.length > 0) {
                res.json({
                    message: "Employee Login Successful",
                    employee: result[0]
                });
            } else {
                res.status(401).json({
                    message: "Invalid Employee Credentials"
                });
            }
        }
    });
});
