import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
// Import collectionGroup
import { collectionGroup, query, where, getDocs, orderBy } from 'firebase/firestore';
import {
  Container,
  Heading,
  VStack,
  Box,
  Text,
  Center,
  Tag,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import SpinnerComponent from '../components/Spinner';

// Helper to format currency
const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

const OrderHistoryPage = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Stop fetching if user is not logged in
    if (!currentUser) {
      setLoading(false);
      setOrders([]); // Clear orders if user logs out
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      setError(null); // Reset error before fetching
      try {
        // --- UPDATED QUERY: Use collectionGroup ---
        console.log(`Fetching orders for user: ${currentUser.uid} using collectionGroup`);
        const ordersQuery = query(
          collectionGroup(db, 'orders'), // Query across all 'orders' subcollections
          where('userId', '==', currentUser.uid),
          orderBy('orderDate', 'desc')
        );
        // --- END UPDATED QUERY ---

        const querySnapshot = await getDocs(ordersQuery);
        console.log(`Found ${querySnapshot.docs.length} orders.`);

        // Map the data, extracting catalogueId from the parent path
        const userOrders = querySnapshot.docs.map(doc => {
          // Path: /catalogues/{catalogueId}/orders/{orderId}
          // doc.ref.parent.parent gives the specific catalogue document reference
          const catalogueId = doc.ref.parent.parent?.id; // Safely get the catalogue ID
          if (!catalogueId) {
              console.warn(`Could not determine catalogueId for order ${doc.id}`);
          }
          return {
            id: doc.id, // The order ID
            catalogueId: catalogueId || 'unknown', // Store catalogueId with the order data
            ...doc.data(), // Spread the rest of the order data
          };
        });

        setOrders(userOrders);

      } catch (err) {
        console.error("Error fetching orders:", err);
        // Check if the error is about a missing index
        if (err.code === 'failed-precondition') {
             setError("Firestore requires an index for this query. Please check the browser console for a link to create it automatically.");
             // Log the specific error which might contain the index creation link
             console.error("Firestore Index Error:", err);
        } else {
            // General error message
            setError("We couldn't load your orders. Please try again later.");
        }
      } finally {
        setLoading(false); // Stop loading regardless of success or failure
      }
    };

    fetchOrders(); // Execute the fetch function

  }, [currentUser]); // Re-run effect if the currentUser object changes (login/logout)

  // --- Render Logic ---

  // Show loading spinner
  if (loading) {
    return <SpinnerComponent />;
  }

  // Show error message
  if (error) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle mr={2}>Error Loading Orders!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          {/* Optionally add instructions or a retry button */}
        </Alert>
      </Container>
    );
  }

  // Prompt to log in if not logged in after loading state
  if (!currentUser) {
      return (
        <Container maxW="container.lg" py={8} centerContent>
            <Text>Please log in to view your order history.</Text>
            {/* Optionally add a login button */}
            {/* <Button mt={4} colorScheme="teal" as={RouterLink} to="/login">Login</Button> */}
        </Container>
      )
  }

  // Main content rendering
  return (
    <Container maxW="container.lg" py={8}>
      <Heading mb={6} size="lg">My Order History</Heading>
      {/* Show message if logged in but no orders found */}
      {orders.length === 0 ? (
         <Center h="40vh" flexDirection="column">
             <Text fontSize="xl">You haven't placed any orders yet.</Text>
             <Button mt={4} colorScheme="teal" as={RouterLink} to="/">
                 Start Shopping
             </Button>
         </Center>
      ) : (
        // List the orders
        <VStack spacing={4} align="stretch">
          {orders.map(order => (
            // ** UPDATE LINK **: Use catalogueId and order.id for the new route structure
            <Box
              key={order.id} // Use unique order ID as key
              p={5}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              // Define the new path structure (route to be created in App.js next)
              as={RouterLink}
              to={`/order-details/${order.catalogueId}/${order.id}`} // <-- Updated Link Path
              _hover={{ bg: 'gray.50', shadow: 'sm' }}
              transition="background-color 0.2s ease-out, box-shadow 0.2s ease-out"
            >
              <Flex justifyContent="space-between" alignItems="center" wrap="wrap" gap={2}>
                {/* Order ID and Date */}
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.600" noOfLines={1}>Order ID: {order.id}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {/* Safely format date */}
                    Placed on: {order.orderDate?.toDate ? order.orderDate.toDate().toLocaleDateString('en-IN') : 'N/A'}
                  </Text>
                  {/* Optional: Show catalogue ID for debugging */}
                  {/* <Text fontSize="xs" color="gray.400">Catalogue: {order.catalogueId}</Text> */}
                </Box>
                {/* Status and Total Amount */}
                <VStack align="end" spacing={1}>
                  <Tag
                    size="sm"
                    variant="subtle"
                    // Dynamic color scheme based on order status
                    colorScheme={
                      order.status === 'Placed' ? 'blue' :
                      order.status === 'Shipped' ? 'orange' :
                      order.status === 'Delivered' ? 'green' :
                      order.status === 'Cancelled' ? 'red' : 'gray' // Added Cancelled status example
                    }
                  >
                    {order.status || 'Unknown'}
                  </Tag>
                  {/* Format total amount */}
                  <Text fontWeight="bold" color="teal.600">{formatCurrency(order.totalAmount || 0)}</Text>
                </VStack>
              </Flex>
            </Box>
          ))}
        </VStack>
      )}
    </Container>
  );
};

export default OrderHistoryPage;