const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// สร้างฟังก์ชันเพื่อทดสอบความถูกต้องของรหัสผ่าน
const validatePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// เพิ่มฟังก์ชัน resetLoginAttempts
const resetLoginAttempts = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $set: {
        login_attempts: 0,
        lock_until: null
      }
    });
    return true;
  } catch (error) {
    console.error('Reset login attempts error:', error);
    return false;
  }
};

// เพิ่มฟังก์ชัน updateLastLogin
const updateLastLogin = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $set: {
        last_login: new Date()
      }
    });
    return true;
  } catch (error) {
    console.error('Update last login error:', error);
    return false;
  }
};

const user_schema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
    },
    prefix: {
      type: String,
      enum: ["เด็กชาย", "เด็กหญิง", "นาย", "นาง", "นางสาว"],
    },
    first_name: {
      type: String,
    },
    last_name: {
      type: String,
    },
    password: {
      type: String,
    },
    phone_number: {
      type: String,
    },
    status_user: {
      type: String,
    },
    role: {
      type: String,
      default: 'student', // เพิ่มค่าเริ่มต้นเป็น student
    },
    gen_id: {
      type: String,
    },
    google_id: {
      type: String,
    },
    reset_password_token: {
      type: String,
    },
    reset_password_auth_tag: {
      type: String,
    },
    reset_password_expires: {
      type: String,
    },
    time_stamps_mail: {
      type: String,
    },
    count_mail: {
      type: String,
    },
    profile_image: { 
      type: String 
    },
    login_attempts: {
      type: Number,
      default: 0,
    },
    lock_until: {
      type: Date,
    },
    last_login: {
      type: Date,
    },
    student_id: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// เพิ่มเมธอดสำหรับตรวจสอบว่าบัญชีถูกล็อคหรือไม่
user_schema.methods.isLocked = function () {
  // ถ้ามีเวลาล็อคและเวลาปัจจุบันยังไม่เกินเวลาล็อค
  return !!(this.lock_until && this.lock_until > Date.now());
};

// เพิ่มเมธอดสำหรับตรวจสอบรหัสผ่าน
user_schema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// เพิ่มฟังก์ชันสำหรับรีเซ็ตค่าในกรณีล็อกอินสำเร็จ
user_schema.methods.successfulLogin = async function () {
  this.login_attempts = 0;
  this.lock_until = null;
  this.last_login = new Date();
  await this.save();
};

// สร้างและส่งออกโมเดล
const User = mongoose.model("user", user_schema, "user");

module.exports = User;