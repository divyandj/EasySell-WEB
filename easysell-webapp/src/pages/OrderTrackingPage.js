import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  Container, Heading, Text, VStack, Box, Center, Divider,
  SimpleGrid, Image, Flex, Alert, AlertIcon, AlertTitle,
  AlertDescription, HStack, Tooltip, useColorModeValue, Icon, Badge
} from '@chakra-ui/react';
import { FiCheck, FiPackage, FiClock, FiTruck, FiCheckCircle, FiMapPin } from 'react-icons/fi';
import SpinnerComponent from '../components/Spinner';

const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

const OrderTrackingPage = () => {
  const { catalogueId, orderId } = useParams();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pageBg = useColorModeValue('#F8F9FC', '#09090B');
  const cardBg = useColorModeValue('white', '#111116');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const priceColor = useColorModeValue('brand.600', 'brand.300');
  const altBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const successColor = useColorModeValue('green.600', 'green.300');

  useEffect(() => {
    if (!currentUser) { setLoading(false); setError("Please log in to view orders."); return; }
    if (!orderId || !catalogueId) { setLoading(false); setError("Order ID or Catalogue ID is missing."); return; }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const orderRef = doc(db, 'catalogues', catalogueId, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          if (orderData.userId === currentUser.uid) {
            setOrder({ id: orderSnap.id, ...orderData });
          } else {
            setError("Access Denied: You don't have permission to view this order.");
          }
        } else {
          setError(`Order "${orderId}" not found.`);
        }
      } catch (err) {
        setError("Failed to fetch order details.");
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
      <Box bg={pageBg} minH="80vh">
        <Container maxW="container.lg" py={12}>
          <Alert status="error" borderRadius="12px">
            <AlertIcon />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </Container>
      </Box>
    );
  }

  if (!order) return <Center h="50vh" bg={pageBg}><Text color={mutedColor}>Order not found.</Text></Center>;

  const {
    shippingAddress = {},
    items = [],
    orderSubtotal = 0,
    orderTax = 0,
    rewardDiscount = 0,
    rewardRedeemed = null,
    totalAmount = 0,
    status = 'Unknown',
    orderDate
  } = order;
  const steps = ['Placed', 'Processing', 'Shipped', 'Delivered'];
  const currentIdx = steps.indexOf(status);
  const isCancelled = status === 'Cancelled';

  return (
    <Box minH="100vh" bg={pageBg} py={{ base: 6, md: 10 }}>
      <Container maxW="container.lg">
        <VStack spacing={6} align="stretch">

          {/* Header */}
          <Box p={6} borderWidth="1px" borderColor={borderColor} borderRadius="16px" bg={cardBg} boxShadow="card">
            <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
              <Box>
                <Heading fontSize={{ base: 'lg', md: 'xl' }} color={textColor} fontWeight="800" letterSpacing="-0.02em">
                  Order Details
                </Heading>
                <Text fontSize="xs" color={mutedColor} mt={1}>ID: {order.id}</Text>
                <Text fontSize="xs" color={mutedColor}>
                  {orderDate?.toDate ? orderDate.toDate().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                </Text>
              </Box>
              <Badge
                borderRadius="full"
                px={4}
                py={1.5}
                fontSize="xs"
                fontWeight="700"
                colorScheme={status === 'Placed' ? 'blue' : status === 'Processing' ? 'purple' : status === 'Shipped' ? 'orange' : status === 'Delivered' ? 'green' : status === 'Cancelled' ? 'red' : 'gray'}
              >
                {status}
              </Badge>
            </Flex>
          </Box>

          {/* Progress Stepper */}
          <Box p={6} borderWidth="1px" borderColor={borderColor} borderRadius="16px" bg={cardBg} boxShadow="card">
            <Text fontSize="xs" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="0.1em" mb={5}>
              Order Progress
            </Text>

            <Box position="relative">
              {/* Track BG */}
              <Box position="absolute" top="16px" left="0" w="full" h="3px" bg={altBg} borderRadius="full" zIndex={0} />
              {/* Active */}
              <Box
                position="absolute"
                top="16px"
                left="0"
                w={isCancelled ? '0%' : currentIdx === 0 ? '10%' : currentIdx === 1 ? '40%' : currentIdx === 2 ? '70%' : currentIdx === 3 ? '100%' : '0%'}
                h="3px"
                bg={isCancelled ? 'red.400' : 'brand.500'}
                borderRadius="full"
                transition="width 0.8s ease"
              />

              <Flex justify="space-between" position="relative" zIndex={1}>
                {steps.map((step, index) => {
                  const isCompleted = currentIdx >= index;
                  const isCurrent = currentIdx === index;
                  const stepIcons = [FiPackage, FiClock, FiTruck, FiCheckCircle];

                  return (
                    <VStack key={step} spacing={2} align="center" w="24%">
                      <Flex
                        w={8} h={8}
                        borderRadius="full"
                        bg={isCancelled ? (index === 0 ? 'red.500' : altBg) : (isCompleted ? 'brand.500' : altBg)}
                        color={isCompleted || (isCancelled && index === 0) ? 'white' : mutedColor}
                        align="center" justify="center"
                        transition="all 0.3s"
                        boxShadow={isCurrent && !isCancelled ? '0 0 0 4px rgba(108,92,231,0.2)' : 'none'}
                      >
                        {isCompleted ? <Icon as={FiCheck} boxSize={3.5} /> : <Icon as={stepIcons[index]} boxSize={3.5} />}
                      </Flex>
                      <Text fontSize="xs" fontWeight={isCurrent ? "700" : "500"} color={isCurrent ? textColor : mutedColor} textAlign="center">
                        {step}
                      </Text>
                    </VStack>
                  );
                })}
              </Flex>

              {isCancelled && (
                <Center mt={5}>
                  <Badge colorScheme="red" borderRadius="full" px={4} py={1.5} fontSize="sm" fontWeight="700">
                    ORDER CANCELLED
                  </Badge>
                </Center>
              )}
            </Box>
          </Box>

          {/* Items */}
          <Box>
            <Text fontSize="xs" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="0.1em" mb={4}>
              Items ({items.length})
            </Text>
            <VStack spacing={3} align="stretch">
              {items.map((item, index) => {
                const priceDetails = item.priceDetails || {};
                const variantOptions = item.variant?.options ? Object.entries(item.variant.options).map(([key, value]) => `${key}: ${value}`).join(', ') : '';

                return (
                  <Flex
                    key={`${item.productId}-${index}`}
                    p={4}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="14px"
                    bg={cardBg}
                    align="center"
                    gap={4}
                    direction={{ base: 'column', sm: 'row' }}
                  >
                    <Image
                      src={item.imageUrl || item.variant?.imageUrl}
                      boxSize={{ base: "60px", md: "70px" }}
                      objectFit="cover"
                      borderRadius="10px"
                      fallbackSrc="https://via.placeholder.com/70"
                      flexShrink={0}
                    />
                    <Box flex="1" w="full">
                      <Text fontWeight="600" fontSize="sm" color={textColor} noOfLines={1}>{item.title}</Text>
                      {variantOptions && <Text fontSize="xs" color={mutedColor}>{variantOptions}</Text>}
                      <Text fontSize="xs" color={mutedColor}>Qty: {item.quantity}</Text>
                      {priceDetails.taxAmountUnit > 0 ? (
                      <Tooltip
                        label={`Unit: ${formatCurrency(priceDetails.effectiveUnitPricePreTax)} + Tax: ${formatCurrency(priceDetails.taxAmountUnit)} = ${formatCurrency(priceDetails.finalUnitPriceWithTax)}`}
                        placement='bottom-start' hasArrow
                      >
                        <Text fontSize="xs" color={mutedColor} cursor="help" mt={0.5}>
                          {formatCurrency(priceDetails.finalUnitPriceWithTax)} / unit
                        </Text>
                      </Tooltip>
                      ) : (
                        <Text fontSize="xs" color={mutedColor} mt={0.5}>
                          {formatCurrency(priceDetails.finalUnitPriceWithTax)} / unit
                        </Text>
                      )}
                    </Box>
                    <VStack align="end" spacing={0} flexShrink={0}>
                      <Text fontWeight="700" fontSize="sm" color={priceColor}>{formatCurrency(priceDetails.lineItemTotal)}</Text>
                      {priceDetails.lineItemTax > 0 && (
                        <Text fontSize="xs" color={mutedColor}>Tax: {formatCurrency(priceDetails.lineItemTax)}</Text>
                      )}
                    </VStack>
                  </Flex>
                );
              })}
            </VStack>
          </Box>

          {/* Summary */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box p={5} borderWidth="1px" borderColor={borderColor} borderRadius="16px" bg={cardBg} boxShadow="card">
              <HStack spacing={2} mb={3}>
                <Icon as={FiMapPin} color="brand.500" boxSize={4} />
                <Text fontSize="xs" fontWeight="700" color={mutedColor} textTransform="uppercase" letterSpacing="0.06em">Shipping Address</Text>
              </HStack>
              <VStack align="start" spacing={1} fontSize="sm" color={textColor}>
                <Text fontWeight="600">{shippingAddress.name}</Text>
                <Text color={mutedColor}>{shippingAddress.address}</Text>
                <Text color={mutedColor}>{shippingAddress.city}, {shippingAddress.pincode}</Text>
                <Text color={mutedColor}>Phone: {shippingAddress.phone}</Text>
                {order.transportName && (
                  <Text color={mutedColor} mt={2}>
                    <Text as="span" fontWeight="600" color={textColor}>Transport: </Text>
                    {order.transportName}
                  </Text>
                )}
              </VStack>
            </Box>
            <Box p={5} borderWidth="1px" borderColor={borderColor} borderRadius="16px" bg={altBg} boxShadow="card">
              <Text fontSize="xs" fontWeight="700" color={mutedColor} textTransform="uppercase" letterSpacing="0.06em" mb={3}>
                Order Totals
              </Text>
              <VStack align="stretch" spacing={2} fontSize="sm">
                <Flex justify="space-between"><Text color={mutedColor}>Subtotal</Text><Text fontWeight="600" color={textColor}>{formatCurrency(orderSubtotal)}</Text></Flex>
                {rewardDiscount > 0 && (
                  <Box>
                    <Flex justify="space-between" align="start">
                      <Text color={mutedColor}>Reward Discount</Text>
                      <Text fontWeight="700" color={successColor}>-{formatCurrency(rewardDiscount)}</Text>
                    </Flex>
                    {rewardRedeemed?.title && (
                      <Text fontSize="xs" color={mutedColor} mt={1} textAlign="right">
                        {rewardRedeemed.title}{rewardRedeemed.type ? ` • ${rewardRedeemed.type.replace('_', ' ')}` : ''}
                      </Text>
                    )}
                  </Box>
                )}
                {orderTax > 0 && (
                  <Flex justify="space-between"><Text color={mutedColor}>Tax</Text><Text fontWeight="600" color={textColor}>{formatCurrency(orderTax)}</Text></Flex>
                )}
                <Divider borderColor={borderColor} />
                <Flex justify="space-between" pt={1}>
                  <Text fontWeight="700" color={textColor}>Total</Text>
                  <Text fontWeight="800" fontSize="lg" color={priceColor}>{formatCurrency(totalAmount)}</Text>
                </Flex>
              </VStack>
            </Box>
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default OrderTrackingPage;