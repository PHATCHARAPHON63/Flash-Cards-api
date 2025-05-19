const Joi = require("joi");
const { PREFIX } = require("../configs/constant.config");

const loginSchema = Joi.object({
  email: Joi.string().required().messages({
    "string.empty": "กรุณาระบุรหัสนักเรียนหรืออีเมล",
    "any.required": "กรุณาระบุรหัสนักเรียนหรืออีเมล",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
    "string.empty": "กรุณาระบุรหัสผ่าน",
    "any.required": "กรุณาระบุรหัสผ่าน",
  }),
});

// เพิ่ม Schema สำหรับการสมัครสมาชิก
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "รูปแบบอีเมลไม่ถูกต้อง",
    "string.empty": "กรุณาระบุอีเมล",
    "any.required": "กรุณาระบุอีเมล",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
    "string.empty": "กรุณาระบุรหัสผ่าน",
    "any.required": "กรุณาระบุรหัสผ่าน",
  }),
  prefix: Joi.string()
    .valid(...PREFIX)
    .required()
    .messages({
      "any.only": "คำนำหน้าไม่ถูกต้อง",
      "string.empty": "กรุณาระบุคำนำหน้า",
      "any.required": "กรุณาระบุคำนำหน้า",
    }),
  first_name: Joi.string().required().messages({
    "string.empty": "กรุณาระบุชื่อ",
    "any.required": "กรุณาระบุชื่อ",
  }),
  last_name: Joi.string().required().messages({
    "string.empty": "กรุณาระบุนามสกุล",
    "any.required": "กรุณาระบุนามสกุล",
  }),
  phone_number: Joi.string()
    .pattern(/^0[0-9]{9}$/)
    .required()
    .messages({
      "string.pattern.base":
        "เบอร์โทรศัพท์ไม่ถูกต้อง ต้องขึ้นต้นด้วย 0 และมี 10 หลัก",
      "string.empty": "กรุณาระบุเบอร์โทรศัพท์",
      "any.required": "กรุณาระบุเบอร์โทรศัพท์",
    }),
  role: Joi.string().valid("student").default("student").messages({
    "any.only": "บทบาทไม่ถูกต้อง",
  }),
  student_id: Joi.string().min(4).required().messages({
    "string.min": "รหัสนักเรียนต้องมีความยาวอย่างน้อย 4 ตัวอักษร",
    "string.empty": "กรุณาระบุรหัสนักเรียน",
    "any.required": "กรุณาระบุรหัสนักเรียน",
  }),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    "string.empty": "Token สำหรับรีเซ็ตรหัสผ่านไม่ถูกต้อง",
    "any.required": "Token สำหรับรีเซ็ตรหัสผ่านไม่ถูกต้อง",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
    "string.empty": "กรุณาระบุรหัสผ่าน",
    "any.required": "กรุณาระบุรหัสผ่าน",
  }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "รหัสผ่านไม่ตรงกัน",
    "string.empty": "กรุณายืนยันรหัสผ่าน",
    "any.required": "กรุณายืนยันรหัสผ่าน",
  }),
});

// เพิ่ม Schema สำหรับการเปลี่ยนรหัสผ่าน
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "กรุณาระบุรหัสผ่านปัจจุบัน",
    "any.required": "กรุณาระบุรหัสผ่านปัจจุบัน",
  }),
  newPassword: Joi.string().min(6).required().messages({
    "string.min": "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
    "string.empty": "กรุณาระบุรหัสผ่านใหม่",
    "any.required": "กรุณาระบุรหัสผ่านใหม่",
  }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "รหัสผ่านใหม่ไม่ตรงกัน",
      "string.empty": "กรุณายืนยันรหัสผ่านใหม่",
      "any.required": "กรุณายืนยันรหัสผ่านใหม่",
    }),
});

module.exports = {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
