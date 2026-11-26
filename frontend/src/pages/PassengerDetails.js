import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Calendar, CheckCircle, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function PassengerDetails() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    contactEmail: '',
    contactPhone: '',
    passengers: [],
  });
  const [showPassword, setShowPassword] = useState(false);

  // Get selected seats from location state
  const selectedSeats = location.state?.selectedSeats || [];
  const passengersCount = location.state?.passengers || selectedSeats.length;

  useEffect(() => {
    if (selectedSeats.length === 0) {
      navigate(`/seats/${scheduleId}`);
      return;
    }
    fetchSchedule();
    initializeForm();
  }, [scheduleId, selectedSeats, navigate]);

  const fetchSchedule = async () => {
    try {
      const response = await api.get(`/schedules/${scheduleId}/seats`);
      if (response.data.success) {
        setSchedule(response.data.schedule);
      }
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const initializeForm = () => {
    const passengers = selectedSeats.map((seat, index) => ({
      seatNumber: seat,
      name: index === 0 && user ? user.full_name : '',
      age: '',
      gender: 'male',
      email: index === 0 && user ? user.email : '',
      phone: index === 0 && user ? user.phone : '',
    }));

    setFormData({
      contactEmail: user?.email || '',
      contactPhone: user?.phone || '',
      passengers,
    });
  };

  const updatePassenger = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      passengers: prev.passengers.map((p, i) => i === index ? { ...p, [field]: value } : p),
    }));
  };

  const updateContact = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.contactEmail || !formData.contactPhone) {
      return 'Please provide contact email and phone number';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      return 'Please enter a valid email address';
    }
    if (!/^[\d\s\-\+\(\)]{10,}$/.test(formData.contactPhone)) {
      return 'Please enter a valid phone number';
    }
    for (let i = 0; i < formData.passengers.length; i++) {
      const p = formData.passengers[i];
      if (!p.name.trim()) return `Passenger ${i + 1}: Name is required`;
      if (!p.age || parseInt(p.age) < 1 || parseInt(p.age) > 120) return `Passenger ${i + 1}: Valid age is required`;
      if (!p.gender) return `Passenger ${i + 1}: Gender is required`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    try {
      const response = await api.post('/bookings', {
        schedule_id: scheduleId,
        seat_numbers: selectedSeats,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        passenger_details: formData.passengers,
      });

      if (response.data.success) {
        navigate(`/confirmation/${response.data.booking.id}`);
      } else {
        setError(response.data.message || 'Booking failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    }
  };

  const formatTime = (time) => {
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

  if (!schedule) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Not Found</h2>
          <Link to="/search" className="btn btn-primary">Search Buses</Link>
        </div>
      </div>
    );
  }

  const totalPrice = schedule.price * selectedSeats.length;
  const taxes = Math.round(totalPrice * 0.05);
  const discount = Math.round(totalPrice * 0.1);
  const finalPrice = totalPrice + taxes - discount;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Indicator */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to={`/seats/${scheduleId}?passengers=${passengersCount}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">1</div>
                <div className="w-24 h-1 bg-primary ml-2 mr-2"></div>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">2</div>
                <div className="w-24 h-1 bg-primary ml-2 mr-2"></div>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">3</div>
              </div>
            </div>
            <div className="w-8"></div>
          </div>
          <div className="flex justify-center gap-2 mt-3 text-xs text-gray-500">
            <span className="text-primary font-medium">Seats</span>
            <span className="text-primary font-medium">Details</span>
            <span className="text-primary font-medium">Payment</span>
          </div>
        </div>
      </div>

      <section className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Contact Information
                </h2>
              </div>
              <div className="card-body space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Email Address <span className="text-error">*</span></label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => updateContact('contactEmail', e.target.value)}
                      className="form-input"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Phone Number <span className="text-error">*</span></label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => updateContact('contactPhone', e.target.value)}
                      className="form-input"
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500">Booking confirmation will be sent to this email and phone.</p>
              </div>
            </div>

            {/* Passenger Details */}
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Passenger Details ({passengersCount})
                </h2>
              </div>
              <div className="card-body space-y-6">
                {formData.passengers.map((passenger, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${index === 0 ? 'bg-primary-50 border-primary' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">{index + 1}</span>
                        Passenger {index + 1} - Seat {passenger.seatNumber}
                      </h3>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newPassengers = [...formData.passengers];
                            newPassengers[index] = { ...newPassengers[index], name: '', age: '', gender: 'male', email: '', phone: '' };
                            setFormData(prev => ({ ...prev, passengers: newPassengers }));
                          }}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="form-label">Full Name <span className="text-error">*</span></label>
                        <input
                          type="text"
                          value={passenger.name}
                          onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                          className="form-input"
                          placeholder="Enter full name"
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label">Age <span className="text-error">*</span></label>
                        <input
                          type="number"
                          value={passenger.age}
                          onChange={(e) => updatePassenger(index, 'age', e.target.value)}
                          className="form-input"
                          placeholder="Age"
                          min="1"
                          max="120"
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label">Gender <span className="text-error">*</span></label>
                        <select
                          value={passenger.gender}
                          onChange={(e) => updatePassenger(index, 'gender', e.target.value)}
                          className="form-input form-select"
                          required
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          value={passenger.email}
                          onChange={(e) => updatePassenger(index, 'email', e.target.value)}
                          className="form-input"
                          placeholder="Passenger email (optional)"
                        />
                      </div>
                      <div>
                        <label className="form-label">Phone</label>
                        <input
                          type="tel"
                          value={passenger.phone}
                          onChange={(e) => updatePassenger(index, 'phone', e.target.value)}
                          className="form-input"
                          placeholder="Passenger phone (optional)"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insurance/Options */}
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Travel Options
                </h2>
              </div>
              <div className="card-body space-y-4">
                <label className="flex items-center gap-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-fast">
                  <input type="checkbox" className="form-checkbox" defaultChecked />
                  <div>
                    <p className="font-medium text-gray-900">Trip Insurance</p>
                    <p className="text-sm text-gray-600">Covers cancellation, delay, and baggage loss. ₹49 per passenger</p>
                  </div>
                  <span className="ml-auto text-primary font-medium">+₹{49 * passengersCount}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-fast">
                  <input type="checkbox" className="form-checkbox" />
                  <div>
                    <p className="font-medium text-gray-900">Priority Boarding</p>
                    <p className="text-sm text-gray-600">Board the bus 15 minutes early. ₹29 per passenger</p>
                  </div>
                  <span className="ml-auto text-primary font-medium">+₹{29 * passengersCount}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-fast">
                  <input type="checkbox" className="form-checkbox" defaultChecked />
                  <div>
                    <p className="font-medium text-gray-900">SMS Updates</p>
                    <p className="text-sm text-gray-600">Real-time bus tracking and departure reminders</p>
                  </div>
                  <span className="ml-auto text-success font-medium">Free</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="alert alert-error">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="btn btn-primary btn-lg w-full"
            >
              Continue to Payment
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <div className="card-header">
                <h2 className="font-semibold">Fare Summary</h2>
              </div>
              <div className="card-body space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{schedule.bus_name}</p>
                      <p className="text-sm text-gray-600">{schedule.bus_type} • {schedule.bus_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 4-5 4-5s4 3 4 5c0 1-.5 2.5-1 3.5a7.97 7.97 0 01-1.343 2.315" /></svg> {schedule.source} → {schedule.destination}</span>
                    <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {formatTime(schedule.departure_time)} - {formatTime(schedule.arrival_time)}</span>
                    <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> {new Date(schedule.travel_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {selectedSeats.map(seat => (
                      <span key={seat} className="px-2 py-1 bg-primary text-white text-sm rounded">{seat}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Fare × {passengersCount}</span>
                    <span className="font-medium">₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxes & Fees (5%)</span>
                    <span className="font-medium">₹{taxes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-success">
                    <span>Promotional Discount (10%)</span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Insurance (Optional)</span>
                    <span className="font-medium">₹{49 * passengersCount}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between text-lg font-bold">
                    <span>Total Payable</span>
                    <span className="text-primary">₹{finalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                  <p className="text-sm text-success-dark flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Free cancellation up to 2 hours before departure
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PassengerDetails;