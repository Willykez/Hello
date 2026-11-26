import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Star, Edit, Trash2, Bus, Plus, AlertCircle, CheckCircle, Eye, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function Reviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [formData, setFormData] = useState({ bus_id: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    fetchReviews();
    fetchBusesForReview();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await api.get('/users/reviews');
      if (response.data.success) {
        setReviews(response.data.reviews);
      }
    } catch (err) {
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusesForReview = async () => {
    try {
      const response = await api.get('/buses?limit=100');
      if (response.data.success) {
        setBuses(response.data.buses);
      }
    } catch (err) {
      console.error('Failed to fetch buses:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bus_id || !formData.rating) return;
    
    setSubmitting(true);
    try {
      const endpoint = editingReview ? `/users/reviews/${editingReview.id}` : '/users/reviews';
      const method = editingReview ? 'put' : 'post';
      const response = await api[method](endpoint, { bus_id: formData.bus_id, rating: formData.rating, comment: formData.comment });
      
      if (response.data.success) {
        fetchReviews();
        closeModal();
      } else {
        alert(response.data.message || 'Failed to save review');
      }
    } catch (err) {
      alert('Failed to save review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const response = await api.delete(`/users/reviews/${id}`);
      if (response.data.success) {
        fetchReviews();
      } else {
        alert(response.data.message || 'Failed to delete review');
      }
    } catch (err) {
      alert('Failed to delete review');
    }
  };

  const openModal = (review = null) => {
    if (review) {
      setEditingReview(review);
      setFormData({ bus_id: review.bus_id, rating: review.rating, comment: review.comment || '' });
    } else {
      setEditingReview(null);
      setFormData({ bus_id: '', rating: 5, comment: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingReview(null);
    setFormData({ bus_id: '', rating: 5, comment: '' });
  };

  const getCompletedBuses = () => {
    // In a real app, this would come from the API
    return buses;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
              <p className="text-gray-600">Share your travel experiences and help others choose</p>
            </div>
            <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Write Review
            </button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {error && (
          <div className="alert alert-error mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="card p-12 text-center">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600 mb-6">Share your experience after completing a trip to help other travelers</p>
            <button onClick={() => openModal()} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Write Your First Review
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="card hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <Bus className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">{review.bus_name}</h3>
                          <span className="badge badge-primary">{review.bus_type}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={`text-2xl ${star <= review.rating ? 'text-accent' : 'text-gray-300'}`}>★</span>
                          ))}
                          <span className="text-sm text-gray-500 ml-2">({review.rating}/5)</span>
                          <span className="text-sm text-gray-400 ml-4">{format(new Date(review.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        {review.comment && (
                          <p className="text-gray-600 mt-2">{review.comment}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openModal(review)} className="btn btn-outline btn-sm">
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button onClick={() => handleDelete(review.id)} className="btn btn-outline btn-sm text-error border-error hover:bg-error/10">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Write Review Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">{editingReview ? 'Edit Review' : 'Write a Review'}</h3>
                <button onClick={closeModal} className="modal-close">&times;</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body space-y-4">
                  <div>
                    <label className="form-label">Select Bus <span className="text-error">*</span></label>
                    <select
                      value={formData.bus_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, bus_id: e.target.value }))}
                      className="form-input form-select"
                      required
                      disabled={editingReview}
                    >
                      <option value="">Choose a bus you've traveled on</option>
                      {getCompletedBuses().map(bus => (
                        <option key={bus.id} value={bus.id}>{bus.bus_name} ({bus.bus_type}) - {bus.bus_number}</option>
                      ))}
                    </select>
                    {editingReview && <p className="form-hint">Bus cannot be changed when editing</p>}
                  </div>

                  <div>
                    <label className="form-label">Rating <span className="text-error">*</span></label>
                    <div className="flex items-center gap-2">
                      {[5, 4, 3, 2, 1].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                          className={`text-4xl transition-fast ${star <= formData.rating ? 'text-accent' : 'text-gray-300 hover:text-accent'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Your Review (Optional)</label>
                    <textarea
                      value={formData.comment}
                      onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                      className="form-input"
                      rows={4}
                      placeholder="Share your experience... (cleanliness, punctuality, staff behavior, comfort, etc.)"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={closeModal} className="btn btn-outline">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn btn-primary">
                    {submitting ? 'Saving...' : (editingReview ? 'Update Review' : 'Submit Review')}
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Reviews;