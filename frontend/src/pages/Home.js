import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, MapPin, Calendar, Users, Shield, CheckCircle, Star, ArrowRight, Search, Clock, Heart, Truck } from 'lucide-react';
import api from '../../services/api';

function Home() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    travelDate: '',
    passengers: 1,
  });
  const [roundTrip, setRoundTrip] = useState(false);
  const [returnDate, setReturnDate] = useState('');
  const [suggestions, setSuggestions] = useState({ source: [], destination: [] });
  const [activeField, setActiveField] = useState(null);
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

  const cities = [
    'Bangalore', 'Chennai', 'Hyderabad', 'Mumbai', 'Pune', 'Delhi', 'Jaipur',
    'Kolkata', 'Bhubaneswar', 'Ahmedabad', 'Surat', 'Coimbatore', 'Vijayawada',
    'Kochi', 'Thiruvananthapuram', 'Mysore', 'Mangalore', 'Goa', 'Nagpur', 'Indore',
    'Lucknow', 'Kanpur', 'Patna', 'Ranchi', 'Bhopal', 'Visakhapatnam', 'Madurai'
  ];

  useEffect(() => {
    fetchPopularRoutes();
  }, []);

  const fetchPopularRoutes = async () => {
    try {
      const response = await api.get('/routes/popular');
      if (response.data.success) {
        setPopularRoutes(response.data.routes.slice(0, 6));
      }
    } catch (error) {
      console.error('Failed to fetch popular routes:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const filtered = cities.filter(c => c.toLowerCase().includes(value.toLowerCase())).slice(0, 6);
    setSuggestions(prev => ({ ...prev, [field]: filtered }));
    setActiveField(field);
  };

  const selectCity = (field, city) => {
    setFormData(prev => ({ ...prev, [field]: city }));
    setSuggestions(prev => ({ ...prev, [field]: [] }));
    setActiveField(null);
  };

  const swapCities = () => {
    setFormData(prev => ({ ...prev, source: prev.destination, destination: prev.source }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.source || !formData.destination || !formData.travelDate) return;
    
    const params = new URLSearchParams({
      source: formData.source,
      destination: formData.destination,
      travelDate: formData.travelDate,
      passengers: formData.passengers,
    });
    if (roundTrip && returnDate) params.append('returnDate', returnDate);
    
    navigate(`/search?${params.toString()}`);
  };

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const features = [
    { icon: Shield, title: 'Secure Payments', desc: 'PCI DSS compliant payment gateway with multiple options' },
    { icon: CheckCircle, title: 'Instant Confirmation', desc: 'Real-time booking confirmation via SMS & Email' },
    { icon: Clock, title: '24/7 Support', desc: 'Round-the-clock customer assistance for your journey' },
    { icon: Star, title: 'Best Price Guarantee', desc: 'Transparent pricing with no hidden charges' },
    { icon: Heart, title: 'Ladies Seats', desc: 'Dedicated ladies-only seating for safety & comfort' },
    { icon: Truck, title: 'Wide Network', desc: '500+ routes connecting major cities across India' },
  ];

  const busTypes = [
    { type: 'AC Sleeper', icon: '🛏️', desc: 'Comfortable berths with curtains', amenities: ['Blanket', 'Water Bottle', 'Charging Point', 'Reading Light'] },
    { type: 'AC Seater', icon: '💺', desc: 'Reclining seats with AC', amenities: ['WiFi', 'Charging Port', 'AC', 'Music System'] },
    { type: 'Non-AC Sleeper', icon: '🛌', desc: 'Budget-friendly sleeper option', amenities: ['Blanket', 'Water Bottle', 'Curtains'] },
    { type: 'AC Semi-Sleeper', icon: '🪑', desc: 'Semi-reclining seats with AC', amenities: ['WiFi', 'Charging Port', 'Snacks', 'Water Bottle'] },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-primary-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                <Star className="w-4 h-4 inline mr-1" /> 4.8/5 Rating • 1M+ Downloads
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Book Bus Tickets <br />
              <span className="text-accent">Online in Seconds</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl">
              India's most trusted bus booking platform. 500+ routes, secure payments, 
              instant confirmation & 24/7 support. Your journey starts here.
            </p>

            {/* Search Form */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-white/20 shadow-xl">
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-0 md:grid md:grid-cols-5 md:items-end gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-white/80 mb-2">From</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                    <input
                      type="text"
                      value={formData.source}
                      onChange={(e) => handleInputChange('source', e.target.value)}
                      onFocus={() => setActiveField('source')}
                      placeholder="Enter city"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-accent focus:bg-white/20 transition-fast"
                      autoComplete="off"
                    />
                  </div>
                  {activeField === 'source' && suggestions.source.length > 0 && (
                    <ul className="absolute top-full left-0 right-0 bg-white rounded-lg shadow-xl mt-1 z-10 max-h-40 overflow-y-auto">
                      {suggestions.source.map(city => (
                        <li key={city} onClick={() => selectCity('source', city)} className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-gray-900">{city}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  type="button"
                  onClick={swapCities}
                  className="md:hidden flex justify-center mx-auto p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-fast"
                  aria-label="Swap source and destination"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                </button>

                <div className="relative">
                  <label className="block text-sm font-medium text-white/80 mb-2">To</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                    <input
                      type="text"
                      value={formData.destination}
                      onChange={(e) => handleInputChange('destination', e.target.value)}
                      onFocus={() => setActiveField('destination')}
                      placeholder="Enter city"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-accent focus:bg-white/20 transition-fast"
                      autoComplete="off"
                    />
                  </div>
                  {activeField === 'destination' && suggestions.destination.length > 0 && (
                    <ul className="absolute top-full left-0 right-0 bg-white rounded-lg shadow-xl mt-1 z-10 max-h-40 overflow-y-auto">
                      {suggestions.destination.map(city => (
                        <li key={city} onClick={() => selectCity('destination', city)} className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-gray-900">{city}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="hidden md:block">
                  <button
                    type="button"
                    onClick={swapCities}
                    className="w-full justify-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-fast"
                    aria-label="Swap source and destination"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.travelDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, travelDate: e.target.value }))}
                    min={today}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-accent focus:bg-white/20 transition-fast"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Passengers</label>
                  <select
                    value={formData.passengers}
                    onChange={(e) => setFormData(prev => ({ ...prev, passengers: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-accent focus:bg-white/20 transition-fast appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%23ffffff%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                  >
                    {[...Array(6)].map((_, i) => i + 1).map(n => <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!formData.source || !formData.destination || !formData.travelDate}
                  className="md:col-span-1 lg:col-span-2 btn btn-accent btn-lg w-full justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Search Buses
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              {/* Round Trip Toggle */}
              <div className="mt-4 pt-4 border-t border-white/20 flex flex-col md:flex-row items-center justify-between gap-4">
                <label className="flex items-center gap-3 text-white/90 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roundTrip}
                    onChange={(e) => setRoundTrip(e.target.checked)}
                    className="w-5 h-5 rounded border-white/30 text-accent focus:ring-accent"
                  />
                  <span className="font-medium">Round Trip</span>
                </label>
                {roundTrip && (
                  <div className="w-full md:w-64">
                    <label className="block text-sm font-medium text-white/80 mb-1">Return Date</label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={formData.travelDate || today}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-accent focus:bg-white/20 transition-fast"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Bus */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 md:left-auto md:right-10 md:bottom-20 md:translate-x-0 opacity-20">
          <Bus className="w-64 h-64 text-accent" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Bus, value: '500+', label: 'Routes' },
              { icon: Users, value: '1M+', label: 'Happy Customers' },
              { icon: Star, value: '4.8', label: 'App Rating' },
              { icon: Shield, value: '100%', label: 'Secure' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary-50 flex items-center justify-center">
                  <stat.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      {popularRoutes.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Popular Routes</h2>
                <p className="text-gray-600 mt-1">Most booked routes by our customers</p>
              </div>
              <Link to="/search" className="btn btn-outline">View All Routes</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularRoutes.map((route) => (
                <Link key={route.id} to={`/search?source=${route.source}&destination=${route.destination}&travelDate=${today}`} className="card p-6 hover:shadow-xl transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Bus className="w-6 h-6 text-primary" />
                    </div>
                    <span className="badge badge-primary">{route.schedule_count || 10}+ buses daily</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{route.source}</p>
                      <p className="text-sm text-gray-500">Departure</p>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="font-semibold text-gray-900">{route.destination}</p>
                      <p className="text-sm text-gray-500">Arrival</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <span>{route.distance_km} km</span>
                    <span>{route.estimated_duration}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bus Types */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Choose Your Comfort</h2>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">Select from a variety of bus types to match your budget and comfort preferences</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {busTypes.map((bus, i) => (
              <div key={i} className="card p-6 text-center hover:shadow-xl transition-all group">
                <div className="text-5xl mb-4">{bus.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{bus.type}</h3>
                <p className="text-gray-600 text-sm mb-4">{bus.desc}</p>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {bus.amenities.map((amenity, j) => (
                    <span key={j} className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">{amenity}</span>
                  ))}
                </div>
                <Link to="/search" className="text-primary font-medium hover:text-primary-dark transition-fast flex items-center justify-center gap-1 group">
                  Book Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose BusBooking?</h2>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">We make bus travel simple, safe, and affordable for everyone</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="card p-6 hover:shadow-xl transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Travel?</h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">Join millions of travelers who trust BusBooking for their journey. Book your next trip today!</p>
          <Link to="/search" className="btn btn-accent btn-lg inline-flex items-center gap-2">
            Book Your Ticket
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* App Download */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 items-center">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold mb-4">Download Our App</h2>
              <p className="text-gray-400 mb-8">Book on the go, track your bus in real-time, and get exclusive app-only offers.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <a href="#" className="w-48 h-14 rounded-lg bg-white flex items-center justify-center gap-3 hover:bg-gray-100 transition-fast">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.23 19.59V10.41c0-.82-.68-1.5-1.5-1.5h-1.59l1.59-1.59c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0L13.34 8.6c-.39.39-.39 1.03 0 1.41l1.06 1.06H6.5c-.83 0-1.5.67-1.5 1.5v9.18c0 .83.67 1.5 1.5 1.5h12.23c.83 0 1.5-.67 1.5-1.5zm-1.5 0H6.5V10.41h10.23v9.18z"/></svg>
                  <span className="font-semibold text-gray-900">App Store</span>
                </a>
                <a href="#" className="w-48 h-14 rounded-lg bg-white flex items-center justify-center gap-3 hover:bg-gray-100 transition-fast">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.5 22C6.23 22 2 17.78 2 12.5S6.23 3 11.5 3 21 7.23 21 12.5c0 2.34-.82 4.45-2.19 6.07l-2.35 2.35c-.29.31-.76.31-1.05 0l-1.42-1.42c-.2-.2-.2-.51 0-.71.15-.15.34-.23.53-.23.19 0 .38.08.53.23l1.42 1.42c.29.29.77.29 1.05 0l2.35-2.35C19.82 16.95 20 14.84 20 12.5 20 7.23 15.78 3 11.5 3S3 7.23 3 12.5 7.23 22 11.5 22z"/></svg>
                  <span className="font-semibold text-gray-900">Google Play</span>
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="w-64 h-[400px] mx-auto md:mx-0 rounded-2xl bg-gray-800 border border-gray-700 overflow-hidden shadow-2xl">
                <div className="h-12 bg-gray-900 border-b border-gray-700 flex items-center px-4">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="p-6 h-[calc(100%-3rem)] flex flex-col items-center justify-center text-gray-400">
                  <Bus className="w-24 h-24 text-primary mb-4" />
                  <p className="text-center">BusBooking App Preview</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {[
                { value: '4.8★', label: 'App Store Rating' },
                { value: '1M+', label: 'Downloads' },
                { value: '500+', label: 'Routes' },
              ].map((stat, i) => (
                <div key={i} className="text-center p-6 rounded-xl bg-gray-800">
                  <div className="text-3xl font-bold text-accent mb-1">{stat.value}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;