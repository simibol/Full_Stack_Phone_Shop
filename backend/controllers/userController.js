const axios = require('axios');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const User = require('../models/User');


exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

exports.updateInfo = async (req, res) => {
  try {
    const { id, firstname, lastname, email } = req.body;

    // validate
    if (!id || !firstname || !lastname || !email) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // update user information
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { firstname, lastname, email },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    return res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { id, email, oldPassword, newPassword } = req.body;
    if (!id || !oldPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const response = await axios.post('http://localhost:5001/api/auth/login', {
      email,
      password: oldPassword
    });

    if (response.status !== 200) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailContent = `
      <html>
        <body>
          <p>Hi there,</p>
          <p>Your password has been successfully changed. If you did not make this change, please contact us immediately.</p>
          <p>Best regards,<br>OldPhoneDeals Team</p>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password changed for OldPhoneDeals',
      html: emailContent,
    });

    return res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};