import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
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
  Button,
  useColorModeValue,
  Icon,
  HStack,
  Spacer
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiShoppingBag, FiChevronRight, FiAlertCircle } from 'react-icons/fi';
import SpinnerComponent from '../components/Spinner';

// --- MOTION COMPONENTS ---
const MotionBox = motion(Box);
const MotionVStack = motion(VStack);

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

// Helper to format currency
const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

// Helper to get Status Icon & Color
const getStatusConfig = (status) => {
  switch (status) {
    case 'Placed': return { icon: FiPackage, color: 'blue' };
    case 'Processing': return { icon: FiClock, color: 'purple' };
    case 'Shipped': return { icon: FiTruck, color: 'orange' };
    case 'Delivered': return { icon: FiCheckCircle, color: 'green' };
    case 'Cancelled': return { icon: FiAlertCircle, color: 'red' };
    default: return { icon: FiShoppingBag, color: 'gray' };
  }
};

const OrderHistoryPage = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- THEME COLORS ---
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'whiteAlpha.100'); // Glass-ish feel in dark mode
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.200');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const brandColor = useColorModeValue('brand.600', 'brand.300');

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setOrders([]);
      return;
    }

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
          return {
            id: doc.id,
            catalogueId: catalogueId || 'unknown',
            ...doc.data(),
          };
        });

        setOrders(userOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        if (err.code === 'failed-precondition') {
          setError("Database index missing. Please notify admin.");
        } else {
          setError("Could not load orders. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser]);

  if (loading) return <SpinnerComponent />;

  if (error) {
    return (
      <Container maxW="container.lg" py={12} centerContent>
        <Alert status="error" borderRadius="xl" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="200px" bg="red.50">
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">Oops!</AlertTitle>
          <AlertDescription maxWidth="sm">{error}</AlertDescription>
        </Alert>
      </Container>
    );
  }

  if (!currentUser) {
    return (
      <Container maxW="container.lg" py={20} centerContent>
        <VStack spacing={6}>
          <Heading size="lg" color="gray.500">Sign in to view orders</Heading>
          <Button colorScheme="brand" size="lg" as={RouterLink} to="/login">Login Now</Button>
        </VStack>
      </Container>
    )
  }

  return (
    <Box minH="100vh" bg={pageBg} py={10}>
      <Container maxW="container.lg">
        <Flex justify="space-between" align="center" mb={10}>
          <VStack align="start" spacing={1}>
            <Heading size="lg" fontWeight="900" bgGradient="linear(to-r, brand.500, accent.500)" bgClip="text">
              Your Orders
            </Heading>
            <Text color={mutedColor} fontSize="sm">Track and manage your purchases</Text>
          </VStack>
          <Button leftIcon={<FiShoppingBag />} variant="ghost" colorScheme="brand" as={RouterLink} to="/">
            Continue Shopping
          </Button>
        </Flex>

        {orders.length === 0 ? (
          <Center h="50vh" flexDirection="column" bg={cardBg} borderRadius="3xl" shadow="sm" borderWidth="1px" borderColor={borderColor}>
            <Icon as={FiShoppingBag} w={16} h={16} color="gray.300" mb={4} />
            <Text fontSize="xl" fontWeight="bold" color={textColor}>No orders yet</Text>
            <Text color={mutedColor} mb={6}>Looks like you haven't bought anything.</Text>
            <Button colorScheme="brand" size="lg" as={RouterLink} to="/">
              Start Exploring
            </Button>
          </Center>
        ) : (
          <MotionVStack
            spacing={6}
            align="stretch"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {orders.map(order => {
              const { icon: StatusIcon, color: statusColor } = getStatusConfig(order.status);

              return (
                <MotionBox
                  key={order.id}
                  variants={itemVariants}
                  p={{ base: 5, md: 6 }}
                  borderRadius="2xl"
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  shadow="sm"
                  _hover={{ shadow: 'lg', transform: 'translateY(-2px)', borderColor: 'brand.200' }}
                  transition="all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)"
                  as={RouterLink}
                  to={`/order-details/${order.catalogueId}/${order.id}`}
                  position="relative"
                  overflow="hidden"
                >
                  <Flex justify="space-between" align="center" wrap="wrap" gap={4}>

                    {/* LEFT: Icon & Basic Info */}
                    <HStack spacing={4} align="start">
                      <Flex
                        w="12" h="12"
                        borderRadius="full"
                        bg={`${statusColor}.50`}
                        color={`${statusColor}.500`}
                        align="center" justify="center"
                        fontSize="xl"
                      >
                        <StatusIcon />
                      </Flex>
                      <Box>
                        <Text fontWeight="bold" fontSize="lg" color={textColor} lineHeight="short">
                          Order #{order.id.slice(0, 8).toUpperCase()}...
                        </Text>
                        <Text fontSize="sm" color={mutedColor} mt={1}>
                          {order.items?.length || 0} items • {order.orderDate?.toDate ? order.orderDate.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date N/A'}
                        </Text>
                      </Box>
                    </HStack>

                    <Spacer display={{ base: 'none', md: 'block' }} />

                    {/* RIGHT: Status & Price */}
                    <HStack spacing={6} align="center">
                      <Tag
                        size="lg"
                        borderRadius="full"
                        variant="subtle"
                        colorScheme={statusColor}
                        px={4}
                      >
                        <HStack spacing={2}>
                          {order.status === 'Delivered' && <Icon as={FiCheckCircle} />}
                          <Text fontWeight="bold" fontSize="sm">{order.status || 'Pending'}</Text>
                        </HStack>
                      </Tag>

                      <VStack align="end" spacing={0}>
                        <Text fontSize="xs" color={mutedColor} textTransform="uppercase" letterSpacing="wide" fontWeight="bold">Total</Text>
                        <Text fontSize="xl" fontWeight="900" color={textColor}>
                          {formatCurrency(order.totalAmount)}
                        </Text>
                      </VStack>

                      <Icon as={FiChevronRight} color="gray.300" fontSize="2xl" />
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