// ========================================
// IMPORTS
// ========================================

const express = require("express");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const app = express();
const PORT = 3000;


// ========================================
// DATABASE
// ========================================

const pool = new Pool({
    host: "192.168.56.101",
    port: 5432,
    user: "playground_user",
    password: "test123",
    database: "security_playground"
});


// ========================================
// MIDDLEWARE
// ========================================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: "shinobi-secret",
    resave: false,
    saveUninitialized: false
}));

app.use(express.static("public"));


// ========================================
// LOGIN RATE LIMIT
// ========================================

const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many login attempts. Try again in one minute."
});


// ========================================
// DATABASE CONNECTION
// ========================================

pool.connect()
    .then(client => {
        console.log("Connected to PostgreSQL database.");
        client.release();
    })
    .catch(error => {
        console.error("Database connection failed:", error);
    });


// ========================================
// REGISTER
// ========================================

app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            `
            INSERT INTO users (username, email, password)
            VALUES ($1, $2, $3)
            `,
            [username, email, hashedPassword]
        );

        console.log("User registered:", email);

        res.redirect("/");

    } catch (error) {
        console.error("Registration error:", error);

        if (error.code === "23505") {
            return res.send(
                "An account with this email already exists."
            );
        }

        res.status(500).send(
            "Something went wrong while creating your account."
        );
    }
});


// ========================================
// LOGIN
// ========================================

app.post("/login", loginLimiter, async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query(
            `
            SELECT *
            FROM users
            WHERE email = $1
            `,
            [email]
        );

        if (result.rows.length === 0) {
            console.log("Login failed:", email);

            return res.send(
                "Incorrect email or password."
            );
        }

        const user = result.rows[0];

        // Compare entered password with stored hash
        const passwordMatches =
            await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            console.log("Login failed:", email);

            return res.send(
                "Incorrect email or password."
            );
        }

        req.session.userId = user.id;

        console.log("Login successful:", user.username);

        res.redirect("/home.html");

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).send(
            "Something went wrong while logging in."
        );
    }
});


// ========================================
// LOAD USERS
// ========================================

app.get("/api/users", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            error: "Not logged in"
        });
    }

    try {
        const result = await pool.query(
            `
            SELECT id, username
            FROM users
            ORDER BY username
            `
        );

        res.json(result.rows);

    } catch (error) {
        console.error("User list error:", error);

        res.status(500).json({
            error: "Could not load users"
        });
    }
});


// ========================================
// LOAD OTHER USER PROFILE
// ========================================

app.get("/api/users/:id", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            error: "Not logged in"
        });
    }

    const userId = req.params.id;

    try {
        const result = await pool.query(
            `
            SELECT
                id,
                username,
                village,
                clan,
                rank,
                chakra,
                jutsu,
                food,
                dream,
                trait,
                weakness,
                team,
                message
            FROM users
            WHERE id = $1
            `,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error("User profile error:", error);

        res.status(500).json({
            error: "Could not load user profile"
        });
    }
});


// ========================================
// LOAD OWN PROFILE
// ========================================

app.get("/api/profile", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            error: "Not logged in"
        });
    }

    try {
        const result = await pool.query(
            `
            SELECT
                username,
                email,
                village,
                clan,
                rank,
                chakra,
                jutsu,
                food,
                dream,
                trait,
                weakness,
                team,
                message
            FROM users
            WHERE id = $1
            `,
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error("Profile load error:", error);

        res.status(500).json({
            error: "Could not load profile"
        });
    }
});


// ========================================
// SAVE OWN PROFILE
// ========================================

app.post("/profile", async (req, res) => {
    if (!req.session.userId) {
        return res.redirect("/");
    }

    const {
        village,
        clan,
        rank,
        chakra,
        jutsu,
        food,
        dream,
        trait,
        weakness,
        team,
        message
    } = req.body;

    try {
        await pool.query(
            `
            UPDATE users
            SET
                village = $1,
                clan = $2,
                rank = $3,
                chakra = $4,
                jutsu = $5,
                food = $6,
                dream = $7,
                trait = $8,
                weakness = $9,
                team = $10,
                message = $11
            WHERE id = $12
            `,
            [
                village,
                clan,
                rank,
                chakra,
                jutsu,
                food,
                dream,
                trait,
                weakness,
                team,
                message,
                req.session.userId
            ]
        );

        console.log(
            "Profile saved for user ID:",
            req.session.userId
        );

        res.redirect("/profile.html");

    } catch (error) {
        console.error("Profile save error:", error);

        res.status(500).send(
            "Could not save profile."
        );
    }
});


// ========================================
// LOGOUT
// ========================================

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});


// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
    console.log(
        `Security Playground running on http://localhost:${PORT}`
    );

    console.log("POST /register route is ready.");
    console.log("POST /login route is ready.");
    console.log("Login rate limit: 5 attempts per minute.");
    console.log("Password hashing with bcrypt is enabled.");
    console.log("GET /api/users route is ready.");
    console.log("GET /api/users/:id route is ready.");
    console.log("GET /api/profile route is ready.");
    console.log("POST /profile route is ready.");
});