const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const taskRoutes = require("./routes/taskRoutes");
const teamRoutes = require("./routes/teamRoutes");
const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const draftRoutes = require("./routes/draftRoutes");
const authRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const userRoutes = require("./routes/userRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

app.use("/api", (req, res, next) => {
  console.log(req.method, req.originalUrl);
  next();
});

app.use("/api", draftRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", workspaceRoutes);
app.use("/api", userRoutes);
app.use("/api", reviewRoutes);
app.use("/api", taskRoutes);
app.use("/api", teamRoutes);

app.get("/", (req, res) => {
  res.send("DraftYard API is running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});