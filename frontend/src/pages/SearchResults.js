import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Filter, X, Clock, MapPin, DollarSign, Bus, ChevronDown, ChevronUp, Check, Star, Shield, Wifi, Plug, Coffee } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';

function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    busTypes: [],
    priceRange: [0, 5000],
    departureTime: '',
    sortBy: 'departure_time',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [busTypes, setBusTypes] = useState([]);

  const source = searchParams.get('source');
  const destination = searchParams.get('destination');
  const travelDate = searchParams.get('travelDate');
  const passengers = parseInt(searchParams.get('passengers')) || 1;
  const returnDate = searchParams.get('returnDate');

  const fetchBusTypes = useCallback(async () => {
    try {
      const response = await api.get('/buses/types');
      if (response.data.success) setBusTypes(response.data.types);
    } catch (err) { console.error(err); }
  }, []);

  const fetchSchedules = useCallback(async (page = 1) => {
    if (!source || !destination || !travelDate) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        source,
        destination,
        travel_date: travelDate,
        page,
        limit: pagination.limit,
        sort: filters.sortBy,
      });
      
      if (filters.busTypes.length > 0) params.append('bus_type', filters.busTypes.join(','));
      if (filters.priceRange[0] > 0) params.append('min_price', filters.priceRange[0]);
      if (filters.priceRange[1] < 5000) params.append('max_price', filters.priceRange[1]);
      if (filters.departureTime) params.append('departure_time', filters.departureTime);

      const response = await api.get(`/schedules/search?${params.toString()}`);
      
      if (response.data.success) {
        setSchedules(response.data.schedules);
        setPagination(prev => ({ ...prev, ...response.data.pagination }));
      } else {
        setError(response.data.message || 'Failed to fetch buses');
      }
    } catch (err) {
      setError('Failed to search buses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [source, destination, travelDate, filters, pagination.limit]);

  useEffect(() => {
    fetchBusTypes();
    if (source && destination && travelDate) {
      fetchSchedules(1);
    }
  }, [source, destination, travelDate, fetchBusTypes, fetchSchedules]);

  useEffect(() => {
    if (source && destination && travelDate) {
      fetchSchedules(pagination.page);
    }
  }, [filters, pagination.page, fetchSchedules]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ busTypes: [], priceRange: [0, 5000], departureTime: '', sortBy: 'departure_time' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = filters.busTypes.length > 0 || filters.priceRange[0] > 0 || filters.priceRange[1] < 5000 || filters.departureTime;

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const calculateDuration = (dep, arr) => {
    const [depH, depM] = dep.split(':').map(Number);
    const [arrH, arrM] = arr.split(':').map(Number);
    let depMinutes = depH * 60 + depM;
    let arrMinutes = arrH * 60 + arrM;
    if (arrMinutes <= depMinutes) arrMinutes += 24 * 60;
    const diff = arrMinutes - depMinutes;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m`;
  };

  const getAmenityIcon = (amenity) => {
    const icons = {
      wifi: Wifi, charging: Plug, blanket: Coffee, water: Coffee, 'reading light': Star, tv: Star, ac: Shield, snacks: Coffee, music: Star, curtains: Shield,
    };
    const key = amenity.toLowerCase().replace(' port', '').replace(' system', '').replace(' bottle', '');
    return icons[key] || Shield;
  };

  if (!source || !destination || !travelDate) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Search</h2>
          <p className="text-gray-600 mb-6">Please provide source, destination, and travel date.</p>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Summary */}
      <section className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <Bus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{source} → {destination}</h1>
                <p className="text-gray-600 text-sm">
                  {format(new Date(travelDate), 'EEEE, MMMM d, yyyy')} • {passengers} Passenger{passengers > 1 ? 's' : ''}
                  {returnDate && <span className="ml-2 px-2 py-0.5 text-xs bg-accent-100 text-accent-dark rounded-full">Return: {format(new Date(returnDate), 'MMM d')}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {pagination.total} bus{pagination.total !== 1 ? 'es' : ''} found
              </span>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-outline btn-sm flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters {hasActiveFilters && <span className="badge badge-primary">{filters.busTypes.length + (filters.priceRange[0] > 0 ? 1 : 0) + (filters.priceRange[1] < 5000 ? 1 : 0) + (filters.departureTime ? 1 : 0)}</span>}
              </button>
              <Link to="/" className="btn btn-ghost btn-sm">Modify Search</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Sidebar */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Panel */}
          <aside className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="card sticky top-24">
              <div className="card-header flex items-center justify-between">
                <h3 className="font-semibold">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-sm text-primary hover:text-primary-dark">Clear all</button>
                )}
              </div>
              <div className="card-body space-y-6">
                {/* Bus Type */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Bus Type</h4>
                  <div className="space-y-2">
                    {busTypes.map(type => (
                      <label key={type} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.busTypes.includes(type)}
                          onChange={(e) => handleFilterChange('busTypes', e.target.checked ? [...filters.busTypes, type] : filters.busTypes.filter(t => t !== type))}
                          className="form-checkbox"
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      value={filters.priceRange[0]}
                      onChange={(e) => handleFilterChange('priceRange', [parseInt(e.target.value), filters.priceRange[1]])}
                      className="flex-1"
                    />
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      value={filters.priceRange[1]}
                      onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>₹{filters.priceRange[0]}</span>
                    <span>₹{filters.priceRange[1]}</span>
                  </div>
                </div>

                {/* Departure Time */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Departure Time</h4>
                  <div className="space-y-2">
                    {[
                      { value: '00:00', label: 'Before 6 AM' },
                      { value: '06:00', label: '6 AM - 12 PM' },
                      { value: '12:00', label: '12 PM - 6 PM' },
                      { value: '18:00', label: 'After 6 PM' },
                    ].map(opt => (
                      <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="departureTime"
                          value={opt.value}
                          checked={filters.departureTime === opt.value}
                          onChange={(e) => handleFilterChange('departureTime', e.target.value)}
                          className="form-radio"
                        />
                        <span className="text-sm text-gray-700">{opt.label}</span>
                      </label>
                    ))}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="departureTime"
                        value=""
                        checked={!filters.departureTime}
                        onChange={(e) => handleFilterChange('departureTime', '')}
                        className="form-radio"
                      />
                      <span className="text-sm text-gray-700">Any Time</span>
                    </label>
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Sort By</h4>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="form-input form-select"
                  >
                    <option value="departure_time">Departure Time</option>
                    <option value="arrival_time">Arrival Time</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="duration">Duration</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <main className="lg:col-span-3">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="card p-6 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
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
            ) : schedules.length === 0 ? (
              <div className="card p-12 text-center">
                <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No buses found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or search for a different date.</p>
                <button onClick={clearFilters} className="btn btn-outline">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {schedules.map((schedule) => (
                    <BusCard
                      key={schedule.id}
                      schedule={schedule}
                      passengers={passengers}
                      formatTime={formatTime}
                      calculateDuration={calculateDuration}
                      getAmenityIcon={getAmenityIcon}
                      onSelect={() => navigate(`/seats/${schedule.id}?passengers=${passengers}`)}
                    />
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
                      Previous
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
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function BusCard({ schedule, passengers, formatTime, calculateDuration, getAmenityIcon, onSelect }) {
  const amenities = schedule.amenities || [];
  const duration = calculateDuration(schedule.departure_time, schedule.arrival_time);
  const totalPrice = schedule.price * passengers;

  return (
    <div className="card p-6 hover:shadow-xl transition-all">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Bus Info */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
            <Bus className="w-8 h-8 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h3 className="font-bold text-gray-900 truncate">{schedule.bus_name}</h3>
              <span className="badge badge-primary">{schedule.bus_type}</span>
              <span className="badge badge-gray">{schedule.bus_number}</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {schedule.operator_id ? `Operated by ${schedule.operator_id}` : 'Private Operator'}
            </div>
            <div className="flex flex-wrap gap-2">
              {amenities.slice(0, 4).map((amenity, i) => {
                const Icon = getAmenityIcon(amenity);
                return (
                  <span key={i} className="flex items-center gap-1 text-xs text-gray-600 px-2 py-1 bg-gray-50 rounded">
                    <Icon className="w-3 h-3" />
                    {amenity}
                  </span>
                );
              })}
              {amenities.length > 4 && (
                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded">+{amenities.length - 4} more</span>
              )}
            </div>
          </div>
        </div>

        {/* Timing */}
        <div className="flex flex-col items-center md:items-start gap-2 w-full md:w-auto">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{formatTime(schedule.departure_time)}</p>
              <p className="text-xs text-gray-500">Departure</p>
            </div>
            <div className="flex flex-col items-center text-gray-400 hidden sm:flex">
              <div className="w-16 h-px bg-gray-300 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-400" />
              </div>
              <p className="text-xs mt-1">{duration}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{formatTime(schedule.arrival_time)}</p>
              <p className="text-xs text-gray-500">Arrival</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">{schedule.source} → {schedule.destination}</p>
        </div>

        {/* Price & Action */}
        <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">₹{schedule.price.toLocaleString()}</p>
            <p className="text-xs text-gray-500">per seat</p>
            {passengers > 1 && (
              <p className="text-sm text-gray-600 mt-1">Total: <span className="font-semibold">₹{totalPrice.toLocaleString()}</span></p>
            )}
          </div>
          <button
            onClick={onSelect}
            className="btn btn-primary w-full md:w-auto"
            disabled={schedule.available_seats === 0}
          >
            {schedule.available_seats === 0 ? 'Sold Out' : `Select Seats (${schedule.available_seats} left)`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SearchResults;