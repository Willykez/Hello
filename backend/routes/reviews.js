const express = require('express');
const { body, validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();
const dbPath = path.join(__dirname, '../database/bus_booking.db');

const getDb = () => new sqlite3.Database(dbPath);
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Get reviews for a bus
router.get('/bus/:busId', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const db = getDb();

  db.all(`
    SELECT rv.*, u.full_name
    FROM reviews rv
    JOIN users u ON rv.user_id = u.id
    WHERE rv.bus_id = ?
    ORDER BY rv.created_at DESC
    LIMIT ? OFFSET ?
  `, [req.params.busId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)], (err, reviews) => {
    if (err) return res.status(500).json({ success: false, message: 'Failed to fetch reviews' });

    db.get(`SELECT COUNT(*) as total FROM reviews WHERE bus_id = ?`, [req.params.busId], (err, countResult) => {
      // Get average rating
      db.get(`SELECT AVG(rating) as avgRating, COUNT(*) as totalReviews FROM reviews WHERE bus_id = ?`, [req.params.busId], (err, ratingResult) => {
        res.json({
          success: true,
          reviews,
          summary: {
            averageRating: ratingResult.avgRating ? parseFloat(ratingResult.avgRating.toFixed(1)) : 0,
            totalReviews: ratingResult.totalReviews
          },
          pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult.total, pages: Math.ceil(countResult.total / parseInt(limit)) }
        });
        db.close();
      });
    });
  });
});

// Get bus rating summary
router.get('/bus/:busId/summary', (req, res) => {
  const db = getDb();
  db.get(`
    SELECT
      AVG(rating) as avgRating,
      COUNT(*) as totalReviews,
      SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as fiveStar,
      SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as fourStar,
      SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as threeStar,
      SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as twoStar,
      SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as oneStar
    FROM reviews WHERE bus_id = ?
  `, [req.params.busId], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Failed to fetch summary' });

    res.json({
      success: true,
      summary: {
        averageRating: result.avgRating ? parseFloat(result.avgRating.toFixed(1)) : 0,
        totalReviews: result.totalReviews || 0,
        distribution: {
          5: result.fiveStar || 0,
          4: result.fourStar || 0,
          3: result.threeStar || 0,
          2: result.twoStar || 0,
          1: result.oneStar || 0
        }
      }
    });
    db.close();
  });
});

module.exports = router;