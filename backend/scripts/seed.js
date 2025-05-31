///////////////////////////////////////////////////////////////////
//
//  This script is used to seed the database with initial data from JSON files.
//  It connects to the MongoDB database, reads the JSON files, and inserts the data into the database.
//
///////////////////////////////////////////////////////////////////



// to ensure correct pathway ->
const path = require('path');

const usersPath  = path.join(__dirname, '..', '..', 'dataset_dev', 'userlist.json');
const phonesListingPath = path.join(__dirname, '..', '..', 'dataset_dev', 'phonelisting.json');

require('dotenv').config();
const mongoose = require('mongoose');
const fs       = require('fs');
const bcrypt   = require('bcrypt');
const User     = require('../models/User');
const Phone    = require('../models/Phone');

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // loading the JSON ->
    const rawUsers  = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const rawPhones = JSON.parse(fs.readFileSync(phonesListingPath, 'utf8'));

    // hashing one time for all users ->
    const defaultHash = await bcrypt.hash(process.env.USER_DEFAULT, 10);
    const users = rawUsers.map(u => ({
        _id:      u._id.$oid,
        firstname:u.firstname,
        lastname: u.lastname,
        email:    u.email,
        password: defaultHash
    }));

    await User.deleteMany();
    await User.insertMany(users);
    console.log(`${users.length} users seeded`);

    // transforming the phone raw data into mongoDB ->
    const phones = rawPhones.map(p => ({
        title:    p.title,
        brand:    p.brand,
        image: `/images/${p.brand}.jpeg`,       // we are using '/images/' because that is what is defined in server.js
        stock:    p.stock,
        seller:   p.seller,
        price:    p.price,
        disabled: Boolean(p.disabled),
        reviews:  p.reviews.map(r => ({
            reviewer: r.reviewer,
            rating:   r.rating,
            comment:  r.comment,
            hidden:   Boolean(r.hidden)
        }))
    }));

    await Phone.deleteMany();
    await Phone.insertMany(phones);
    console.log(`${phones.length} phones seeded`);

    await mongoose.disconnect();
    console.log('MongoDB disconnected');
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});