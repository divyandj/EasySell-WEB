import React, { useState, useEffect } from 'react';
import {
  Container,
  Heading,
  SimpleGrid,
  Box,
  Image,
  Text,
  Button,
  Skeleton,
  useColorModeValue,
  Icon,
  Flex,
  Center,
  VStack,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { FiArrowRight, FiShoppingBag, FiShield, FiCheckCircle } from 'react-icons/fi';

const MotionBox = motion(Box);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

const StorefrontPage = ({ subdomain }) => {
  const { currentUser } = useAuth();
  const [storeOwner, setStoreOwner] = useState(null);
  const [catalogues, setCatalogues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStorefrontData = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('storeHandle', '==', subdomain.toLowerCase()));
        const userSnapshot = await getDocs(q);

        if (userSnapshot.empty) {
          setError("Store Not Found");
          setLoading(false);
          return;
        }

        const ownerData = userSnapshot.docs[0].data();
        const ownerId = userSnapshot.docs[0].id;
        setStoreOwner({ id: ownerId, ...ownerData });

        const catRef = collection(db, 'catalogues');
        const catQuery = query(catRef, where('userId', '==', ownerId));
        const catSnapshot = await getDocs(catQuery);

        const catalogueList = catSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCatalogues(catalogueList);
      } catch (err) {
        console.error("Error fetching storefront:", err);
        setError("Failed to load storefront.");
      } finally {
        setLoading(false);
      }
    };

    if (subdomain) {
      fetchStorefrontData();
    }
  }, [subdomain]);

  // Theme colors
  const pageBg = useColorModeValue('#F8F9FC', '#09090B');
  const cardBg = useColorModeValue('white', '#111116');
  const cardBorder = useColorModeValue('gray.100', 'whiteAlpha.100');
  const textColor = useColorModeValue('gray.800', 'white');
  const descColor = useColorModeValue('gray.500', 'gray.400');
  const catLabel = useColorModeValue('brand.600', 'brand.300');
  const emptyIconBg = useColorModeValue('gray.100', 'whiteAlpha.100');
  const avatarBorder = useColorModeValue('white', '#09090B');

  // Loading State
  if (loading) {
    return (
      <Box bg={pageBg} minH="100vh">
        <Box py={16} px={6}>
          <Container maxW="container.xl">
            <Skeleton height="200px" mb={12} borderRadius="20px" />
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height="300px" borderRadius="16px" />
              ))}
            </SimpleGrid>
          </Container>
        </Box>
      </Box>
    );
  }

  // Error State
  if (error || !storeOwner) {
    return (
      <Box bg={pageBg} minH="100vh">
        <Center py={32}>
          <VStack spacing={6} textAlign="center">
            <Flex w={20} h={20} bg={emptyIconBg} borderRadius="full" align="center" justify="center">
              <Icon as={FiShoppingBag} w={10} h={10} color="gray.400" />
            </Flex>
            <Heading color={textColor} size="lg">{error || "Store Not Found"}</Heading>
            <Text color={descColor} maxW="400px">The store you are looking for does not exist or has been removed.</Text>
            <Button as="a" href="https://mmproperty.in" colorScheme="brand" borderRadius="full" px={8}>
              Go to easySell
            </Button>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box bg={pageBg} minH="100vh">
      {/* ============================================
          STORE HERO
          ============================================ */}
      <Box
        bgGradient="linear(to-br, brand.600, brand.800)"
        position="relative"
        overflow="hidden"
        pt={{ base: 12, md: 16 }}
        pb={{ base: 16, md: 20 }}
        px={6}
      >
        {/* Decorative */}
        <Box position="absolute" top="-30%" right="-15%" w="500px" h="500px" bg="accent.500" filter="blur(180px)" opacity="0.12" borderRadius="full" />

        <Container maxW="container.lg" position="relative" zIndex={1}>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            textAlign="center"
          >
            {/* Store Logo */}
            {storeOwner.profileImageUrl ? (
              <Center mb={5}>
                <Box
                  p="3px"
                  bgGradient="linear(to-r, accent.300, brand.300)"
                  borderRadius="full"
                  boxShadow="0 8px 30px rgba(0,0,0,0.2)"
                >
                  <Image
                    src={storeOwner.profileImageUrl}
                    alt={storeOwner.businessName || "Store"}
                    boxSize="100px"
                    borderRadius="full"
                    objectFit="cover"
                    border="3px solid"
                    borderColor={avatarBorder}
                  />
                </Box>
              </Center>
            ) : (
              <Center mb={5}>
                <Flex
                  w={20}
                  h={20}
                  bg="whiteAlpha.200"
                  borderRadius="full"
                  align="center"
                  justify="center"
                  backdropFilter="blur(10px)"
                >
                  <Icon as={FiShoppingBag} w={10} h={10} color="white" />
                </Flex>
              </Center>
            )}

            {/* Store Name */}
            <Heading
              as="h1"
              fontSize={{ base: '2xl', md: '4xl' }}
              fontWeight="900"
              color="white"
              letterSpacing="-0.02em"
              mb={3}
            >
              {storeOwner.businessName || "My Storefront"}
            </Heading>

            {/* Store Owner */}
            {storeOwner.ownerName && (
              <Text fontSize="md" color="whiteAlpha.800" mb={4}>
                by {storeOwner.ownerName}
              </Text>
            )}

            {/* Trust Indicators */}
            <HStack justify="center" spacing={3} flexWrap="wrap">
              <Badge
                bg="whiteAlpha.200"
                color="white"
                backdropFilter="blur(10px)"
                px={3}
                py={1.5}
                borderRadius="full"
                fontSize="xs"
                fontWeight="600"
                display="flex"
                alignItems="center"
                gap={1.5}
              >
                <Icon as={FiCheckCircle} boxSize={3} />
                Verified Seller
              </Badge>
              <Badge
                bg="whiteAlpha.200"
                color="white"
                backdropFilter="blur(10px)"
                px={3}
                py={1.5}
                borderRadius="full"
                fontSize="xs"
                fontWeight="600"
                display="flex"
                alignItems="center"
                gap={1.5}
              >
                <Icon as={FiShield} boxSize={3} />
                Secure Checkout
              </Badge>
            </HStack>

            {/* Login CTA (for guests) */}
            {!currentUser && (
              <Button
                as={RouterLink}
                to="/login"
                mt={6}
                size="md"
                bg="white"
                color="brand.600"
                borderRadius="full"
                fontWeight="600"
                px={8}
                _hover={{ transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
              >
                Login to Shop
              </Button>
            )}
          </MotionBox>
        </Container>
      </Box>

      {/* ============================================
          CATALOGUES GRID
          ============================================ */}
      <Container maxW="container.xl" py={{ base: 12, md: 16 }}>
        <VStack spacing={2} mb={10} textAlign="center">
          <Text fontSize="xs" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="0.1em">
            Collections
          </Text>
          <Heading fontSize={{ base: 'xl', md: '2xl' }} color={textColor}>
            Browse Our Categories
          </Heading>
        </VStack>

        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 3 }}
          spacing={8}
          as={motion.div}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {catalogues.length > 0 ? (
            catalogues.map((catalogue) => (
              <MotionBox
                key={catalogue.id}
                variants={itemVariants}
                as={RouterLink}
                to={`/catalogue/${catalogue.id}`}
                display="block"
                bg={cardBg}
                borderWidth="1px"
                borderColor={cardBorder}
                borderRadius="20px"
                overflow="hidden"
                boxShadow="card"
                _hover={{ boxShadow: 'cardHover', transform: 'translateY(-4px)' }}
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                role="group"
              >
                {/* Image */}
                <Box overflow="hidden">
                  <Image
                    src={catalogue.imageUrl}
                    alt={catalogue.name}
                    h="220px"
                    w="full"
                    objectFit="cover"
                    fallbackSrc="https://via.placeholder.com/400x220?text=Collection"
                    transition="transform 0.4s ease"
                    _groupHover={{ transform: 'scale(1.05)' }}
                  />
                </Box>

                {/* Content */}
                <Box p={6}>
                  <Text
                    color={catLabel}
                    fontWeight="700"
                    textTransform="uppercase"
                    fontSize="xs"
                    letterSpacing="0.08em"
                    mb={2}
                  >
                    Collection
                  </Text>

                  <Heading
                    as="h3"
                    size="md"
                    mb={2}
                    noOfLines={1}
                    color={textColor}
                    fontWeight="700"
                    _groupHover={{ color: 'brand.500' }}
                    transition="color 0.2s"
                  >
                    {catalogue.name}
                  </Heading>

                  <Text color={descColor} fontSize="sm" noOfLines={2} mb={4} lineHeight="1.6">
                    {catalogue.description || "Browse our latest products in this collection."}
                  </Text>

                  <HStack
                    color="brand.500"
                    fontWeight="600"
                    fontSize="sm"
                    _groupHover={{ gap: 3 }}
                    transition="all 0.2s"
                    spacing={2}
                  >
                    <Text>View Products</Text>
                    <Icon as={FiArrowRight} transition="transform 0.2s" _groupHover={{ transform: 'translateX(4px)' }} />
                  </HStack>
                </Box>
              </MotionBox>
            ))
          ) : (
            <Box gridColumn="1 / -1" textAlign="center" py={16}>
              <Flex w={16} h={16} bg={emptyIconBg} borderRadius="full" align="center" justify="center" mx="auto" mb={4}>
                <Icon as={FiShoppingBag} w={8} h={8} color="gray.400" />
              </Flex>
              <Heading size="md" color={textColor} mb={2}>No catalogues yet</Heading>
              <Text color={descColor}>This store hasn't added any collections yet. Check back soon!</Text>
            </Box>
          )}
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default StorefrontPage;
