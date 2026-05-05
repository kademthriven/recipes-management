const express = require('express');
const router = express.Router();
const socialController = require('../controllers/socialController');
const { authenticateToken } = require('../middleware/auth');

// User search
router.get('/users/search', authenticateToken, socialController.searchUsers);

// Follow routes
router.post('/follow/:userId', authenticateToken, socialController.followUser);
router.delete('/follow/:userId', authenticateToken, socialController.unfollowUser);
router.get('/follow/:userId/status', authenticateToken, socialController.isFollowing);

// Followers and Following routes
router.get('/:userId/followers', socialController.getFollowers);
router.get('/:userId/following', socialController.getFollowing);
router.get('/:userId/stats', socialController.getFollowStats);

// Activity feed routes
router.get('/feed/activities', authenticateToken, socialController.getActivityFeed);

module.exports = router;
