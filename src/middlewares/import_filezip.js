const path = require("path");
const fs = require("fs");
const fsPromises = fs.promises;
const decompress = require('decompress');

// กำหนดค่าการเก็บไฟล์ด้วย multer
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadPath = path.join(__dirname, "uploads");
      try {
        await fsPromises.mkdir(uploadPath, { recursive: true });
        cb(null, uploadPath);
      } catch (err) {
        cb(err);
      }
    },
    filename: (req, file, cb) => {
      // เพิ่มการตรวจสอบนามสกุลไฟล์
      if (path.extname(file.originalname).toLowerCase() !== '.zip') {
        return cb(new Error('Only ZIP files are allowed'));
      }
      cb(null, Date.now() + "-" + file.originalname);
    },
  });
  
  // กำหนดขนาดไฟล์สูงสุดที่อัปโหลดได้
  const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // จำกัดขนาดไฟล์ที่ 50MB
  });