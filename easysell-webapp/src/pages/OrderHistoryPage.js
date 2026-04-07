import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collectionGroup, query, where, getDocs, orderBy } from 'firebase/firestore';
import {
  Container, Heading, VStack, Box, Text, Center, Flex,
  Button, useColorModeValue, Icon, HStack, Badge
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiShoppingBag, FiChevronRight, FiAlertCircle } from 'react-icons/fi';
import SpinnerComponent from '../components/Spinner';

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

const isCancelledStatus = (status) => ['Cancelled', 'CANCELLED_BY_BUYER'].includes(String(status || ''));

const getStatusConfig = (status) => {
  switch (status) {
    case 'Placed': return { icon: FiPackage, color: 'blue' };
    case 'Processing': return { icon: FiClock, color: 'purple' };
    case 'Shipped': return { icon: FiTruck, color: 'orange' };
    case 'Delivered': return { icon: FiCheckCircle, color: 'green' };
    case 'Cancelled': return { icon: FiAlertCircle, color: 'red' };
    case 'CANCELLED_BY_BUYER': return { icon: FiAlertCircle, color: 'gray' };
    default: return { icon: FiShoppingBag, color: 'gray' };
  }
};

const OrderHistoryPage = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pageBg = useColorModeValue('#F8F9FC', '#09090B');
  const cardBg = useColorModeValue('white', '#111116');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const priceColor = useColorModeValue('brand.600', 'brand.300');
  const emptyIconBg = useColorModeValue('gray.100', 'whiteAlpha.100');

  useEffect(() => {
    if (!currentUser) { setLoading(false); setOrders([]); return; }

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const ordersQuery = query(
          collectionGroup(db, 'orders'),
          where('userId', '==', currentUser.uid),
          orderBy('orderDate', 'desc')
        );
        const querySnapshot = await getDocs(ordersQuery);
        const userOrders = querySnapshot.docs.map(doc => {
          const catalogueId = doc.ref.parent.parent?.id;
          return { id: doc.id, catalogueId: catalogueId || 'unknown', ...doc.data() };
        });

        // Keep cancelled orders visible but pushed below active orders.
        userOrders.sort((a, b) => {
          const aCancelled = isCancelledStatus(a.status);
          const bCancelled = isCancelledStatus(b.status);
          if (aCancelled === bCancelled) {
            const aMs = a.orderDate?.toMillis ? a.orderDate.toMillis() : 0;
            const bMs = b.orderDate?.toMillis ? b.orderDate.toMillis() : 0;
            return bMs - aMs;
          }
          return aCancelled ? 1 : -1;
        });

        setOrders(userOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        if (err.code === 'failed-precondition') setError("Database index missing. Please notify admin.");
        else setError("Could not load orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [currentUser]);

  if (loading) return <SpinnerComponent />;

  if (error) {
    return (
      <Box bg={pageBg} minH="80vh">
        <Container maxW="container.lg" py={20} centerContent>
          <VStack spacing={4} p={8} bg={cardBg} borderRadius="20px" borderWidth="1px" borderColor={borderColor} boxShadow="card">
            <Icon as={FiAlertCircle} boxSize={10} color="red.400" />
            <Heading size="md" color={textColor}>Something went wrong</Heading>
            <Text color={mutedColor} textAlign="center">{error}</Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <Box bg={pageBg} minH="80vh">
        <Container maxW="container.lg" py={20} centerContent>
          <VStack spacing={4}>
            <Heading size="lg" color={mutedColor}>Sign in to view orders</Heading>
            <Button colorScheme="brand" as={RouterLink} to="/login" borderRadius="12px">Login</Button>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg} py={{ base: 6, md: 10 }}>
      <Container maxW="container.lg">
        <Flex justify="space-between" align="center" mb={8}>
          <VStack align="start" spacing={0}>
            <Heading fontSize={{ base: 'xl', md: '2xl' }} fontWeight="800" color={textColor} letterSpacing="-0.02em">
              Your Orders
            </Heading>
            <Text color={mutedColor} fontSize="sm">Track and manage your purchases</Text>
          </VStack>
          <Button variant="ghost" colorScheme="brand" size="sm" as={RouterLink} to="/">
            Continue Shopping
          </Button>
        </Flex>

        {orders.length === 0 ? (
          <Center py={20} flexDirection="column" bg={cardBg} borderRadius="20px" borderWidth="1px" borderColor={borderColor} boxShadow="card">
            <Flex w={16} h={16} bg={emptyIconBg} borderRadius="full" align="center" justify="center" mb={4}>
              <Icon as={FiShoppingBag} w={8} h={8} color="gray.400" />
            </Flex>
            <Text fontSize="lg" fontWeight="700" color={textColor} mb={1}>No orders yet</Text>
            <Text color={mutedColor} mb={5}>You haven't placed any orders.</Text>
            <Button colorScheme="brand" as={RouterLink} to="/" borderRadius="12px">Start Shopping</Button>
          </Center>
        ) : (
          <MotionVStack spacing={3} align="stretch" variants={containerVariants} initial="hidden" animate="visible">
            {orders.map(order => {
              const { icon: StatusIcon, color: statusColor } = getStatusConfig(order.status);
              const cancelled = isCancelledStatus(order.status);
              return (
                <MotionBox
                  key={order.id}
                  variants={itemVariants}
                  p={{ base: 4, md: 5 }}
                  borderRadius="16px"
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  boxShadow="card"
                  opacity={cancelled ? 0.72 : 1}
                  _hover={{ borderColor: cancelled ? borderColor : 'brand.200', transform: cancelled ? 'none' : 'translateY(-2px)', boxShadow: cancelled ? 'card' : 'cardHover' }}
                  transition="all 0.2s"
                  as={RouterLink}
                  to={`/order-details/${order.catalogueId}/${order.id}`}
                >
                  <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
                    <HStack spacing={3}>
                      <Flex w={10} h={10} borderRadius="12px" bg={`${statusColor}.50`} color={`${statusColor}.500`} align="center" justify="center">
                        <StatusIcon />
                      </Flex>
                      <Box>
                        <Text fontWeight="700" fontSize="sm" color={textColor}>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </Text>
                        <Text fontSize="xs" color={mutedColor}>
                          {order.items?.length || 0} items · {order.orderDate?.toDate ? order.orderDate.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                        </Text>
                        {cancelled && (
                          <Text fontSize="xs" color={mutedColor}>
                            Cancelled {order.cancelledAt?.toDate ? order.cancelledAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                          </Text>
                        )}
                      </Box>
                    </HStack>

                    <HStack spacing={4}>
                      <Badge borderRadius="full" colorScheme={statusColor} px={3} py={1} fontSize="xs" fontWeight="600">
                        {order.status || 'Pending'}
                      </Badge>
                      <Text fontSize="md" fontWeight="800" color={priceColor}>
                        {formatCurrency(order.totalAmount)}
                      </Text>
                      <Icon as={FiChevronRight} color="gray.300" />
                    </HStack>
                  </Flex>
                </MotionBox>
              );
            })}
          </MotionVStack>
        )}
      </Container>
    </Box>
  );
};

export default OrderHistoryPage;