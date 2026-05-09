import React, { useState, useEffect, useMemo } from 'react';
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
import { Link as RouterLink } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  FiArrowRight,
  FiMail,
  FiShoppingBag,
} from 'react-icons/fi';

const formatStoreHandle = (value = 'store') => (
  value
    .replace(/\..*$/, '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
);

const getStoreDescription = (storeOwner) => (
  storeOwner?.storeDescription
  || storeOwner?.businessDescription
  || storeOwner?.description
  || 'Curated collections with reliable service and secure checkout.'
);

const StorefrontPage = ({ subdomain }) => {
  const { currentUser } = useAuth();
  const [storeOwner, setStoreOwner] = useState(null);
  const [catalogues, setCatalogues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const storeHandleLabel = useMemo(() => formatStoreHandle(subdomain || 'store'), [subdomain]);

  useEffect(() => {
    const fetchStorefrontData = async () => {
      try {
        setLoading(true);
        setError(null);

        const usersRef = collection(db, 'users');
        const storeHandle = (subdomain || '').toLowerCase();
        const ownerQuery = query(usersRef, where('storeHandle', '==', storeHandle));
        const userSnapshot = await getDocs(ownerQuery);

        if (userSnapshot.empty) {
          setError('Store Not Found');
          setLoading(false);
          return;
        }

        const ownerData = userSnapshot.docs[0].data();
        const ownerId = userSnapshot.docs[0].id;
        setStoreOwner({ id: ownerId, ...ownerData });

        const catRef = collection(db, 'catalogues');
        const catQuery = query(catRef, where('userId', '==', ownerId));
        const catSnapshot = await getDocs(catQuery);

        const catalogueList = catSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCatalogues(catalogueList);
      } catch (err) {
        console.error('Error fetching storefront:', err);
        setError('Failed to load storefront.');
      } finally {
        setLoading(false);
      }
    };

    if (subdomain) {
      fetchStorefrontData();
    }
  }, [subdomain]);

  const pageBg = useColorModeValue('#F4F6F8', '#090B12');
  const surfaceBg = useColorModeValue('white', '#111827');
  const mutedSurface = useColorModeValue('#F1F5F9', '#1F2937');
  const borderColor = useColorModeValue('#E2E8F0', 'whiteAlpha.200');
  const textColor = useColorModeValue('#0F172A', 'whiteAlpha.900');
  const descColor = useColorModeValue('#334155', 'gray.300');
  const emptyIconBg = useColorModeValue('gray.100', 'whiteAlpha.100');
  const accentColor = '#2563EB';
  const accentColorHover = '#1D4ED8';
  const accentSoft = useColorModeValue('#DBEAFE', 'rgba(37, 99, 235, 0.22)');

  const storeTitle = storeOwner?.businessName || `${storeHandleLabel} Store`;
  const storeDescription = getStoreDescription(storeOwner);
  const hasCatalogues = catalogues.length > 0;

  if (loading) {
    return (
      <Box bg={pageBg} minH="100vh">
        <Container maxW="container.xl" py={{ base: 10, md: 14 }}>
          <Skeleton height="260px" borderRadius="20px" mb={6} />
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            {[1, 2, 3].map((idx) => (
              <Skeleton key={idx} height="260px" borderRadius="16px" />
            ))}
          </SimpleGrid>
        </Container>
      </Box>
    );
  }

  if (error || !storeOwner) {
    return (
      <Box bg={pageBg} minH="100vh">
        <Center py={28}>
          <VStack spacing={6} textAlign="center" px={4}>
            <Flex w={20} h={20} bg={emptyIconBg} borderRadius="full" align="center" justify="center">
              <Icon as={FiShoppingBag} w={10} h={10} color="gray.400" />
            </Flex>
            <Heading color={textColor} size="lg">{error || 'Store Not Found'}</Heading>
            <Text color={descColor} maxW="430px">
              The store page could not be loaded. Please verify the store link and try again.
            </Text>
            <Button
              as={RouterLink}
              to="/contact"
              bg={accentColor}
              color="white"
              _hover={{ bg: accentColorHover }}
              borderRadius="full"
              px={8}
            >
              Contact Store Support
            </Button>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box bg={pageBg} minH="100vh">
      <Container maxW="container.xl" py={{ base: 8, md: 10 }}>
        <Box
          bg={surfaceBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="16px"
          p={{ base: 6, md: 8 }}
          boxShadow="card"
        >
          <VStack align="start" spacing={5}>
            <Badge
              bg={accentSoft}
              color={accentColor}
              borderRadius="full"
              px={3.5}
              py={1.5}
              fontWeight="700"
              letterSpacing="0.08em"
              fontSize="10px"
            >
              Official Storefront
            </Badge>

            <Heading
              as="h1"
              color={textColor}
              fontSize={{ base: '3xl', md: '5xl' }}
              lineHeight="1.06"
            >
              {storeTitle}
            </Heading>

            <Text color={descColor} fontSize={{ base: 'md', md: 'lg' }} lineHeight="1.8" maxW="720px">
              {storeDescription}
            </Text>

            <HStack spacing={3} flexWrap="wrap">
              <Button
                as="a"
                href="#store-collections"
                bg={accentColor}
                color="white"
                borderRadius="12px"
                px={7}
                rightIcon={<Icon as={FiArrowRight} />}
                _hover={{ bg: accentColorHover }}
              >
                Shop Collections
              </Button>
              <Button
                as={RouterLink}
                to="/contact"
                variant="outline"
                borderRadius="12px"
                px={7}
                borderColor={borderColor}
                color={textColor}
                leftIcon={<Icon as={FiMail} />}
              >
                Contact Store
              </Button>
              <Button
                as={RouterLink}
                to="/about-us"
                variant="ghost"
                borderRadius="12px"
                px={6}
                color={textColor}
                _hover={{ bg: mutedSurface }}
              >
                About This Store
              </Button>
            </HStack>

            {!currentUser && (
              <Button
                as={RouterLink}
                to="/login"
                variant="ghost"
                px={0}
                color={accentColor}
                fontWeight="700"
                _hover={{ bg: 'transparent', color: accentColorHover }}
              >
                Sign in for faster checkout
              </Button>
            )}

            <Text color={descColor} fontSize="sm">
              Looking for full store details, team information, and service policies? Visit About This Store.
            </Text>
          </VStack>
        </Box>

        <Box id="store-collections" mt={{ base: 12, md: 14 }}>
          <VStack spacing={3} textAlign="center" mb={{ base: 8, md: 10 }}>
            <Badge
              bg={accentSoft}
              color={accentColor}
              borderRadius="full"
              px={3.5}
              py={1.5}
              fontWeight="700"
              letterSpacing="0.08em"
              fontSize="10px"
            >
              Collections
            </Badge>
            <Heading color={textColor} fontSize={{ base: '2xl', md: '3xl' }}>
              Browse by collection
            </Heading>
            <Text color={descColor} maxW="620px">
              Every collection below is curated for this storefront to keep discovery clear and focused.
            </Text>
          </VStack>

          {hasCatalogues ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {catalogues.map((catalogue) => (
                <Box
                  key={catalogue.id}
                  as={RouterLink}
                  to={`/catalogue/${catalogue.id}`}
                  display="block"
                  bg={surfaceBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="14px"
                  overflow="hidden"
                  boxShadow="card"
                  cursor="pointer"
                  touchAction="manipulation"
                  _hover={{ boxShadow: 'cardHover', borderColor: '#94A3B8' }}
                  _focusVisible={{ boxShadow: `0 0 0 2px ${accentColor}` }}
                  transition="box-shadow 0.2s ease, border-color 0.2s ease"
                >
                  <Box h="200px" overflow="hidden" bg={mutedSurface}>
                    <Image
                      src={catalogue.imageUrl}
                      alt={catalogue.name}
                      h="full"
                      w="full"
                      objectFit="cover"
                      loading="lazy"
                      fallbackSrc="https://via.placeholder.com/500x380?text=Collection"
                    />
                  </Box>

                  <Box p={5}>
                    <Text fontSize="xs" color={descColor} textTransform="uppercase" letterSpacing="0.08em" fontWeight="700" mb={2}>
                      Collection
                    </Text>

                    <Heading as="h3" size="md" color={textColor} noOfLines={1} mb={2}>
                      {catalogue.name}
                    </Heading>

                    <Text color={descColor} fontSize="sm" noOfLines={2} lineHeight="1.7" mb={4}>
                      {catalogue.description || 'Discover products curated by this store in this collection.'}
                    </Text>

                    <HStack color={accentColor} fontWeight="700" fontSize="sm" spacing={2}>
                      <Text>View Collection</Text>
                      <Icon as={FiArrowRight} />
                    </HStack>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          ) : (
            <Box
              bg={surfaceBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="18px"
              py={14}
              px={6}
              textAlign="center"
            >
              <Flex w={14} h={14} bg={emptyIconBg} borderRadius="full" align="center" justify="center" mx="auto" mb={4}>
                <Icon as={FiShoppingBag} w={7} h={7} color="gray.400" />
              </Flex>
              <Heading size="md" color={textColor} mb={2}>Collections are being prepared</Heading>
              <Text color={descColor} mb={5}>This store is active, and inventory will appear shortly.</Text>
              <Button
                as={RouterLink}
                to="/contact"
                bg={accentColor}
                color="white"
                _hover={{ bg: accentColorHover }}
                borderRadius="12px"
                px={7}
              >
                Ask About Availability
              </Button>
            </Box>
          )}
        </Box>

        {storeOwner.requestProductEnabled && (
          <Box
            mt={10}
            bg={surfaceBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="14px"
            p={{ base: 6, md: 7 }}
          >
            <Flex
              direction={{ base: 'column', md: 'row' }}
              align={{ base: 'start', md: 'center' }}
              justify="space-between"
              gap={4}
            >
              <VStack align="start" spacing={1}>
                <Heading as="h3" size="md" color={textColor}>Need a specific product?</Heading>
                <Text color={descColor}>
                  Send a request directly to this store and get a tailored sourcing response.
                </Text>
              </VStack>
              <Button
                as={RouterLink}
                to="/request-product"
                bg={accentColor}
                color="white"
                _hover={{ bg: accentColorHover }}
                borderRadius="12px"
                px={7}
                minW={{ md: '200px' }}
              >
                Request Product
              </Button>
            </Flex>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default StorefrontPage;