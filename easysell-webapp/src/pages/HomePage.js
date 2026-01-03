import React, { useState, useEffect } from 'react';
import {
  Container,
  Heading,
  SimpleGrid,
  Box,
  Image,
  Text,
  Button,
  VStack,
  Skeleton,
  useColorModeValue,
  Icon,
  Flex
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { FiArrowRight, FiShoppingBag } from 'react-icons/fi';
import { getProxiedUrl } from '../config';

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

  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Box>
      {/* Hero Section */}
      <Box bg="teal.600" color="white" py={20} px={6} textAlign="center">
        <Container maxW="container.lg">
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
              colorScheme="whiteAlpha"
              color="teal.700"
              bg="white"
              _hover={{ bg: 'gray.100' }}
            >
              Login to Shop
            </Button>
          )}
        </Container>
      </Box>

      {/* Catalogues Grid */}
      <Container maxW="container.xl" py={16}>
        <Heading mb={8} textAlign="center" color="gray.700">
          Our Collections
        </Heading>

        {loading ? (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height="300px" borderRadius="lg" />
            ))}
          </SimpleGrid>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
            {catalogues.length > 0 ? (
              catalogues.map((catalogue) => (
                <Box
                  key={catalogue.id}
                  bg={cardBg}
                  maxW="sm"
                  borderWidth="1px"
                  borderRadius="lg"
                  overflow="hidden"
                  boxShadow="lg"
                  transition="transform 0.2s"
                  _hover={{ transform: 'scale(1.02)' }}
                  as={RouterLink}
                  to={`/catalogue/${catalogue.id}`}
                >
                  <Image
                    src={getProxiedUrl(catalogue.imageUrl)}
                    alt={catalogue.name}
                    h="200px"
                    w="full"
                    objectFit="cover"
                    fallbackSrc="https://via.placeholder.com/400x200?text=Collection"
                  />

                  <Box p={6}>
                    <Flex alignItems="center" mb={2}>
                      <Icon as={FiShoppingBag} color="teal.500" mr={2} />
                      <Text
                        color="teal.500"
                        fontWeight="bold"
                        textTransform="uppercase"
                        fontSize="xs"
                        letterSpacing="wide"
                      >
                        Collection
                      </Text>
                    </Flex>

                    <Heading size="md" mb={2} noOfLines={1}>
                      {catalogue.name}
                    </Heading>

                    <Text color="gray.600" fontSize="sm" noOfLines={3} mb={4}>
                      {catalogue.description || "Browse our latest products in this collection."}
                    </Text>

                    <Button
                      variant="link"
                      colorScheme="teal"
                      rightIcon={<FiArrowRight />}
                    >
                      Browse Products
                    </Button>
                  </Box>
                </Box>
              ))
            ) : (
              <Box gridColumn="1 / -1" textAlign="center" py={10}>
                <Text fontSize="lg" color="gray.500">
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