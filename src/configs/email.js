const nodemailer = require("nodemailer");


const connectEmail = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "jacktast9@gmail.com", 
    pass: "vprmuptdublzjpln", 
  },
});

module.exports = connectEmail;
