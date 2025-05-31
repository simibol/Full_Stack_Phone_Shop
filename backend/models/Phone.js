const mongoose = require('mongoose');
const reviewSchema = require('./Review');

const phoneSchema = new mongoose.Schema({
    title:    { type: String, required: true },
    brand:    { 
        type: String, 
        required: true, 
        enum: ['Samsung','Apple','HTC','Huawei','Nokia','LG','Motorola','Sony','BlackBerry'] 
    },
    image:    { type: String, required: true },
    stock:    { type: Number, default: 0 },
    seller:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    price:    { type: Number, required: true },
    disabled: { type: Boolean, default: false },
    reviews:  [ reviewSchema ]
}, { timestamps: true });

module.exports = mongoose.model('Phone', phoneSchema);