const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const submissionController = require('../controllers/submissionController');
const { authenticate } = require('../middleware/auth');

// @route   POST api/submissions
// @desc    Submitting a solution for a problem
// @access  Private
router.post(
  '/',
  [
    authenticate,
    [
      check('problemId', 'Problem ID is required').not().isEmpty(),
      check('code', 'Code is required').not().isEmpty(),
      check('language', 'Language is required').isIn(['c', 'cpp', 'python'])
    ]
  ],
  submissionController.submitSolution
);

// @route   GET api/submissions/:id
// @desc    Getting submission by ID
// @access  Private (only submitter or admin)
router.get('/:id', authenticate, submissionController.getSubmissionById);

// @route   GET api/submissions/problem/:problemId
// @desc    Getting submissions for a problem
// @access  Private
router.get('/problem/:problemId', authenticate, submissionController.getSubmissionsByProblem);

// @route   GET api/submissions/user
// @desc    Getting submissions by current user
// @access  Private
router.get('/user/me', authenticate, submissionController.getSubmissionsByUser);

module.exports = router;