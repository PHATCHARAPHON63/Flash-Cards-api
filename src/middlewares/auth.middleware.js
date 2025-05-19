const jwt = require("jsonwebtoken");

const User = require("../models/user");
const admin_auth_middleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log("no token");

      return res.status(401).json({ message: "Authentication required" });
    }

    const { _id } = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ _id, role: "admin" });

    if (!user) {
      console.log("no user");

      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error);
  }
};

const user_auth_middleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { _id } = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(_id);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ตรวจสอบสถานะผู้ใช้เพิ่มเติมถ้าจำเป็น
    // if (user.status !== 'active') {
    //   return res.status(401).json({ message: 'Account is inactive' });
    // }

    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { admin_auth_middleware, user_auth_middleware };
