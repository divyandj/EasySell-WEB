import React, { useState, useEffect, useMemo } from 'react';
import {
  AspectRatio,
  Badge,
  Box,
  Button,
  Center,
  Container,
  Divider,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Image,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiShield,
  FiShoppingBag,
  FiTruck,
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

const storefrontHighlights = [
  {
    title: 'Fast dispatch',
    description: 'Orders move quickly from browsing to packing without unnecessary steps.',
    icon: FiTruck,
  },
  {
    title: 'Secure checkout',
    description: 'The payment path stays focused and easy to follow.',
    icon: FiShield,
  },
  {
    title: 'Direct support',
    description: 'Customers can contact the store team without leaving the storefront.',
    icon: FiMail,
  },
];

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
  const accentColor = useColorModeValue('brand.600', 'brand.300');
  const accentColorHover = useColorModeValue('brand.700', 'brand.400');
  const accentSoft = useColorModeValue('brand.50', 'rgba(37, 99, 235, 0.08)');
  const chipBg = useColorModeValue('#F8FAFC', 'whiteAlpha.100');
  const panelBg = useColorModeValue('rgba(255,255,255,0.84)', 'rgba(17,24,39,0.94)');

  const storefrontStats = useMemo(() => ([
    {
      label: 'Collections',
      value: String(catalogues.length).padStart(2, '0'),
      note: 'Curated categories to browse',
      icon: FiShoppingBag,
    },
    {
      label: 'Checkout',
      value: 'Secure',
      note: 'Payment flow kept focused',
      icon: FiCheckCircle,
    },
    {
      label: 'Support',
      value: 'Direct',
      note: 'Store-led help and follow-up',
      icon: FiMail,
    },
    {
      label: 'Dispatch',
      value: 'Quick',
      note: 'Practical delivery timelines',
      icon: FiClock,
    },
  ]), [catalogues.length]);

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
      <Container maxW="container.xl" py={{ base: 6, md: 10 }}>
        <Box
          position="relative"
          overflow="hidden"
          bg={surfaceBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius={{ base: '24px', md: '32px' }}
          boxShadow="card"
        >
          <Box position="absolute" inset="0" bgGradient="linear(to-br, rgba(37,99,235,0.14), transparent 38%, transparent 62%, rgba(15,23,42,0.04))" />

          <Box position="relative" p={{ base: 6, md: 10 }}>
            <Grid templateColumns={{ base: '1fr', xl: '1.15fr 0.85fr' }} gap={{ base: 8, xl: 10 }} alignItems="stretch">
              <Box>
                <Badge
                  bg={accentSoft}
                  color={accentColor}
                  borderRadius="full"
                  px={3.5}
                  py={1.5}
                  fontWeight="800"
                  letterSpacing="0.08em"
                  fontSize="10px"
                >
                  Independent storefront
                </Badge>

                <Heading
                  as="h1"
                  color={textColor}
                  fontSize={{ base: '3xl', md: '5xl', xl: '5.5xl' }}
                  lineHeight="1.04"
                  mt={4}
                  maxW="11ch"
                >
                  {storeTitle}
                </Heading>

                <Text color={descColor} fontSize={{ base: 'md', md: 'lg' }} lineHeight="1.85" mt={5} maxW="760px">
                  {storeDescription}
                </Text>

                <HStack spacing={3} flexWrap="wrap" mt={7}>
                  <Button
                    as="a"
                    href="#store-collections"
                    bg={accentColor}
                    color="white"
                    borderRadius="full"
                    px={7}
                    rightIcon={<Icon as={FiArrowRight} />}
                    _hover={{ bg: accentColorHover, transform: 'translateY(-1px)' }}
                    _active={{ transform: 'translateY(0)' }}
                  >
                    Browse collections
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/contact"
                    variant="outline"
                    borderRadius="full"
                    px={7}
                    borderColor={borderColor}
                    color={textColor}
                    leftIcon={<Icon as={FiMail} />}
                  >
                    Contact store
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/about-us"
                    variant="ghost"
                    borderRadius="full"
                    px={6}
                    color={textColor}
                    _hover={{ bg: mutedSurface }}
                  >
                    About this store
                  </Button>
                </HStack>

                <HStack spacing={2} flexWrap="wrap" mt={6} color={descColor} fontSize="sm">
                  <HStack spacing={1.5} px={3} py={1.5} bg={chipBg} borderRadius="full">
                    <Icon as={FiCheckCircle} />
                    <Text fontWeight="700">Secure checkout</Text>
                  </HStack>
                  <HStack spacing={1.5} px={3} py={1.5} bg={chipBg} borderRadius="full">
                    <Icon as={FiTruck} />
                    <Text fontWeight="700">Quick dispatch</Text>
                  </HStack>
                  <HStack spacing={1.5} px={3} py={1.5} bg={chipBg} borderRadius="full">
                    <Icon as={FiMail} />
                    <Text fontWeight="700">Direct support</Text>
                  </HStack>
                </HStack>

                {!currentUser && (
                  <Text color={descColor} fontSize="sm" mt={4}>
                    Sign in for faster checkout and order history.
                  </Text>
                )}
              </Box>

              <Box
                bg={panelBg}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="28px"
                p={5}
                backdropFilter="blur(16px)"
              >
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Text color={descColor} fontSize="xs" fontWeight="800" letterSpacing="0.12em" textTransform="uppercase">
                      Store snapshot
                    </Text>
                    <Heading size="lg" color={textColor} mt={1}>
                      Shopping made simple
                    </Heading>
                  </Box>

                  <Divider borderColor={borderColor} />

                  {storefrontHighlights.map((highlight) => (
                    <HStack
                      key={highlight.title}
                      align="start"
                      spacing={3}
                      p={3.5}
                      borderRadius="20px"
                      bg={mutedSurface}
                      borderWidth="1px"
                      borderColor={borderColor}
                    >
                      <Center w="42px" h="42px" borderRadius="14px" bg={accentSoft} color={accentColor} flexShrink={0}>
                        <Icon as={highlight.icon} boxSize={4.5} />
                      </Center>
                      <Box>
                        <Text color={textColor} fontWeight="800" fontSize="sm">{highlight.title}</Text>
                        <Text color={descColor} fontSize="sm" lineHeight="1.7" mt={1}>
                          {highlight.description}
                        </Text>
                      </Box>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </Grid>
          </Box>
        </Box>

        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mt={6}>
          {storefrontStats.map((stat) => (
            <Box
              key={stat.label}
              bg={surfaceBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="24px"
              p={4}
              boxShadow="soft"
            >
              <HStack justify="space-between" align="start" spacing={3}>
                <Box>
                  <Text color={descColor} fontSize="xs" fontWeight="800" letterSpacing="0.12em" textTransform="uppercase">
                    {stat.label}
                  </Text>
                  <Heading color={textColor} fontSize={{ base: '2xl', md: '3xl' }} lineHeight="1.1" mt={2}>
                    {stat.value}
                  </Heading>
                </Box>
                <Center w="40px" h="40px" borderRadius="14px" bg={accentSoft} color={accentColor} flexShrink={0}>
                  <Icon as={stat.icon} boxSize={4} />
                </Center>
              </HStack>
              <Text color={descColor} fontSize="sm" lineHeight="1.7" mt={3}>
                {stat.note}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        <Box id="store-collections" mt={{ base: 12, md: 14 }}>
          <HStack justify="space-between" align={{ base: 'start', md: 'end' }} flexWrap="wrap" gap={4} mb={6}>
            <VStack align="start" spacing={2} maxW="720px">
              <Badge
                bg={accentSoft}
                color={accentColor}
                borderRadius="full"
                px={3.5}
                py={1.5}
                fontWeight="800"
                letterSpacing="0.08em"
                fontSize="10px"
              >
                Collections
              </Badge>
              <Heading color={textColor} fontSize={{ base: '2xl', md: '3xl' }}>
                Browse focused collections
              </Heading>
              <Text color={descColor} maxW="660px">
                The storefront stays intentionally narrow so customers can move from discovery to checkout with less friction.
              </Text>
            </VStack>

            {storeOwner.requestProductEnabled && (
              <Button
                as={RouterLink}
                to="/request-product"
                variant="outline"
                borderRadius="full"
                borderColor={borderColor}
                color={textColor}
                minW={{ md: '190px' }}
              >
                Request a product
              </Button>
            )}
          </HStack>

          {hasCatalogues ? (
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
              {catalogues.map((catalogue, index) => (
                <Box
                  key={catalogue.id}
                  as={RouterLink}
                  to={`/catalogue/${catalogue.id}`}
                  display="block"
                  bg={surfaceBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="28px"
                  overflow="hidden"
                  boxShadow="card"
                  cursor="pointer"
                  touchAction="manipulation"
                  _hover={{ boxShadow: 'cardHover', borderColor: borderColor, transform: 'translateY(-2px)' }}
                  _focusVisible={{ boxShadow: `0 0 0 2px ${accentColor}` }}
                  transition="transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease"
                >
                  <AspectRatio ratio={4 / 3} bg={mutedSurface}>
                    <Image
                      src={catalogue.imageUrl}
                      alt={catalogue.name}
                      objectFit="cover"
                      loading="lazy"
                      fallbackSrc="https://via.placeholder.com/900x675?text=Collection"
                    />
                  </AspectRatio>

                  <Stack spacing={4} p={5}>
                    <HStack justify="space-between" align="start" spacing={3}>
                      <Box>
                        <Badge
                          bg={accentSoft}
                          color={accentColor}
                          borderRadius="full"
                          px={2.5}
                          py={1}
                          fontSize="10px"
                          fontWeight="800"
                          letterSpacing="0.08em"
                        >
                          Collection {String(index + 1).padStart(2, '0')}
                        </Badge>
                        <Heading as="h3" size="md" color={textColor} noOfLines={1} mt={3}>
                          {catalogue.name}
                        </Heading>
                      </Box>
                      <Icon as={FiArrowRight} color={accentColor} />
                    </HStack>

                    <Text color={descColor} fontSize="sm" noOfLines={3} lineHeight="1.75">
                      {catalogue.description || 'Discover a clean selection curated by this store.'}
                    </Text>

                    <Divider borderColor={borderColor} />

                    <Text color={accentColor} fontWeight="800" fontSize="sm">
                      View collection
                    </Text>
                  </Stack>
                </Box>
              ))}
            </SimpleGrid>
          ) : (
            <Box
              bg={surfaceBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="28px"
              py={16}
              px={6}
              textAlign="center"
            >
              <Center w={16} h={16} bg={emptyIconBg} borderRadius="full" mx="auto" mb={5}>
                <Icon as={FiShoppingBag} w={8} h={8} color="gray.400" />
              </Center>
              <Heading size="md" color={textColor} mb={3}>Collections are being prepared</Heading>
              <Text color={descColor} mb={6} maxW="520px" mx="auto">
                This storefront is live, and the catalog will appear as the store adds products.
              </Text>
              <Button
                as={RouterLink}
                to="/contact"
                bg={accentColor}
                color="white"
                _hover={{ bg: accentColorHover }}
                borderRadius="full"
                px={7}
              >
                Ask about availability
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
            borderRadius="28px"
            p={{ base: 6, md: 8 }}
          >
            <Grid templateColumns={{ base: '1fr', md: '1.15fr 0.85fr' }} gap={6} alignItems="center">
              <Box>
                <Badge
                  bg={accentSoft}
                  color={accentColor}
                  borderRadius="full"
                  px={3.5}
                  py={1.5}
                  fontWeight="800"
                  letterSpacing="0.08em"
                  fontSize="10px"
                >
                  Request flow
                </Badge>
                <Heading as="h3" size="lg" color={textColor} mt={4}>
                  Need a specific product?
                </Heading>
                <Text color={descColor} mt={3} lineHeight="1.8" maxW="700px">
                  Send a request directly to this store and keep the conversation in one place. The response stays tied to the storefront so the next step is easy to follow.
                </Text>
              </Box>

              <HStack justify={{ base: 'flex-start', md: 'flex-end' }}>
                <Button
                  as={RouterLink}
                  to="/request-product"
                  bg={accentColor}
                  color="white"
                  _hover={{ bg: accentColorHover }}
                  borderRadius="full"
                  px={7}
                  minW={{ md: '220px' }}
                >
                  Request product
                </Button>
              </HStack>
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default StorefrontPage;