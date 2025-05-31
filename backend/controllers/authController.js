const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Helper to send email
async function sendEmail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
  await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
}

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().lean();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

exports.deleteUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const result = await User.deleteOne({ email });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ firstname: firstName, lastname: lastName, email, password: hashed });
    await user.save();
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const link = `${process.env.FRONTEND_URL}/auth?view=verify&emailToken=${token}`;
    const html = `<p>Hi ${firstName}, please verify: <a href="${link}">click</a></p>`;
    await sendEmail({ to: email, subject: 'Verify email', html });
    res.status(201).json({ message: 'Signup successful.' });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { emailToken } = req.body;
    const { email } = jwt.verify(emailToken, process.env.JWT_SECRET);
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (user.verified) return res.status(400).json({ message: 'Already verified' });
    user.verified = true;
    await user.save();
    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};

exports.failEmailVerification = async (req, res) => {
  try {
    const { emailToken } = req.body;
    const { email } = jwt.verify(emailToken, process.env.JWT_SECRET);
    const result = await User.deleteOne({ email });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted due to failed verification.' });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'All fields are required.' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'User not found.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });
    if (!user.verified) return res.status(401).json({ message: 'Email not verified.' });
    user.lastLogin = new Date();
    await user.save();
    const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const link = `${process.env.FRONTEND_URL}/auth?view=reset&resetToken=${token}`;
    const html = `<p>Reset password: <a href="${link}">click</a></p>`;
    await sendEmail({ to: email, subject: 'Reset password', html });
    res.json({ message: 'Reset email sent.' });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    if (!resetToken || !password) return res.status(400).json({ message: 'All fields are required.' });
    const { id } = jwt.verify(resetToken, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};