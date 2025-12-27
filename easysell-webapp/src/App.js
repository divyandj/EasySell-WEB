// import React from 'react';
// import { Routes, Route } from 'react-router-dom'; // No need for Navigate here anymore
// import CataloguePage from './pages/CataloguePage';
// import ProductDetailPage from './pages/ProductDetailPage';
// import CartPage from './pages/CartPage';
// import CheckoutPage from './pages/CheckoutPage';
// import LoginPage from './pages/LoginPage';
// import OrderHistoryPage from './pages/OrderHistoryPage';
// import OrderTrackingPage from './pages/OrderTrackingPage';
// import NotFoundPage from './pages/NotFoundPage';
// import HomePage from './pages/HomePage'; // Import HomePage
// import Navbar from './components/Navbar';
// import ProtectedRoute from './components/ProtectedRoute';
// import { Box } from '@chakra-ui/react';

// function App() {
//   return (
//     <>
//       <Navbar />
//       {/* Main content area with padding top to account for Navbar height */}
//       <Box pt="64px"> {/* Ensure padding matches Navbar height (h={16} = 64px) */}
//         <Routes>
//           {/* Public Routes */}
//           <Route path="/" element={<HomePage />} /> {/* Render HomePage at root */}
//           <Route path="/catalogue/:catalogueId" element={<CataloguePage />} />
//           <Route path="/product/:productId" element={<ProductDetailPage />} />
//           <Route path="/cart" element={<CartPage />} />
//           <Route path="/login" element={<LoginPage />} />

//           {/* Protected Routes */}
//           <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
//           <Route path="/orders" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />

//           {/* --- UPDATED ROUTE for Order Details --- */}
//           {/* Uses both catalogueId and orderId as parameters */}
//           <Route
//             path="/order-details/:catalogueId/:orderId"
//             element={<ProtectedRoute><OrderTrackingPage /></ProtectedRoute>}
//           />
//           {/* --- END UPDATED ROUTE --- */}
//           {/* Fallback route forr any undefined paths */}
//           <Route path="*" element={<NotFoundPage />} />
//         </Routes>
//       </Box>
//     </>
//   );
// }

// export default App;


// import React from 'react';
// import { Routes, Route } from 'react-router-dom';
// import CataloguePage from './pages/CataloguePage';
// import ProductDetailPage from './pages/ProductDetailPage';
// import CartPage from './pages/CartPage';
// import CheckoutPage from './pages/CheckoutPage';
// import LoginPage from './pages/LoginPage';
// import OrderHistoryPage from './pages/OrderHistoryPage';
// import OrderTrackingPage from './pages/OrderTrackingPage';
// import NotFoundPage from './pages/NotFoundPage';
// import HomePage from './pages/HomePage';
// import Navbar from './components/Navbar';
// import ProtectedRoute from './components/ProtectedRoute';
// import { Box } from '@chakra-ui/react';

// function App() {
//   return (
//     <>
//       <Navbar />
//       {/* Main content area with padding top to account for Navbar height */}
//       <Box pt="64px">
//         <Routes>
//           {/* --- Public Routes --- */}
//           <Route path="/" element={<HomePage />} /> {/* Home is public, but links will require login */}
//           <Route path="/login" element={<LoginPage />} />

//           {/* --- Protected Routes --- */}
//           {/* Catalogue access now requires login */}
//           <Route
//             path="/catalogue/:catalogueId"
//             element={
//               <ProtectedRoute>
//                 <CataloguePage />
//               </ProtectedRoute>
//             }
//           />

//           {/* Product details access now requires login */}
//           <Route
//             path="/product/:productId"
//             element={
//               <ProtectedRoute>
//                 <ProductDetailPage />
//               </ProtectedRoute>
//             }
//           />

//           {/* Cart access now requires login */}
//           <Route
//             path="/cart"
//             element={
//               <ProtectedRoute>
//                 <CartPage />
//               </ProtectedRoute>
//             }
//           />

//           {/* Checkout flow (already protected) */}
//           <Route
//             path="/checkout"
//             element={
//               <ProtectedRoute>
//                 <CheckoutPage />
//               </ProtectedRoute>
//             }
//           />

//           {/* Order History (already protected) */}
//           <Route
//             path="/orders"
//             element={
//               <ProtectedRoute>
//                 <OrderHistoryPage />
//               </ProtectedRoute>
//             }
//           />

//           {/* Order Details (already protected) */}
//           <Route
//             path="/order-details/:catalogueId/:orderId"
//             element={
//               <ProtectedRoute>
//                 <OrderTrackingPage />
//               </ProtectedRoute>
//             }
//           />

//           {/* Fallback for unknown routes */}
//           <Route path="*" element={<NotFoundPage />} />
//         </Routes>
//       </Box>
//     </>
//   );
// }

// export default App;


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
import ProtectedRoute from './components/ProtectedRoute';
import { Box } from '@chakra-ui/react';

function App() {
  return (
    <>
      <Navbar />
      {/* Main content area with padding top to account for Navbar height */}
      <Box pt="64px">
        <Routes>
          {/* Public Route: ONLY Login is public now */}
          <Route path="/login" element={<LoginPage />} />

          {/* --- Protected Routes --- */}
          {/* Home Page is now protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          {/* Catalogue access requires login */}
          <Route
            path="/catalogue/:catalogueId"
            element={
              <ProtectedRoute>
                <CataloguePage />
              </ProtectedRoute>
            }
          />

          {/* Product details access requires login */}
          <Route
            path="/product/:productId"
            element={
              <ProtectedRoute>
                <ProductDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Cart access requires login */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />

          {/* Checkout flow requires login */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />

          {/* Order History requires login */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderHistoryPage />
              </ProtectedRoute>
            }
          />

          {/* Order Details requires login */}
          <Route
            path="/order-details/:catalogueId/:orderId"
            element={
              <ProtectedRoute>
                <OrderTrackingPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback for unknown routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Box>
    </>
  );
}

export default App;