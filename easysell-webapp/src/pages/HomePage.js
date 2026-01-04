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
  Flex
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
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

const HomePage = () => {
  const { currentUser } = useAuth();
  const [catalogues, setCatalogues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all catalogues from Firestore
  useEffect(() => {
    const fetchCatalogues = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'catalogues'));
        const catalogueList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCatalogues(catalogueList);
      } catch (error) {
        console.error("Error fetching catalogues:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogues();
  }, []);

  // --- THEME COLORS ---
  const cardBg = useColorModeValue('white', 'whiteAlpha.50');
  const cardBorder = useColorModeValue('gray.200', 'whiteAlpha.100');
  const cardShadow = useColorModeValue('lg', 'xl');
  const catTextColor = useColorModeValue('brand.600', 'brand.300');
  const descColor = useColorModeValue('gray.600', 'gray.400');
  const noCatColor = useColorModeValue('gray.500', 'gray.400');
  // Premium Gradient Heading
  const headingGradient = useColorModeValue(
    "linear(to-r, gray.700, gray.900)",
    "linear(to-r, white, gray.200)"
  );

  return (
    <Box>
      {/* Hero Section */}
      <Box
        bgGradient="linear(to-r, brand.900, brand.700)"
        color="white"
        py={24}
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
          bg="brand.400"
          filter="blur(150px)"
          opacity="0.2"
          borderRadius="full"
        />
        <Container maxW="container.lg" position="relative" zIndex={1} as={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <Heading size="2xl" mb={4}>
            Welcome to easySell
          </Heading>
          <Text fontSize="xl" opacity={0.9} mb={8}>
            Explore our exclusive collections.
            {currentUser
              ? ` Welcome back, ${currentUser.displayName}!`
              : " Login to see prices and place orders."}
          </Text>
          {!currentUser && (
            <Button
              as={RouterLink}
              to="/login"
              size="lg"
              variant="solid"
              colorScheme="whiteAlpha"
              color="brand.900"
              bg="white"
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            >
              Login to Shop
            </Button>
          )}
        </Container>
      </Box>

      {/* Catalogues Grid */}
      <Container maxW="container.xl" py={16}>
        <Heading mb={8} textAlign="center" fontSize="3xl" bgGradient="linear(to-r, brand.200, accent.200)" bgClip="text">
          Our Collections
        </Heading>

        {loading ? (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height="300px" borderRadius="lg" />
            ))}
          </SimpleGrid>
        ) : (
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
                    h="200px"
                    w="full"
                    objectFit="cover"
                    fallbackSrc="https://via.placeholder.com/400x200?text=Collection"
                  />

                  <Box p={6}>
                    <Flex alignItems="center" mb={2}>
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

                    <Heading size="md" mb={2} noOfLines={1} bgGradient={headingGradient} bgClip="text">
                      {catalogue.name}
                    </Heading>

                    <Text color={descColor} fontSize="sm" noOfLines={3} mb={4}>
                      {catalogue.description || "Browse our latest products in this collection."}
                    </Text>

                    <Button
                      variant="link"
                      colorScheme="brand"
                      rightIcon={<FiArrowRight />}
                    >
                      Browse Products
                    </Button>
                  </Box>
                </MotionBox>
              ))
            ) : (
              <Box gridColumn="1 / -1" textAlign="center" py={10}>
                <Text fontSize="lg" color={noCatColor}>
                  No catalogues found. Please check back later!
                </Text>
              </Box>
            )}
          </SimpleGrid>
        )}
      </Container>
    </Box>
  );
};

export default HomePage;