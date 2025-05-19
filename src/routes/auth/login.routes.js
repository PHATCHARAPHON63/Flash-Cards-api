const express = require("express");
const loginController = require("../../controllers/auth/login.controller");
const validateRequest = require("../../validations/validate.middleware");
const { loginSchema } = require("../../validations/auth.validation");
const { rateLimitMiddleware } = require("../../middlewares/rate_limit.middleware");

const router = express.Router();

// กำหนด rate limit สำหรับการล็อกอิน (10 ครั้งต่อ 5 นาที)
const loginRateLimit = rateLimitMiddleware(10, 5);

// POST /api/v1/auth/login_user - สำหรับนักเรียน
router.post(
  "/login_user", 
  loginRateLimit,
  validateRequest(loginSchema), 
  loginController.loginUser
);

module.exports = router;