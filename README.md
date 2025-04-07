📋 Overview

CodeForge is a full-stack MERN (MongoDB, Express, React, Node.js) application that provides an online judge system for coding practice. 
It allows users to browse coding problems, submit solutions in C/C++, and receive immediate feedback on their submissions including execution time, 
memory usage, and test case results.

✨ Features

User Authentication: Secure registration and login system with JWT
Problem Repository: Browse, filter, and search coding problems by difficulty and tags
Code Editor: Built-in Monaco Editor with syntax highlighting for C and C++
Automatic Code Evaluation: Solutions are compiled and run against test cases in a secure environment
Real-time Feedback: Detailed results showing execution time, memory usage, and test case status
Problem Creation: Create and share your own coding problems with custom test cases
User Profiles: Track solved problems and submission history

🛠️ Tech Stack

Frontend

React: UI library for building the user interface
React Router: Navigation and routing
React Bootstrap: UI components and responsive design
Monaco Editor: Code editor with syntax highlighting
Axios: HTTP client for API requests
React-Toastify: Toast notifications
React-Markdown: Markdown rendering for problem descriptions

Backend

Node.js: JavaScript runtime
Express.js: Web application framework
MongoDB: NoSQL database for storing problems, submissions, and user data
Mongoose: MongoDB object modeling
JWT: Authentication middleware
bcrypt: Password hashing
Code Execution Engine: Custom system for compiling, running, and evaluating code submissions

📝 Usage

For Users

Register/Login: Create an account or log in
Browse Problems: Navigate to the Problems page to view available coding challenges
Solve Problems: Click on a problem to view details and submit solutions
View Results: Get immediate feedback on your submissions
Track Progress: Visit your profile to see submission history and solved problems

For Problem Creators

Create Problems: Add new coding problems with descriptions, input/output formats, and constraints
Add Test Cases: Create test cases with input and expected output
Set Difficulty: Choose difficulty level and add relevant tags
Manage Problems: Edit or delete your created problems

🔧 Code Evaluation System

CodeForge uses a secure code execution system that:

Receives submitted code in C or C++
Compiles the code (for C/C++) in a controlled environment using gcc/g++
Executes the code against multiple test cases with strict time and memory limits
Streams test case input to the program and captures output
Monitors real-time memory usage and execution time
Verifies the output against expected results
Provides detailed feedback including:

Status (Accepted, Wrong Answer, Compilation Error, Runtime Error, Time Limit Exceeded)
Execution time and memory usage
Details of any failed test cases with expected vs. actual output
Error messages for debugging
