# OldPhoneDeals - Assignment 2 TUT1-G1
**Contributors: Simon Bolger and Annabel Chen**

An eCommerce web application for buying and reviewing second-hand phones.


## Tech Stack
- Frontend: React 18, React Router DOM
- Backend: Express.js, Node.js
- Database: MongoDB (local)


## Getting Started
* Prerequisites
Before running this project locally, ensure the following tools are installed:
    - [Node.js](https://nodejs.org/) (v18+ recommended)
    - [MongoDB Community Server](https://www.mongodb.com/try/download/community)
    - [Homebrew (macOS)](https://brew.sh/) (optional, for easy installation)


* Repository Setup Instructions
1. **Clone the repository**
   ```bash
   git clone https://github.sydney.edu.au/COMP5347-COMP4347-2025/Tut1_G1.git
   cd old-phone-deals

2. **Install backend dependencies**
    ```bash
    cd backend
    npm install

3. **Install frontend dependencies**
    ```bash
    cd frontend
    npm install


* Dataset Setup Instructions
1. **Start MongoDB**
    ```bash
    brew services start mongodb-community@7.0

2. **Place the following dataset json files and images in the dataset_dev/ folder**
The image files are expected to match the phone brand and will be served via the /images route.
    /dataset_dev/
    ├── phone_default_images/
    ├── phonelisting.json
    └── userlist.json

3. **Seed the Database**
    ```bash
    cd backend
    npm run seed


* Running the Application
1. **Backend**
  The backend runs on port 5000.
    ```bash
    cd backend
    npm start

2. **Frontend**
  The frontend runs on port 3002.
    ```bash
    cd frontend
    npm start

