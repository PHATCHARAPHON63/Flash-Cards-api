const connectEmail = require("./configs/email");

// ตั้งค่าข้อมูลอีเมล
const mailOptions = {
  from: "jacktast9@gmail.com", // คนส่ง
  to: "phatcharaphonch63@gmail.com", // คนรับ
  subject: "แจ็คทดสอบส่งเมลผ่าน Gmail", // หัวข้อ
  text: "ส่งสำเร็จแล้วนะแจ็ค เยี่ยม!", // เนื้อหาในอีเมล
};

// ส่งอีเมล
connectEmail.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log("ส่งไม่สำเร็จ :", error);
  } else {
    console.log("ส่งอีเมลสำเร็จ :", info.response);
  }
});
