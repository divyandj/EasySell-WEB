import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  Center,
  Icon,
  HStack // IMPORT ADDED
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiExternalLink } from 'react-icons/fi'; // Icon for links

// Key used in CataloguePage.js
const RECENTLY_VISITED_KEY = 'recentlyVisitedCatalogues';

const HomePage = () => {
  const [recentCatalogues, setRecentCatalogues] = useState([]);

  useEffect(() => {
    // Load the history from local storage when the component mounts
    try {
      const storedHistory = localStorage.getItem(RECENTLY_VISITED_KEY);
      if (storedHistory) {
        setRecentCatalogues(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load recently visited catalogues:", error);
      // Clear potentially corrupted data
      localStorage.removeItem(RECENTLY_VISITED_KEY);
    }
  }, []); // Empty dependency array ensures this runs only once

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" textAlign="center">
          Welcome to easySell!
        </Heading>

        {/* --- Recently Visited Section --- */}
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            Recently Visited Catalogues
          </Heading>
          {recentCatalogues.length === 0 ? (
            <Center bg="gray.50" p={6} borderRadius="md" borderWidth="1px" borderColor="gray.200">
              <Text color="gray.500">You haven't visited any catalogues yet. Start exploring!</Text>
            </Center>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={5}>
              {recentCatalogues.map((catalogue) => (
                <Box
                  key={catalogue.id}
                  as={RouterLink}
                  to={`/catalogue/${catalogue.id}`}
                  p={5}
                  bg="white"
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                  shadow="sm"
                  transition="all 0.2s ease-in-out"
                  _hover={{ shadow: 'md', borderColor: 'teal.300', transform: 'translateY(-3px)' }}
                >
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontWeight="semibold" noOfLines={1} color="gray.800">
                      {catalogue.name}
                    </Text>
                    <Icon as={FiExternalLink} color="gray.400" />
                  </HStack>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>

        {/* You can add other sections to the homepage here later */}
        {/* e.g., Featured Products, Promotions, etc. */}

      </VStack>
    </Container>
  );
};

export default HomePage;