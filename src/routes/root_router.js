const { Router } = require("express");
const { user_auth_middleware } = require("../middlewares/auth.middleware");
const auth_router = require("./auth/auth.router");
const user_router = require("./user/user.router");
const loginController = require("../controllers/auth/login.controller");
const validateRequest = require("../validations/validate.middleware");
const { loginSchema } = require("../validations/auth.validation");
const logger = require("../configs/logger.config");
const flashcard_router = require("./flashcards/flashcard.routes");
const root_router = Router();

// เพิ่ม middleware เพื่อบันทึก logging สำหรับทุก request
root_router.use((req, res, next) => {
  logger.info(`API Request: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("user-agent") || "-",
  });
  next();
});

// Public routes ที่ไม่ต้องการการยืนยันตัวตน
root_router.use("/auth", auth_router);

// กำหนด login_user route ที่ root level - แก้ไขจาก router เป็น root_router
root_router.post("/login_user", validateRequest(loginSchema), (req, res) => {
  console.log("Login route hit!");
  return loginController.loginUser(req, res);
});

// Protected routes ที่ต้องการการยืนยันตัวตน
root_router.use("/user", user_auth_middleware, user_router);

// ทดสอบ health check
root_router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});
root_router.use("/flashcards", user_auth_middleware, flashcard_router);
// ตรวจสอบว่าผู้ใช้ยัง logged in อยู่หรือไม่
root_router.get("/verify-token", user_auth_middleware, (req, res) => {
  res.status(200).json({
    isValid: true,
    user: {
      _id: req.user._id,
      email: req.user.email,
      role: "student",
      name: `${req.user.prefix} ${req.user.first_name} ${req.user.last_name}`,
    },
  });
});

module.exports = root_router;
