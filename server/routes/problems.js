const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const problemController = require('../controllers/problemController');
const { authenticate, isOwnerOrAdmin } = require('../middleware/auth');

// @route   GET api/problems
// @desc    Getting all problems
// @access  Public
router.get('/', problemController.getProblems);

// @route   GET api/problems/tags
// @desc    Getting all unique tags
// @access  Public
router.get('/tags', problemController.getAllTags);

// @route   GET api/problems/stats
// @desc    Getting problem statistics
// @access  Public
router.get('/stats', problemController.getProblemStats);

// @route   GET api/problems/:id
// @desc    Getting problem by ID
// @access  Public
router.get('/:id', problemController.getProblemById);

// @route   POST api/problems
// @desc    Creating a new problem
// @access  Private
router.post(
  '/',
  [
    authenticate,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('inputFormat', 'Input format is required').not().isEmpty(),
      check('outputFormat', 'Output format is required').not().isEmpty(),
      check('constraints', 'Constraints are required').not().isEmpty(),
      check('testCases', 'At least one test case is required').isArray({ min: 1 }),
      check('testCases.*.input', 'Test case input is required').not().isEmpty(),
      check('testCases.*.output', 'Test case output is required').not().isEmpty()
    ]
  ],
  problemController.createProblem
);

// @route   PUT api/problems/:id
// @desc    Updating a problem
// @access  Private (only author or admin)
router.put(
  '/:id',
  [
    authenticate,
    isOwnerOrAdmin('Problem'),
    [
      check('title', 'Title cannot be empty').optional().not().isEmpty(),
      check('description', 'Description cannot be empty').optional().not().isEmpty(),
      check('inputFormat', 'Input format cannot be empty').optional().not().isEmpty(),
      check('outputFormat', 'Output format cannot be empty').optional().not().isEmpty(),
      check('constraints', 'Constraints cannot be empty').optional().not().isEmpty(),
      check('testCases', 'At least one test case is required').optional().isArray({ min: 1 }),
      check('testCases.*.input', 'Test case input is required').optional().not().isEmpty(),
      check('testCases.*.output', 'Test case output is required').optional().not().isEmpty()
    ]
  ],
  problemController.updateProblem
);

// @route   DELETE api/problems/:id
// @desc    Deleting a problem
// @access  Private (only author or admin)
router.delete(
  '/:id',
  [authenticate, isOwnerOrAdmin('Problem')],
  problemController.deleteProblem
);

module.exports = router;