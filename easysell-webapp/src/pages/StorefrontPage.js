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
  VStack
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { FiArrowRight, FiShoppingBag } from 'react-icons/fi';

const MotionBox = motion(Box);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
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

        // 1. Find the User by storeHandle
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

        // 2. Fetch Catalogues for this User
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

  // --- THEME COLORS ---
  const cardBg = useColorModeValue('white', 'whiteAlpha.50');
  const cardBorder = useColorModeValue('gray.200', 'whiteAlpha.100');
  const cardShadow = useColorModeValue('lg', 'xl');
  const catTextColor = useColorModeValue('brand.600', 'brand.300');
  const descColor = useColorModeValue('gray.600', 'gray.400');
  const noCatColor = useColorModeValue('gray.500', 'gray.400');
  const headingGradient = useColorModeValue(
    "linear(to-r, gray.700, gray.900)",
    "linear(to-r, white, gray.200)"
  );

  if (loading) {
    return (
      <Box pt={24} pb={16}>
        <Container maxW="container.xl" textAlign="center">
          <Skeleton height="200px" mb={12} borderRadius="xl" />
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height="300px" borderRadius="lg" />
            ))}
          </SimpleGrid>
        </Container>
      </Box>
    );
  }

  if (error || !storeOwner) {
    return (
      <Center py={32}>
        <VStack spacing={6}>
          <Icon as={FiShoppingBag} w={20} h={20} color="gray.400" />
          <Heading color="gray.600">{error || "Store Not Found"}</Heading>
          <Text color="gray.500">The store you are looking for does not exist or has been removed.</Text>
          <Button as="a" href="https://mmproperty.in" colorScheme="brand" mt={4}>
            Go to Main easySell
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box>
      {/* Personalized Hero Section */}
      <Box
        bgGradient="linear(to-r, brand.800, purple.700)"
        color="white"
        py={20}
        px={6}
        textAlign="center"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="-50%"
          left="-10%"
          width="500px"
          height="500px"
          bg="purple.400"
          filter="blur(150px)"
          opacity="0.3"
          borderRadius="full"
        />
        <Container maxW="container.lg" position="relative" zIndex={1} as={motion.div} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
          {storeOwner.profileImageUrl ? (
            <Center mb={6}>
              <Box p={1} bg="white" borderRadius="full" boxShadow="2xl">
                <Image
                  src={storeOwner.profileImageUrl}
                  alt={storeOwner.businessName || "Store"}
                  boxSize="120px"
                  borderRadius="full"
                  objectFit="cover"
                />
              </Box>
            </Center>
          ) : (
            <Center mb={6}>
              <Box p={6} bg="whiteAlpha.200" borderRadius="full" backdropFilter="blur(10px)">
                <Icon as={FiShoppingBag} w={16} h={16} color="white" />
              </Box>
            </Center>
          )}

          <Heading size="3xl" mb={4} fontWeight="extrabold" letterSpacing="tight">
            {storeOwner.businessName || "My Storefront"}
          </Heading>

          <Text fontSize="xl" opacity={0.9} mb={8} maxW="2xl" mx="auto">
            {storeOwner.ownerName ? `Operated by ${storeOwner.ownerName}` : "Explore our exclusive collections."}
          </Text>

          {!currentUser && (
            <Button
              as={RouterLink}
              to="/login"
              size="lg"
              variant="solid"
              colorScheme="whiteAlpha"
              color="purple.800"
              bg="white"
              boxShadow="xl"
              _hover={{ transform: 'translateY(-2px)', boxShadow: '2xl', bg: 'gray.50' }}
            >
              Login to Shop
            </Button>
          )}
        </Container>
      </Box>

      {/* Catalogues Grid */}
      <Container maxW="container.xl" py={20}>
        <Box textAlign="center" mb={12}>
          <Text textTransform="uppercase" color="brand.500" fontWeight="bold" letterSpacing="widest" mb={2}>
            Collections
          </Text>
          <Heading fontSize="3xl" bgGradient={headingGradient} bgClip="text" fontWeight="extrabold">
            Featured Categories
          </Heading>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10} as={motion.div} variants={containerVariants} initial="hidden" animate="visible">
          {catalogues.length > 0 ? (
            catalogues.map((catalogue) => (
              <MotionBox
                key={catalogue.id}
                variants={itemVariants}
                bg={cardBg}
                maxW="sm"
                borderWidth="1px"
                borderColor={cardBorder}
                borderRadius="2xl"
                overflow="hidden"
                boxShadow={cardShadow}
                backdropFilter="blur(10px)"
                whileHover={{ scale: 1.03, boxShadow: '2xl' }}
                as={RouterLink}
                to={`/catalogue/${catalogue.id}`}
              >
                <Image
                  src={catalogue.imageUrl}
                  alt={catalogue.name}
                  h="240px"
                  w="full"
                  objectFit="cover"
                  fallbackSrc="https://via.placeholder.com/400x200?text=Collection"
                />

                <Box p={8}>
                  <Flex alignItems="center" mb={3}>
                    <Icon as={FiShoppingBag} color={catTextColor} mr={2} />
                    <Text
                      color={catTextColor}
                      fontWeight="bold"
                      textTransform="uppercase"
                      fontSize="xs"
                      letterSpacing="wide"
                    >
                      Collection
                    </Text>
                  </Flex>

                  <Heading size="md" mb={3} noOfLines={1} bgGradient={headingGradient} bgClip="text">
                    {catalogue.name}
                  </Heading>

                  <Text color={descColor} fontSize="sm" noOfLines={2} mb={5}>
                    {catalogue.description || "Browse our latest products in this collection."}
                  </Text>

                  <Button
                    variant="link"
                    colorScheme="brand"
                    rightIcon={<FiArrowRight />}
                    fontWeight="bold"
                  >
                    View Catalog
                  </Button>
                </Box>
              </MotionBox>
            ))
          ) : (
            <Box gridColumn="1 / -1" textAlign="center" py={12}>
              <Icon as={FiShoppingBag} w={12} h={12} color={noCatColor} mb={4} opacity={0.5} />
              <Text fontSize="xl" color={noCatColor} fontWeight="medium">
                No catalogues available yet.
              </Text>
            </Box>
          )}
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default StorefrontPage;
