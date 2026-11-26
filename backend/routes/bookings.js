const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

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

// Generate booking reference
function generateBookingRef() {
  return 'BB' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
}

// Create booking
router.post('/', authenticateToken, [
  body('schedule_id').notEmpty(),
  body('seat_numbers').isArray({ min: 1 }),
  body('contact_email').isEmail(),
  body('contact_phone').notEmpty(),
  body('passenger_details').isArray({ min: 1 }),
], validate, (req, res) => {
  const { schedule_id, seat_numbers, contact_email, contact_phone, passenger_details } = req.body;
  const userId = req.user.id;
  const db = getDb();

  // Verify schedule exists and has enough seats
  db.get(`SELECT * FROM schedules WHERE id = ? AND status = 'active'`, [schedule_id], (err, schedule) => {
    if (err || !schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    if (schedule.available_seats < seat_numbers.length) {
      return res.status(400).json({ success: false, message: 'Not enough seats available' });
    }

    // Check if seats are already booked
    db.all(`SELECT seat_numbers FROM bookings WHERE schedule_id = ? AND booking_status != 'cancelled'`, [schedule_id], (err, bookings) => {
      const bookedSeats = new Set();
      bookings.forEach(b => b.seat_numbers.split(',').forEach(s => bookedSeats.add(s.trim())));

      const requestedSeats = seat_numbers.map(s => s.toString().trim());
      const alreadyBooked = requestedSeats.filter(s => bookedSeats.has(s));

      if (alreadyBooked.length > 0) {
        return res.status(400).json({ success: false, message: `Seats already booked: ${alreadyBooked.join(', ')}` });
      }

      const totalAmount = schedule.price * seat_numbers.length;
      const bookingId = uuidv4();
      const bookingRef = generateBookingRef();
      const seatNumbersStr = requestedSeats.join(',');

      // Start transaction
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Create booking
        db.run(
          `INSERT INTO bookings (id, user_id, schedule_id, seat_numbers, total_amount, booking_reference, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [bookingId, userId, schedule_id, seatNumbersStr, totalAmount, bookingRef, contact_email, contact_phone],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ success: false, message: 'Booking creation failed' });
            }

            // Create payment record
            const paymentId = uuidv4();
            const transactionId = 'TXN' + Date.now().toString(36).toUpperCase();
            db.run(
              `INSERT INTO payments (id, booking_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?, ?)`,
              [paymentId, bookingId, totalAmount, 'online', transactionId, 'completed'],
              function(err) {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ success: false, message: 'Payment record failed' });
                }

                // Update available seats
                const newAvailableSeats = schedule.available_seats - seat_numbers.length;
                db.run(
                  `UPDATE schedules SET available_seats = ? WHERE id = ?`,
                  [newAvailableSeats, schedule_id],
                  function(err) {
                    if (err) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ success: false, message: 'Seat update failed' });
                    }

                    db.run('COMMIT', (err) => {
                      if (err) {
                        return res.status(500).json({ success: false, message: 'Transaction commit failed' });
                      }

                      // Return booking details with schedule info
                      db.get(`
                        SELECT b.*, s.departure_time, s.arrival_time, s.travel_date, s.price,
                               bs.bus_name, bs.bus_type, bs.bus_number,
                               r.source, r.destination
                        FROM bookings b
                        JOIN schedules s ON b.schedule_id = s.id
                        JOIN buses bs ON s.bus_id = bs.id
                        JOIN routes r ON s.route_id = r.id
                        WHERE b.id = ?
                      `, [bookingId], (err, booking) => {
                        res.status(201).json({
                          success: true,
                          message: 'Booking confirmed',
                          booking: {
                            ...booking,
                            seat_numbers: booking.seat_numbers.split(','),
                            passenger_details
                          }
                        });
                        db.close();
                      });
                    });
                  }
                );
              }
            );
          }
        );
      });
    });
  });
});

// Get user's bookings
router.get('/', authenticateToken, (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const db = getDb();

  let query = `
    SELECT b.*, s.departure_time, s.arrival_time, s.travel_date, s.price,
           bs.bus_name, bs.bus_type, bs.bus_number, bs.amenities,
           r.source, r.destination, r.estimated_duration
    FROM bookings b
    JOIN schedules s ON b.schedule_id = s.id
    JOIN buses bs ON s.bus_id = bs.id
    JOIN routes r ON s.route_id = r.id
    WHERE b.user_id = ?
  `;
  const params = [req.user.id];

  if (status) {
    query += ' AND b.booking_status = ?';
    params.push(status);
  }

  query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(query, params, (err, bookings) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }

    let countQuery = 'SELECT COUNT(*) as total FROM bookings WHERE user_id = ?';
    const countParams = [req.user.id];
    if (status) { countQuery += ' AND booking_status = ?'; countParams.push(status); }

    db.get(countQuery, countParams, (err, countResult) => {
      res.json({
        success: true,
        bookings: bookings.map(b => ({
          ...b,
          seat_numbers: b.seat_numbers.split(','),
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

// Get single booking
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  db.get(`
    SELECT b.*, s.departure_time, s.arrival_time, s.travel_date, s.price,
           bs.bus_name, bs.bus_type, bs.bus_number, bs.amenities,
           r.source, r.destination, r.estimated_duration
    FROM bookings b
    JOIN schedules s ON b.schedule_id = s.id
    JOIN buses bs ON s.bus_id = bs.id
    JOIN routes r ON s.route_id = r.id
    WHERE b.id = ? AND b.user_id = ?
  `, [req.params.id, req.user.id], (err, booking) => {
    if (err || !booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({
      success: true,
      booking: {
        ...booking,
        seat_numbers: booking.seat_numbers.split(','),
        amenities: booking.amenities ? booking.amenities.split(',') : []
      }
    });
    db.close();
  });
});

// Cancel booking
router.put('/:id/cancel', authenticateToken, (req, res) => {
  const db = getDb();

  db.get(`SELECT * FROM bookings WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], (err, booking) => {
    if (err || !booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.booking_status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking already cancelled' });
    }

    // Check if travel date has passed
    const travelDate = new Date(booking.travel_date);
    const now = new Date();
    if (travelDate < now) {
      return res.status(400).json({ success: false, message: 'Cannot cancel past bookings' });
    }

    const seatCount = booking.seat_numbers.split(',').length;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      db.run(`UPDATE bookings SET booking_status = 'cancelled' WHERE id = ?`, [req.params.id], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ success: false, message: 'Cancellation failed' });
        }

        // Update available seats
        db.run(`UPDATE schedules SET available_seats = available_seats + ? WHERE id = ?`, [seatCount, booking.schedule_id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ success: false, message: 'Seat update failed' });
          }

          // Update payment status
          db.run(`UPDATE payments SET status = 'refunded' WHERE booking_id = ?`, [req.params.id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ success: false, message: 'Payment update failed' });
            }

            db.run('COMMIT', (err) => {
              if (err) return res.status(500).json({ success: false, message: 'Transaction failed' });
              res.json({ success: true, message: 'Booking cancelled successfully', refundAmount: booking.total_amount });
              db.close();
            });
          });
        });
      });
    });
  });
});

// Download ticket (generate ticket data)
router.get('/:id/ticket', authenticateToken, (req, res) => {
  const db = getDb();
  db.get(`
    SELECT b.*, s.departure_time, s.arrival_time, s.travel_date, s.price,
           bs.bus_name, bs.bus_type, bs.bus_number,
           r.source, r.destination, r.estimated_duration,
           u.full_name, u.email, u.phone
    FROM bookings b
    JOIN schedules s ON b.schedule_id = s.id
    JOIN buses bs ON s.bus_id = bs.id
    JOIN routes r ON s.route_id = r.id
    JOIN users u ON b.user_id = u.id
    WHERE b.id = ? AND b.user_id = ?
  `, [req.params.id, req.user.id], (err, booking) => {
    if (err || !booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const ticket = {
      bookingReference: booking.booking_reference,
      passengerName: booking.full_name,
      passengerEmail: booking.email,
      passengerPhone: booking.phone,
      busName: booking.bus_name,
      busType: booking.bus_type,
      busNumber: booking.bus_number,
      source: booking.source,
      destination: booking.destination,
      travelDate: booking.travel_date,
      departureTime: booking.departure_time,
      arrivalTime: booking.arrival_time,
      duration: booking.estimated_duration,
      seats: booking.seat_numbers.split(','),
      totalAmount: booking.total_amount,
      bookingDate: booking.created_at,
      status: booking.booking_status,
      qrCode: `data:text/plain,${booking.booking_reference}|${booking.id}|${booking.user_id}`
    };

    res.json({ success: true, ticket });
    db.close();
  });
});

module.exports = router;