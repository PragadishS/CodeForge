const { validationResult } = require('express-validator');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const User = require('../models/User');
const codeExecutor = require('../services/codeExecutor');

// @route   POST api/submissions
// @desc    Submitting a solution for a problem
// @access  Private
exports.submitSolution = async (req, res) => {
  // Validating request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { problemId, code, language } = req.body;

  try {
    // Checking if problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Creating new submission
    const newSubmission = new Submission({
      user: req.user._id,
      problem: problemId,
      code,
      language,
      status: 'Pending',
      totalTestCases: problem.testCases.length
    });

    // Saving submission to database
    const submission = await newSubmission.save();

    // Processing submission asynchronously
    processSubmission(submission._id);

    res.status(201).json({
      id: submission._id,
      status: 'Pending',
      message: 'Your solution has been submitted and is being processed'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Processing submission asynchronously
const processSubmission = async (submissionId) => {
  try {
    const submission = await Submission.findById(submissionId)
      .populate('problem', 'testCases timeLimit memoryLimit');
    
    if (!submission) {
      throw new Error('Submission not found');
    }
    
    // Executing code against test cases
    const result = await codeExecutor.execute(
      submission.code,
      submission.language,
      submission.problem.testCases,
      submission.problem.timeLimit,
      submission.problem.memoryLimit
    );
    
    // Updating submission with results
    submission.status = result.status;
    submission.executionTime = result.executionTime;
    submission.memoryUsed = result.memoryUsed;
    submission.testCasesPassed = result.testCasesPassed;
    submission.totalTestCases = result.totalTestCases;
    
    if (result.failedTestCase) {
      submission.failedTestCase = result.failedTestCase;
    }
    
    if (result.errorMessage) {
      submission.errorMessage = result.errorMessage;
    }
    
    await submission.save();
    
    // Updating problem statistics
    const problem = await Problem.findById(submission.problem);
    await problem.updateSubmissionStats(result.status === 'Accepted');
    
    // If accepted and first time solving, adding to user's solved problems
    if (result.status === 'Accepted') {
      const user = await User.findById(submission.user);
      if (!user.problemsSolved.includes(submission.problem._id)) {
        user.problemsSolved.push(submission.problem._id);
        await user.save();
      }
    }
    
    return { submissionId, status: result.status };
  } catch (error) {
    console.error('Error processing submission:', error);
    
    // Updating submission with error
    const submission = await Submission.findById(submissionId);
    if (submission) {
      submission.status = 'Runtime Error';
      submission.errorMessage = error.message;
      await submission.save();
    }
    
    throw error;
  }
};

// @route   GET api/submissions/:id
// @desc    Getting submission by ID
// @access  Private (only submitter or admin)
exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('problem', 'title')
      .populate('user', 'username');
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Checking if user is authorized
    if (
      submission.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    res.json(submission);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   GET api/submissions/problem/:problemId
// @desc    Getting submissions for a problem
// @access  Private (only submitter or admin)
exports.getSubmissionsByProblem = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filtering by current user only
    const submissions = await Submission.find({
      problem: req.params.problemId,
      user: req.user._id
    })
      .select('status executionTime memoryUsed language submittedAt')
      .skip(skip)
      .limit(limit)
      .sort({ submittedAt: -1 });
    
    const total = await Submission.countDocuments({
      problem: req.params.problemId,
      user: req.user._id
    });
    
    res.json({
      submissions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/submissions/user
// @desc    Getting submissions by current user
// @access  Private
exports.getSubmissionsByUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const submissions = await Submission.find({
      user: req.user._id
    })
      .populate('problem', 'title')
      .select('problem status executionTime language submittedAt')
      .skip(skip)
      .limit(limit)
      .sort({ submittedAt: -1 });
    
    const total = await Submission.countDocuments({
      user: req.user._id
    });
    
    res.json({
      submissions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};