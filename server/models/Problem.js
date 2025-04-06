const mongoose = require('mongoose');

// Test case schema
const TestCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true
  },
  output: {
    type: String,
    required: true
  },
  isExample: {
    type: Boolean,
    default: false
  }
});

// Problem schema
const ProblemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  inputFormat: {
    type: String,
    required: true
  },
  outputFormat: {
    type: String,
    required: true
  },
  constraints: {
    type: String,
    required: true
  },
  timeLimit: {
    type: Number,
    default: 1000, // milliseconds
    min: 100,
    max: 10000
  },
  memoryLimit: {
    type: Number,
    default: 256, // MB
    min: 16,
    max: 512
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  tags: [String],
  testCases: [TestCaseSchema],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submissions: {
    type: Number,
    default: 0
  },
  acceptedSubmissions: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Updating the updatedAt field before saving
ProblemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculating acceptance rate
ProblemSchema.virtual('acceptanceRate').get(function() {
  if (this.submissions === 0) return 0;
  return (this.acceptedSubmissions / this.submissions * 100).toFixed(2);
});

// Calculating submission count
ProblemSchema.methods.updateSubmissionStats = function(isAccepted) {
  this.submissions += 1;
  if (isAccepted) {
    this.acceptedSubmissions += 1;
  }
  return this.save();
};

module.exports = mongoose.model('Problem', ProblemSchema);