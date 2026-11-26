const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const dbPath = path.join(__dirname, '../database/bus_booking.db');

// Helper function to get database connection
const getDb = () => new sqlite3.Database(dbPath);

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').trim().notEmpty().withMessage('Full name required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
], validate, async (req, res) => {
  const { email, password, full_name, phone } = req.body;
  const db = getDb();

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    db.run(
      `INSERT INTO users (id, email, password, full_name, phone) VALUES (?, ?, ?, ?, ?)`,
      [userId, email, hashedPassword, full_name, phone || null],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
          }
          return res.status(500).json({ success: false, message: 'Registration failed' });
        }

        const token = jwt.sign(
          { id: userId, email, full_name },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
          success: true,
          message: 'Registration successful',
          token,
          user: { id: userId, email, full_name, phone }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    db.close();
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], validate, (req, res) => {
  const { email, password } = req.body;
  const db = getDb();

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name, phone: user.phone }
    });
    db.close();
  });
});

// Get current user profile
router.get('/me', authenticateToken, (req, res) => {
  const db = getDb();
  db.get(`SELECT id, email, full_name, phone, created_at FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
    db.close();
  });
});

// Update profile
router.put('/profile', authenticateToken, [
  body('full_name').optional().trim().notEmpty(),
  body('phone').optional().isMobilePhone(),
], validate, (req, res) => {
  const { full_name, phone } = req.body;
  const db = getDb();

  const updates = [];
  const params = [];
  if (full_name) { updates.push('full_name = ?'); params.push(full_name); }
  if (phone) { updates.push('phone = ?'); params.push(phone); }
  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.user.id);

  db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: 'Update failed' });
    }
    res.json({ success: true, message: 'Profile updated' });
    db.close();
  });
});

// Change password
router.put('/password', authenticateToken, [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 6 }),
], validate, async (req, res) => {
  const { current_password, new_password } = req.body;
  const db = getDb();

  db.get(`SELECT password FROM users WHERE id = ?`, [req.user.id], async (err, user) => {
    if (err || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isValid = await bcrypt.compare(current_password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password incorrect' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    db.run(`UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [hashedPassword, req.user.id], (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Password update failed' });
      }
      res.json({ success: true, message: 'Password changed successfully' });
      db.close();
    });
  });
});

module.exports = router;