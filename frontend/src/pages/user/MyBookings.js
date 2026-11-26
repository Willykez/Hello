import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Bus, Ticket, Calendar, Clock, MapPin, Filter, X, ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react';
import api from '../../services/api';

function MyBookings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  const statusOptions = [
    { value: '', label: 'All Bookings' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const fetchBookings = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit: pagination.limit });
      if (statusFilter) params.append('status', statusFilter);
      const response = await api.get(`/bookings?${params.toString()}`);
      if (response.data.success) {
        setBookings(response.data.bookings);
        setPagination(prev => ({ ...prev, ...response.data.pagination }));
      } else {
        setError(response.data.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(1);
  }, [statusFilter]);

  useEffect(() => {
    if (pagination.page > 1) fetchBookings(pagination.page);
  }, [pagination.page]);

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
    const params = new URLSearchParams(searchParams);
    if (status) params.set('status', status);
    else params.delete('status');
    setSearchParams(params);
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const statusStyles = {
    confirmed: 'bg-success/10 text-success border-success/30',
    completed: 'bg-primary/10 text-primary border-primary/30',
    cancelled: 'bg-error/10 text-error border-error/30',
  };

  const statusLabels = {
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-gray-600">View and manage all your bus bookings</p>
            </div>
            <Link to="/search" className="btn btn-primary">
              <Bus className="w-4 h-4" />
              Book New Ticket
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-6">
        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex flex-wrap gap-3">
              {statusOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-fast ${
                    statusFilter === option.value
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gray-200"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                    <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                    <div className="flex gap-4">
                      <div className="h-3 w-24 bg-gray-200 rounded"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="w-24 h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="card p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {statusFilter ? `No ${statusLabels[statusFilter]?.toLowerCase()} bookings` : 'No bookings yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {statusFilter
                ? 'Try changing the filter or book a new trip'
                : 'Start your journey by booking your first bus ticket'}
            </p>
            <Link to="/search" className="btn btn-primary">
              <Bus className="w-4 h-4" />
              Book Now
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {bookings.map(booking => (
                <div key={booking.id} className="card hover:shadow-lg transition-shadow">
                  <Link to={`/bookings/${booking.id}`} className="block p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      {/* Bus Info */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <Bus className="w-8 h-8 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <h3 className="font-bold text-gray-900 truncate">{booking.bus_name}</h3>
                            <span className="badge badge-primary">{booking.bus_type}</span>
                            <span className="badge badge-gray">{booking.bus_number}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {booking.operator_id ? `Operated by ${booking.operator_id}` : 'Private Operator'}
                          </p>
                          <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {booking.source} → {booking.destination}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(new Date(booking.travel_date), 'EEEE, MMMM d, yyyy')}</span>
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatTime(booking.departure_time)} - {formatTime(booking.arrival_time)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Seats & Status */}
                      <div className="flex flex-col md:items-end gap-3 md:w-auto">
                        <div className="flex flex-wrap gap-1 justify-end md:justify-end">
                          {booking.seat_numbers.slice(0, 4).map(seat => (
                            <span key={seat} className="px-2 py-1 bg-primary-100 text-primary text-sm rounded border border-primary-200">Seat {seat}</span>
                          ))}
                          {booking.seat_numbers.length > 4 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">+{booking.seat_numbers.length - 4} more</span>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[booking.booking_status] || 'bg-gray-100 text-gray-700'}`}>
                          {statusLabels[booking.booking_status] || booking.booking_status}
                        </span>
                        <p className="text-sm text-gray-500">{booking.seat_numbers.length} seat{booking.seat_numbers.length > 1 ? 's' : ''}</p>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex flex-col md:items-end gap-2 md:w-auto">
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">₹{booking.total_amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Total Paid</p>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/bookings/${booking.id}`} className="btn btn-outline btn-sm">
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                          {booking.booking_status === 'confirmed' && (
                            <button className="btn btn-outline btn-sm text-error border-error hover:bg-error/10">
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="btn btn-outline btn-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) pageNum = i + 1;
                  else if (pagination.page <= 3) pageNum = i + 1;
                  else if (pagination.page >= pagination.pages - 2) pageNum = pagination.pages - 4 + i;
                  else pageNum = pagination.page - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      className={`w-10 h-10 rounded-lg font-medium transition-fast ${
                        pagination.page === pageNum
                          ? 'bg-primary text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="btn btn-outline btn-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default MyBookings;