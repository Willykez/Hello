# BusBooking - Full Stack Bus Booking Web Application

A complete, production-ready bus booking system with modern frontend and robust backend.

## 🚀 Features

### User Features
- **Search & Book**: Search buses by route, date, and filters
- **Seat Selection**: Interactive seat map with real-time availability
- **Passenger Details**: Multi-passenger booking with validation
- **Secure Payment**: Multiple payment methods (Card, UPI, Net Banking, Wallet)
- **Booking Management**: View, download, print, share, and cancel tickets
- **User Dashboard**: Stats, upcoming trips, booking history
- **Profile Management**: Update profile, change password, notification preferences
- **Reviews & Ratings**: Rate and review buses after travel
- **Responsive Design**: Works on mobile, tablet, and desktop

### Technical Features
- **Modern Stack**: React 18 + Node.js/Express + SQLite
- **Authentication**: JWT-based auth with secure password hashing
- **RESTful API**: Well-structured endpoints with validation
- **Database**: SQLite with proper relationships and indexes
- **Real-time Updates**: Seat availability, booking confirmations
- **Error Handling**: Comprehensive error handling and user feedback
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation

## 📁 Project Structure

```
bus-booking/
├── backend/
│   ├── database/
│   │   ├── init.js          # Database initialization & sample data
│   │   └── bus_booking.db   # SQLite database (created on init)
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js          # Authentication endpoints
│   │   ├── buses.js         # Bus management
│   │   ├── routes.js        # Route management
│   │   ├── schedules.js     # Schedule search & management
│   │   ├── bookings.js      # Booking CRUD & payment
│   │   ├── users.js         # User dashboard & profile
│   │   └── reviews.js       # Reviews & ratings
│   ├── server.js            # Express server entry point
│   ├── package.json
│   └── .env
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js    # Navigation with search
│   │   │   ├── Footer.js    # Site footer
│   │   │   └── Layout.js    # Page layout wrapper
│   │   ├── context/
│   │   │   └── AuthContext.js  # Authentication state
│   │   ├── pages/
│   │   │   ├── Home.js              # Landing page with search
│   │   │   ├── SearchResults.js     # Bus listing with filters
│   │   │   ├── SeatSelection.js     # Interactive seat map
│   │   │   ├── PassengerDetails.js  # Passenger form
│   │   │   ├── Payment.js           # Payment methods
│   │   │   ├── BookingConfirmation.js # Success page with ticket
│   │   │   ├── auth/
│   │   │   │   ├── Login.js
│   │   │   │   └── Register.js
│   │   │   └── user/
│   │   │       ├── Dashboard.js
│   │   │       ├── MyBookings.js
│   │   │       ├── BookingDetail.js
│   │   │       ├── Profile.js
│   │   │       └── Reviews.js
│   │   ├── services/
│   │   │   └── api.js       # Axios instance with interceptors
│   │   ├── styles/
│   │   │   └── index.css    # Complete design system
│   │   ├── App.js           # Routes & providers
│   │   └── index.js         # Entry point
│   └── package.json
└── README.md
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm run init-db    # Initialize database with sample data
npm run dev        # Start development server (port 3001)
```

### Frontend Setup
```bash
cd frontend
npm install
npm start          # Start React dev server (port 3000)
```

### Access the App
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- API Health: http://localhost:3001/api/health

## 🔐 Demo Accounts
After running `npm run init-db`:
- **john@example.com** / password123
- **jane@example.com** / password123

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Buses
- `GET /api/buses` - List buses (with filters)
- `GET /api/buses/types` - Get bus types
- `GET /api/buses/:id` - Get bus details
- `POST /api/buses` - Create bus (admin)
- `PUT /api/buses/:id` - Update bus (admin)
- `DELETE /api/buses/:id` - Delete bus (admin)

### Routes
- `GET /api/routes` - List routes
- `GET /api/routes/cities` - Get all cities
- `GET /api/routes/popular` - Popular routes
- `GET /api/routes/:id` - Get route details

### Schedules
- `GET /api/schedules/search` - Search schedules (main booking search)
- `GET /api/schedules/:id/seats` - Get seat layout
- `GET /api/schedules` - List schedules (admin)
- `POST /api/schedules` - Create schedule (admin)
- `PUT /api/schedules/:id` - Update schedule (admin)
- `DELETE /api/schedules/:id` - Delete schedule (admin)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List user bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/:id/ticket` - Get ticket data

### Users
- `GET /api/users/dashboard` - Dashboard stats
- `GET /api/users/reviews` - User reviews
- `POST /api/users/reviews` - Add review
- `PUT /api/users/reviews/:id` - Update review
- `DELETE /api/users/reviews/:id` - Delete review

### Reviews
- `GET /api/reviews/bus/:busId` - Get bus reviews
- `GET /api/reviews/bus/:busId/summary` - Rating summary

## 🎨 Design System

The frontend includes a complete design system with:
- **Colors**: Primary, secondary, accent, success, error, warning palettes
- **Typography**: Inter font family with consistent scale
- **Spacing**: 4px base unit system
- **Components**: Buttons, inputs, cards, modals, dropdowns, tables, badges, alerts
- **Utilities**: Flexbox, grid, spacing, typography, colors, shadows, borders
- **Dark Mode**: Automatic via `prefers-color-scheme`
- **Responsive**: Mobile-first breakpoints

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=3001
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
DB_PATH=./database/bus_booking.db
NODE_ENV=development
```

## 📦 Production Build

```bash
# Backend
cd backend
npm install --production

# Frontend
cd frontend
npm run build
# Serve build/ folder with nginx, Apache, or any static server
```

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📝 License

MIT License - feel free to use for learning or commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues or questions, please open a GitHub issue.