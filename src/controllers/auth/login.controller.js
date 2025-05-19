const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../../models/user");
const logger = require("../../configs/logger.config");

// ลบฟังก์ชัน login สำหรับ admin ออกเนื่องจากมีเฉพาะ role student

/**
 * การจัดการเข้าสู่ระบบสำหรับนักเรียน
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - สถานะการเข้าสู่ระบบและข้อมูลผู้ใช้
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // ตรวจสอบว่าส่งข้อมูลมาครบหรือไม่
    if (!email || !password) {
      return res.status(400).json({ message: "กรุณากรอกรหัสนักเรียนและรหัสผ่าน" });
    }

    // ค้นหาผู้ใช้จากรหัสนักเรียนหรืออีเมล (อาจเป็นรหัสนักเรียน, gen_id หรืออีเมล)
    let user = await User.findOne({
      $or: [
        { email: email }, 
        { gen_id: email },
        { student_id: email }
      ],
      role: "student" // เพิ่มเงื่อนไขให้ค้นหาเฉพาะ role student
    });

    if (!user) {
      return res.status(401).json({ message: "ไม่พบข้อมูลนักเรียน กรุณาตรวจสอบรหัสนักเรียนหรืออีเมล" });
    }

    // ตรวจสอบสถานะผู้ใช้
    if (user.status_user !== 'active') {
      return res.status(403).json({ message: "บัญชีของคุณยังไม่เปิดใช้งาน กรุณาติดต่อครูผู้ดูแล" });
    }

    // ตรวจสอบว่าบัญชีถูกล็อคหรือไม่
    if (user.isLocked()) {
      // คำนวณเวลาที่เหลือก่อนปลดล็อค
      const now = new Date();
      const unlockTime = new Date(user.lock_until);
      const remainingTime = Math.ceil((unlockTime - now) / 1000 / 60); // เวลาที่เหลือในนาที

      return res.status(423).json({
        message: `บัญชีของคุณถูกล็อคชั่วคราว กรุณาลองอีกครั้งใน ${remainingTime} นาที`,
        locked: true,
        unlockTime: user.lock_until
      });
    }

    // ตรวจสอบรหัสผ่าน
    const isMatch = await bcrypt.compare(password, user.password);
    
    // ถ้ารหัสผ่านไม่ถูกต้อง
    if (!isMatch) {
      // เพิ่มจำนวนความพยายามล็อกอินที่ล้มเหลว
      user.login_attempts += 1;
      
      // ถ้าล็อกอินล้มเหลวมากกว่าหรือเท่ากับ 3 ครั้ง ให้ล็อคบัญชี 15 นาที
      if (user.login_attempts >= 3) {
        user.lock_until = new Date(Date.now() + 15 * 60 * 1000); // 15 นาที
        await user.save();
        
        return res.status(423).json({
          message: "บัญชีของคุณถูกล็อคเป็นเวลา 15 นาที เนื่องจากล็อกอินล้มเหลวหลายครั้ง",
          locked: true,
          unlockTime: user.lock_until
        });
      }
      
      // บันทึกการพยายามล็อกอินที่ล้มเหลว
      await user.save();
      
      return res.status(400).json({ 
        message: "รหัสผ่านไม่ถูกต้อง", 
        remainingAttempts: 3 - user.login_attempts 
      });
    }

    // รีเซ็ตจำนวนความพยายามล็อกอินที่ล้มเหลว
    user.login_attempts = 0;
    user.lock_until = null;
    await user.save();

    // สร้าง JWT token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_TOKEN_EXPIRES_IN || "1d"
    });

    // บันทึก log การเข้าสู่ระบบสำเร็จ
    logger.info(`นักเรียน ${user._id} เข้าสู่ระบบสำเร็จ`, {
      userId: user._id,
      email: user.email,
      studentId: user.student_id
    });

    // ส่งข้อมูลกลับไปยังผู้ใช้
    return res.json({
      role: "student", // กำหนดค่า role เป็น student เสมอ
      name: `${user.prefix} ${user.first_name} ${user.last_name}`,
      img: user.profile_image || "",
      token,
      userId: user._id  // ส่ง userId เพื่อเก็บใน localStorage
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`, { error });
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง" });
  }
};

module.exports = { loginUser };