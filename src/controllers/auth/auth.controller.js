const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const bcrypt = require("bcryptjs");
const { validateEmail, Phone } = require("../../utils/validate");
const { encryptPassword } = require("../../services/encrypt_password.service");
const connectEmail = require("../../configs/email");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // หาผู้ใช้ในฐานข้อมูล
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ตรวจสอบรหัสผ่าน
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // สร้าง JWT token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ฟังก์ชันลงทะเบียน
const register = async (req, res) => {
  try {
    const {
      email,
      password,
      prefix,
      first_name,
      last_name,
      phone_number,
      role,
    } = req.body;

    // ตรวจสอบว่าอีเมลซ้ำหรือไม่
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "อีเมลนี้มีผู้ใช้งานในระบบแล้ว" });
    }

    // ตรวจสอบเบอร์โทรศัพท์ซ้ำ
    const existingPhone = await User.findOne({ phone_number });
    if (existingPhone) {
      return res
        .status(400)
        .json({ message: "เบอร์โทรศัพท์นี้มีผู้ใช้งานในระบบแล้ว" });
    }

    // ตรวจสอบรูปแบบเบอร์โทรศัพท์ด้วย utility ที่มีอยู่
    if (!Phone.isValidPhone(phone_number)) {
      return res.status(400).json({ message: "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง" });
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await encryptPassword(password);
    if (!hashedPassword) {
      return res
        .status(500)
        .json({ message: "เกิดข้อผิดพลาดในการเข้ารหัสรหัสผ่าน" });
    }

    // สร้าง generation ID
    const gen_id =
      role.substring(0, 3).toUpperCase() + Date.now().toString().substring(7);

    // สร้างผู้ใช้ใหม่
    const newUser = new User({
      email,
      password: hashedPassword,
      prefix,
      first_name,
      last_name,
      phone_number,
      status_user: "active",
      role: role || "student",
      gen_id,
      reset_password_token: "",
      reset_password_auth_tag: "",
      reset_password_expires: "",
      time_stamps_mail: Date.now().toString(),
      count_mail: "0",
      profile_image: "",
      login_attempts: 0,
    });

    await newUser.save();

    // ส่งอีเมลแจ้งเตือนการสมัครสมาชิกใหม่ (ถ้าต้องการ)
    try {
      const mailOptions = {
        from: "jacktast9@gmail.com",
        to: email,
        subject: "ยินดีต้อนรับสู่ระบบโรงเรียน",
        html: `
            <div style="font-family: 'Sarabun', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #ffce00; border-radius: 10px; background-color: #fff8dc;">
              <h2 style="color: #ff9800; text-align: center;">🎉 ลงทะเบียนสำเร็จ! 🎉</h2>
              <p>สวัสดีคุณ ${prefix} ${first_name} ${last_name},</p>
              <p>ขอต้อนรับสู่ <strong>ระบบท่องคำศัพท์ Flash Cards</strong> 🎨📚 ระบบที่ช่วยให้คุณฝึกจำคำศัพท์ได้ง่าย สนุก และรวดเร็ว!</p>
              <p>บัญชีของคุณได้ลงทะเบียนเรียบร้อยแล้ว พร้อมเริ่มท่องคำศัพท์ได้ทันที!</p>
              <p><strong>อีเมลที่ลงทะเบียน:</strong> ${email}</p>
              <hr style="border: none; border-top: 1px dashed #ff9800; margin: 20px 0;">
              <p>หากคุณไม่ได้ดำเนินการลงทะเบียนนี้ กรุณาติดต่อเจ้าหน้าที่ผู้ดูแลระบบโดยด่วน</p>
              <p style="margin-top: 30px;">ขอให้สนุกกับการเรียนรู้! ✨<br>ทีมงาน Flash Cards 📖</p>
            </div>
          `,
      };

      await connectEmail.sendMail(mailOptions);
      console.log("ส่งอีเมลสำเร็จ");
    } catch (emailError) {
      console.error("ข้อผิดพลาดในการส่งอีเมล:", emailError);
      // ไม่จำเป็นต้องส่งข้อผิดพลาดกลับ เพราะการสมัครสมาชิกยังสำเร็จ
    }

    // สร้าง token สำหรับเข้าสู่ระบบทันที
    const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_TOKEN_EXPIRES_IN || "1d",
    });

    return res.status(201).json({
      message: "ลงทะเบียนสำเร็จ",
      token,
      user: {
        _id: newUser._id,
        email: newUser.email,
        prefix: newUser.prefix,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการลงทะเบียน", error: error.message });
  }
};

// เพิ่ม export ฟังก์ชัน register
module.exports = { login, register };
