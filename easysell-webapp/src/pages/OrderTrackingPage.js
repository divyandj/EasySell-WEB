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
  Spinner,
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
  Tooltip,
  useColorModeValue,
  Icon
} from '@chakra-ui/react';
import SpinnerComponent from '../components/Spinner';

// Helper to format currency
const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

const OrderTrackingPage = () => {
  const { catalogueId, orderId } = useParams();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- THEME COLORS ---
  const bgCard = useColorModeValue('white', 'whiteAlpha.50');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const brandColor = useColorModeValue('teal.600', 'brand.300');
  const sectionBg = useColorModeValue('gray.50', 'whiteAlpha.50');

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setError("Please log in to view orders.");
      return;
    }
    if (!orderId || !catalogueId) {
      setLoading(false);
      setError("Order ID or Catalogue ID is missing from the URL.");
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`Fetching order: /catalogues/${catalogueId}/orders/${orderId}`);
        const orderRef = doc(db, 'catalogues', catalogueId, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          if (orderData.userId === currentUser.uid) {
            setOrder({ id: orderSnap.id, ...orderData });
          } else {
            setError("Access Denied: You do not have permission to view this order.");
          }
        } else {
          setError(`Order with ID "${orderId}" not found.`);
        }
      } catch (err) {
        setError("Failed to fetch order details. Please check your connection.");
        console.error("Fetch Order Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, catalogueId, currentUser]);

  if (loading) return <SpinnerComponent />;

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

  if (!order) return <Center h="50vh"><Text>Order details could not be loaded.</Text></Center>;

  const { shippingAddress = {}, items = [], orderSubtotal = 0, orderTax = 0, totalAmount = 0, status = 'Unknown', orderDate } = order;

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">

        {/* --- ORDER HEADER --- */}
        <Box p={5} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" bg={bgCard} shadow="sm">
          <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
            <Box>
              <Heading size="lg" mb={1}>Order Details</Heading>
              <Text color={textColor} mt={2} fontSize="sm">Order ID: {order.id}</Text>
              <Text fontSize="sm" color={mutedColor}>
                Placed On: {orderDate?.toDate ? orderDate.toDate().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
              </Text>
            </Box>
            <Tag size="lg" variant="subtle" colorScheme={status === 'Placed' ? 'blue' : status === 'Shipped' ? 'orange' : status === 'Delivered' ? 'green' : status === 'Cancelled' ? 'red' : 'gray'}>
              Status: {status}
            </Tag>
          </Flex>
        </Box>

        {/* --- TRACKING PROGRESS STEPPER --- */}
        <Box p={6} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" bg={bgCard} shadow="sm">
          <Heading size="md" mb={6}>Order Progress</Heading>

          <Box position="relative">
            {/* Background Track */}
            <Box position="absolute" top="15px" left="0" w="full" h="4px" bg={sectionBg} borderRadius="full" zIndex={0} />

            {/* Active Track */}
            <Box
              position="absolute"
              top="15px"
              left="0"
              w={status === 'Placed' ? '15%' : status === 'Processing' ? '50%' : status === 'Shipped' ? '80%' : status === 'Delivered' ? '100%' : '0%'}
              h="4px"
              bg={status === 'Cancelled' ? 'red.400' : "brand.500"}
              borderRadius="full"
              zIndex={0}
              transition="width 1s ease-in-out"
            />

            <Flex justify="space-between" position="relative" zIndex={1}>
              {['Placed', 'Processing', 'Shipped', 'Delivered'].map((step, index) => {
                const steps = ['Placed', 'Processing', 'Shipped', 'Delivered'];
                const currentStatusIndex = steps.indexOf(status);
                const isCompleted = currentStatusIndex >= index;
                const isCurrent = currentStatusIndex === index;
                const isCancelled = status === 'Cancelled';

                return (
                  <VStack key={step} spacing={2} align="center" w="24%">
                    <Flex
                      align="center"
                      justify="center"
                      w="32px"
                      h="32px"
                      borderRadius="full"
                      bg={isCancelled ? 'red.500' : (isCompleted ? "brand.500" : sectionBg)}
                      borderWidth="2px"
                      borderColor={isCancelled ? 'red.500' : (isCompleted ? "brand.500" : borderColor)}
                      color={isCompleted || isCancelled ? "white" : mutedColor}
                      transition="all 0.4s"
                    >
                      {isCompleted ? <Icon as={require('react-icons/fi').FiCheck} /> : <Text fontSize="xs" fontWeight="bold">{index + 1}</Text>}
                    </Flex>
                    <Text fontSize={{ base: "xs", md: "sm" }} fontWeight={isCurrent ? "bold" : "medium"} color={isCurrent ? textColor : mutedColor} textAlign="center">{step}</Text>
                  </VStack>
                );
              })}
            </Flex>

            {status === 'Cancelled' && (
              <Flex justify="center" mt={4}>
                <Tag colorScheme="red" size="lg" variant="solid">ORDER CANCELLED</Tag>
              </Flex>
            )}
          </Box>
        </Box>

        {/* --- ITEMS SECTION --- */}
        <Box>
          <Heading size="md" mb={4}>Items Purchased</Heading>
          <VStack spacing={4} align="stretch">
            {items.map((item, index) => {
              const priceDetails = item.priceDetails || {};
              const productSnapshot = item.productSnapshot || {};
              const variantOptions = item.variant?.options ? Object.entries(item.variant.options).map(([key, value]) => `${key}: ${value}`).join(', ') : '';

              return (
                <Flex key={`${item.productId}-${index}`} align={{ base: 'flex-start', md: 'center' }} p={4} borderWidth="1px" borderColor={borderColor} borderRadius="xl" direction={{ base: 'column', md: 'row' }} gap={4}>
                  <Image src={item.imageUrl || item.variant?.imageUrl} boxSize={{ base: '60px', md: '80px' }} objectFit="cover" borderRadius="md" fallbackSrc="https://via.placeholder.com/80" />
                  <VStack align="start" spacing={1} flex="1" w="full">
                    <Text fontWeight="semibold">{item.title}</Text>
                    {variantOptions && <Text fontSize="sm" color={mutedColor}>{variantOptions}</Text>}
                    <Text fontSize="sm" color={mutedColor}>Qty: {item.quantity}</Text>
                    <Tooltip label={`Price/unit: ${formatCurrency(priceDetails.effectiveUnitPricePreTax)}\n+ Tax: ${formatCurrency(priceDetails.taxAmountUnit)}\n= Total: ${formatCurrency(priceDetails.finalUnitPriceWithTax)}`} aria-label='Price breakdown' bg='gray.700' color='white' placement='bottom-start' hasArrow whiteSpace='pre-line' p={2}>
                      <Text fontSize="xs" color={mutedColor} cursor="help" mt={1}>{formatCurrency(priceDetails.finalUnitPriceWithTax)} / unit</Text>
                    </Tooltip>
                  </VStack>
                  <VStack align={{ base: 'start', md: 'end' }}>
                    <Text fontWeight="semibold" fontSize="md" color={textColor}>{formatCurrency(priceDetails.lineItemTotal)}</Text>
                    <Text fontSize="xs" color={mutedColor}>(Subtotal: {formatCurrency(priceDetails.lineItemSubtotal)}, Tax: {formatCurrency(priceDetails.lineItemTax)})</Text>
                  </VStack>
                </Flex>
              );
            })}
          </VStack>
        </Box>

        {/* --- SUMMARY SECTION --- */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} pt={4}>
          <Box p={5} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" bg={bgCard}>
            <Heading size="sm" mb={3}>Shipping Address</Heading>
            <VStack align="stretch" spacing={1} fontSize="sm" color={textColor}>
              <Text>{shippingAddress.name}</Text>
              <Text>{shippingAddress.address}</Text>
              <Text>{shippingAddress.city}, {shippingAddress.pincode}</Text>
              <Text>Phone: {shippingAddress.phone}</Text>
            </VStack>
          </Box>
          <Box p={5} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" bg={sectionBg}>
            <Heading size="sm" mb={3}>Order Totals</Heading>
            <VStack align="stretch" spacing={2} fontSize="sm">
              <HStack justify="space-between"><Text color={mutedColor}>Subtotal</Text><Text fontWeight="medium" color={textColor}>{formatCurrency(orderSubtotal)}</Text></HStack>
              <HStack justify="space-between"><Text color={mutedColor}>Taxes</Text><Text fontWeight="medium" color={textColor}>{formatCurrency(orderTax)}</Text></HStack>
              <Divider my={1} borderColor={borderColor} />
              <HStack justify="space-between" pt={1}><Text fontWeight="bold" fontSize="md" color={textColor}>Grand Total</Text><Text fontWeight="bold" fontSize="lg" color={brandColor}>{formatCurrency(totalAmount)}</Text></HStack>
            </VStack>
          </Box>
        </SimpleGrid>

      </VStack>
    </Container>
  );
};

export default OrderTrackingPage;