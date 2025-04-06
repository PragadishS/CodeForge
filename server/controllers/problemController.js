const { validationResult } = require('express-validator');
const Problem = require('../models/Problem');
const User = require('../models/User');

// @route   GET api/problems
// @desc    Getting all problems
// @access  Public
exports.getProblems = async (req, res) => {
  try {
    const query = { isPublic: true };
    
    // Filtering by difficulty
    if (req.query.difficulty) {
      query.difficulty = req.query.difficulty;
    }
    
    // Filtering by tags - matching ALL tags, not just one
    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      // Using $all to require all tags to be present
      query.tags = { $all: tags };
    }
    
    // Searching by title
    if (req.query.search) {
      query.title = { $regex: req.query.search, $options: 'i' };
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const problems = await Problem.find(query)
      .select('title difficulty tags submissions acceptedSubmissions author createdAt')
      .populate('author', 'username')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Problem.countDocuments(query);
    
    res.json({
      problems,
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

// @route   GET api/problems/:id
// @desc    Getting problem by ID
// @access  Public
exports.getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .populate('author', 'username');
    
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    
    // Filtering out non-example test cases for public access
    const isAuthor = req.user && 
      (req.user._id.toString() === problem.author._id.toString() || 
       req.user.role === 'admin');
    
    if (!isAuthor) {
      problem.testCases = problem.testCases.filter(testCase => testCase.isExample);
    }
    
    res.json(problem);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Problem not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   POST api/problems
// @desc    Creating a new problem
// @access  Private
exports.createProblem = async (req, res) => {
  // Validating request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      title,
      description,
      inputFormat,
      outputFormat,
      constraints,
      difficulty,
      tags,
      testCases,
      timeLimit,
      memoryLimit,
      isPublic
    } = req.body;

    // Creating new problem
    const newProblem = new Problem({
      title,
      description,
      inputFormat,
      outputFormat,
      constraints,
      difficulty: difficulty || 'Medium',
      tags: tags || [],
      testCases: testCases || [],
      timeLimit: timeLimit || 1000,
      memoryLimit: memoryLimit || 256,
      isPublic: isPublic !== undefined ? isPublic : true,
      author: req.user._id
    });

    // Saving problem to database
    const problem = await newProblem.save();

    // Adding problem to user's created problems
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { problemsCreated: problem._id } }
    );

    res.status(201).json(problem);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   PUT api/problems/:id
// @desc    Updating a problem
// @access  Private (only author or admin)
exports.updateProblem = async (req, res) => {
  // Validating request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      title,
      description,
      inputFormat,
      outputFormat,
      constraints,
      difficulty,
      tags,
      testCases,
      timeLimit,
      memoryLimit,
      isPublic
    } = req.body;

    // Getting problem
    const problem = req.resourceItem; // From middleware

    // Updating fields
    if (title) problem.title = title;
    if (description) problem.description = description;
    if (inputFormat) problem.inputFormat = inputFormat;
    if (outputFormat) problem.outputFormat = outputFormat;
    if (constraints) problem.constraints = constraints;
    if (difficulty) problem.difficulty = difficulty;
    if (tags) problem.tags = tags;
    if (testCases) problem.testCases = testCases;
    if (timeLimit) problem.timeLimit = timeLimit;
    if (memoryLimit) problem.memoryLimit = memoryLimit;
    if (isPublic !== undefined) problem.isPublic = isPublic;

    // Saving updated problem
    const updatedProblem = await problem.save();

    res.json(updatedProblem);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   DELETE api/problems/:id
// @desc    Deleting a problem
// @access  Private (only author or admin)
exports.deleteProblem = async (req, res) => {
  try {
    const problem = req.resourceItem; // From middleware
    
    // Removing problem from user's created problems
    await User.findByIdAndUpdate(
      problem.author,
      { $pull: { problemsCreated: problem._id } }
    );
    
    // Deleting the problem
    await problem.deleteOne();
    
    res.json({ message: 'Problem removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/problems/tags
// @desc    Getting all unique tags
// @access  Public
exports.getAllTags = async (req, res) => {
  try {
    const tags = await Problem.distinct('tags');
    res.json(tags);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/problems/stats
// @desc    Getting problem statistics
// @access  Public
exports.getProblemStats = async (req, res) => {
  try {
    const totalProblems = await Problem.countDocuments({ isPublic: true });
    
    const difficultyStats = await Problem.aggregate([
      { $match: { isPublic: true } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);
    
    const tagStats = await Problem.aggregate([
      { $match: { isPublic: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      totalProblems,
      difficultyStats: difficultyStats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      topTags: tagStats
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};