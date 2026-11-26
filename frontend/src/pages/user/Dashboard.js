import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Bus, Ticket, Calendar, Clock, MapPin, ArrowRight, Star, User, Settings, Heart, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingTrips: 0,
    pastTrips: 0,
    cancelledTrips: 0,
  });
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/users/dashboard');
      if (response.data.success) {
        setStats(response.data.stats);
        setUpcomingBookings(response.data.upcomingBookings);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const statCards = [
    { icon: Ticket, label: 'Total Bookings', value: stats.totalBookings, color: 'bg-primary-100 text-primary', link: '/bookings' },
    { icon: Calendar, label: 'Upcoming Trips', value: stats.upcomingTrips, color: 'bg-success-100 text-success', link: '/bookings?status=confirmed' },
    { icon: Clock, label: 'Past Trips', value: stats.pastTrips, color: 'bg-gray-100 text-gray-700', link: '/bookings?status=completed' },
    { icon: Heart, label: 'Cancelled', value: stats.cancelledTrips, color: 'bg-error-100 text-error', link: '/bookings?status=cancelled' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.full_name?.split(' ')[0] || 'Traveler'}!</h1>
              <p className="text-gray-600 mt-1">Manage your bookings and plan your next journey</p>
            </div>
            <Link to="/search" className="btn btn-primary flex items-center gap-2">
              <Bus className="w-5 h-5" />
              Book New Ticket
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, i) => (
            <Link key={i} to={stat.link} className="card p-6 hover:shadow-xl transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 rounded-xl ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-7 h-7" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link to="/search" className="card p-6 hover:shadow-xl transition-all group text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Book New Ticket</h3>
            <p className="text-gray-600 text-sm">Search 500+ routes across India</p>
          </Link>
          <Link to="/bookings" className="card p-6 hover:shadow-xl transition-all group text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-success-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Ticket className="w-8 h-8 text-success" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">My Bookings</h3>
            <p className="text-gray-600 text-sm">View and manage all your trips</p>
          </Link>
          <Link to="/reviews" className="card p-6 hover:shadow-xl transition-all group text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-accent-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Write Reviews</h3>
            <p className="text-gray-600 text-sm">Share your travel experience</p>
          </Link>
        </div>

        {/* Upcoming Trips */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Upcoming Trips
            </h2>
            <Link to="/bookings?status=confirmed" className="text-sm text-primary hover:text-primary-dark flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming trips</h3>
                <p className="text-gray-600 mb-6">Your next adventure is waiting!</p>
                <Link to="/search" className="btn btn-primary">Book a Trip</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.slice(0, 3).map((booking) => (
                  <Link key={booking.id} to={`/bookings/${booking.id}`} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-fast group">
                    <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Bus className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{booking.bus_name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {booking.source} → {booking.destination}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(new Date(booking.travel_date), 'MMM d, yyyy')}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatTime(booking.departure_time)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="badge badge-success">Confirmed</span>
                      <p className="text-sm text-gray-500 mt-1">{booking.seat_numbers.length} seat{booking.seat_numbers.length > 1 ? 's' : ''}</p>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors mx-auto mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;