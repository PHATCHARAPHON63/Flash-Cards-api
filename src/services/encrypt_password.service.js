const bcrypt = require('bcryptjs');

const encryptPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error('encryptPassword error: ', error);
    return null;
  }
};

module.exports = { encryptPassword };
