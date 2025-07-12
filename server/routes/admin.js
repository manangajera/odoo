const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const SwapRequest = require('../models/SwapRequest');
const Announcement = require('../models/Announcement');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(protect);
router.use(adminOnly);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          publicUsers: { $sum: { $cond: ['$isPublic', 1, 0] } },
          bannedUsers: { $sum: { $cond: ['$isBanned', 1, 0] } },
          adminUsers: { $sum: { $cond: ['$isAdmin', 1, 0] } }
        }
      }
    ]);

    // Get swap statistics
    const swapStats = await SwapRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get top skills
    const topSkills = await User.aggregate([
      { $unwind: '$skillsOffered' },
      {
        $group: {
          _id: '$skillsOffered',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Format swap statistics
    const swapStatsFormatted = {
      total: 0,
      pending: 0,
      accepted: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0
    };

    swapStats.forEach(stat => {
      swapStatsFormatted[stat._id] = stat.count;
      swapStatsFormatted.total += stat.count;
    });

    res.json({
      success: true,
      data: {
        users: userStats[0] || {
          totalUsers: 0,
          publicUsers: 0,
          bannedUsers: 0,
          adminUsers: 0
        },
        swaps: swapStatsFormatted,
        recentRegistrations,
        topSkills
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting dashboard data'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with admin controls
// @access  Admin
router.get('/users', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),
  query('status')
    .optional()
    .isIn(['all', 'active', 'banned', 'private'])
    .withMessage('Invalid status filter')
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
      page = 1,
      limit = 20,
      search,
      status = 'all'
    } = req.query;

    // Build query
    let query = { isAdmin: false }; // Exclude admin users

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'active') {
      query.isBanned = false;
      query.isPublic = true;
    } else if (status === 'banned') {
      query.isBanned = true;
    } else if (status === 'private') {
      query.isPublic = false;
      query.isBanned = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const total = await User.countDocuments(query);

    // Get swap counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const swapStats = await SwapRequest.getUserStats(user._id);
        return {
          ...user,
          swapStats
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting users'
    });
  }
});

// @route   PUT /api/admin/users/:id/ban
// @desc    Ban a user
// @access  Admin
router.put('/users/:id/ban', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Cannot ban admin users'
      });
    }

    if (user.isBanned) {
      return res.status(400).json({
        success: false,
        message: 'User is already banned'
      });
    }

    // Ban user
    user.isBanned = true;
    user.isPublic = false; // Also make profile private
    await user.save();

    // Cancel all pending swap requests involving this user
    await SwapRequest.updateMany(
      {
        $or: [
          { requester: id },
          { receiver: id }
        ],
        status: 'pending'
      },
      { status: 'cancelled' }
    );

    res.json({
      success: true,
      message: 'User banned successfully',
      data: user
    });

  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error banning user'
    });
  }
});

// @route   PUT /api/admin/users/:id/unban
// @desc    Unban a user
// @access  Admin
router.put('/users/:id/unban', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isBanned) {
      return res.status(400).json({
        success: false,
        message: 'User is not banned'
      });
    }

    // Unban user
    user.isBanned = false;
    user.isPublic = true; // Make profile public again
    await user.save();

    res.json({
      success: true,
      message: 'User unbanned successfully',
      data: user
    });

  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error unbanning user'
    });
  }
});

// @route   GET /api/admin/swaps
// @desc    Get all swap requests for monitoring
// @access  Admin
router.get('/swaps', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled'])
    .withMessage('Invalid status filter')
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
      page = 1,
      limit = 20,
      status
    } = req.query;

    // Build query
    let query = {};
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get swap requests
    const swapRequests = await SwapRequest.find(query)
      .populate('requester', 'name email profilePhoto')
      .populate('receiver', 'name email profilePhoto')
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
    console.error('Admin get swaps error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting swap requests'
    });
  }
});

// @route   POST /api/admin/announcements
// @desc    Create platform announcement
// @access  Admin
router.post('/announcements', [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('type')
    .optional()
    .isIn(['info', 'warning', 'success', 'error'])
    .withMessage('Invalid announcement type'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiration date')
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

    const { title, message, type = 'info', expiresAt } = req.body;

    const announcement = new Announcement({
      title,
      message,
      type,
      createdBy: req.user._id,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    await announcement.save();

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    });

  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating announcement'
    });
  }
});

// @route   GET /api/admin/reports/users
// @desc    Generate user activity report
// @access  Admin
router.get('/reports/users', async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false })
      .select('-password')
      .lean();

    // Add swap statistics to each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const swapStats = await SwapRequest.getUserStats(user._id);
        return {
          ...user,
          swapStats
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        generatedAt: new Date().toISOString(),
        totalUsers: usersWithStats.length
      }
    });

  } catch (error) {
    console.error('Generate user report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating user report'
    });
  }
});

// @route   GET /api/admin/reports/swaps
// @desc    Generate swap activity report
// @access  Admin
router.get('/reports/swaps', async (req, res) => {
  try {
    const swapRequests = await SwapRequest.find({})
      .populate('requester', 'name email')
      .populate('receiver', 'name email')
      .lean();

    // Generate statistics
    const stats = {
      total: swapRequests.length,
      byStatus: {},
      byMonth: {},
      averageRating: 0,
      totalRatings: 0
    };

    let ratingSum = 0;
    let ratingCount = 0;

    swapRequests.forEach(swap => {
      // Count by status
      stats.byStatus[swap.status] = (stats.byStatus[swap.status] || 0) + 1;

      // Count by month
      const month = new Date(swap.createdAt).toISOString().substring(0, 7);
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;

      // Calculate average rating
      if (swap.rating) {
        ratingSum += swap.rating;
        ratingCount++;
      }
    });

    if (ratingCount > 0) {
      stats.averageRating = Math.round((ratingSum / ratingCount) * 10) / 10;
      stats.totalRatings = ratingCount;
    }

    res.json({
      success: true,
      data: {
        swapRequests,
        statistics: stats,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Generate swap report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating swap report'
    });
  }
});

// @route   GET /api/admin/reports/activity
// @desc    Generate platform activity report
// @access  Admin
router.get('/reports/activity', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // User statistics
    const userStats = {
      total: await User.countDocuments({ isAdmin: false }),
      active: await User.countDocuments({ isPublic: true, isBanned: false }),
      banned: await User.countDocuments({ isBanned: true }),
      newThisMonth: await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
        isAdmin: false
      }),
      newThisWeek: await User.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
        isAdmin: false
      })
    };

    // Swap statistics
    const swapStats = {
      total: await SwapRequest.countDocuments({}),
      pending: await SwapRequest.countDocuments({ status: 'pending' }),
      completed: await SwapRequest.countDocuments({ status: 'completed' }),
      thisMonth: await SwapRequest.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      }),
      thisWeek: await SwapRequest.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
      })
    };

    // Top skills
    const topSkills = await User.aggregate([
      { $match: { isAdmin: false, isPublic: true, isBanned: false } },
      { $unwind: '$skillsOffered' },
      {
        $group: {
          _id: '$skillsOffered',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);

    res.json({
      success: true,
      data: {
        users: userStats,
        swaps: swapStats,
        topSkills,
        generatedAt: now.toISOString(),
        reportPeriod: {
          from: thirtyDaysAgo.toISOString(),
          to: now.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Generate activity report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating activity report'
    });
  }
});

module.exports = router;