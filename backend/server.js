
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    THE MAIN ENTRY POINT FOR THE BACKEND SERVER
//    THIS FILE HANDLES THE SERVER SETUP AND MONGODB CONNECTION AND DECLARES 
//    THE STATIC ROUTES, AND THE API ROUTES
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////


require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const adminRouter = require('./routes/admin');

const app = express();

// sessions
app.use(session({
  name: 'admin.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    maxAge: 1000 * 60 * 15, // Ensures it only runs for 15 minutes
    httpOnly: true,
    secure: false
  }
}));

// middleware
app.use(cors({
  origin: 'http://localhost:3002',
  credentials: true
}));
app.use(express.json());

// mongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));


// DEFINE STATIC ROUTES 
app.use(
  '/images/',
  express.static(path.join(__dirname, '..', 'dataset_dev', 'phone_default_images'))
);

// point to the routes/* folder
app.use('/api/phones', require('./routes/phones'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', adminRouter);
app.use('/api/cart', require('./routes/cart'));
app.use('/api/users', require('./routes/users'));



const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
