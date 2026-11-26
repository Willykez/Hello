const express = require('express');
const { body, validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

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

// Get user dashboard stats
router.get('/dashboard', authenticateToken, (req, res) => {
  const db = getDb();

  db.get(`SELECT COUNT(*) as total FROM bookings WHERE user_id = ?`, [req.user.id], (err, totalResult) => {
    db.get(`SELECT COUNT(*) as upcoming FROM bookings b JOIN schedules s ON b.schedule_id = s.id WHERE b.user_id = ? AND b.booking_status = 'confirmed' AND date(s.travel_date) >= date('now')`, [req.user.id], (err, upcomingResult) => {
      db.get(`SELECT COUNT(*) as past FROM bookings b JOIN schedules s ON b.schedule_id = s.id WHERE b.user_id = ? AND (b.booking_status = 'completed' OR date(s.travel_date) < date('now'))`, [req.user.id], (err, pastResult) => {
        db.get(`SELECT COUNT(*) as cancelled FROM bookings WHERE user_id = ? AND booking_status = 'cancelled'`, [req.user.id], (err, cancelledResult) => {
          db.all(`
            SELECT b.*, s.departure_time, s.arrival_time, s.travel_date,
                   bs.bus_name, bs.bus_type, r.source, r.destination
            FROM bookings b
            JOIN schedules s ON b.schedule_id = s.id
            JOIN buses bs ON s.bus_id = bs.id
            JOIN routes r ON s.route_id = r.id
            WHERE b.user_id = ? AND b.booking_status = 'confirmed' AND date(s.travel_date) >= date('now')
            ORDER BY s.travel_date ASC, s.departure_time ASC
            LIMIT 3
          `, [req.user.id], (err, upcomingBookings) => {
            res.json({
              success: true,
              stats: {
                totalBookings: totalResult.total,
                upcomingTrips: upcomingResult.upcoming,
                pastTrips: pastResult.past,
                cancelledTrips: cancelledResult.cancelled
              },
              upcomingBookings: upcomingBookings.map(b => ({
                ...b,
                seat_numbers: b.seat_numbers.split(',')
              }))
            });
            db.close();
          });
        });
      });
    });
  });
});

// Get user's reviews
router.get('/reviews', authenticateToken, (req, res) => {
  const db = getDb();
  db.all(`
    SELECT rv.*, b.bus_name, b.bus_type
    FROM reviews rv
    JOIN buses b ON rv.bus_id = b.id
    WHERE rv.user_id = ?
    ORDER BY rv.created_at DESC
  `, [req.user.id], (err, reviews) => {
    res.json({ success: true, reviews });
    db.close();
  });
});

// Add review
router.post('/reviews', authenticateToken, [
  body('bus_id').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().trim(),
], validate, (req, res) => {
  const { bus_id, rating, comment } = req.body;
  const db = getDb();

  // Check if user has completed a trip on this bus
  db.get(`
    SELECT 1 FROM bookings b
    JOIN schedules s ON b.schedule_id = s.id
    WHERE b.user_id = ? AND s.bus_id = ? AND b.booking_status = 'confirmed' AND date(s.travel_date) < date('now')
    LIMIT 1
  `, [req.user.id, bus_id], (err, completedTrip) => {
    if (!completedTrip) {
      return res.status(400).json({ success: false, message: 'You can only review buses you have traveled on' });
    }

    // Check if already reviewed
    db.get(`SELECT id FROM reviews WHERE user_id = ? AND bus_id = ?`, [req.user.id, bus_id], (err, existing) => {
      if (existing) {
        return res.status(400).json({ success: false, message: 'You have already reviewed this bus' });
      }

      const { v4: uuidv4 } = require('uuid');
      const id = uuidv4();

      db.run(`INSERT INTO reviews (id, user_id, bus_id, rating, comment) VALUES (?, ?, ?, ?, ?)`,
        [id, req.user.id, bus_id, rating, comment || null], function(err) {
          if (err) return res.status(500).json({ success: false, message: 'Failed to add review' });
          res.status(201).json({ success: true, message: 'Review added', review: { id, bus_id, rating, comment } });
          db.close();
        });
    });
  });
});

// Update review
router.put('/reviews/:id', authenticateToken, [
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('comment').optional().trim(),
], validate, (req, res) => {
  const { rating, comment } = req.body;
  const db = getDb();

  const updates = [];
  const params = [];
  if (rating) { updates.push('rating = ?'); params.push(rating); }
  if (comment !== undefined) { updates.push('comment = ?'); params.push(comment); }

  if (updates.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });

  params.push(req.params.id, req.user.id);
  db.run(`UPDATE reviews SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params, function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Update failed' });
    if (this.changes === 0) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review updated' });
    db.close();
  });
});

// Delete review
router.delete('/reviews/:id', authenticateToken, (req, res) => {
  const db = getDb();
  db.run(`DELETE FROM reviews WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Delete failed' });
    if (this.changes === 0) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review deleted' });
    db.close();
  });
});

// Admin: Get all users
router.get('/', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const db = getDb();

  let query = 'SELECT id, email, full_name, phone, created_at FROM users WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (email LIKE ? OR full_name LIKE ? OR phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(query, params, (err, users) => {
    if (err) return res.status(500).json({ success: false, message: 'Failed to fetch users' });

    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];
    if (search) { countQuery += ' AND (email LIKE ? OR full_name LIKE ? OR phone LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    db.get(countQuery, countParams, (err, countResult) => {
      res.json({
        success: true,
        users,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult.total, pages: Math.ceil(countResult.total / parseInt(limit)) }
      });
      db.close();
    });
  });
});

module.exports = router;