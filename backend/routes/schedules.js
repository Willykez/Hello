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

// Search schedules (main booking search)
router.get('/search', (req, res) => {
  const { source, destination, travel_date, bus_type, min_price, max_price, departure_time, sort = 'departure_time', page = 1, limit = 20 } = req.query;

  if (!source || !destination || !travel_date) {
    return res.status(400).json({ success: false, message: 'Source, destination, and travel_date are required' });
  }

  const db = getDb();

  let query = `
    SELECT
      s.*,
      b.bus_number, b.bus_name, b.bus_type, b.total_seats, b.amenities,
      r.source, r.destination, r.distance_km, r.estimated_duration
    FROM schedules s
    JOIN buses b ON s.bus_id = b.id
    JOIN routes r ON s.route_id = r.id
    WHERE r.source = ? AND r.destination = ? AND s.travel_date = ? AND s.status = 'active' AND s.available_seats > 0
  `;
  const params = [source, destination, travel_date];

  if (bus_type) {
    query += ' AND b.bus_type = ?';
    params.push(bus_type);
  }
  if (min_price) {
    query += ' AND s.price >= ?';
    params.push(parseFloat(min_price));
  }
  if (max_price) {
    query += ' AND s.price <= ?';
    params.push(parseFloat(max_price));
  }
  if (departure_time) {
    query += ' AND s.departure_time >= ?';
    params.push(departure_time);
  }

  // Sorting
  const sortOptions = {
    'departure_time': 's.departure_time ASC',
    'arrival_time': 's.arrival_time ASC',
    'price_low': 's.price ASC',
    'price_high': 's.price DESC',
    'duration': 'r.estimated_duration ASC'
  };
  query += ` ORDER BY ${sortOptions[sort] || 's.departure_time ASC'}`;

  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(query, params, (err, schedules) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Search failed' });
    }

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM schedules s
      JOIN buses b ON s.bus_id = b.id
      JOIN routes r ON s.route_id = r.id
      WHERE r.source = ? AND r.destination = ? AND s.travel_date = ? AND s.status = 'active' AND s.available_seats > 0
    `;
    const countParams = [source, destination, travel_date];
    if (bus_type) { countQuery += ' AND b.bus_type = ?'; countParams.push(bus_type); }
    if (min_price) { countQuery += ' AND s.price >= ?'; countParams.push(parseFloat(min_price)); }
    if (max_price) { countQuery += ' AND s.price <= ?'; countParams.push(parseFloat(max_price)); }
    if (departure_time) { countQuery += ' AND s.departure_time >= ?'; countParams.push(departure_time); }

    db.get(countQuery, countParams, (err, countResult) => {
      res.json({
        success: true,
        schedules: schedules.map(s => ({
          ...s,
          amenities: s.amenities ? s.amenities.split(',') : []
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

// Get schedule with seat layout
router.get('/:id/seats', (req, res) => {
  const db = getDb();
  db.get(`
    SELECT s.*, b.bus_number, b.bus_name, b.bus_type, b.total_seats, b.amenities,
           r.source, r.destination, r.distance_km, r.estimated_duration
    FROM schedules s
    JOIN buses b ON s.bus_id = b.id
    JOIN routes r ON s.route_id = r.id
    WHERE s.id = ?
  `, [req.params.id], (err, schedule) => {
    if (err || !schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    // Get booked seats for this schedule
    db.all(`SELECT seat_numbers FROM bookings WHERE schedule_id = ? AND booking_status != 'cancelled'`, [req.params.id], (err, bookings) => {
      const bookedSeats = new Set();
      bookings.forEach(b => {
        b.seat_numbers.split(',').forEach(seat => bookedSeats.add(seat.trim()));
      });

      // Generate seat layout based on bus type
      const seatLayout = generateSeatLayout(schedule.bus_type, schedule.total_seats, bookedSeats);

      res.json({
        success: true,
        schedule: {
          ...schedule,
          amenities: schedule.amenities ? schedule.amenities.split(',') : [],
          seatLayout,
          bookedSeats: Array.from(bookedSeats)
        }
      });
      db.close();
    });
  });
});

function generateSeatLayout(busType, totalSeats, bookedSeats) {
  const layout = [];
  const isSleeper = busType.toLowerCase().includes('sleeper');
  const seatsPerRow = isSleeper ? 4 : 5; // Sleeper: 2+2, Seater: 2+3 or 3+2

  for (let i = 1; i <= totalSeats; i++) {
    const row = Math.ceil(i / seatsPerRow);
    const positionInRow = ((i - 1) % seatsPerRow) + 1;

    let seatType = 'regular';
    if (isSleeper) {
      // Sleeper: positions 1,2 are lower berths; 3,4 are upper berths
      seatType = positionInRow <= 2 ? 'lower' : 'upper';
    } else {
      // Seater: window seats at positions 1 and seatsPerRow
      seatType = (positionInRow === 1 || positionInRow === seatsPerRow) ? 'window' : 'aisle';
    }

    layout.push({
      number: i.toString(),
      row,
      position: positionInRow,
      type: seatType,
      booked: bookedSeats.has(i.toString()),
      x: (positionInRow - 1) * 100,
      y: (row - 1) * 80
    });
  }

  return { seats: layout, seatsPerRow, totalRows: Math.ceil(totalSeats / seatsPerRow) };
}

// Get all schedules (admin)
router.get('/', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const { page = 1, limit = 20, status, bus_id, route_id } = req.query;
  const db = getDb();

  let query = `
    SELECT s.*, b.bus_name, b.bus_number, r.source, r.destination
    FROM schedules s
    JOIN buses b ON s.bus_id = b.id
    JOIN routes r ON s.route_id = r.id
    WHERE 1=1
  `;
  const params = [];

  if (status) { query += ' AND s.status = ?'; params.push(status); }
  if (bus_id) { query += ' AND s.bus_id = ?'; params.push(bus_id); }
  if (route_id) { query += ' AND s.route_id = ?'; params.push(route_id); }

  query += ' ORDER BY s.travel_date DESC, s.departure_time ASC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(query, params, (err, schedules) => {
    if (err) return res.status(500).json({ success: false, message: 'Failed to fetch schedules' });

    let countQuery = 'SELECT COUNT(*) as total FROM schedules WHERE 1=1';
    const countParams = [];
    if (status) { countQuery += ' AND status = ?'; countParams.push(status); }
    if (bus_id) { countQuery += ' AND bus_id = ?'; countParams.push(bus_id); }
    if (route_id) { countQuery += ' AND route_id = ?'; countParams.push(route_id); }

    db.get(countQuery, countParams, (err, countResult) => {
      res.json({
        success: true,
        schedules,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult.total, pages: Math.ceil(countResult.total / parseInt(limit)) }
      });
      db.close();
    });
  });
});

// Create schedule (admin)
router.post('/', authenticateToken, authorizeRoles('admin'), [
  body('bus_id').notEmpty(),
  body('route_id').notEmpty(),
  body('departure_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('arrival_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('price').isFloat({ min: 0 }),
  body('available_seats').isInt({ min: 1 }),
  body('travel_date').matches(/^\d{4}-\d{2}-\d{2}$/),
], validate, (req, res) => {
  const { bus_id, route_id, departure_time, arrival_time, price, available_seats, travel_date } = req.body;
  const db = getDb();
  const id = uuidv4();

  // Verify bus and route exist
  db.get(`SELECT total_seats FROM buses WHERE id = ?`, [bus_id], (err, bus) => {
    if (err || !bus) return res.status(400).json({ success: false, message: 'Invalid bus' });
    if (available_seats > bus.total_seats) {
      return res.status(400).json({ success: false, message: 'Available seats cannot exceed bus capacity' });
    }

    db.run(
      `INSERT INTO schedules (id, bus_id, route_id, departure_time, arrival_time, price, available_seats, travel_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, bus_id, route_id, departure_time, arrival_time, price, available_seats, travel_date],
      function(err) {
        if (err) return res.status(500).json({ success: false, message: 'Failed to create schedule' });
        res.status(201).json({ success: true, message: 'Schedule created', schedule: { id, bus_id, route_id, departure_time, arrival_time, price, available_seats, travel_date } });
        db.close();
      }
    );
  });
});

// Update schedule (admin)
router.put('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const { departure_time, arrival_time, price, available_seats, travel_date, status } = req.body;
  const db = getDb();

  const updates = [];
  const params = [];
  if (departure_time) { updates.push('departure_time = ?'); params.push(departure_time); }
  if (arrival_time) { updates.push('arrival_time = ?'); params.push(arrival_time); }
  if (price) { updates.push('price = ?'); params.push(price); }
  if (available_seats) { updates.push('available_seats = ?'); params.push(available_seats); }
  if (travel_date) { updates.push('travel_date = ?'); params.push(travel_date); }
  if (status) { updates.push('status = ?'); params.push(status); }

  if (updates.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });

  params.push(req.params.id);
  db.run(`UPDATE schedules SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Update failed' });
    res.json({ success: true, message: 'Schedule updated' });
    db.close();
  });
});

// Delete schedule (admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const db = getDb();
  db.run(`DELETE FROM schedules WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Delete failed' });
    res.json({ success: true, message: 'Schedule deleted' });
    db.close();
  });
});

module.exports = router;