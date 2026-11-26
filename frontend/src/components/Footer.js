import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, MapPin, Phone, Mail, Clock, Facebook, Twitter, Instagram, Linkedin, Shield, CheckCircle, Headphones, Truck } from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { label: 'About Us', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Press', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Partners', href: '#' },
    ],
    support: [
      { label: 'Help Center', href: '#' },
      { label: 'Contact Us', href: '#' },
      { label: 'Cancellation Policy', href: '#' },
      { label: 'Refund Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
    ],
    services: [
      { label: 'Bus Tickets', href: '/search' },
      { label: 'Bus Routes', href: '#' },
      { label: 'Bus Operators', href: '#' },
      { label: 'Track Bus', href: '#' },
      { label: 'Offers & Discounts', href: '#' },
    ],
    travelInfo: [
      { label: 'Popular Routes', href: '#' },
      { label: 'Bus Types', href: '#' },
      { label: 'Boarding Points', href: '#' },
      { label: 'Dropping Points', href: '#' },
      { label: 'Travel Guidelines', href: '#' },
    ],
  };

  const features = [
    { icon: Shield, title: 'Secure Payment', desc: '100% secure & encrypted transactions' },
    { icon: CheckCircle, title: 'Easy Booking', desc: 'Book tickets in just a few clicks' },
    { icon: Headphones, title: '24/7 Support', desc: 'Round the clock customer assistance' },
    { icon: Truck, title: 'Wide Network', desc: '500+ routes across India' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300" role="contentinfo">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-2xl mb-6" aria-label="BusBooking Home">
              <Bus className="w-8 h-8 text-accent" />
              <span>BusBooking</span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-xs">
              India's most trusted bus booking platform. Book tickets online for 500+ routes with secure payments and 24/7 support.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="tel:+1800123456" className="flex items-center gap-2 hover:text-white transition-fast">
                <Phone className="w-5 h-5" />
                +1 800 123 456
              </a>
              <a href="mailto:support@busbooking.com" className="flex items-center gap-2 hover:text-white transition-fast">
                <Mail className="w-5 h-5" />
                support@busbooking.com
              </a>
            </div>
            <div className="flex items-center gap-4 mt-6">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-fast" aria-label={label}>
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map(({ label, href }) => (
                <li key={label}>
                  <Link to={href} className="hover:text-white transition-fast">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map(({ label, href }) => (
                <li key={label}>
                  <Link to={href} className="hover:text-white transition-fast">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map(({ label, href }) => (
                <li key={label}>
                  <Link to={href} className="hover:text-white transition-fast">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Travel Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Travel Info</h4>
            <ul className="space-y-3">
              {footerLinks.travelInfo.map(({ label, href }) => (
                <li key={label}>
                  <Link to={href} className="hover:text-white transition-fast">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Features Bar */}
      <div className="bg-gray-800 border-t border-gray-700 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h5 className="text-white font-semibold">{title}</h5>
                  <p className="text-gray-400 text-sm mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {currentYear} BusBooking. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link to="#" className="hover:text-white transition-fast">Terms of Service</Link>
              <Link to="#" className="hover:text-white transition-fast">Privacy Policy</Link>
              <Link to="#" className="hover:text-white transition-fast">Cookie Policy</Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 text-sm">Download App:</span>
              <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-fast" aria-label="Download on App Store">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.23 19.59V10.41c0-.82-.68-1.5-1.5-1.5h-1.59l1.59-1.59c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0L13.34 8.6c-.39.39-.39 1.03 0 1.41l1.06 1.06H6.5c-.83 0-1.5.67-1.5 1.5v9.18c0 .83.67 1.5 1.5 1.5h12.23c.83 0 1.5-.67 1.5-1.5zm-1.5 0H6.5V10.41h10.23v9.18z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-fast" aria-label="Get it on Google Play">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.5 22C6.23 22 2 17.78 2 12.5S6.23 3 11.5 3 21 7.23 21 12.5c0 2.34-.82 4.45-2.19 6.07l-2.35 2.35c-.29.31-.76.31-1.05 0l-1.42-1.42c-.2-.2-.2-.51 0-.71.15-.15.34-.23.53-.23.19 0 .38.08.53.23l1.42 1.42c.29.29.77.29 1.05 0l2.35-2.35C19.82 16.95 20 14.84 20 12.5 20 7.23 15.78 3 11.5 3S3 7.23 3 12.5 7.23 22 11.5 22z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;