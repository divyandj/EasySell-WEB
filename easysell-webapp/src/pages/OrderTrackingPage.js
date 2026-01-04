// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import { doc, getDoc } from 'firebase/firestore';
// import { db } from '../firebase';
// import { useAuth } from '../context/AuthContext';
// import {
//   Container,
//   Heading,
//   Text,
//   VStack,
//   Box,
//   Spinner, // Keep Spinner import
//   Center,
//   Divider,
//   SimpleGrid,
//   Image,
//   Flex,
//   Tag,
//   Alert,
//   AlertIcon,
//   AlertTitle,
//   AlertDescription,
//   HStack,
//   Tooltip
// } from '@chakra-ui/react';
// import { getProxiedUrl } from '../config';
// import SpinnerComponent from '../components/Spinner'; // Use the dedicated Spinner component

// // Helper to format currency
// const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`; // Added default 0 for safety

// const OrderTrackingPage = () => {
//   // Get both catalogueId and orderId from the URL parameters using useParams
//   const { catalogueId, orderId } = useParams();

//   const { currentUser } = useAuth(); // Get current user from AuthContext
//   const [order, setOrder] = useState(null); // State to hold the fetched order data
//   const [loading, setLoading] = useState(true); // Loading state for data fetching
//   const [error, setError] = useState(null); // Error state for fetch errors or access issues

//   // Effect hook to fetch order data when component mounts or IDs/user change
//   useEffect(() => {
//     // Basic validation: Check if user is logged in and IDs are present in URL
//     if (!currentUser) {
//         setLoading(false);
//         setError("Please log in to view orders.");
//         return; // Stop execution if no user
//     }
//     if (!orderId || !catalogueId) {
//         setLoading(false);
//         setError("Order ID or Catalogue ID is missing from the URL.");
//         return; // Stop execution if IDs are missing
//     }

//     // Async function to fetch the order document
//     const fetchOrder = async () => {
//       setLoading(true); // Set loading true at the start of fetch
//       setError(null); // Clear previous errors on new fetch attempt
//       try {
//         // Construct the correct Firestore document path using both IDs
//         console.log(`Fetching order: /catalogues/${catalogueId}/orders/${orderId}`);
//         const orderRef = doc(db, 'catalogues', catalogueId, 'orders', orderId); // Path to the document in the subcollection

//         // Fetch the document data
//         const orderSnap = await getDoc(orderRef);

//         // Check if the document exists
//         if (orderSnap.exists()) {
//           const orderData = orderSnap.data();
//           // Security check: Ensure the fetched order belongs to the currently logged-in user
//           if (orderData.userId === currentUser.uid) {
//             setOrder({ id: orderSnap.id, ...orderData }); // Set the order state if user matches
//           } else {
//             // Logged in user does not own this order
//             setError("Access Denied: You do not have permission to view this order.");
//             console.warn(`User ${currentUser.uid} attempted to access order ${orderId} owned by ${orderData.userId}`);
//           }
//         } else {
//           // Order ID does not exist in the specified catalogue subcollection
//           setError(`Order with ID "${orderId}" (in catalogue "${catalogueId}") not found.`);
//         }
//       } catch (err) {
//         // Handle potential Firestore errors (network issues, permissions during fetch, etc.)
//         setError("Failed to fetch order details. Please check your connection or try again later.");
//         console.error("Fetch Order Error:", err);
//       } finally {
//         setLoading(false); // Set loading false when fetch attempt completes (success or fail)
//       }
//     };

//     fetchOrder(); // Execute the fetch function

//     // Dependency array ensures this effect runs if orderId, catalogueId, or currentUser changes
//   }, [orderId, catalogueId, currentUser]);

//   // --- Render Logic ---

//   // Display loading spinner while data is being fetched
//   if (loading) {
//       return <SpinnerComponent />;
//   }

//   // Display error message if fetching failed or access was denied
//   if (error) {
//     return (
//         <Container maxW="container.lg" py={8}>
//             <Alert status="error" borderRadius="md">
//                 <AlertIcon />
//                 <AlertTitle mr={2}>Error Loading Order!</AlertTitle>
//                 <AlertDescription>{error}</AlertDescription>
//             </Alert>
//         </Container>
//     );
//   }

//   // Handle case where fetch completes without error but order is still null (e.g., unexpected data issue)
//   if (!order) {
//       return <Center h="50vh"><Text>Order details could not be loaded.</Text></Center>;
//   }

//   // Destructure order data with defaults for safety before rendering
//   const { shippingAddress = {}, items = [], orderSubtotal = 0, orderTax = 0, totalAmount = 0, status = 'Unknown', orderDate } = order;

//   // --- Main Component JSX ---
//   return (
//     <Container maxW="container.lg" py={8}>
//       <VStack spacing={6} align="stretch">
//         {/* Order Header Section */}
//         <Box p={5} borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
//           <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
//             {/* Left side: Title, ID, Date */}
//             <Box>
//                 <Heading size="lg">Order Details</Heading>
//                 <Text color="gray.600" mt={2} fontSize="sm">Order ID: {order.id}</Text>
//                 <Text fontSize="sm" color="gray.500">
//                     {/* Format date using Indian locale preferences */}
//                     Placed On: {orderDate?.toDate ? orderDate.toDate().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
//                 </Text>
//             </Box>
//             {/* Right side: Status Tag */}
//             <Tag
//               size="lg"
//               variant="subtle"
//               // Dynamic color scheme based on order status
//               colorScheme={
//                 status === 'Placed' ? 'blue' :
//                 status === 'Shipped' ? 'orange' :
//                 status === 'Delivered' ? 'green' :
//                 status === 'Cancelled' ? 'red' : 'gray' // Example for cancelled status
//               }
//             >
//               Status: {status}
//             </Tag>
//           </Flex>
//         </Box>

//         {/* Items Purchased Section */}
//         <Box>
//             <Heading size="md" mb={4}>Items Purchased</Heading>
//             <VStack spacing={4} align="stretch">
//               {/* Map through items array (ensure it's an array first) */}
//               {Array.isArray(items) && items.map((item, index) => {
//                 // Provide default empty objects for safety if priceDetails or productSnapshot is missing
//                 const priceDetails = item.priceDetails || {};
//                 const productSnapshot = item.productSnapshot || {};
//                 // Safely format variant options into a string
//                 const variantOptions = item.variant?.options ? Object.entries(item.variant.options).map(([key, value]) => `${key}: ${value}`).join(', ') : '';

//                 // Render each item
//                 return (
//                     <Flex
//                         key={`${item.productId}-${index}`} // Use productId and index for a more stable key
//                         align={{base: 'flex-start', md: 'center'}} // Align items differently on mobile vs desktop
//                         p={4}
//                         borderWidth="1px"
//                         borderColor="gray.200"
//                         borderRadius="md"
//                         direction={{base: 'column', md: 'row'}} // Stack vertically on mobile, horizontally on desktop
//                         gap={4} // Consistent gap between elements
//                     >
//                       {/* Item Image */}
//                       <Image
//                         // Safely get image URL (item image or variant image) using proxy
//                         src={getProxiedUrl(item.imageUrl || item.variant?.imageUrl)}
//                         boxSize={{base: '60px', md: '80px'}} // Smaller image on mobile
//                         objectFit="cover"
//                         borderRadius="md"
//                         // Placeholder using first letter of title if available
//                         fallbackSrc={`https://via.placeholder.com/80?text=${item.title ? item.title[0] : '?'}`}
//                         mr={{md: 4}} // Margin right only on medium+ screens
//                         alt={item.title || 'Product Image'} // Alt text for accessibility
//                       />
//                       {/* Item Details (Title, Variant, Qty, Unit Price Breakdown) */}
//                       <VStack align="start" spacing={1} flex="1" w="full">
//                         <Text fontWeight="semibold">{item.title || 'Product Title Missing'}</Text>
//                         {/* Display variant options if they exist */}
//                         {variantOptions && (
//                           <Text fontSize="sm" color="gray.500">
//                             {variantOptions}
//                           </Text>
//                         )}
//                         <Text fontSize="sm" color="gray.600">Qty: {item.quantity || 1}</Text>
//                         {/* Display Unit Price Info with Tooltip for detailed breakdown */}
//                         <Tooltip
//                             // Multiline label showing price calculation steps
//                             label={
//                             `Price/unit: ${formatCurrency(priceDetails.effectiveUnitPricePreTax)}
//                             + Tax/unit: ${formatCurrency(priceDetails.taxAmountUnit)} (${productSnapshot.taxRate || 0}%)
//                             = Total/unit: ${formatCurrency(priceDetails.finalUnitPriceWithTax)}
//                             ${(priceDetails.discountAmountUnit > 0 || priceDetails.bulkDiscountAmountUnit > 0) ? `(Saved ${formatCurrency((priceDetails.discountAmountUnit || 0) + (priceDetails.bulkDiscountAmountUnit || 0))}/unit)` : ''}` // Show savings if applicable
//                             }
//                             aria-label='Price breakdown per unit' // Accessibility label
//                             bg='gray.700' color='white' placement='bottom-start' hasArrow whiteSpace='pre-line' p={2} borderRadius="md" // Styling
//                         >
//                             {/* Text displayed on page, triggering tooltip on hover */}
//                             <Text fontSize="xs" color="gray.500" cursor="help" mt={1}>
//                                 {formatCurrency(priceDetails.finalUnitPriceWithTax)} / unit (incl. tax) {productSnapshot.priceUnit ? ` ${productSnapshot.priceUnit}` : ''}
//                             </Text>
//                         </Tooltip>
//                       </VStack>

//                       {/* Line Item Total (Subtotal + Tax) */}
//                       <VStack align={{ base: 'start', md: 'end'}} spacing={0} w={{base: 'full', md: 'auto'}} mt={{base: 2, md: 0}}>
//                           <Text fontWeight="semibold" fontSize="md">{formatCurrency(priceDetails.lineItemTotal)}</Text>
//                           <Text fontSize="xs" color="gray.500">
//                             (Subtotal: {formatCurrency(priceDetails.lineItemSubtotal)}, Tax: {formatCurrency(priceDetails.lineItemTax)})
//                           </Text>
//                       </VStack>
//                     </Flex>
//                 )
//               })}
//             </VStack>
//         </Box>

//         {/* Order Summary & Shipping Details Grid */}
//         <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} pt={4}>
//           {/* Shipping Address Box */}
//           <Box p={5} borderWidth="1px" borderColor="gray.200" borderRadius="md">
//             <Heading size="sm" mb={3}>Shipping Address</Heading>
//             <VStack align="stretch" spacing={1} fontSize="sm">
//                 {/* Safely access shipping address fields with defaults */}
//                 <Text>{shippingAddress.name || 'N/A'}</Text>
//                 <Text>{shippingAddress.address || 'N/A'}</Text>
//                 <Text>{shippingAddress.city || 'N/A'}, {shippingAddress.pincode || 'N/A'}</Text>
//                 <Text>Phone: {shippingAddress.phone || 'N/A'}</Text>
//             </VStack>
//           </Box>
//           {/* Order Totals Box */}
//           <Box p={5} borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
//             <Heading size="sm" mb={3}>Order Totals</Heading>
//             <VStack align="stretch" spacing={2} fontSize="sm">
//                  {/* Subtotal */}
//                  <HStack justifyContent="space-between">
//                      <Text color="gray.600">Subtotal (excl. tax)</Text>
//                      <Text fontWeight="medium">{formatCurrency(orderSubtotal)}</Text>
//                  </HStack>
//                  {/* Taxes */}
//                  <HStack justifyContent="space-between">
//                      <Text color="gray.600">Taxes</Text>
//                      <Text fontWeight="medium">{formatCurrency(orderTax)}</Text>
//                  </HStack>
//                  {/* Placeholder for Shipping Costs - Add if needed in orderData */}
//                  {/* <HStack justifyContent="space-between">
//                      <Text color="gray.600">Shipping</Text>
//                      <Text fontWeight="medium">{formatCurrency(order.shippingCost || 0)}</Text>
//                  </HStack> */}
//                  <Divider my={1}/>
//                  {/* Grand Total */}
//                  <HStack justifyContent="space-between" pt={1}>
//                      <Text fontWeight="bold" fontSize="md">Grand Total</Text>
//                      <Text fontWeight="bold" fontSize="lg" color="teal.600">{formatCurrency(totalAmount)}</Text>
//                  </HStack>
//             </VStack>
//           </Box>
//         </SimpleGrid>
//       </VStack>
//     </Container>
//   );
// };

// export default OrderTrackingPage;


import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Heading,
  Text,
  VStack,
  Box,
  Spinner, // Keep Spinner import
  Center,
  Divider,
  SimpleGrid,
  Image,
  Flex,
  Tag,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  Tooltip
} from '@chakra-ui/react';
import SpinnerComponent from '../components/Spinner'; // Use the dedicated Spinner component

// Helper to format currency
const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`; // Added default 0 for safety

const OrderTrackingPage = () => {
  // Get both catalogueId and orderId from the URL parameters using useParams
  const { catalogueId, orderId } = useParams();

  const { currentUser } = useAuth(); // Get current user from AuthContext
  const [order, setOrder] = useState(null); // State to hold the fetched order data
  const [loading, setLoading] = useState(true); // Loading state for data fetching
  const [error, setError] = useState(null); // Error state for fetch errors or access issues

  // Effect hook to fetch order data when component mounts or IDs/user change
  useEffect(() => {
    // Basic validation: Check if user is logged in and IDs are present in URL
    if (!currentUser) {
        setLoading(false);
        setError("Please log in to view orders.");
        return; // Stop execution if no user
    }
    if (!orderId || !catalogueId) {
        setLoading(false);
        setError("Order ID or Catalogue ID is missing from the URL.");
        return; // Stop execution if IDs are missing
    }

    // Async function to fetch the order document
    const fetchOrder = async () => {
      setLoading(true); // Set loading true at the start of fetch
      setError(null); // Clear previous errors on new fetch attempt
      try {
        // Construct the correct Firestore document path using both IDs
        console.log(`Fetching order: /catalogues/${catalogueId}/orders/${orderId}`);
        const orderRef = doc(db, 'catalogues', catalogueId, 'orders', orderId); // Path to the document in the subcollection

        // Fetch the document data
        const orderSnap = await getDoc(orderRef);

        // Check if the document exists
        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          // Security check: Ensure the fetched order belongs to the currently logged-in user
          if (orderData.userId === currentUser.uid) {
            setOrder({ id: orderSnap.id, ...orderData }); // Set the order state if user matches
          } else {
            // Logged in user does not own this order
            setError("Access Denied: You do not have permission to view this order.");
            console.warn(`User ${currentUser.uid} attempted to access order ${orderId} owned by ${orderData.userId}`);
          }
        } else {
          // Order ID does not exist in the specified catalogue subcollection
          setError(`Order with ID "${orderId}" (in catalogue "${catalogueId}") not found.`);
        }
      } catch (err) {
        // Handle potential Firestore errors (network issues, permissions during fetch, etc.)
        setError("Failed to fetch order details. Please check your connection or try again later.");
        console.error("Fetch Order Error:", err);
      } finally {
        setLoading(false); // Set loading false when fetch attempt completes (success or fail)
      }
    };

    fetchOrder(); // Execute the fetch function

    // Dependency array ensures this effect runs if orderId, catalogueId, or currentUser changes
  }, [orderId, catalogueId, currentUser]);

  // --- Render Logic ---

  // Display loading spinner while data is being fetched
  if (loading) {
      return <SpinnerComponent />;
  }

  // Display error message if fetching failed or access was denied
  if (error) {
    return (
        <Container maxW="container.lg" py={8}>
            <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertTitle mr={2}>Error Loading Order!</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </Container>
    );
  }

  // Handle case where fetch completes without error but order is still null (e.g., unexpected data issue)
  if (!order) {
      return <Center h="50vh"><Text>Order details could not be loaded.</Text></Center>;
  }

  // Destructure order data with defaults for safety before rendering
  const { shippingAddress = {}, items = [], orderSubtotal = 0, orderTax = 0, totalAmount = 0, status = 'Unknown', orderDate } = order;

  // --- Main Component JSX ---
  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Order Header Section */}
        <Box p={5} borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
          <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
            {/* Left side: Title, ID, Date */}
            <Box>
                <Heading size="lg">Order Details</Heading>
                <Text color="gray.600" mt={2} fontSize="sm">Order ID: {order.id}</Text>
                <Text fontSize="sm" color="gray.500">
                    {/* Format date using Indian locale preferences */}
                    Placed On: {orderDate?.toDate ? orderDate.toDate().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                </Text>
            </Box>
            {/* Right side: Status Tag */}
            <Tag
              size="lg"
              variant="subtle"
              // Dynamic color scheme based on order status
              colorScheme={
                status === 'Placed' ? 'blue' :
                status === 'Shipped' ? 'orange' :
                status === 'Delivered' ? 'green' :
                status === 'Cancelled' ? 'red' : 'gray' // Example for cancelled status
              }
            >
              Status: {status}
            </Tag>
          </Flex>
        </Box>

        {/* Items Purchased Section */}
        <Box>
            <Heading size="md" mb={4}>Items Purchased</Heading>
            <VStack spacing={4} align="stretch">
              {/* Map through items array (ensure it's an array first) */}
              {Array.isArray(items) && items.map((item, index) => {
                // Provide default empty objects for safety if priceDetails or productSnapshot is missing
                const priceDetails = item.priceDetails || {};
                const productSnapshot = item.productSnapshot || {};
                // Safely format variant options into a string
                const variantOptions = item.variant?.options ? Object.entries(item.variant.options).map(([key, value]) => `${key}: ${value}`).join(', ') : '';

                // Render each item
                return (
                    <Flex
                        key={`${item.productId}-${index}`} // Use productId and index for a more stable key
                        align={{base: 'flex-start', md: 'center'}} // Align items differently on mobile vs desktop
                        p={4}
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        direction={{base: 'column', md: 'row'}} // Stack vertically on mobile, horizontally on desktop
                        gap={4} // Consistent gap between elements
                    >
                      {/* Item Image */}
                      <Image
                        // Safely get image URL (item image or variant image) directly from Cloudinary data
                        src={item.imageUrl || item.variant?.imageUrl}
                        boxSize={{base: '60px', md: '80px'}} // Smaller image on mobile
                        objectFit="cover"
                        borderRadius="md"
                        // Placeholder using first letter of title if available
                        fallbackSrc={`https://via.placeholder.com/80?text=${item.title ? item.title[0] : '?'}`}
                        mr={{md: 4}} // Margin right only on medium+ screens
                        alt={item.title || 'Product Image'} // Alt text for accessibility
                      />
                      {/* Item Details (Title, Variant, Qty, Unit Price Breakdown) */}
                      <VStack align="start" spacing={1} flex="1" w="full">
                        <Text fontWeight="semibold">{item.title || 'Product Title Missing'}</Text>
                        {/* Display variant options if they exist */}
                        {variantOptions && (
                          <Text fontSize="sm" color="gray.500">
                            {variantOptions}
                          </Text>
                        )}
                        <Text fontSize="sm" color="gray.600">Qty: {item.quantity || 1}</Text>
                        {/* Display Unit Price Info with Tooltip for detailed breakdown */}
                        <Tooltip
                            // Multiline label showing price calculation steps
                            label={
                            `Price/unit: ${formatCurrency(priceDetails.effectiveUnitPricePreTax)}
                            + Tax/unit: ${formatCurrency(priceDetails.taxAmountUnit)} (${productSnapshot.taxRate || 0}%)
                            = Total/unit: ${formatCurrency(priceDetails.finalUnitPriceWithTax)}
                            ${(priceDetails.discountAmountUnit > 0 || priceDetails.bulkDiscountAmountUnit > 0) ? `(Saved ${formatCurrency((priceDetails.discountAmountUnit || 0) + (priceDetails.bulkDiscountAmountUnit || 0))}/unit)` : ''}` // Show savings if applicable
                            }
                            aria-label='Price breakdown per unit' // Accessibility label
                            bg='gray.700' color='white' placement='bottom-start' hasArrow whiteSpace='pre-line' p={2} borderRadius="md" // Styling
                        >
                            {/* Text displayed on page, triggering tooltip on hover */}
                            <Text fontSize="xs" color="gray.500" cursor="help" mt={1}>
                                {formatCurrency(priceDetails.finalUnitPriceWithTax)} / unit (incl. tax) {productSnapshot.priceUnit ? ` ${productSnapshot.priceUnit}` : ''}
                            </Text>
                        </Tooltip>
                      </VStack>

                      {/* Line Item Total (Subtotal + Tax) */}
                      <VStack align={{ base: 'start', md: 'end'}} spacing={0} w={{base: 'full', md: 'auto'}} mt={{base: 2, md: 0}}>
                          <Text fontWeight="semibold" fontSize="md">{formatCurrency(priceDetails.lineItemTotal)}</Text>
                          <Text fontSize="xs" color="gray.500">
                            (Subtotal: {formatCurrency(priceDetails.lineItemSubtotal)}, Tax: {formatCurrency(priceDetails.lineItemTax)})
                          </Text>
                      </VStack>
                    </Flex>
                )
              })}
            </VStack>
        </Box>

        {/* Order Summary & Shipping Details Grid */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} pt={4}>
          {/* Shipping Address Box */}
          <Box p={5} borderWidth="1px" borderColor="gray.200" borderRadius="md">
            <Heading size="sm" mb={3}>Shipping Address</Heading>
            <VStack align="stretch" spacing={1} fontSize="sm">
                {/* Safely access shipping address fields with defaults */}
                <Text>{shippingAddress.name || 'N/A'}</Text>
                <Text>{shippingAddress.address || 'N/A'}</Text>
                <Text>{shippingAddress.city || 'N/A'}, {shippingAddress.pincode || 'N/A'}</Text>
                <Text>Phone: {shippingAddress.phone || 'N/A'}</Text>
            </VStack>
          </Box>
          {/* Order Totals Box */}
          <Box p={5} borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
            <Heading size="sm" mb={3}>Order Totals</Heading>
            <VStack align="stretch" spacing={2} fontSize="sm">
                 {/* Subtotal */}
                 <HStack justifyContent="space-between">
                     <Text color="gray.600">Subtotal (excl. tax)</Text>
                     <Text fontWeight="medium">{formatCurrency(orderSubtotal)}</Text>
                 </HStack>
                 {/* Taxes */}
                 <HStack justifyContent="space-between">
                     <Text color="gray.600">Taxes</Text>
                     <Text fontWeight="medium">{formatCurrency(orderTax)}</Text>
                 </HStack>
                 {/* Placeholder for Shipping Costs - Add if needed in orderData */}
                 {/* <HStack justifyContent="space-between">
                     <Text color="gray.600">Shipping</Text>
                     <Text fontWeight="medium">{formatCurrency(order.shippingCost || 0)}</Text>
                 </HStack> */}
                 <Divider my={1}/>
                 {/* Grand Total */}
                 <HStack justifyContent="space-between" pt={1}>
                     <Text fontWeight="bold" fontSize="md">Grand Total</Text>
                     <Text fontWeight="bold" fontSize="lg" color="teal.600">{formatCurrency(totalAmount)}</Text>
                 </HStack>
            </VStack>
          </Box>
        </SimpleGrid>
      </VStack>
    </Container>
  );
};

export default OrderTrackingPage;