const express = require('express');
const { body, query, validationResult } = require('express-validator');
const SwapRequest = require('../models/SwapRequest');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/swaps
// @desc    Create a new swap request
// @access  Private
router.post('/', protect, [
  body('receiverId')
    .isMongoId()
    .withMessage('Invalid receiver ID'),
  body('skillOffered')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Skill offered must be between 1 and 100 characters'),
  body('skillWanted')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Skill wanted must be between 1 and 100 characters'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters')
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

    const { receiverId, skillOffered, skillWanted, message } = req.body;

    // Check if receiver exists and is not banned
    const receiver = await User.findById(receiverId);
    if (!receiver || receiver.isBanned || !receiver.isPublic) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found or unavailable'
      });
    }

    // Prevent self-requests
    if (req.user._id.toString() === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send swap request to yourself'
      });
    }

    // Check if requester has the offered skill
    if (!req.user.skillsOffered.includes(skillOffered)) {
      return res.status(400).json({
        success: false,
        message: 'You do not have the offered skill in your profile'
      });
    }

    // Check if receiver has the wanted skill
    if (!receiver.skillsOffered.includes(skillWanted)) {
      return res.status(400).json({
        success: false,
        message: 'Receiver does not offer the requested skill'
      });
    }

    // Check for existing pending/accepted request
    const existingRequest = await SwapRequest.findOne({
      requester: req.user._id,
      receiver: receiverId,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending or accepted request with this user'
      });
    }

    // Create swap request
    const swapRequest = new SwapRequest({
      requester: req.user._id,
      receiver: receiverId,
      skillOffered,
      skillWanted,
      message
    });

    await swapRequest.save();

    // Populate the request for response
    await swapRequest.populate([
      { path: 'requester', select: 'name email profilePhoto' },
      { path: 'receiver', select: 'name email profilePhoto' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Swap request created successfully',
      data: swapRequest
    });

  } catch (error) {
    console.error('Create swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating swap request'
    });
  }
});

// @route   GET /api/swaps
// @desc    Get user's swap requests (sent and received)
// @access  Private
router.get('/', protect, [
  query('type')
    .optional()
    .isIn(['sent', 'received', 'all'])
    .withMessage('Type must be sent, received, or all'),
  query('status')
    .optional()
    .isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
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
      type = 'all',
      status,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    let query = {};

    if (type === 'sent') {
      query.requester = req.user._id;
    } else if (type === 'received') {
      query.receiver = req.user._id;
    } else {
      query.$or = [
        { requester: req.user._id },
        { receiver: req.user._id }
      ];
    }

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get swap requests
    const swapRequests = await SwapRequest.find(query)
      .populate('requester', 'name email profilePhoto rating')
      .populate('receiver', 'name email profilePhoto rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const total = await SwapRequest.countDocuments(query);

    res.json({
      success: true,
      data: {
        swapRequests,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get swap requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting swap requests'
    });
  }
});

// @route   GET /api/swaps/:id
// @desc    Get specific swap request
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid swap request ID'
      });
    }

    const swapRequest = await SwapRequest.findById(id)
      .populate('requester', 'name email profilePhoto rating')
      .populate('receiver', 'name email profilePhoto rating')
      .lean();

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is involved in this swap
    const isInvolved = swapRequest.requester._id.toString() === req.user._id.toString() ||
                      swapRequest.receiver._id.toString() === req.user._id.toString();

    if (!isInvolved) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: swapRequest
    });

  } catch (error) {
    console.error('Get swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting swap request'
    });
  }
});

// @route   PUT /api/swaps/:id/accept
// @desc    Accept a swap request
// @access  Private
router.put('/:id/accept', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const swapRequest = await SwapRequest.findById(id)
      .populate('requester', 'name email')
      .populate('receiver', 'name email');

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is the receiver
    if (swapRequest.receiver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the receiver can accept this request'
      });
    }

    // Check if request is pending
    if (swapRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request is not pending'
      });
    }

    // Update status
    swapRequest.status = 'accepted';
    await swapRequest.save();

    res.json({
      success: true,
      message: 'Swap request accepted successfully',
      data: swapRequest
    });

  } catch (error) {
    console.error('Accept swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error accepting swap request'
    });
  }
});

// @route   PUT /api/swaps/:id/reject
// @desc    Reject a swap request
// @access  Private
router.put('/:id/reject', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const swapRequest = await SwapRequest.findById(id)
      .populate('requester', 'name email')
      .populate('receiver', 'name email');

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is the receiver
    if (swapRequest.receiver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the receiver can reject this request'
      });
    }

    // Check if request is pending
    if (swapRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request is not pending'
      });
    }

    // Update status
    swapRequest.status = 'rejected';
    await swapRequest.save();

    res.json({
      success: true,
      message: 'Swap request rejected',
      data: swapRequest
    });

  } catch (error) {
    console.error('Reject swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rejecting swap request'
    });
  }
});

// @route   PUT /api/swaps/:id/complete
// @desc    Mark swap as completed with rating and feedback
// @access  Private
router.put('/:id/complete', protect, [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Feedback cannot exceed 500 characters')
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
    const { rating, feedback } = req.body;

    const swapRequest = await SwapRequest.findById(id)
      .populate('requester', 'name email')
      .populate('receiver', 'name email');

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is involved in this swap
    const isInvolved = swapRequest.requester._id.toString() === req.user._id.toString() ||
                      swapRequest.receiver._id.toString() === req.user._id.toString();

    if (!isInvolved) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if request is accepted
    if (swapRequest.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Request must be accepted before completion'
      });
    }

    // Update swap request
    swapRequest.status = 'completed';
    swapRequest.rating = rating;
    swapRequest.feedback = feedback;
    await swapRequest.save();

    // Update the other user's rating
    const otherUserId = swapRequest.requester._id.toString() === req.user._id.toString()
      ? swapRequest.receiver._id
      : swapRequest.requester._id;

    const otherUser = await User.findById(otherUserId);
    if (otherUser) {
      await otherUser.updateRating(rating);
    }

    res.json({
      success: true,
      message: 'Swap completed successfully',
      data: swapRequest
    });

  } catch (error) {
    console.error('Complete swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error completing swap request'
    });
  }
});

// @route   DELETE /api/swaps/:id
// @desc    Cancel/delete a swap request
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const swapRequest = await SwapRequest.findById(id);

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Check if user is the requester
    if (swapRequest.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the requester can cancel this request'
      });
    }

    // Check if request can be cancelled
    if (swapRequest.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed swap'
      });
    }

    // Delete the request
    await SwapRequest.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Swap request cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling swap request'
    });
  }
});

// @route   GET /api/swaps/stats/dashboard
// @desc    Get swap statistics for user dashboard
// @access  Private
router.get('/stats/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await SwapRequest.aggregate([
      {
        $match: {
          $or: [
            { requester: userId },
            { receiver: userId }
          ]
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      total: 0,
      pending: 0,
      accepted: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    // Get recent activity
    const recentSwaps = await SwapRequest.find({
      $or: [
        { requester: userId },
        { receiver: userId }
      ]
    })
    .populate('requester', 'name profilePhoto')
    .populate('receiver', 'name profilePhoto')
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();

    res.json({
      success: true,
      data: {
        stats: result,
        recentActivity: recentSwaps
      }
    });

  } catch (error) {
    console.error('Get swap stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting swap statistics'
    });
  }
});

module.exports = router;