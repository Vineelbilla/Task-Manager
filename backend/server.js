const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const protect = require("./middleware/authMiddleware");
const errorHandler = require("./middleware/errorMiddleware");
const { getDashboard } = require("./controllers/taskController");

dotenv.config();
connectDB();

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!process.env.FRONTEND_URL || !origin) {
        return callback(null, true);
      }

      const allowedOrigins = process.env.FRONTEND_URL.split(",").map((item) => item.trim());
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.get("/api/dashboard", protect, getDashboard);

if (process.env.NODE_ENV === "production") {
  const frontendDistPath = path.join(__dirname, "..", "frontend", "dist");
  app.use(express.static(frontendDistPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }

    return res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res
      .status(200)
      .send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Team Task Manager API</title>
    <style>
      body {
        margin: 0;
        font-family: Segoe UI, Arial, sans-serif;
        background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
        color: #e2e8f0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
      }
      .card {
        width: min(100%, 720px);
        background: rgba(15, 23, 42, 0.88);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 20px;
        padding: 32px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
      }
      h1, p, li {
        margin-top: 0;
      }
      code {
        color: #93c5fd;
      }
      ul {
        padding-left: 18px;
      }
      a {
        color: #93c5fd;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Team Task Manager API</h1>
      <p>The backend server is running successfully.</p>
      <p>Use the React frontend on <code>http://localhost:5173</code> when Vite is running.</p>
      <ul>
        <li><code>POST /api/auth/signup</code></li>
        <li><code>POST /api/auth/login</code></li>
        <li><code>GET /api/dashboard</code></li>
        <li><code>GET /api/projects</code></li>
        <li><code>GET /api/tasks</code></li>
      </ul>
    </div>
  </body>
</html>`);
  });
}

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
