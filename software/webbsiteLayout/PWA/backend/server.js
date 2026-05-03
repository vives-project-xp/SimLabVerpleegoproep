const path = require("path");
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const webpush = require("web-push");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const USERS_FILE = path.join(__dirname, "users.json");
const SUBSCRIPTIONS_FILE = path.join(__dirname, "push-subscriptions.json");
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

const defaultUsers = {
    Leerkracht: {
        password: "Leerkracht1",
        role: "leerkracht"
    },
    Leerling: {
        password: "Leerling1",
        role: "leerling"
    }
};

const beds = {
    C302_1: "idle",
    C302_2: "idle",
    C302_3: "idle",
    C302_4: "idle",
    C314_1: "idle",
    C314_2: "idle",
    C314_3: "idle",
    C314_4: "idle",
    C314_5: "idle",
    C314_6: "idle"
};

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(FRONTEND_DIR));

app.use(session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: "lax"
    }
}));

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        "mailto:test@test.com",
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

function readJson(filePath, fallback) {
    try {
        if (!fs.existsSync(filePath)) {
            return fallback;
        }

        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (err) {
        console.error(`Kon ${filePath} niet lezen:`, err);
        return fallback;
    }
}

function writeJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getUsers() {
    return readJson(USERS_FILE, defaultUsers);
}

function saveUsers(users) {
    writeJson(USERS_FILE, users);
}

function getSubscriptions() {
    return readJson(SUBSCRIPTIONS_FILE, []);
}

function saveSubscriptions(subscriptions) {
    writeJson(SUBSCRIPTIONS_FILE, subscriptions);
}

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ success: false, error: "Niet ingelogd" });
    }

    next();
}

function requireTeacher(req, res, next) {
    if (!req.session.user || req.session.user.role !== "leerkracht") {
        return res.status(403).json({ success: false, error: "Geen toegang" });
    }

    next();
}

function calculateCounts() {
    const values = Object.values(beds);

    return {
        help: values.filter(status => status === "call" || status === "extra").length,
        colleague: values.filter(status => status === "present").length,
        lowBat: values.filter(status => status === "low_battery").length
    };
}

function normalizeBedId(room, bed, bedId) {
    if (bedId) {
        return String(bedId);
    }

    return `${room}_${bed}`;
}

function sendNotifications(data) {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        return;
    }

    const payload = JSON.stringify({
        title: "Nieuwe oproep",
        body: `Kamer ${data.room} bed ${data.bed}: ${data.status}`,
        icon: "/icon.svg",
        badge: "/icon.svg",
        data: {
            url: "/"
        }
    });

    const subscriptions = getSubscriptions();
    const validSubscriptions = [];

    subscriptions.forEach(subscription => {
        webpush.sendNotification(subscription, payload).catch(err => {
            console.error("Push notificatie mislukt:", err.message);
        });
        validSubscriptions.push(subscription);
    });

    saveSubscriptions(validSubscriptions);
}

app.get("/", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login.html");
    }

    res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();
    const user = users[username];

    if (!user || user.password !== password) {
        return res.status(401).json({ success: false, error: "Login mislukt" });
    }

    req.session.user = {
        username,
        role: user.role
    };

    res.json({ success: true, user: req.session.user });
});

app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

app.get("/api/me", requireLogin, (req, res) => {
    res.json({ success: true, user: req.session.user });
});

app.get("/api/state", requireLogin, (req, res) => {
    res.json({
        beds,
        counts: calculateCounts()
    });
});

app.post("/api/call", (req, res) => {
    const { room, bed, bedId, status } = req.body;
    const normalizedStatus = status || "idle";
    const normalizedBedId = normalizeBedId(room, bed, bedId);

    beds[normalizedBedId] = normalizedStatus;

    console.log("Update ontvangen:", {
        room,
        bed,
        bedId: normalizedBedId,
        status: normalizedStatus
    });

    sendNotifications({
        room,
        bed,
        bedId: normalizedBedId,
        status: normalizedStatus
    });

    res.json({ success: true });
});

app.get("/api/push/public-key", requireLogin, (req, res) => {
    if (!process.env.VAPID_PUBLIC_KEY) {
        return res.status(500).json({ success: false, error: "VAPID public key ontbreekt" });
    }

    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

app.post("/api/push/subscribe", requireLogin, (req, res) => {
    const subscriptions = getSubscriptions();
    const exists = subscriptions.some(subscription => subscription.endpoint === req.body.endpoint);

    if (!exists) {
        subscriptions.push(req.body);
        saveSubscriptions(subscriptions);
    }

    res.json({ success: true });
});

app.post("/api/push/unsubscribe", requireLogin, (req, res) => {
    const { endpoint } = req.body;
    const subscriptions = getSubscriptions().filter(subscription => subscription.endpoint !== endpoint);

    saveSubscriptions(subscriptions);
    res.json({ success: true });
});

app.post("/api/change-password", requireTeacher, (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const users = getUsers();
    const teacher = users[req.session.user.username];

    if (!teacher || teacher.password !== currentPassword) {
        return res.status(400).json({ success: false, error: "Huidig wachtwoord is fout" });
    }

    if (!newPassword || newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, error: "Nieuwe wachtwoorden komen niet overeen" });
    }

    teacher.password = newPassword;
    saveUsers(users);

    res.json({ success: true, message: "Eigen wachtwoord gewijzigd" });
});

app.post("/api/change-student-password", requireTeacher, (req, res) => {
    const { newPassword, confirmPassword } = req.body;
    const users = getUsers();

    if (!newPassword || newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, error: "Nieuwe wachtwoorden komen niet overeen" });
    }

    users.Leerling.password = newPassword;
    saveUsers(users);

    res.json({ success: true, message: "Wachtwoord leerling gewijzigd" });
});

app.listen(PORT, () => {
    console.log(`SimLab API draait op poort ${PORT}`);
});
