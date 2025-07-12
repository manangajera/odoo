const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const SwapRequest = require('../models/SwapRequest');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all public users with search and filter
// @access  Public
router.get('/', optionalAuth, [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),
  query('skill')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Skill filter cannot exceed 50 characters'),
  query('availability')
    .optional()
    .isIn(['Weekdays', 'Weekends', 'Evenings', 'Mornings'])
    .withMessage('Invalid availability filter'),
  query('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location filter cannot exceed 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      search,
      skill,
      availability,
      location,
      page = 1,
      limit = 12
    } = req.query;

    // Build query
    let query = {
      isPublic: true,
      isBanned: false
    };

    // Exclude current user if authenticated
    if (req.user) {
      query._id = { $ne: req.user._id };
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Skill filter
    if (skill) {
      query.$or = [
        { skillsOffered: { $regex: skill, $options: 'i' } },
        { skillsWanted: { $regex: skill, $options: 'i' } }
      ];
    }

    // Availability filter
    if (availability) {
      query.availability = availability;
    }

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const users = await User.find(query)
      .select('-password -ratingSum -totalRatings')
      .sort(search ? { score: { $meta: 'textScore' } } : { rating: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting users'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(id)
      .select('-password -ratingSum -totalRatings')
      .populate('completedSwaps')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is banned or private
    if (user.isBanned) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If profile is private and not the owner, hide details
    if (!user.isPublic && (!req.user || req.user._id.toString() !== id)) {
      return res.status(404).json({
        success: false,
        message: 'User profile is private'
      });
    }

    // Get user's swap statistics
    const swapStats = await SwapRequest.getUserStats(id);

    res.json({
      success: true,
      data: {
        user,
        swapStats
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user'
    });
  }
});

// @route   GET /api/users/:id/reviews
// @desc    Get user reviews/feedback
// @access  Public
router.get('/:id/reviews', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get completed swaps with feedback for this user
    const reviews = await SwapRequest.find({
      $or: [
        { requester: id },
        { receiver: id }
      ],
      status: 'completed',
      feedback: { $exists: true, $ne: '' }
    })
    .populate('requester', 'name profilePhoto')
    .populate('receiver', 'name profilePhoto')
    .sort({ completedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

    const total = await SwapRequest.countDocuments({
      $or: [
        { requester: id },
        { receiver: id }
      ],
      status: 'completed',
      feedback: { $exists: true, $ne: '' }
    });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user reviews'
    });
  }
});

// @route   GET /api/users/search/skills
// @desc    Get unique skills for autocomplete
// @access  Public
router.get('/search/skills', async (req, res) => {
  try {
    const { q } = req.query;

    let matchStage = {
      isPublic: true,
      isBanned: false
    };

    if (q) {
      matchStage.$or = [
        { skillsOffered: { $regex: q, $options: 'i' } },
        { skillsWanted: { $regex: q, $options: 'i' } }
      ];
    }

    const skills = await User.aggregate([
      { $match: matchStage },
      {
        $project: {
          skills: { $concatArrays: ['$skillsOffered', '$skillsWanted'] }
        }
      },
      { $unwind: '$skills' },
      {
        $group: {
          _id: '$skills',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 20 },
      {
        $project: {
          skill: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: skills
    });

  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting skills'
    });
  }
});

module.exports = router;