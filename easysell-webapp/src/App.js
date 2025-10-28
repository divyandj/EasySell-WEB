import React from 'react';
import { Routes, Route } from 'react-router-dom'; // No need for Navigate here anymore
import CataloguePage from './pages/CataloguePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import NotFoundPage from './pages/NotFoundPage';
import HomePage from './pages/HomePage'; // Import HomePage
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { Box } from '@chakra-ui/react';

function App() {
  return (
    <>
      <Navbar />
      {/* Main content area with padding top to account for Navbar height */}
      <Box pt="64px"> {/* Ensure padding matches Navbar height (h={16} = 64px) */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} /> {/* Render HomePage at root */}
          <Route path="/catalogue/:catalogueId" element={<CataloguePage />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />

          {/* --- UPDATED ROUTE for Order Details --- */}
          {/* Uses both catalogueId and orderId as parameters */}
          <Route
            path="/order-details/:catalogueId/:orderId"
            element={<ProtectedRoute><OrderTrackingPage /></ProtectedRoute>}
          />
          {/* --- END UPDATED ROUTE --- */}
          {/* Fallback route forr any undefined paths */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Box>
    </>
  );
}

export default App;