import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Menu, X, User, LogOut, Ticket, Settings, Star, Heart, Bell,
  ChevronDown, Bus, Search, MapPin, Calendar, Clock
} from 'lucide-react';

function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const navLinks = [
    { path: '/', label: 'Home', icon: Bus },
    { path: '/search', label: 'Book Tickets', icon: Search },
    { path: '/dashboard', label: 'My Trips', icon: Ticket, protected: true },
    { path: '/reviews', label: 'Reviews', icon: Star, protected: true },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      {/* Top Bar */}
      <div className="hidden md:flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            500+ Routes Across India
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            24/7 Customer Support
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-4 h-4 text-error" />
            1M+ Happy Customers
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a href="tel:+1800123456" className="flex items-center gap-1 hover:text-primary transition-fast">
            <span className="hidden sm:inline">+1 800 123 456</span>
          </a>
          <a href="mailto:support@busbooking.com" className="hover:text-primary transition-fast">
            support@busbooking.com
          </a>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container mx-auto px-4" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16 md:h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl z-20" aria-label="BusBooking Home">
            <Bus className="w-8 h-8 text-primary" />
            <span className="hidden sm:block">BusBooking</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label, icon: Icon, protected }) => (
              <Link
                key={path}
                to={path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-fast flex items-center gap-2 ${
                  location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
                    ? 'bg-primary-50 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${protected && !isAuthenticated ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Search Button (Mobile) */}
            <button
              ref={searchRef}
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-fast"
              aria-label="Search buses"
              aria-expanded={searchOpen}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Auth Buttons / User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-fast"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <span className="hidden sm:block">{user?.full_name?.split(' ')[0] || 'User'}</span>
                  <ChevronDown className={`w-4 h-4 transition-fast ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="dropdown-menu animate-slideDown">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-900">{user?.full_name}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                    <Link to="/dashboard" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                      <Ticket className="w-4 h-4" />
                      My Bookings
                    </Link>
                    <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                      <Settings className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link to="/reviews" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                      <Star className="w-4 h-4" />
                      My Reviews
                    </Link>
                    <div className="dropdown-divider" />
                    <button onClick={handleLogout} className="dropdown-item error">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-fast"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-slideDown">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map(({ path, label, icon: Icon, protected }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-fast ${
                  location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
                    ? 'bg-primary-50 text-primary'
                    : 'text-gray-600 hover:bg-gray-100'
                } ${protected && !isAuthenticated ? 'opacity-50' : ''}`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
            {!isAuthenticated && (
              <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                <Link to="/login" className="btn btn-outline btn-lg w-full" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                <Link to="/register" className="btn btn-primary btn-lg w-full" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Bar Overlay (Mobile) */}
      {searchOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 bottom-0 bg-white z-50 animate-slideDown p-4 overflow-y-auto">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Search Buses</h2>
            <SearchForm onSearch={(params) => {
              setSearchOpen(false);
              navigate('/search', { search: params });
            }} />
          </div>
        </div>
      )}
    </header>
  );
}

// Inline Search Form Component
function SearchForm({ onSearch }) {
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    travelDate: '',
    returnDate: '',
    passengers: 1,
  });
  const [roundTrip, setRoundTrip] = useState(false);
  const [suggestions, setSuggestions] = useState({ source: [], destination: [] });
  const [activeField, setActiveField] = useState(null);

  const cities = [
    'Bangalore', 'Chennai', 'Hyderabad', 'Mumbai', 'Pune', 'Delhi', 'Jaipur',
    'Kolkata', 'Bhubaneswar', 'Ahmedabad', 'Surat', 'Coimbatore', 'Vijayawada',
    'Kochi', 'Thiruvananthapuram', 'Mysore', 'Mangalore', 'Goa', 'Nagpur', 'Indore'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const filtered = cities.filter(c => c.toLowerCase().includes(value.toLowerCase())).slice(0, 5);
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
    if (roundTrip && formData.returnDate) params.append('returnDate', formData.returnDate);
    onSearch(params.toString());
  };

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <label className="form-label">From</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={formData.source}
            onChange={(e) => handleInputChange('source', e.target.value)}
            onFocus={() => setActiveField('source')}
            placeholder="Enter city"
            className="form-input pl-10"
            autoComplete="off"
          />
        </div>
        {activeField === 'source' && suggestions.source.length > 0 && (
          <ul className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-40 overflow-y-auto">
            {suggestions.source.map(city => (
              <li key={city} onClick={() => selectCity('source', city)} className="px-4 py-3 hover:bg-gray-100 cursor-pointer">{city}</li>
            ))}
          </ul>
        )}
      </div>

      <button type="button" onClick={swapCities} className="flex justify-center mx-auto p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-fast" aria-label="Swap source and destination">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
      </button>

      <div className="relative">
        <label className="form-label">To</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={formData.destination}
            onChange={(e) => handleInputChange('destination', e.target.value)}
            onFocus={() => setActiveField('destination')}
            placeholder="Enter city"
            className="form-input pl-10"
            autoComplete="off"
          />
        </div>
        {activeField === 'destination' && suggestions.destination.length > 0 && (
          <ul className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-40 overflow-y-auto">
            {suggestions.destination.map(city => (
              <li key={city} onClick={() => selectCity('destination', city)} className="px-4 py-3 hover:bg-gray-100 cursor-pointer">{city}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Departure Date</label>
          <input
            type="date"
            value={formData.travelDate}
            onChange={(e) => setFormData(prev => ({ ...prev, travelDate: e.target.value }))}
            min={today}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">{roundTrip ? 'Return Date' : 'Passengers'}</label>
          {roundTrip ? (
            <input
              type="date"
              value={formData.returnDate}
              onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
              min={formData.travelDate || today}
              className="form-input"
            />
          ) : (
            <select value={formData.passengers} onChange={(e) => setFormData(prev => ({ ...prev, passengers: parseInt(e.target.value) }))} className="form-input form-select">
              {[...Array(6)].map((_, i) => i + 1).map(n => <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>)}
            </select>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input type="checkbox" checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)} className="form-checkbox" />
        Round Trip
      </label>

      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={!formData.source || !formData.destination || !formData.travelDate}>
        <Search className="w-4 h-4" />
        Search Buses
      </button>
    </form>
  );
}

export default Header;