
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CataloguePage from './pages/CataloguePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import HomePage from './pages/HomePage';
import StorefrontPage from './pages/StorefrontPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { Box, Flex } from '@chakra-ui/react';

const getSubdomain = () => {
  const host = window.location.hostname;
  const parts = host.split('.');

  // Local testing: store.localhost -> ['store', 'localhost']
  // Prod: store.mmproperty.in -> ['store', 'mmproperty', 'in']
  // Ignore 'www' and the root domain
  if (host.includes('localhost') && parts.length >= 2) {
    if (parts[0] !== 'www') return parts[0];
  } else if (parts.length >= 3) {
    if (parts[0] !== 'www') return parts[0];
  }
  return null;
};

function App() {
  const subdomain = getSubdomain();

  return (
    <Flex direction="column" minH="100vh">
      <ScrollToTop />
      <Navbar />
      <Box flex="1">
        <Routes>
          {/* --- Public Routes (Accessible by Everyone) --- */}

          {/* 1. Dynamic Root Route: Storefront if subdomain exists, otherwise Main Home */}
          <Route path="/" element={subdomain ? <StorefrontPage subdomain={subdomain} /> : <HomePage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<LoginPage />} />
          <Route path="/catalogue/:catalogueId" element={<CataloguePage />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />

          {/* --- Protected Routes (Login Required) --- */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderHistoryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/order-details/:catalogueId/:orderId"
            element={
              <ProtectedRoute>
                <OrderTrackingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Box>
      <Footer />
    </Flex>
  );
}

export default App;