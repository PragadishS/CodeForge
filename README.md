# CodeForge - Online Judge System




<img width="1440" alt="Screenshot 1947-01-24 at 6 16 13 PM" src="https://github.com/user-attachments/assets/5bbaf855-13e4-49da-9e0a-47c3fc47ff5b" />


## 📋 Overview

CodeForge is a full-stack MERN (MongoDB, Express, React, Node.js) application that provides an online judge system for coding practice. 
It allows users to browse coding problems, submit solutions in C/C++, and receive immediate feedback on their submissions including execution time, 
memory usage, and test case results.

## ✨ Features

- **User Authentication**: Secure registration and login system with JWT
- **Problem Repository**: Browse, filter, and search coding problems by difficulty and tags
- **Code Editor**: Built-in Monaco Editor with syntax highlighting for C and C++
- **Automatic Code Evaluation**: Solutions are compiled and run against test cases in a secure environment
- **Real-time Feedback**: Detailed results showing execution time, memory usage, and test case status
- **Problem Creation**: Create and share your own coding problems with custom test cases
- **User Profiles**: Track solved problems and submission history
- **Admin Dashboard**: Manage problems, users, and submissions (for admin users)

## 🛠️ Tech Stack

### Frontend
- **React**: UI library for building the user interface
- **React Router**: Navigation and routing
- **React Bootstrap**: UI components and responsive design
- **Monaco Editor**: Code editor with syntax highlighting
- **Axios**: HTTP client for API requests
- **React-Toastify**: Toast notifications
- **React-Markdown**: Markdown rendering for problem descriptions

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database for storing problems, submissions, and user data
- **Mongoose**: MongoDB object modeling
- **JWT**: Authentication middleware
- **bcrypt**: Password hashing
- **Code Execution Engine**: Custom system for compiling, running, and evaluating code submissions


## 🚀 Installation and Setup

### Prerequisites
- Node.js and npm
- MongoDB
- C/C++ compiler (gcc/g++)

### Client Setup
```bash
# Clone the repository
git clone https://github.com/PragadishS/CodeForge.git
cd CodeForge

# Install client dependencies
cd client
npm install

# Start client development server
npm start
```

### Server Setup
```bash
# From the root directory
cd server
npm install

# Configure environment variables
# Create a .env file with the following variables:
# PORT=5000
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret
# JWT_EXPIRE=24h
# TEMP_CODE_DIR=./temp/code
# TEMP_TEST_DIR=./temp/testcases
# CODE_EXECUTION_TIMEOUT=5000
# FRONTEND_URL=http://localhost:3000

# Start server development server
npm run dev
```

## 📝 Usage

### For Users
1. **Register/Login**: Create an account or log in
2. **Browse Problems**: Navigate to the Problems page to view available coding challenges
3. **Solve Problems**: Click on a problem to view details and submit solutions
4. **View Results**: Get immediate feedback on your submissions
5. **Track Progress**: Visit your profile to see submission history and solved problems

### For Problem Creators
1. **Create Problems**: Add new coding problems with descriptions, input/output formats, and constraints
2. **Add Test Cases**: Create test cases with input and expected output
3. **Set Difficulty**: Choose difficulty level and add relevant tags
4. **Manage Problems**: Edit or delete your created problems

## 🔧 Code Evaluation System

CodeForge uses a secure code execution system that:

1. Receives submitted code in C or C++
2. Compiles the code (for C/C++) in a controlled environment using gcc/g++
3. Executes the code against multiple test cases with strict time and memory limits
4. Streams test case input to the program and captures output
5. Monitors real-time memory usage and execution time
6. Verifies the output against expected results with smart whitespace and line ending normalization
7. Provides detailed feedback including:
   - Status (Accepted, Wrong Answer, Compilation Error, Runtime Error, Time Limit Exceeded)
   - Execution time and memory usage
   - Details of any failed test cases with expected vs. actual output
   - Error messages for debugging

The system uses Node.js child processes to safely execute code in a controlled environment, 
with timeout safeguards to prevent infinite loops or excessive resource consumption.

## 🗂️ Project Structure

```
CodeForge/
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── auth/
│       │   │   ├── Login.js
│       │   │   └── Register.js
│       │   ├── layout/
│       │   │   ├── Navbar.js
│       │   │   └── Footer.js
│       │   └── submissions/
│       │       └── CodeEditor.js
│       ├── context/
│       │   └── AuthContext.js
│       ├── pages/
│       │   ├── Home.js
│       │   ├── Problems.js
│       │   ├── ProblemDetail.js
│       │   ├── CreateProblem.js
│       │   ├── EditProblem.js
│       │   ├── Profile.js
│       │   └── SubmissionResult.js
│       ├── services/
│       │   └── api.js
│       ├── App.js
│       ├── index.js
│       ├── App.css
│       └── index.css
└── server/
    ├── config/
    │   └── db.js
    ├── controllers/
    │   ├── authController.js
    │   ├── problemController.js
    │   └── submissionController.js
    ├── middleware/
    │   └── auth.js
    ├── models/
    │   ├── Problem.js
    │   ├── Submission.js
    │   └── User.js
    ├── routes/
    │   ├── auth.js
    │   ├── problems.js
    │   └── submissions.js
    ├── services/
    │   └── codeExecutor.js
    ├── utils/
    │   ├── codeRunner.js
    │   └── verifier.js
    ├── temp/
    │   ├── code/
    │   └── testcases/
    ├── server.js
    └── package.json
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Problems
- `GET /api/problems` - Get all problems (with pagination and filtering)
- `GET /api/problems/:id` - Get a specific problem
- `POST /api/problems` - Create a new problem
- `PUT /api/problems/:id` - Update a problem
- `DELETE /api/problems/:id` - Delete a problem
- `GET /api/problems/tags` - Get all available tags
- `GET /api/problems/stats` - Get problem statistics

### Submissions
- `POST /api/submissions` - Submit a solution
- `GET /api/submissions/:id` - Get a specific submission
- `GET /api/submissions/problem/:problemId` - Get submissions for a problem
- `GET /api/submissions/user/me` - Get current user's submissions

## 🛡️ Authentication System

CodeForge uses JWT (JSON Web Tokens) for authentication:

1. User credentials are securely hashed using bcrypt
2. After successful authentication, the server issues a JWT token
3. The client stores the token in local storage
4. The token is included in the Authorization header for authenticated requests
5. The server verifies the token's validity and extracts user information
6. Resource access is controlled based on user role and ownership

## 💡 Deployment

The application can be deployed with the following options:

### Backend
- Deploy the Node.js server on cloud platforms like Render, Heroku, or AWS
- Set up environment variables for production
- Ensure the necessary compilers (gcc/g++) and Python are installed on the deployment server

### Frontend
- Deploy the React application on Netlify, Vercel, or similar platforms
- Set up environment variables to point to your deployed backend API


<p align="center">Made with ❤️ by Pragadish S</p>
