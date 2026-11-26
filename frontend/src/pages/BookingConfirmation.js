import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, Bus, Download, Share2, Ticket, User, Mail, Phone, Shield, Star, ArrowLeft, Printer, Copy, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { format } from 'date-fns';

function BookingConfirmation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [booking, setBooking] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchBooking();
    fetchTicket();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      if (response.data.success) {
        setBooking(response.data.booking);
      } else {
        setError(response.data.message || 'Booking not found');
      }
    } catch (err) {
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicket = async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}/ticket`);
      if (response.data.success) {
        setTicket(response.data.ticket);
      }
    } catch (err) {
      console.error('Failed to fetch ticket:', err);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Generate PDF-like content
      const ticketContent = generateTicketContent();
      const blob = new Blob([ticketContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BusBooking-Ticket-${booking?.booking_reference || bookingId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: 'BusBooking Ticket',
      text: `My bus ticket: ${booking?.booking_reference} - ${booking?.source} to ${booking?.destination}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const copyReference = () => {
    navigator.clipboard.writeText(booking?.booking_reference || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateTicketContent = () => {
    if (!booking || !ticket) return '';
    return `
BUSBOOKING - E-TICKET
=====================

Booking Reference: ${booking.booking_reference}
Booking Date: ${format(new Date(booking.created_at), 'MMMM d, yyyy HH:mm')}
Status: ${booking.booking_status.toUpperCase()}

PASSENGER DETAILS
-----------------
Name: ${ticket.passengerName}
Email: ${ticket.passengerEmail}
Phone: ${ticket.passengerPhone}

JOURNEY DETAILS
---------------
Bus: ${ticket.busName} (${ticket.busType})
Bus Number: ${ticket.busNumber}
Route: ${ticket.source} → ${ticket.destination}
Travel Date: ${format(new Date(ticket.travelDate), 'MMMM d, yyyy')}
Departure: ${ticket.departureTime}
Arrival: ${ticket.arrivalTime}
Duration: ${ticket.duration}
Seats: ${ticket.seats.join(', ')}

FARE DETAILS
------------
Total Amount: ₹${ticket.totalAmount.toLocaleString()}
Payment Status: ${ticket.payment_status?.toUpperCase() || 'COMPLETED'}

IMPORTANT INFORMATION
--------------------
• Please carry a valid government ID proof along with this ticket
• Arrive at boarding point 30 minutes before departure
• This is an e-ticket, no printout required (show on mobile)
• Free cancellation up to 2 hours before departure
• For support: +1 800 123 456 | support@busbooking.com

QR Code: ${ticket.qrCode}

Thank you for choosing BusBooking!
Safe travels! 🚌
    `.trim();
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to load booking details'}</p>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const statusColors = {
    confirmed: 'bg-success/10 text-success border-success/30',
    cancelled: 'bg-error/10 text-error border-error/30',
    completed: 'bg-primary/10 text-primary border-primary/30',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Header */}
      <section className="bg-gradient-to-r from-success to-success-dark text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Your ticket has been booked successfully. A confirmation has been sent to your email and phone.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 px-6 py-2 bg-white/20 rounded-full backdrop-blur-sm">
            <span className="font-medium">Booking Reference:</span>
            <span className="font-mono text-xl font-bold tracking-wider">{booking.booking_reference}</span>
            <button onClick={copyReference} className="ml-2 p-1 rounded hover:bg-white/30 transition-fast" aria-label="Copy reference">
              {copied ? <CheckCircle className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Ticket Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket */}
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-primary-dark p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                      <Bus className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{booking.bus_name}</h2>
                      <div className="flex items-center gap-3 mt-1 text-white/80 text-sm">
                        <span className="px-2 py-1 bg-white/20 rounded">{booking.bus_type}</span>
                        <span className="px-2 py-1 bg-white/20 rounded">{booking.bus_number}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right md:text-left">
                    <p className="text-white/70 text-sm">Booking Reference</p>
                    <p className="font-mono text-xl font-bold text-white tracking-wider">{booking.booking_reference}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Route */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span className="font-medium text-gray-900">{booking.source}</span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                      <span className="font-medium text-gray-900">{booking.destination}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(new Date(booking.travel_date), 'EEEE, MMMM d, yyyy')}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatTime(booking.departure_time)} - {formatTime(booking.arrival_time)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {booking.estimated_duration}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[booking.booking_status] || 'bg-gray-100 text-gray-700'}`}>
                      {booking.booking_status.charAt(0).toUpperCase() + booking.booking_status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Seats */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-primary" />
                    Seats: {booking.seat_numbers.join(', ')} ({booking.seat_numbers.length} seat{booking.seat_numbers.length > 1 ? 's' : ''})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {booking.seat_numbers.map(seat => (
                      <span key={seat} className="px-4 py-2 bg-primary-100 text-primary rounded-lg font-medium border border-primary-200">
                        Seat {seat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Passengers */}
                {booking.passenger_details && booking.passenger_details.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Passengers
                    </h3>
                    <div className="space-y-2">
                      {booking.passenger_details.map((passenger, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-primary text-white text-sm flex items-center justify-center">{index + 1}</span>
                            <div>
                              <p className="font-medium text-gray-900">{passenger.name}</p>
                              <p className="text-sm text-gray-500">Age: {passenger.age} • {passenger.gender.charAt(0).toUpperCase() + passenger.gender.slice(1)}</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-primary-100 text-primary text-sm font-medium rounded">Seat {passenger.seatNumber}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fare Breakdown */}
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Fare Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base Fare × {booking.seat_numbers.length}</span>
                      <span className="font-medium">₹{(booking.price * booking.seat_numbers.length).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxes & Fees</span>
                      <span className="font-medium">₹{Math.round(booking.price * booking.seat_numbers.length * 0.05).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-success">
                      <span>Discount</span>
                      <span>-₹{Math.round(booking.price * booking.seat_numbers.length * 0.1).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-2 flex justify-between text-lg font-bold">
                      <span>Total Paid</span>
                      <span className="text-primary">₹{booking.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Ticket Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleDownload} disabled={downloading} className="btn btn-outline flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  {downloading ? 'Downloading...' : 'Download Ticket'}
                </button>
                <button onClick={handlePrint} className="btn btn-outline flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  Print Ticket
                </button>
                <button onClick={handleShare} className="btn btn-outline flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <Link to={`/bookings/${booking.id}`} className="btn btn-primary flex items-center gap-2">
                  <Ticket className="w-4 h-4" />
                  View in My Bookings
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Info */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold">Contact Information</h3>
              </div>
              <div className="card-body space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{booking.contact_email || ticket?.passengerEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{booking.contact_phone || ticket?.passengerPhone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Info */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Important Information
                </h3>
              </div>
              <div className="card-body space-y-3">
                <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-success-dark">
                    <p className="font-medium">E-Ticket Valid</p>
                    <p>Show this ticket on your mobile device. No printout required.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                  <Clock className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-warning-dark">
                    <p className="font-medium">Arrive Early</p>
                    <p>Be at the boarding point 30 minutes before departure.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg">
                  <User className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-primary-dark">
                    <p className="font-medium">ID Proof Required</p>
                    <p>Carry a valid government ID (Aadhaar, PAN, Driving License).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-error/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-error-dark">
                    <p className="font-medium">Cancellation Policy</p>
                    <p>Free cancellation up to 2 hours before departure. Full refund.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold">Need Help?</h3>
              </div>
              <div className="card-body space-y-3">
                <a href="tel:+1800123456" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-fast">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-gray-500">24/7 Helpline</p>
                    <p className="font-medium text-gray-900">+1 800 123 456</p>
                  </div>
                </a>
                <a href="mailto:support@busbooking.com" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-fast">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-gray-500">Email Support</p>
                    <p className="font-medium text-gray-900">support@busbooking.com</p>
                  </div>
                </a>
                <Link to="/bookings" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-fast">
                  <Ticket className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-gray-500">View All Bookings</p>
                    <p className="font-medium text-gray-900">My Trips</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Rate Your Trip */}
            {booking.booking_status === 'completed' && (
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Star className="w-5 h-5 text-accent" />
                    Rate Your Trip
                  </h3>
                </div>
                <div className="card-body">
                  <p className="text-sm text-gray-600 mb-4">How was your journey with {booking.bus_name}?</p>
                  <div className="flex justify-center gap-1 mb-4">
                    {[5, 4, 3, 2, 1].map(star => (
                      <button key={star} className="text-3xl text-gray-300 hover:text-accent transition-fast">★</button>
                    ))}
                  </div>
                  <Link to="/reviews" className="btn btn-outline w-full">Write a Review</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">What's Next?</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Calendar, title: 'Track Your Bus', desc: 'Real-time tracking available on the day of travel', link: '/bookings' },
              { icon: Shield, title: 'Trip Insurance', desc: 'Add insurance for cancellation protection', link: '#' },
              { icon: Star, title: 'Earn Rewards', desc: 'Collect points on every booking for discounts', link: '#' },
            ].map((item, i) => (
              <Link key={i} to={item.link} className="card p-6 text-center hover:shadow-xl transition-all group">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default BookingConfirmation;