const express = require('express');
const { v4: uuidv4 } = require('uuid');
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

// Get all routes
router.get('/', (req, res) => {
  const { search, page = 1, limit = 50 } = req.query;
  const db = getDb();

  let query = 'SELECT * FROM routes WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (source LIKE ? OR destination LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY source, destination LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(query, params, (err, routes) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch routes' });
    }

    let countQuery = 'SELECT COUNT(*) as total FROM routes WHERE 1=1';
    const countParams = [];
    if (search) { countQuery += ' AND (source LIKE ? OR destination LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`); }

    db.get(countQuery, countParams, (err, countResult) => {
      res.json({
        success: true,
        routes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / parseInt(limit))
        }
      });
      db.close();
    });
  });
});

// Get unique cities (for autocomplete)
router.get('/cities', (req, res) => {
  const db = getDb();
  db.all(`SELECT DISTINCT source as city FROM routes UNION SELECT DISTINCT destination FROM routes ORDER BY city`, [], (err, rows) => {
    res.json({ success: true, cities: rows.map(r => r.city) });
    db.close();
  });
});

// Get popular routes
router.get('/popular', (req, res) => {
  const db = getDb();
  db.all(`
    SELECT r.*, COUNT(s.id) as schedule_count
    FROM routes r
    LEFT JOIN schedules s ON r.id = s.route_id AND s.status = 'active'
    GROUP BY r.id
    ORDER BY schedule_count DESC
    LIMIT 10
  `, [], (err, routes) => {
    res.json({ success: true, routes });
    db.close();
  });
});

// Get single route
router.get('/:id', (req, res) => {
  const db = getDb();
  db.get(`SELECT * FROM routes WHERE id = ?`, [req.params.id], (err, route) => {
    if (err || !route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }
    res.json({ success: true, route });
    db.close();
  });
});

// Create route (admin only)
router.post('/', authenticateToken, authorizeRoles('admin'), [
  body('source').notEmpty(),
  body('destination').notEmpty(),
  body('distance_km').isInt({ min: 1 }),
  body('estimated_duration').notEmpty(),
], validate, (req, res) => {
  const { source, destination, distance_km, estimated_duration } = req.body;
  const db = getDb();
  const id = uuidv4();

  db.run(
    `INSERT INTO routes (id, source, destination, distance_km, estimated_duration) VALUES (?, ?, ?, ?, ?)`,
    [id, source, destination, distance_km, estimated_duration],
    function(err) {
      if (err) return res.status(500).json({ success: false, message: 'Failed to create route' });
      res.status(201).json({ success: true, message: 'Route created', route: { id, source, destination, distance_km, estimated_duration } });
      db.close();
    }
  );
});

// Update route (admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const { source, destination, distance_km, estimated_duration } = req.body;
  const db = getDb();

  const updates = [];
  const params = [];
  if (source) { updates.push('source = ?'); params.push(source); }
  if (destination) { updates.push('destination = ?'); params.push(destination); }
  if (distance_km) { updates.push('distance_km = ?'); params.push(distance_km); }
  if (estimated_duration) { updates.push('estimated_duration = ?'); params.push(estimated_duration); }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }

  params.push(req.params.id);
  db.run(`UPDATE routes SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Update failed' });
    res.json({ success: true, message: 'Route updated' });
    db.close();
  });
});

// Delete route (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const db = getDb();
  db.run(`DELETE FROM routes WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Delete failed' });
    res.json({ success: true, message: 'Route deleted' });
    db.close();
  });
});

module.exports = router;