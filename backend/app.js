require("dotenv").config();
const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const http = require("http");

dotenv.config();

const { oauth2client, refreshAccessToken } = require("./config/googleClient");
require("./services/cronJob.js");
const { redis, setCache, getCache } = require("./config/redisClient.js");
const { initSocket } = require("./config/socket"); // import your socket module

const userRoutes = require("./routes/userRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const testReportsRoutes = require("./routes/testReportsRoutes");
const doctorProfileRoutes = require("./routes/doctorProfileRoutes");
const receptionProfileRoutes = require("./routes/receptionProfileRoutes.js");
const feedbackRoutes = require("./routes/feedbackRoutes");
const healthWorkerRoutes = require("./routes/healthWorkerRoutes.js");
const AiConsultation = require("./routes/AiConsultation.js");

const profileRoutes = require("./routes/profileRoutes");
const multiDoctorDashboardRoutes = require("./routes/multiDoctorDashboardRoutes");

const cors = require("cors");

const app = express();
const server = http.createServer(app);

initSocket(server);

// --- Load Google Cloud TTS service account key JSON ---

const ttsKeyFilePath = process.env.TTS_SA_KEY_JSON_PATH;

if (!ttsKeyFilePath) {
  throw new Error("Environment variable TTS_SA_KEY_JSON_PATH is not set");
}

const ttsCredentials = JSON.parse(fs.readFileSync(path.resolve(ttsKeyFilePath), "utf8"));

console.log("Loaded Google TTS credentials for project:", ttsCredentials.project_id);

// You can export or use `ttsCredentials` in your TTS client initialization wherever needed

// --- Middlewares ---
app.use(cors());
app.use(express.json());

app.use("/api/AiConsultation", AiConsultation);

app.use(async (req, res, next) => {
  try {
    const tokenExpiryTime = oauth2client.credentials.expiry_date;
    const currentTime = Date.now();
    if (!tokenExpiryTime || tokenExpiryTime < currentTime) {
      console.log("Access token expired, refreshing...");
      await refreshAccessToken();
    }
    next();
  } catch (error) {
    console.error("Error checking or refreshing token:", error);
    return res.status(500).json({ error: "Authentication error" });
  }
});

// Routes
app.get("/", (req, res) => res.send("Hello World"));

app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/testReports", testReportsRoutes);
app.use("/api/uploadProfiles", profileRoutes);
app.use("/api/doctorProfileRoutes", doctorProfileRoutes);
app.use("/api/receptionProfileRoutes", receptionProfileRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/multiDoctorDashboardRoutes", multiDoctorDashboardRoutes);
app.use("/api/healthWorkerRoutes", healthWorkerRoutes);

app.get("/keepalive", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

app.get("/auth/google", (req, res) => {
  const url = oauth2client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar"],
  });
  res.redirect(url);
});

app.get("/auth/redirect", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).send("No authorization code provided.");
    }
    const tokens = await oauth2client.getToken(code);
    oauth2client.setCredentials(tokens);
    res.send("Google authentication successful!");
  } catch (e) {
    console.error("Error authenticating with Google:", e);
    if (!res.headersSent) res.status(500).send("Authentication failed.");
  }
});

// Example cache test
(async () => {
  await setCache("go", "goa");
  const value = await getCache("go");
  console.log("Cached value:", value);
})();

const PORT = process.env.PORT || 8000;
server.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);

// If you want to enable HTTPS later, you can uncomment and update the cert files
// https.createServer(options, app).listen(PORT, "0.0.0.0", () => {
//   console.log(`Server is running on https://localhost:${PORT}`);
// });
