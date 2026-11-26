import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, BankBuilding, Smartphone, Shield, CheckCircle, Lock, AlertCircle, ChevronRight, Radio, RadioChecked } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function Payment() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: '',
  });
  const [upiId, setUpiId] = useState('');
  const [netBankingBank, setNetBankingBank] = useState('');

  // Get booking data from location state
  const bookingData = location.state || {};
  const selectedSeats = bookingData.selectedSeats || [];
  const passengersCount = bookingData.passengers || selectedSeats.length;
  const passengerDetails = bookingData.passengerDetails || [];
  const contactEmail = bookingData.contactEmail || '';
  const contactPhone = bookingData.contactPhone || '';

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay, Amex' },
    { id: 'upi', name: 'UPI', icon: Smartphone, desc: 'PhonePe, Google Pay, Paytm, BHIM' },
    { id: 'netbanking', name: 'Net Banking', icon: BankBuilding, desc: '50+ Banks Supported' },
    { id: 'wallet', name: 'Wallet', icon: Smartphone, desc: 'Paytm, Amazon Pay, Mobikwik' },
  ];

  const banks = [
    'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank',
    'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Union Bank of India', 'IndusInd Bank',
    'Yes Bank', 'IDFC First Bank', 'Federal Bank', 'RBL Bank', 'Other'
  ];

  useEffect(() => {
    if (selectedSeats.length === 0) {
      navigate(`/seats/${scheduleId}`);
      return;
    }
    fetchSchedule();
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

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    const groups = digits.match(/.{1,4}/g) || [];
    return groups.join(' ');
  };

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 2) {
      return digits.slice(0, 2) + '/' + digits.slice(2, 4);
    }
    return digits;
  };

  const handleCardChange = (field, value) => {
    let formatted = value;
    if (field === 'cardNumber') formatted = formatCardNumber(value);
    if (field === 'expiry') formatted = formatExpiry(value);
    if (field === 'cvv') formatted = value.replace(/\D/g, '').slice(0, 3);
    setCardForm(prev => ({ ...prev, [field]: formatted }));
  };

  const validateCard = () => {
    const num = cardForm.cardNumber.replace(/\s/g, '');
    if (num.length < 15) return 'Invalid card number';
    if (!/^\d{2}\/\d{2}$/.test(cardForm.expiry)) return 'Invalid expiry date (MM/YY)';
    if (cardForm.cvv.length < 3) return 'Invalid CVV';
    if (!cardForm.name.trim()) return 'Name on card required';
    return null;
  };

  const validateUPI = () => {
    if (!upiId.includes('@')) return 'Enter valid UPI ID (e.g., name@bank)';
    return null;
  };

  const handlePayment = async () => {
    let validationError = null;
    if (selectedMethod === 'card') validationError = validateCard();
    else if (selectedMethod === 'upi') validationError = validateUPI();
    else if (selectedMethod === 'netbanking' && !netBankingBank) validationError = 'Select a bank';

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create booking
      const response = await api.post('/bookings', {
        schedule_id: scheduleId,
        seat_numbers: selectedSeats,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        passenger_details: passengerDetails,
      });

      if (response.data.success) {
        navigate(`/confirmation/${response.data.booking.id}`);
      } else {
        setError(response.data.message || 'Payment failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const totalPrice = schedule?.price ? schedule.price * passengersCount : 0;
  const taxes = Math.round(totalPrice * 0.05);
  const discount = Math.round(totalPrice * 0.1);
  const finalPrice = totalPrice + taxes - discount;

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Indicator */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to={`/passengers/${scheduleId}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <div className="flex items-center">
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
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Methods */}
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Select Payment Method
                </h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {paymentMethods.map(method => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-4 rounded-lg border-2 transition-fast text-left ${
                          selectedMethod === method.id
                            ? 'border-primary bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: selectedMethod === method.id ? '#1e3a5f' : '#f3f4f6' }}>
                          <Icon className="w-5 h-5" style={{ color: selectedMethod === method.id ? 'white' : '#1e3a5f' }} />
                        </div>
                        <p className="font-medium text-gray-900">{method.name}</p>
                        <p className="text-xs text-gray-500">{method.desc}</p>
                        {selectedMethod === method.id && (
                          <div className="mt-2 flex items-center gap-1 text-primary text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Selected
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Payment Form Fields */}
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Payment Details
                </h2>
              </div>
              <div className="card-body space-y-4">
                {selectedMethod === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Card Number <span className="text-error">*</span></label>
                      <input
                        type="text"
                        value={cardForm.cardNumber}
                        onChange={(e) => handleCardChange('cardNumber', e.target.value)}
                        className="form-input"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        autoComplete="cc-number"
                      />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="form-label">Expiry (MM/YY) <span className="text-error">*</span></label>
                        <input
                          type="text"
                          value={cardForm.expiry}
                          onChange={(e) => handleCardChange('expiry', e.target.value)}
                          className="form-input"
                          placeholder="MM/YY"
                          maxLength={5}
                          autoComplete="cc-exp"
                        />
                      </div>
                      <div>
                        <label className="form-label">CVV <span className="text-error">*</span></label>
                        <input
                          type="text"
                          value={cardForm.cvv}
                          onChange={(e) => handleCardChange('cvv', e.target.value)}
                          className="form-input"
                          placeholder="123"
                          maxLength={3}
                          autoComplete="cc-csc"
                        />
                      </div>
                      <div>
                        <label className="form-label">Save Card</label>
                        <label className="flex items-center gap-2 cursor-pointer mt-6">
                          <input type="checkbox" className="form-checkbox" defaultChecked />
                          <span className="text-sm text-gray-600">Save for future bookings</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Name on Card <span className="text-error">*</span></label>
                      <input
                        type="text"
                        value={cardForm.name}
                        onChange={(e) => handleCardChange('name', e.target.value)}
                        className="form-input"
                        placeholder="John Doe"
                        autoComplete="cc-name"
                      />
                    </div>
                  </div>
                )}

                {selectedMethod === 'upi' && (
                  <div className="space-y-4">
                    <div>
                      <label className="form-label">UPI ID <span className="text-error">*</span></label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="form-input"
                        placeholder="yourname@bank"
                        autoComplete="off"
                      />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Or pay using any UPI app:</p>
                      <div className="flex flex-wrap gap-3">
                        {['PhonePe', 'Google Pay', 'Paytm', 'BHIM', 'Amazon Pay'].map(app => (
                          <button key={app} type="button" className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-fast">
                            {app}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">You will receive a payment request on your UPI app.</p>
                  </div>
                )}

                {selectedMethod === 'netbanking' && (
                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Select Your Bank <span className="text-error">*</span></label>
                      <select
                        value={netBankingBank}
                        onChange={(e) => setNetBankingBank(e.target.value)}
                        className="form-input form-select"
                      >
                        <option value="">Choose your bank</option>
                        {banks.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                      </select>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">You will be redirected to your bank's secure payment page.</p>
                    </div>
                  </div>
                )}

                {selectedMethod === 'wallet' && (
                  <div className="space-y-4">
                    <p className="text-gray-600">Select your preferred wallet:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['Paytm', 'Amazon Pay', 'Mobikwik', 'Freecharge', 'JioMoney', 'Airtel Money'].map(wallet => (
                        <button key={wallet} type="button" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary transition-fast flex items-center justify-center gap-2">
                          <span className="font-medium">{wallet}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">You will be redirected to the wallet app/website to complete payment.</p>
                  </div>
                )}

                {error && (
                  <div className="alert alert-error">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Security Notice */}
                <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-lg border border-primary-100">
                  <Lock className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-primary">Secure Payment</p>
                    <p className="text-sm text-gray-600">Your payment details are encrypted and processed securely. We don't store your full card details.</p>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="btn btn-primary btn-lg w-full"
                >
                  {processing ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Processing Payment...
                    </>
                  ) : (
                    `Pay ₹${finalPrice.toLocaleString()}`
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <div className="card-header">
                <h2 className="font-semibold">Order Summary</h2>
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
                  <div className="flex flex-wrap gap-1">
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

                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Instant confirmation via SMS & Email</p>
                  <p>• E-ticket sent immediately after payment</p>
                  <p>• 24/7 customer support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Payment;