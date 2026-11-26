import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bus, MapPin, Clock, Calendar, Users, Shield, CheckCircle, X, Info, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';

function SeatSelection() {
  const { scheduleId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const passengers = parseInt(searchParams.get('passengers')) || 1;

  const [schedule, setSchedule] = useState(null);
  const [seatLayout, setSeatLayout] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLegend, setShowLegend] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, [scheduleId]);

  const fetchSchedule = async () => {
    try {
      const response = await api.get(`/schedules/${scheduleId}/seats`);
      if (response.data.success) {
        setSchedule(response.data.schedule);
        setSeatLayout(response.data.schedule.seatLayout);
        setBookedSeats(response.data.schedule.bookedSeats || []);
      } else {
        setError(response.data.message || 'Failed to load seat layout');
      }
    } catch (err) {
      setError('Failed to load seat layout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seatNumber) => {
    if (bookedSeats.includes(seatNumber)) return;
    
    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(s => s !== seatNumber);
      } else if (prev.length >= passengers) {
        alert(`You can only select ${passengers} seat${passengers > 1 ? 's' : ''}`);
        return prev;
      } else {
        return [...prev, seatNumber];
      }
    });
  };

  const goToPassengerDetails = () => {
    if (selectedSeats.length !== passengers) {
      alert(`Please select exactly ${passengers} seat${passengers > 1 ? 's' : ''}`);
      return;
    }
    navigate(`/passengers/${scheduleId}`, {
      state: { selectedSeats: selectedSeats.sort((a, b) => parseInt(a) - parseInt(b)), passengers }
    });
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

  if (error || !schedule) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Seats</h2>
          <p className="text-gray-600 mb-6">{error || 'Schedule not found'}</p>
          <Link to="/search" className="btn btn-primary">Search Again</Link>
        </div>
      </div>
    );
  }

  const { seats, seatsPerRow, totalRows } = seatLayout;
  const totalPrice = schedule.price * selectedSeats.length;

  // Group seats by row
  const rows = {};
  seats.forEach(seat => {
    if (!rows[seat.row]) rows[seat.row] = [];
    rows[seat.row].push(seat);
  });

  const sortedRows = Object.keys(rows).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <Link to={`/search?${searchParams.toString()}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 inline-flex">
            <ArrowLeft className="w-5 h-5" />
            Back to Results
          </Link>
          
          <div className="card p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Bus className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{schedule.bus_name}</h1>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                    <span className="badge badge-primary">{schedule.bus_type}</span>
                    <span className="badge badge-gray">{schedule.bus_number}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {schedule.source} → {schedule.destination}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:items-end gap-2 text-right">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatTime(schedule.departure_time)} - {formatTime(schedule.arrival_time)}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(new Date(schedule.travel_date), 'MMM d, yyyy')}</span>
                </div>
                <div className="text-2xl font-bold text-primary">₹{schedule.price.toLocaleString()} <span className="text-sm font-normal text-gray-500">/ seat</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seat Selection */}
      <section className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Seat Map */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="font-semibold">Select Your Seats</h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span className="w-5 h-5 rounded border-2 border-gray-300 bg-gray-100"></span> Available
                  </span>
                  <span className="flex items-center gap-2 text-gray-600">
                    <span className="w-5 h-5 rounded bg-primary"></span> Selected
                  </span>
                  <span className="flex items-center gap-2 text-gray-600">
                    <span className="w-5 h-5 rounded bg-gray-300"></span> Booked
                  </span>
                </div>
              </div>
              <div className="card-body">
                {/* Bus Layout Visualization */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                      <Bus className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{schedule.bus_name}</p>
                      <p className="text-sm text-gray-600">{schedule.bus_type} • {schedule.total_seats} Seats</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs text-gray-600">
                    <span>Front</span>
                    <span>Door</span>
                    <span>Aisle</span>
                    <span>Rear</span>
                  </div>
                </div>

                {/* Seat Grid */}
                <div className="seat-map">
                  {sortedRows.map(rowNum => {
                    const rowSeats = rows[rowNum].sort((a, b) => a.position - b.position);
                    return (
                      <div key={rowNum} className="seat-row justify-center gap-1 mb-1">
                        {rowSeats.map(seat => {
                          const isBooked = bookedSeats.includes(seat.number);
                          const isSelected = selectedSeats.includes(seat.number);
                          const isLadies = seat.type === 'lower' && (parseInt(seat.number) % 2 === 1); // Example logic
                          
                          let seatClass = 'seat ';
                          if (isBooked) seatClass += 'booked';
                          else if (isSelected) seatClass += 'selected';
                          else if (isLadies) seatClass += 'ladies';
                          else seatClass += 'available';

                          return (
                            <button
                              key={seat.number}
                              onClick={() => !isBooked && handleSeatClick(seat.number)}
                              disabled={isBooked}
                              className={seatClass}
                              title={isBooked ? 'Booked' : isSelected ? 'Selected' : isLadies ? 'Ladies Seat' : `Seat ${seat.number}`}
                              aria-label={isBooked ? `Seat ${seat.number}, booked` : isSelected ? `Seat ${seat.number}, selected` : `Seat ${seat.number}, available`}
                            >
                              {seat.number}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                {showLegend && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="font-medium mb-3">Legend</h4>
                    <div className="seat-legend">
                      <span className="seat-legend-item"><span className="seat-legend-box border-gray-200 bg-gray-100"></span> Available</span>
                      <span className="seat-legend-item"><span className="seat-legend-box border-primary bg-primary"></span> Selected</span>
                      <span className="seat-legend-item"><span className="seat-legend-box border-gray-300 bg-gray-300"></span> Booked</span>
                      <span className="seat-legend-item"><span className="seat-legend-box border-pink-300 bg-pink-100"></span> Ladies Seat</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Panel */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <div className="card-header">
                <h2 className="font-semibold">Booking Summary</h2>
              </div>
              <div className="card-body space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fare × {passengers} seat{passengers > 1 ? 's' : ''}</span>
                    <span className="font-medium">₹{(schedule.price * passengers).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxes & Fees</span>
                    <span className="font-medium">₹{Math.round(schedule.price * passengers * 0.05).toLocaleString()}</span>
                  </div>
                  {selectedSeats.length > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Discount</span>
                      <span>-₹{Math.round(schedule.price * selectedSeats.length * 0.1).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">₹{totalPrice > 0 ? (totalPrice + Math.round(totalPrice * 0.05) - Math.round(totalPrice * 0.1)).toLocaleString() : '0'}</span>
                  </div>
                </div>

                {selectedSeats.length > 0 && (
                  <div className="bg-primary-50 rounded-lg p-3">
                    <h4 className="font-medium text-primary mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Selected Seats ({selectedSeats.length}/{passengers})
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedSeats.sort((a, b) => parseInt(a) - parseInt(b)).map(seat => (
                        <span key={seat} className="px-2 py-1 bg-primary text-white text-sm rounded">{seat}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSeats.length < passengers && (
                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
                    <p className="text-sm text-warning-dark flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Please select {passengers - selectedSeats.length} more seat{passengers - selectedSeats.length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                <button
                  onClick={goToPassengerDetails}
                  disabled={selectedSeats.length !== passengers}
                  className="btn btn-primary btn-lg w-full"
                >
                  {selectedSeats.length === passengers ? `Proceed to Payment (₹${(totalPrice + Math.round(totalPrice * 0.05) - Math.round(totalPrice * 0.1)).toLocaleString()})` : `Select ${passengers} Seat${passengers > 1 ? 's' : ''}`}
                </button>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>Secure payment • Free cancellation up to 2h before departure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SeatSelection;