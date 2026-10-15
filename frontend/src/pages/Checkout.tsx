import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import type { Address } from '../types/api';

const initialAddress: Address = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Kenya',
};

function ShippingForm({ address, onChange, sameAsShipping, onSameAsShippingChange }: { 
  address: Address; 
  onChange: (field: string, value: string) => void;
  sameAsShipping?: boolean;
  onSameAsShippingChange?: (value: boolean) => void;
}) {
  const defaultSameAsShipping = sameAsShipping ?? true;
  const defaultOnChange = onSameAsShippingChange || (() => {});
  return (
    <form>
      <>
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Shipping Address</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="label">First Name *</label>
              <input
                id="firstName"
                type="text"
                value={address.firstName}
                onChange={e => onChange('firstName', e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="label">Last Name *</label>
              <input
                id="lastName"
                type="text"
                value={address.lastName}
                onChange={e => onChange('lastName', e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="label">Phone *</label>
              <input
                id="phone"
                type="tel"
                value={address.phone}
                onChange={e => onChange('phone', e.target.value)}
                className="input"
                placeholder="+254 7XX XXX XXX"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                value={address.email || ''}
                onChange={e => onChange('email', e.target.value)}
                className="input"
              />
            </div>
          </div>
          <div>
            <label htmlFor="line1" className="label">Address Line 1 *</label>
            <input
              id="line1"
              type="text"
              value={address.line1}
              onChange={e => onChange('line1', e.target.value)}
              className="input"
              placeholder="Building, Street"
              required
            />
          </div>
          <div>
            <label htmlFor="line2" className="label">Address Line 2</label>
            <input
              id="line2"
              type="text"
              value={address.line2}
              onChange={e => onChange('line2', e.target.value)}
              className="input"
              placeholder="Apartment, Floor"
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="label">City *</label>
              <input
                id="city"
                type="text"
                value={address.city}
                onChange={e => onChange('city', e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label htmlFor="state" className="label">County/State *</label>
              <input
                id="state"
                type="text"
                value={address.state}
                onChange={e => onChange('state', e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label htmlFor="postalCode" className="label">Postal Code</label>
              <input
                id="postalCode"
                type="text"
                value={address.postalCode}
                onChange={e => onChange('postalCode', e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>
        <div className="mt-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={defaultSameAsShipping}
              onChange={e => defaultOnChange(e.target.checked)}
              className="h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700">Billing address is the same as shipping</span>
          </label>
        </div>
      </>
    </form>
  );
}

function PaymentForm({ paymentMethod, setPaymentMethod, phoneNumber, setPhoneNumber }: { 
  paymentMethod: 'mpesa' | 'card';
  setPaymentMethod: (m: 'mpesa' | 'card') => void;
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
}) {
  return (
    <form>
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">Payment Method</h2>
        <div className="space-y-4">
          <label className="relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors hover:border-primary-300">
            <input
              type="radio"
              name="paymentMethod"
              value="mpesa"
              checked={paymentMethod === 'mpesa'}
              onChange={() => setPaymentMethod('mpesa')}
              className="h-4 w-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
            />
            <div className="ml-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93c-3.95-.49-7-3.85-7-7.93a9.96 9.96 0 016.93-9.93c2.07 0 3.98.85 5.36 2.23l1.53-1.53c-1.73-1.16-3.92-1.86-6.4-1.86z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="font-medium text-neutral-900">M-Pesa</p>
                <p className="text-sm text-neutral-500">Pay with M-Pesa STK Push</p>
              </div>
            </div>
          </label>

          <label className="relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors hover:border-primary-300">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={() => setPaymentMethod('card')}
              className="h-4 w-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
            />
            <div className="ml-4 flex items-center gap-3">
              <div className="h-10 w-16 rounded-lg bg-neutral-100 flex items-center justify-center">
                <svg className="h-6 w-10 text-neutral-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4v16h16V4zm-2 14H6v-2h12v2zm0-4H6v-2h12v2zm-2-6V4H6v2h12z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="font-medium text-neutral-900">Credit/Debit Card</p>
                <p className="text-sm text-neutral-500">Pay with Visa, Mastercard</p>
              </div>
            </div>
          </label>
        </div>

        {paymentMethod === 'mpesa' && (
          <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
            <label htmlFor="phoneNumber" className="label">M-Pesa Phone Number *</label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              className="input"
              placeholder="+254 7XX XXX XXX"
              required
            />
            <p className="mt-2 text-sm text-neutral-500">You will receive an STK Push prompt on your phone to complete the payment.</p>
          </div>
        )}

        {paymentMethod === 'card' && (
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="cardNumber" className="label">Card Number *</label>
              <input id="cardNumber" type="text" className="input" placeholder="1234 5678 9012 3456" required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiryDate" className="label">Expiry Date *</label>
                <input id="expiryDate" type="text" className="input" placeholder="MM/YY" required />
              </div>
              <div>
                <label htmlFor="cvv" className="label">CVV *</label>
                <input id="cvv" type="text" className="input" placeholder="123" required />
              </div>
            </div>
            <div>
              <label htmlFor="cardName" className="label">Name on Card *</label>
              <input id="cardName" type="text" className="input" placeholder="John Doe" required />
            </div>
          </div>
        )}
      </div>
    </form>
  );
}

function ReviewSection({ 
  shippingAddress, 
  paymentMethod, 
  phoneNumber
}: { 
  shippingAddress: Address;
  paymentMethod: string;
  phoneNumber: string;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">Review Your Order</h2>

        <div className="mb-6">
          <h3 className="font-medium text-neutral-900 mb-3">Shipping Address</h3>
          <address className="text-neutral-700 not-italic">
            <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
            <p>{shippingAddress.line1}</p>
            {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
            <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
            <p>{shippingAddress.country}</p>
            <p>Phone: {shippingAddress.phone}</p>
          </address>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-neutral-900 mb-3">Payment Method</h3>
          <p className="text-neutral-700">
            {paymentMethod === 'mpesa' ? `M-Pesa (${phoneNumber})` : 'Credit/Debit Card'}
          </p>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-neutral-900 mb-3">Order Items</h3>
          <div className="space-y-2">
            {/* Items would be rendered here */}
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-neutral-600">Subtotal</span>
            <span className="font-medium text-neutral-900">KES 0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Shipping</span>
            <span className="font-medium text-neutral-900">
              Free
            </span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2">
            <span className="font-semibold text-neutral-900">Total</span>
            <span className="font-semibold text-neutral-900 text-lg">KES 0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Checkout() {
  const { getSubtotal } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<'shipping' | 'payment' | 'review'>('shipping');
  const [shippingAddress, setShippingAddress] = useState<Address>(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (getSubtotal() === 0) {
    return <div className="min-h-screen bg-white py-16 text-center">Your cart is empty</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 'shipping') {
      if (!shippingAddress.firstName || !shippingAddress.lastName || !shippingAddress.phone || !shippingAddress.line1 || !shippingAddress.city || !shippingAddress.state) {
        setError('Please fill in all required shipping fields');
        return;
      }
      setStep('payment');
    } else if (step === 'payment') {
      if (paymentMethod === 'mpesa' && !phoneNumber) {
        setError('Please enter your M-Pesa phone number');
        return;
      }
      setStep('review');
    } else if (step === 'review') {
      setIsProcessing(true);
      setTimeout(() => {
        navigate('/order-confirmation');
        setIsProcessing(false);
      }, 2000);
    }
  };

  const handleBack = () => {
    if (step === 'payment') setStep('shipping');
    else if (step === 'review') setStep('payment');
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-light tracking-tight text-neutral-900">Checkout</h1>
          <p className="mt-2 text-neutral-600">Complete your purchase</p>
        </div>

        <div className="mb-8">
          <nav className="flex" aria-label="Checkout steps">
            {['shipping', 'payment', 'review'].map((s, index) => (
              <div key={s} className="relative flex-1">
                <button
                  type="button"
                  disabled={index > (step === 'shipping' ? 0 : step === 'payment' ? 1 : 2)}
                  className={`w-full flex items-center justify-center py-3 text-sm font-medium transition-colors ${
                    index < (step === 'shipping' ? 0 : step === 'payment' ? 1 : 2)
                      ? 'text-primary-600 bg-primary-50'
                      : index === (step === 'shipping' ? 0 : step === 'payment' ? 1 : 2)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-neutral-400 bg-neutral-100'
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-current text-white font-medium">
                    {index + 1}
                  </span>
                  <span className="ml-2 hidden sm:inline">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                </button>
                {index < 2 && (
                  <div className="absolute top-4 left-1/2 w-full h-0.5 bg-neutral-200 z-0" />
                )}
              </div>
            ))}
          </nav>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
            {error}
          </div>
        )}

        {step === 'shipping' && (
          <ShippingForm 
            address={shippingAddress} 
            onChange={(field, value) => setShippingAddress(prev => ({ ...prev, [field]: value }))}
          />
        )}

        {step === 'payment' && (
          <PaymentForm 
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
          />
        )}

        {step === 'review' && (
          <ReviewSection 
            shippingAddress={shippingAddress}
            paymentMethod={paymentMethod}
            phoneNumber={phoneNumber}
          />
        )}

        <div className="sticky top-24 bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Order Summary</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd className="font-medium text-neutral-900">KES {getSubtotal().toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-600">Shipping</dt>
              <dd className="font-medium text-neutral-900">
                {(() => {
                  const shipping = getSubtotal() > 5000 ? 0 : 300;
                  if (shipping === 0) {
                    return <span className="text-green-600">Free</span>;
                  }
                  return (
                    <>KES {shipping.toLocaleString()} <span className="text-neutral-500">(Free over KES 5,000)</span></>
                  );
                })()}
              </dd>
            </div>
            <div className="border-t border-neutral-200 pt-3 flex justify-between">
              <dt className="font-semibold text-neutral-900">Total</dt>
              <dd className="font-semibold text-neutral-900 text-lg">KES {(getSubtotal() + (getSubtotal() > 5000 ? 0 : 300)).toLocaleString()}</dd>
            </div>
          </dl>
        </div>

        <div className="flex justify-between mt-6">
          {step !== 'shipping' && (
            <button type="button" onClick={handleBack} className="btn-secondary">
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="btn-primary"
          >
            {isProcessing ? 'Processing...' : step === 'review' ? 'Place Order' : 'Continue'}
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-neutral-500">
          <p>By placing your order, you agree to our <Link to="/terms" className="text-primary-600 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>.</p>
        </div>
      </div>
    </div>
  );
}

export default Checkout;