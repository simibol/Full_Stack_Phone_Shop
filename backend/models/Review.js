const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    reviewer: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    rating: {type: Number, min: 1, max: 5, required: true},
    comment: {type: String, default: ''},
    hidden: {type: Boolean, default: false},
}, {timestamps: true});

module.exports = reviewSchema;