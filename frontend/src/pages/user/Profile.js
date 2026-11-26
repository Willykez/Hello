import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Save, AlertCircle, CheckCircle, Eye, EyeOff, Bell, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);

    try {
      const result = await updateProfile(profileForm);
      if (result.success) {
        setProfileSuccess(true);
      } else {
        setProfileError(result.message || 'Update failed');
      }
    } catch (err) {
      setProfileError('An error occurred. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      if (result.success) {
        setPasswordSuccess(true);
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setPasswordError(result.message || 'Password change failed');
      }
    } catch (err) {
      setPasswordError('An error occurred. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = passwordForm.new_password;
    if (!p) return { level: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-error' };
    if (score === 2) return { level: 2, label: 'Fair', color: 'bg-warning' };
    if (score === 3) return { level: 3, label: 'Good', color: 'bg-primary' };
    return { level: 4, label: 'Strong', color: 'bg-success' };
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account information and security</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="card sticky top-24">
              <div className="card-body text-center py-8">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
                <p className="text-gray-600 text-sm mt-1">{user?.email}</p>
                <span className="inline-block mt-3 px-3 py-1 text-xs font-medium bg-primary-100 text-primary rounded-full">
                  Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '2024'}
                </span>
              </div>
              <div className="border-t border-gray-100">
                <nav className="p-2">
                  <a href="#profile" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-fast">
                    <User className="w-5 h-5" />
                    Profile
                  </a>
                  <a href="#security" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-fast">
                    <Shield className="w-5 h-5" />
                    Security
                  </a>
                  <a href="#notifications" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-fast">
                    <Bell className="w-5 h-5" />
                    Notifications
                  </a>
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-6">
            {/* Profile Information */}
            <section id="profile">
              <div className="card">
                <div className="card-header">
                  <h2 className="font-semibold flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Personal Information
                  </h2>
                </div>
                <div className="card-body">
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    {profileError && (
                      <div className="alert alert-error">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{profileError}</span>
                      </div>
                    )}
                    {profileSuccess && (
                      <div className="alert alert-success">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span>Profile updated successfully!</span>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="form-label">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={profileForm.full_name}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                            className="form-input pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="form-label">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={user?.email || ''}
                            className="form-input pl-10 bg-gray-50"
                            disabled
                          />
                        </div>
                        <p className="form-hint">Email cannot be changed. Contact support for changes.</p>
                      </div>
                      <div>
                        <label className="form-label">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="form-input pl-10"
                            placeholder="+91 98765 43210"
                          />
                        </div>
                      </div>
                    </div>

                    <button type="submit" disabled={profileLoading} className="btn btn-primary">
                      {profileLoading ? 'Saving...' : 'Save Changes'}
                      <Save className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </section>

            {/* Security */}
            <section id="security">
              <div className="card">
                <div className="card-header">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Change Password
                  </h2>
                </div>
                <div className="card-body">
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    {passwordError && (
                      <div className="alert alert-error">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{passwordError}</span>
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="alert alert-success">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span>Password changed successfully!</span>
                      </div>
                    )}

                    <div>
                      <label className="form-label">Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordForm.current_password}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                          className="form-input pl-10 pr-10"
                          required
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="form-label">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordForm.new_password}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                          className="form-input pl-10 pr-10"
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {passwordForm.new_password && (
                        <div className="mt-2">
                          <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${strength.color}`}
                              style={{ width: `${(strength.level / 4) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Password strength: <span className="font-medium">{strength.label}</span></p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordForm.confirm_password}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                          className="form-input pl-10 pr-10"
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button type="submit" disabled={passwordLoading} className="btn btn-primary">
                      {passwordLoading ? 'Updating...' : 'Change Password'}
                      <Save className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </section>

            {/* Notifications */}
            <section id="notifications">
              <div className="card">
                <div className="card-header">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Notification Preferences
                  </h2>
                </div>
                <div className="card-body space-y-4">
                  {[
                    { id: 'booking', title: 'Booking Confirmations', desc: 'Receive confirmation via email and SMS', enabled: true },
                    { id: 'reminders', title: 'Trip Reminders', desc: 'Get notified 24h and 2h before departure', enabled: true },
                    { id: 'promotions', title: 'Promotional Offers', desc: 'Receive discounts and special offers', enabled: false },
                    { id: 'updates', title: 'Service Updates', desc: 'Important announcements and maintenance', enabled: true },
                  ].map(item => (
                    <label key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={item.enabled}
                        className="form-checkbox"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </section>
          </main>
        </div>
      </section>
    </div>
  );
}

export default Profile;