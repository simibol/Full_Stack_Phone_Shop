const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstname: {type: String, required: true},
    lastname: {type: String, required: true},
    email: {type: String, required: true, unique: true},    // username
    password: {type: String, required: true},
    lastLogin: { type: Date},
    verified: {type: Boolean, default: false},
    disabled: { type: Boolean, default: false},
}, {timestamps: true});

module.exports = mongoose.model('User', userSchema);