const express = require("express");
const authController = require("../../controllers/auth/auth.controller");
const validateRequest = require("../../validations/validate.middleware");
const {
  loginSchema,
  registerSchema,
} = require("../../validations/auth.validation");

const router = express.Router();

router.post("/login", validateRequest(loginSchema), authController.login);
router.post(
  "/register",
  validateRequest(registerSchema),
  authController.register
);


module.exports = router;
