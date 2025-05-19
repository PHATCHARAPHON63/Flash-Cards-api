const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { encryptPassword } = require('./encrypt_password.service');

const add_student_user = async (user_data) => {
  try {
    const {
      email,
      student_id,
      name,
      object_id,
      prefix,
      first_name,
      last_name,
      phone_number,
    } = user_data;

    // Check if student_id is valid
    if (!student_id || student_id.length < 4) {
      throw new Error('Student ID must be at least 4 characters long');
    }

    const PASSWORD_PREFIX = process.env.STUDENT_PASSWORD_PREFIX || 'student';
    const last4digit = student_id.slice(-4); // last 4 digits of student_id
    const password = `${PASSWORD_PREFIX}${last4digit}`; // simple password generation

    // Password should be hashed securely
    const encryptedPassword = await encryptPassword(password);

    const create_user_data = {
      email,
      password: encryptedPassword,
      phone_number,
      name,
      prefix,
      first_name,
      last_name,
      status_user: 'active',
      role: 'student',
      gen_id: 'STD' + Date.now().toString().substring(7), // Unique ID for student
      google_id: '', // Empty string or remove if not required
      reset_password_token: '',
      reset_password_auth_tag: '',
      reset_password_expires: '',
      time_stamps_mail: Date.now().toString(),
      count_mail: '0',
      mobile_google_register_id: '',
      student_id: object_id,
    };

    // Create the new user in the database
    // const new_user = await User.create(create_user_data);
    const new_user = await User.findOneAndUpdate(
      { student_id: object_id }, // Search by student_id
      create_user_data, // The data to update or insert
      {
        upsert: true, // Perform an insert if no document is found
        new: true, // Return the updated document
        runValidators: true, // Ensure the schema validation runs
      }
    );

    return new_user;
  } catch (error) {
    console.error('add_user error: ', error);
    throw new Error('Error adding user');
  }
};

module.exports = { add_student_user };
