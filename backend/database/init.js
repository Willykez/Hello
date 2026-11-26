const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'bus_booking.db');
const db = new sqlite3.Database(dbPath);

console.log('Initializing database...');

db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Buses table
  db.run(`CREATE TABLE IF NOT EXISTS buses (
    id TEXT PRIMARY KEY,
    bus_number TEXT UNIQUE NOT NULL,
    bus_name TEXT NOT NULL,
    bus_type TEXT NOT NULL,
    total_seats INTEGER NOT NULL,
    amenities TEXT,
    operator_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Routes table
  db.run(`CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    distance_km INTEGER,
    estimated_duration TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Schedules table
  db.run(`CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    bus_id TEXT NOT NULL,
    route_id TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    price REAL NOT NULL,
    available_seats INTEGER NOT NULL,
    travel_date TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id),
    FOREIGN KEY (route_id) REFERENCES routes(id)
  )`);

  // Bookings table
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    schedule_id TEXT NOT NULL,
    seat_numbers TEXT NOT NULL,
    total_amount REAL NOT NULL,
    booking_status TEXT DEFAULT 'confirmed',
    payment_status TEXT DEFAULT 'completed',
    booking_reference TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (schedule_id) REFERENCES schedules(id)
  )`);

  // Payments table
  db.run(`CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    transaction_id TEXT UNIQUE,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
  )`);

  // Reviews table
  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    bus_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (bus_id) REFERENCES buses(id)
  )`);

  console.log('Tables created successfully.');

  // Insert sample data
  insertSampleData();
});

function insertSampleData() {
  const hashPassword = bcrypt.hashSync('password123', 10);

  // Sample users
  const users = [
    { id: uuidv4(), email: 'john@example.com', password: hashPassword, full_name: 'John Doe', phone: '+1234567890' },
    { id: uuidv4(), email: 'jane@example.com', password: hashPassword, full_name: 'Jane Smith', phone: '+1234567891' },
  ];

  users.forEach(user => {
    db.run(`INSERT OR IGNORE INTO users (id, email, password, full_name, phone) VALUES (?, ?, ?, ?, ?)`,
      [user.id, user.email, user.password, user.full_name, user.phone]);
  });

  // Sample buses
  const buses = [
    { id: uuidv4(), bus_number: 'KA01AB1234', bus_name: 'Royal Express', bus_type: 'AC Sleeper', total_seats: 40, amenities: 'WiFi,Charging Port,Blanket,Water Bottle,Reading Light', operator_id: 'OP001' },
    { id: uuidv4(), bus_number: 'KA01CD5678', bus_name: 'City Connect', bus_type: 'AC Seater', total_seats: 45, amenities: 'WiFi,Charging Port,AC,Music System', operator_id: 'OP002' },
    { id: uuidv4(), bus_number: 'MH12EF9012', bus_name: 'Night Rider', bus_type: 'Non-AC Sleeper', total_seats: 36, amenities: 'Blanket,Water Bottle,Curtains', operator_id: 'OP003' },
    { id: uuidv4(), bus_number: 'DL01GH3456', bus_name: 'Deluxe Travels', bus_type: 'AC Semi-Sleeper', total_seats: 42, amenities: 'WiFi,Charging Port,Blanket,Water Bottle,Snacks', operator_id: 'OP004' },
    { id: uuidv4(), bus_number: 'TN09IJ7890', bus_name: 'Southern Star', bus_type: 'AC Sleeper', total_seats: 38, amenities: 'WiFi,Charging Port,Blanket,Water Bottle,Reading Light,TV', operator_id: 'OP005' },
  ];

  buses.forEach(bus => {
    db.run(`INSERT OR IGNORE INTO buses (id, bus_number, bus_name, bus_type, total_seats, amenities, operator_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [bus.id, bus.bus_number, bus.bus_name, bus.bus_type, bus.total_seats, bus.amenities, bus.operator_id]);
  });

  // Sample routes
  const routes = [
    { id: uuidv4(), source: 'Bangalore', destination: 'Chennai', distance_km: 350, estimated_duration: '6h 30m' },
    { id: uuidv4(), source: 'Bangalore', destination: 'Hyderabad', distance_km: 570, estimated_duration: '9h 45m' },
    { id: uuidv4(), source: 'Mumbai', destination: 'Pune', distance_km: 150, estimated_duration: '3h 00m' },
    { id: uuidv4(), source: 'Delhi', destination: 'Jaipur', distance_km: 280, estimated_duration: '5h 30m' },
    { id: uuidv4(), source: 'Chennai', destination: 'Coimbatore', distance_km: 500, estimated_duration: '8h 15m' },
    { id: uuidv4(), source: 'Hyderabad', destination: 'Vijayawada', distance_km: 275, estimated_duration: '5h 00m' },
    { id: uuidv4(), source: 'Kolkata', destination: 'Bhubaneswar', distance_km: 440, estimated_duration: '7h 30m' },
    { id: uuidv4(), source: 'Ahmedabad', destination: 'Surat', distance_km: 265, estimated_duration: '4h 45m' },
  ];

  routes.forEach(route => {
    db.run(`INSERT OR IGNORE INTO routes (id, source, destination, distance_km, estimated_duration) VALUES (?, ?, ?, ?, ?)`,
      [route.id, route.source, route.destination, route.distance_km, route.estimated_duration]);
  });

  // Wait for routes and buses to be inserted, then create schedules
  setTimeout(() => {
    createSampleSchedules();
  }, 500);
}

function createSampleSchedules() {
  const today = new Date();
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  db.all('SELECT id FROM buses', [], (err, buses) => {
    if (err) return console.error(err);
    db.all('SELECT id FROM routes', [], (err, routes) => {
      if (err) return console.error(err);

      const schedules = [];
      const times = [
        { dep: '06:00', arr: '12:30' },
        { dep: '08:30', arr: '15:00' },
        { dep: '11:00', arr: '17:30' },
        { dep: '14:00', arr: '20:30' },
        { dep: '18:00', arr: '00:30' },
        { dep: '20:30', arr: '03:00' },
        { dep: '22:00', arr: '04:30' },
      ];

      buses.forEach(bus => {
        routes.forEach(route => {
          dates.forEach(date => {
            times.forEach((time, idx) => {
              if (Math.random() > 0.3) { // 70% chance of schedule
                schedules.push({
                  id: uuidv4(),
                  bus_id: bus.id,
                  route_id: route.id,
                  departure_time: time.dep,
                  arrival_time: time.arr,
                  price: 500 + Math.floor(Math.random() * 1000),
                  available_seats: Math.floor(Math.random() * 20) + 10,
                  travel_date: date,
                  status: 'active'
                });
              }
            });
          });
        });
      });

      schedules.forEach(schedule => {
        db.run(`INSERT OR IGNORE INTO schedules (id, bus_id, route_id, departure_time, arrival_time, price, available_seats, travel_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [schedule.id, schedule.bus_id, schedule.route_id, schedule.departure_time, schedule.arrival_time, schedule.price, schedule.available_seats, schedule.travel_date, schedule.status]);
      });

      console.log(`Inserted ${schedules.length} sample schedules.`);
      console.log('Database initialization complete!');
      db.close();
    });
  });
}