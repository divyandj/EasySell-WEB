
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CataloguePage from './pages/CataloguePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import OrderPaymentPage from './pages/OrderPaymentPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import HomePage from './pages/HomePage';
import StorefrontPage from './pages/StorefrontPage';
import RequestProductPage from './pages/RequestProductPage';
import ContactPage from './pages/ContactPage';
import AboutUsPage from './pages/AboutUsPage';
import RewardsPage from './pages/RewardsPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { Box, Flex } from '@chakra-ui/react';

import { resolveStoreContext } from './utils/storeResolver';

function App() {
  const storeContext = resolveStoreContext();
  const isStorefrontContext = storeContext.type === 'subdomain' || storeContext.type === 'customDomain';
  const subdomain = isStorefrontContext ? (storeContext.handle || storeContext.domain) : null;

  return (
    <Flex direction="column" minH="100vh">
      <ScrollToTop />
      <Navbar storeContext={storeContext} />
      <Box flex="1">
        <Routes>
          {/* --- Public Routes (Accessible by Everyone) --- */}

          {/* 1. Dynamic Root Route: Storefront if subdomain exists, otherwise Main Home */}
          <Route path="/" element={subdomain ? <StorefrontPage subdomain={subdomain} /> : <HomePage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<LoginPage />} />
          <Route path="/catalogue/:catalogueId" element={<CataloguePage />} />
          <Route path="/product/:catalogueId/:productId" element={<ProductDetailPage />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/request-product" element={
            <ProtectedRoute>
              <RequestProductPage />
            </ProtectedRoute>
          } />

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
            path="/order-payment/:catalogueId/:orderId"
            element={
              <ProtectedRoute>
                <OrderPaymentPage />
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
      <Footer storeContext={storeContext} />
    </Flex>
  );
}

export default App;