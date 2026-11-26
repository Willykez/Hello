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

// Get all buses (with optional filters)
router.get('/', (req, res) => {
  const { bus_type, search, page = 1, limit = 20 } = req.query;
  const db = getDb();

  let query = 'SELECT * FROM buses WHERE 1=1';
  const params = [];

  if (bus_type) {
    query += ' AND bus_type = ?';
    params.push(bus_type);
  }
  if (search) {
    query += ' AND (bus_name LIKE ? OR bus_number LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(query, params, (err, buses) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch buses' });
    }

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM buses WHERE 1=1';
    const countParams = [];
    if (bus_type) { countQuery += ' AND bus_type = ?'; countParams.push(bus_type); }
    if (search) { countQuery += ' AND (bus_name LIKE ? OR bus_number LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`); }

    db.get(countQuery, countParams, (err, countResult) => {
      res.json({
        success: true,
        buses: buses.map(b => ({
          ...b,
          amenities: b.amenities ? b.amenities.split(',') : []
        })),
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

// Get bus types
router.get('/types', (req, res) => {
  const db = getDb();
  db.all(`SELECT DISTINCT bus_type FROM buses ORDER BY bus_type`, [], (err, rows) => {
    res.json({ success: true, types: rows.map(r => r.bus_type) });
    db.close();
  });
});

// Get single bus
router.get('/:id', (req, res) => {
  const db = getDb();
  db.get(`SELECT * FROM buses WHERE id = ?`, [req.params.id], (err, bus) => {
    if (err || !bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }
    res.json({
      success: true,
      bus: {
        ...bus,
        amenities: bus.amenities ? bus.amenities.split(',') : []
      }
    });
    db.close();
  });
});

// Create bus (admin only)
router.post('/', authenticateToken, authorizeRoles('admin'), [
  body('bus_number').notEmpty(),
  body('bus_name').notEmpty(),
  body('bus_type').notEmpty(),
  body('total_seats').isInt({ min: 1 }),
], validate, (req, res) => {
  const { bus_number, bus_name, bus_type, total_seats, amenities, operator_id } = req.body;
  const db = getDb();
  const id = uuidv4();

  db.run(
    `INSERT INTO buses (id, bus_number, bus_name, bus_type, total_seats, amenities, operator_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, bus_number, bus_name, bus_type, total_seats, amenities?.join(','), operator_id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ success: false, message: 'Bus number already exists' });
        }
        return res.status(500).json({ success: false, message: 'Failed to create bus' });
      }
      res.status(201).json({ success: true, message: 'Bus created', bus: { id, bus_number, bus_name, bus_type, total_seats } });
      db.close();
    }
  );
});

// Update bus (admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const { bus_name, bus_type, total_seats, amenities, operator_id } = req.body;
  const db = getDb();

  const updates = [];
  const params = [];
  if (bus_name) { updates.push('bus_name = ?'); params.push(bus_name); }
  if (bus_type) { updates.push('bus_type = ?'); params.push(bus_type); }
  if (total_seats) { updates.push('total_seats = ?'); params.push(total_seats); }
  if (amenities) { updates.push('amenities = ?'); params.push(amenities.join(',')); }
  if (operator_id) { updates.push('operator_id = ?'); params.push(operator_id); }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }

  params.push(req.params.id);
  db.run(`UPDATE buses SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Update failed' });
    res.json({ success: true, message: 'Bus updated' });
    db.close();
  });
});

// Delete bus (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const db = getDb();
  db.run(`DELETE FROM buses WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Delete failed' });
    res.json({ success: true, message: 'Bus deleted' });
    db.close();
  });
});

module.exports = router;