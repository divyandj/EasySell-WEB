
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CataloguePage from './pages/CataloguePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import NotFoundPage from './pages/NotFoundPage';
import HomePage from './pages/HomePage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { Box, Flex } from '@chakra-ui/react';

function App() {
  return (
    <Flex direction="column" minH="100vh">
      <ScrollToTop />
      <Navbar />
      <Box flex="1">
        <Routes>
          {/* --- Public Routes (Accessible by Everyone) --- */}

          {/* 1. Home Page is now Public */}
          <Route path="/" element={<HomePage />} />

          <Route path="/login" element={<LoginPage />} />
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

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Box>
      <Footer />
    </Flex>
  );
}

export default App;