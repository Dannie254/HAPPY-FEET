import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import type { CartItem } from '../types/api';

function CartItemComponent({ item, onQuantityChange, onRemove, isUpdating }: { 
  item: CartItem; 
  onQuantityChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  isUpdating: string | null;
}) {
  return (
    <div className="flex gap-4 p-6">
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-50">
        {item.product.images[0] ? (
          <img
            src={item.product.images[0].url}
            alt={item.product.images[0].alt || item.product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 002-2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link to={`/product/${item.product.slug}`} className="font-medium text-neutral-900 hover:text-primary-600">
              {item.product.name}
            </Link>
            {item.variant.attributes.length > 0 && (
              <p className="mt-1 text-sm text-neutral-500">
                {item.variant.attributes.map(a => `${a.displayName || a.name}: ${a.value}`).join(', ')}
              </p>
            )}
            <p className="mt-1 text-sm text-neutral-500">SKU: {item.variant.sku}</p>
          </div>
          <button
            onClick={() => onRemove(item.variantId)}
            className="text-neutral-400 hover:text-red-600 transition-colors flex-shrink-0"
            aria-label="Remove item"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2 border border-neutral-300 rounded-lg">
            <button
              onClick={() => onQuantityChange(item.variantId, item.quantity - 1)}
              disabled={isUpdating === item.variantId}
              className="flex h-10 w-10 items-center justify-center text-neutral-600 hover:bg-neutral-100 rounded-l-lg"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => onQuantityChange(item.variantId, parseInt(e.target.value) || 1)}
              min="1"
              max={item.variant.availableStock}
              className="w-16 h-10 text-center border-none focus:outline-none text-neutral-900"
            />
            <button
              onClick={() => onQuantityChange(item.variantId, item.quantity + 1)}
              disabled={isUpdating === item.variantId}
              className="flex h-10 w-10 items-center justify-center text-neutral-600 hover:bg-neutral-100 rounded-r-lg"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div className="ml-auto text-right">
            <p className="text-lg font-semibold text-neutral-900">
              KES {(item.variant.price * item.quantity).toLocaleString()}
            </p>
            <p className="text-sm text-neutral-500">KES {item.variant.price.toLocaleString()} each</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartSummary({ subtotal, shipping, total, onCheckout }: { 
  subtotal: number; 
  shipping: number; 
  total: number;
  onCheckout: () => void;
}) {
  return (
    <div className="sticky top-24 bg-white rounded-xl border border-neutral-200 p-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">Order Summary</h2>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-600">Subtotal ({1} items)</dt>
          <dd className="font-medium text-neutral-900">KES {subtotal.toLocaleString()}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-600">Shipping</dt>
          <dd className="font-medium text-neutral-900">
            {shipping === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              <>KES {shipping.toLocaleString()} <span className="text-neutral-500">(Free over KES 5,000)</span></>
            )}
          </dd>
        </div>
        <div className="border-t border-neutral-200 pt-3 flex justify-between">
          <dt className="font-semibold text-neutral-900">Total</dt>
          <dd className="font-semibold text-neutral-900 text-lg">KES {total.toLocaleString()}</dd>
        </div>
      </dl>
      <button onClick={onCheckout} className="mt-6 w-full btn-primary text-lg py-3">
        Proceed to Checkout
      </button>
      <p className="mt-4 text-center text-xs text-neutral-500">
        Secure checkout with M-Pesa or Card
      </p>
    </div>
  );
}

export function Cart() {
  const { state, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleQuantityChange = (variantId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(variantId);
      return;
    }
    setIsUpdating(variantId);
    updateQuantity(variantId, newQuantity);
    setTimeout(() => setIsUpdating(null), 300);
  }

  const handleRemove = (variantId: string) => {
    if (window.confirm('Remove this item from your cart?')) {
      removeItem(variantId);
    }
  };

  const subtotal = state.items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  const shipping = subtotal > 5000 ? 0 : 300;

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h2 className="mt-4 text-2xl font-semibold text-neutral-900">Your cart is empty</h2>
            <p className="mt-2 text-neutral-600">Looks like you haven't added any items yet.</p>
            <Link to="/shop" className="mt-6 inline-block btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const cartItems = state.items.map((item) => {
    return (
      <CartItemComponent
        key={item.id}
        item={item}
        onQuantityChange={handleQuantityChange}
        onRemove={handleRemove}
        isUpdating={isUpdating}
      />
    );
  });

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-light tracking-tight text-neutral-900">Shopping Cart</h1>
          <p className="mt-2 text-neutral-600">{state.items.length} item{state.items.length !== 1 ? 's' : ''} in your cart</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="border-b border-neutral-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-neutral-900">Cart Items</h2>
              </div>
              <div className="divide-y divide-neutral-200">
                {cartItems}
              </div>

              <div className="border-t border-neutral-200 px-6 py-4 flex justify-end">
                <button
                  onClick={() => { if (window.confirm('Clear all items?')) clearCart(); }}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <CartSummary
              subtotal={subtotal}
              shipping={shipping}
              total={subtotal + shipping}
              onCheckout={() => navigate('/checkout')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;