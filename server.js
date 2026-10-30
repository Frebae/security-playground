const express = require("express");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const app = express();
const pool = new Pool({
    host: "192.168.56.101", port: 5432,
    user: "playground_user", password: "test123",
    database: "security_playground"
});

// Profielvelden die gelezen en opgeslagen worden
const FIELDS = ["village", "clan", "rank", "chakra", "jutsu", "food",
                "dream", "trait", "weakness", "team", "message"];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: "shinobi-secret", resave: false, saveUninitialized: false }));
app.use(express.static("public"));

const loginLimiter = rateLimit({
    windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false,
    message: "Too many login attempts. Try again in one minute."
});

const requireLogin = (req, res, next) =>
    req.session.userId ? next() : res.status(401).json({ error: "Not logged in" });

// Haalt een gebruiker op en stuurt die als JSON terug
async function sendUser(res, columns, id, errorMsg) {
    try {
        const { rows: [user] } = await pool.query(
            `SELECT ${columns} FROM users WHERE id = $1`, [id]);
        user ? res.json(user) : res.status(404).json({ error: "User not found" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: errorMsg });
    }
}

app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        await pool.query(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
            [username, email, hash]);
        res.redirect("/");
    } catch (err) {
        console.error("Registration error:", err);
        if (err.code === "23505") return res.send("An account with this email already exists.");
        res.status(500).send("Something went wrong while creating your account.");
    }
});

app.post("/login", loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        const { rows: [user] } = await pool.query(
            "SELECT id, password FROM users WHERE email = $1", [email]);
        if (!user || !(await bcrypt.compare(password, user.password)))
            return res.send("Incorrect email or password.");
        req.session.userId = user.id;
        res.redirect("/home.html");
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send("Something went wrong while logging in.");
    }
});

app.get("/api/users", requireLogin, async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT id, username FROM users ORDER BY username");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not load users" });
    }
});

app.get("/api/users/:id", requireLogin, (req, res) =>
    sendUser(res, `id, username, ${FIELDS.join(", ")}`, req.params.id, "Could not load user profile"));

app.get("/api/profile", requireLogin, (req, res) =>
    sendUser(res, `username, email, ${FIELDS.join(", ")}`, req.session.userId, "Could not load profile"));

app.post("/profile", async (req, res) => {
    if (!req.session.userId) return res.redirect("/");
    const set = FIELDS.map((f, i) => `${f} = $${i + 1}`).join(", ");
    try {
        await pool.query(
            `UPDATE users SET ${set} WHERE id = $${FIELDS.length + 1}`,
            [...FIELDS.map(f => req.body[f]), req.session.userId]);
        res.redirect("/profile.html");
    } catch (err) {
        console.error("Profile save error:", err);
        res.status(500).send("Could not save profile.");
    }
});

app.get("/logout", (req, res) => req.session.destroy(() => res.redirect("/")));

app.listen(3000, () => console.log("Security Playground running on http://localhost:3000"));