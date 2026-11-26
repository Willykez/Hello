import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, Home, Search, ArrowLeft, Compass } from 'lucide-react';

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-primary-100 flex items-center justify-center">
            <Bus className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to="/" className="btn btn-primary btn-lg w-full md:w-auto flex items-center justify-center gap-2">
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          <Link to="/search" className="btn btn-outline btn-lg w-full md:w-auto flex items-center justify-center gap-2">
            <Search className="w-5 h-5" />
            Search Buses
          </Link>
          <button onClick={() => window.history.back()} className="btn btn-ghost btn-lg w-full md:w-auto flex items-center justify-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm mb-4">Popular destinations:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Bangalore → Chennai', 'Mumbai → Pune', 'Delhi → Jaipur', 'Hyderabad → Vijayawada', 'Kolkata → Bhubaneswar'].map((route, i) => (
              <Link key={i} to={`/search?source=${route.split(' → ')[0]}&destination=${route.split(' → ')[1]}&travelDate=${new Date().toISOString().split('T')[0]}`} className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-primary-100 hover:text-primary transition-fast">
                {route}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;