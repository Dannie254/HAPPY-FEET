import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { Header } from './components/Header';
import Home from '@pages/Home';
import { Shop } from '@pages/Shop';
import ProductDetail from '@pages/ProductDetail';
import Cart from '@pages/Cart';
import Checkout from '@pages/Checkout';

function App() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/search" element={<Shop />} />
            <Route path="/login" element={<div className="py-16 text-center">Login Page</div>} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        </main>
      </div>
    </CartProvider>
  );
}

export default App;
