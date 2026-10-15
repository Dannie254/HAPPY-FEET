import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import type { Cart, CartItem, Product, Variant } from '../types/api';

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CART'; payload: Cart }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_QUANTITY'; payload: { variantId: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' };

const initialState: CartState = {
  items: [],
  isLoading: false,
  error: null,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CART':
      return { ...state, items: action.payload.items, isLoading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(item => item.variantId === action.payload.variantId);
      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + action.payload.quantity,
        };
        return { ...state, items: newItems };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return { ...state, items: state.items.filter(item => item.variantId !== action.payload.variantId) };
      }
      return {
        ...state,
        items: state.items.map(item =>
          item.variantId === action.payload.variantId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(item => item.variantId !== action.payload) };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
}

const CartContext = createContext<{
  state: CartState;
  addItem: (product: Product, variant: Variant, quantity: number) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
} | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const cart = JSON.parse(savedCart);
        dispatch({ type: 'SET_CART', payload: cart });
      } catch {
        localStorage.removeItem('cart');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify({ items: state.items }));
  }, [state.items]);

  const addItem = async (product: Product, variant: Variant, quantity: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      dispatch({ type: 'ADD_ITEM', payload: {
        id: `${product._id}-${variant._id}`,
        productId: product._id,
        variantId: variant._id,
        quantity,
        product: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          images: product.images,
          basePrice: product.basePrice,
          compareAtPrice: product.compareAtPrice,
        },
        variant: {
          _id: variant._id,
          sku: variant.sku,
          attributes: variant.attributes,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          availableStock: variant.availableStock,
          stock: variant.stock,
          status: variant.status,
          images: variant.images,
        },
      }});
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to cart' });
    }
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { variantId, quantity } });
  };

  const removeItem = (variantId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: variantId });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getItemCount = () => state.items.reduce((sum, item) => sum + item.quantity, 0);
  const getSubtotal = () => state.items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      state,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      getItemCount,
      getSubtotal,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}