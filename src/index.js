const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const path = require("path");
const morgan = require("morgan");
const root_router = require("./routes/root_router");
const { rateLimitMiddleware } = require("./middlewares/rate_limit.middleware");
const { mongoConnect } = require("./services/mongo_connect");
const logger = require("./configs/logger.config");
dotenv.config();

const app = express();
const { PORT, CLIENT_URL } = process.env;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger.logApiRequest);
// เพิ่มการเข้าถึงโฟลเดอร์ public สำหรับไฟล์ static
app.use("/public", express.static(path.join(__dirname, "../public")));

// Allow only specific origins websites to access this API
const allowedOrigins = [CLIENT_URL];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost(:\d+)?$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Logger path and status code
app.use(morgan("dev"));
// Secure HTTP headers
app.use(helmet());
// Rate limit middleware - ตามความเหมาะสม
// app.use(rateLimitMiddleware(100, 15));

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/api/v1", root_router);

// Middleware to handle 404 errors
app.use((req, res, next) => {
  res.status(404).json({ message: "Path not found" });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  // บันทึกข้อผิดพลาดด้วย logger
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
  next();
});

app.listen(PORT, async () => {
  await mongoConnect();

  if (PORT === undefined) {
    console.log("PORT is not defined");
    process.exit(1);
  }
  console.log(`🚀 Server is running on port ${PORT}`);
});
