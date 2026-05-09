import React, { useState, useEffect, useMemo } from 'react';
import {
  AspectRatio,
  Badge,
  Box,
  Button,
  Center,
  Container,
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

  // Use theme variables for consistent branding and professional appearance
  const pageBg = useColorModeValue('#F7F8FA', '#0A0B10');
  const surfaceBg = useColorModeValue('rgba(255,255,255,0.9)', 'rgba(17,17,22,0.92)');
  const mutedSurface = useColorModeValue('#F3F4F6', '#1A1A24');
  const borderColor = useColorModeValue('#E5E7EB', 'whiteAlpha.100');
  const textColor = useColorModeValue('var(--store-primary)', 'whiteAlpha.900');
  const descColor = useColorModeValue('gray.600', 'gray.400');
  const emptyIconBg = useColorModeValue('gray.100', 'whiteAlpha.100');
  const accentColor = useColorModeValue('var(--store-accent)', 'var(--store-accent)');
  const accentColorHover = useColorModeValue('var(--store-primary)', '#1d1b33');
  const accentSoft = useColorModeValue('rgba(37, 99, 235, 0.08)', 'rgba(255,255,255,0.08)');
  const chipBg = useColorModeValue('#F3F4F6', 'whiteAlpha.50');
  const panelBg = useColorModeValue('rgba(255,255,255,0.84)', 'rgba(15,15,20,0.72)');
  const heroGlow = useColorModeValue('radial-gradient(circle at top left, rgba(37,99,235,0.10), transparent 42%)', 'radial-gradient(circle at top left, rgba(37,99,235,0.24), transparent 42%)');
  const heroGlowSecondary = useColorModeValue('radial-gradient(circle at bottom right, rgba(15,23,42,0.05), transparent 38%)', 'radial-gradient(circle at bottom right, rgba(255,255,255,0.08), transparent 38%)');

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
  const storeInitials = useMemo(() => storeTitle
    .split(/\s+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase(), [storeTitle]);
  const hasCatalogues = catalogues.length > 0;

  if (loading) {
    return (
      <Box bg={pageBg} minH="100vh">
        <Container maxW="container.xl" py={{ base: 10, md: 14 }}>
          <Skeleton height="280px" borderRadius="24px" mb={6} />
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {[1, 2, 3].map((idx) => (
              <Skeleton key={idx} height="220px" borderRadius="18px" />
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
          boxShadow="0 18px 50px rgba(15, 23, 42, 0.08)"
        >
          <Box position="absolute" inset="0" bg={heroGlow} />
          <Box position="absolute" inset="0" bg={heroGlowSecondary} />
          <Box position="absolute" top="-90px" right="-70px" w="220px" h="220px" borderRadius="full" bg={accentSoft} filter="blur(20px)" />

          <Box position="relative" p={{ base: 5, md: 8 }}>
            <Grid templateColumns={{ base: '1fr', xl: '1.1fr 0.9fr' }} gap={{ base: 6, xl: 8 }} alignItems="stretch">
              <Box>
                <Badge
                  bg={accentSoft}
                  color={accentColor}
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontWeight="700"
                  letterSpacing="0.1em"
                  fontSize="9px"
                >
                  PREMIUM STOREFRONT
                </Badge>

                <Heading
                  as="h1"
                  color={textColor}
                  fontSize={{ base: '2.8xl', md: '5xl', xl: '5.5xl' }}
                  lineHeight="1.02"
                  fontWeight="900"
                  letterSpacing="-0.04em"
                  mt={4}
                  maxW="12ch"
                >
                  {storeTitle}
                </Heading>

                <Text color={descColor} fontSize={{ base: 'sm', md: 'lg' }} lineHeight="1.8" mt={4} maxW="700px" fontWeight="500">
                  {storeDescription}
                </Text>

                <HStack spacing={2.5} flexWrap="wrap" mt={6}>
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

                <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3} mt={8} maxW="760px">
                  <HStack spacing={3} px={4} py={3} bg={chipBg} borderRadius="18px" borderWidth="1px" borderColor={borderColor}>
                    <Center w={10} h={10} borderRadius="full" bg={accentSoft} color={accentColor} fontWeight="800" fontSize="sm">
                      {String(catalogues.length).padStart(2, '0')}
                    </Center>
                    <Box>
                      <Text fontWeight="800" color={textColor}>Collections</Text>
                      <Text fontSize="xs" color={descColor}>Ready to browse</Text>
                    </Box>
                  </HStack>
                  <HStack spacing={3} px={4} py={3} bg={chipBg} borderRadius="18px" borderWidth="1px" borderColor={borderColor}>
                    <Center w={10} h={10} borderRadius="full" bg={accentSoft} color={accentColor}>
                      <Icon as={FiShield} boxSize={4} />
                    </Center>
                    <Box>
                      <Text fontWeight="800" color={textColor}>Secure</Text>
                      <Text fontSize="xs" color={descColor}>Focused checkout</Text>
                    </Box>
                  </HStack>
                  <HStack spacing={3} px={4} py={3} bg={chipBg} borderRadius="18px" borderWidth="1px" borderColor={borderColor}>
                    <Center w={10} h={10} borderRadius="full" bg={accentSoft} color={accentColor}>
                      <Icon as={FiMail} boxSize={4} />
                    </Center>
                    <Box>
                      <Text fontWeight="800" color={textColor}>Direct</Text>
                      <Text fontSize="xs" color={descColor}>Store support</Text>
                    </Box>
                  </HStack>
                </SimpleGrid>

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
                borderRadius="26px"
                p={5}
                backdropFilter="blur(18px)"
              >
                <VStack align="stretch" spacing={4} h="full">
                  <Box>
                    <HStack justify="space-between" align="start" spacing={3}>
                      <Box>
                        <Text color={descColor} fontSize="xs" fontWeight="700" letterSpacing="0.12em" textTransform="uppercase">
                          Live snapshot
                        </Text>
                        <Heading color={textColor} mt={1.5} fontSize="2xl" fontWeight="900" letterSpacing="-0.02em">
                          Built for quick browsing
                        </Heading>
                      </Box>
                      <Center w="56px" h="56px" borderRadius="18px" bg={accentSoft} color={accentColor} fontWeight="900" fontSize="lg">
                        {storeInitials || 'SS'}
                      </Center>
                    </HStack>
                  </Box>

                  <Box
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="22px"
                    bg={surfaceBg}
                    p={4}
                  >
                    <HStack justify="space-between" align="center" spacing={3}>
                      <Box>
                        <Text color={descColor} fontSize="xs" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase">
                          Store state
                        </Text>
                        <Text color={textColor} fontWeight="800" mt={1}>Open for browsing</Text>
                      </Box>
                      <Badge bg={accentSoft} color={accentColor} borderRadius="full" px={3} py={1}>
                        {catalogues.length} collections
                      </Badge>
                    </HStack>
                  </Box>

                  <Box borderWidth="1px" borderColor={borderColor} borderRadius="22px" overflow="hidden">
                    <AspectRatio ratio={16 / 9} bg={mutedSurface}>
                      <Box position="relative">
                        <Image
                          src={catalogues[0]?.imageUrl || 'https://via.placeholder.com/1200x675?text=Storefront'}
                          alt={catalogues[0]?.name || storeTitle}
                          objectFit="cover"
                          loading="lazy"
                        />
                        <Box position="absolute" inset="0" bgGradient="linear(to-t, rgba(15,23,42,0.7), transparent 55%)" />
                        <Box position="absolute" left={4} right={4} bottom={4}>
                          <HStack justify="space-between" align="end" spacing={3}>
                            <Box>
                              <Badge bg="whiteAlpha.800" color={textColor} borderRadius="full" px={2.5} py={0.5} fontSize="9px">
                                Featured first collection
                              </Badge>
                              <Text color="white" fontWeight="800" fontSize="lg" mt={2} noOfLines={1}>
                                {catalogues[0]?.name || 'Store collection'}
                              </Text>
                            </Box>
                            <Icon as={FiArrowRight} color="white" boxSize={5} />
                          </HStack>
                        </Box>
                      </Box>
                    </AspectRatio>
                  </Box>

                  <VStack align="stretch" spacing={3}>
                    {storefrontHighlights.map((highlight) => (
                      <HStack
                        key={highlight.title}
                        align="start"
                        spacing={3}
                        py={3}
                        px={0}
                        borderBottomWidth="1px"
                        borderColor={borderColor}
                        _last={{ borderBottomWidth: 0 }}
                      >
                        <Center w="38px" h="38px" borderRadius="12px" bg={accentSoft} color={accentColor} flexShrink={0}>
                          <Icon as={highlight.icon} boxSize={4} />
                        </Center>
                        <Box>
                          <Text color={textColor} fontWeight="800" fontSize="sm">{highlight.title}</Text>
                          <Text color={descColor} fontSize="xs" lineHeight="1.6" mt={0.5}>
                            {highlight.description}
                          </Text>
                        </Box>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Box>
            </Grid>
          </Box>
        </Box>

        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mt={8}>
          {storefrontStats.map((stat) => (
            <Box
              key={stat.label}
              bg={surfaceBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="18px"
              p={4}
              boxShadow="0 1px 2px rgba(0,0,0,0.05)"
            >
              <HStack justify="space-between" align="start" spacing={2}>
                <Box>
                  <Text color={descColor} fontSize="xs" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase">
                    {stat.label}
                  </Text>
                  <Heading color={textColor} fontSize={{ base: 'xl', md: '2xl' }} lineHeight="1.1" mt={1.5} fontWeight="800">
                    {stat.value}
                  </Heading>
                </Box>
                <Center w="36px" h="36px" borderRadius="10px" bg={accentSoft} color={accentColor} flexShrink={0}>
                  <Icon as={stat.icon} boxSize={3.5} />
                </Center>
              </HStack>
              <Text color={descColor} fontSize="xs" lineHeight="1.6" mt={2.5}>
                {stat.note}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        <Box id="store-collections" mt={{ base: 10, md: 12 }}>
          <HStack justify="space-between" align={{ base: 'start', md: 'end' }} flexWrap="wrap" gap={4} mb={6}>
            <VStack align="start" spacing={1.5} maxW="720px">
              <Badge
                bg={accentSoft}
                color={accentColor}
                borderRadius="full"
                px={3}
                py={1}
                fontWeight="700"
                letterSpacing="0.08em"
                fontSize="9px"
              >
                COLLECTIONS
              </Badge>
              <Heading color={textColor} fontSize={{ base: '2xl', md: '3xl' }} fontWeight="900" letterSpacing="-0.03em">
                Shop the edited collection
              </Heading>
              <Text color={descColor} fontSize="sm" maxW="660px" fontWeight="500" lineHeight="1.7">
                Each category is presented with a simple, focused layout so customers can move from discovery to checkout with less friction.
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
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
              {catalogues.map((catalogue, index) => (
                <Box
                  key={catalogue.id}
                  as={RouterLink}
                  to={`/catalogue/${catalogue.id}`}
                  display="block"
                  bg={surfaceBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="22px"
                  overflow="hidden"
                  boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                  cursor="pointer"
                  touchAction="manipulation"
                  _hover={{ boxShadow: '0 10px 24px rgba(0,0,0,0.08)', borderColor: borderColor, transform: 'translateY(-2px)' }}
                  _focusVisible={{ boxShadow: `0 0 0 2px ${accentColor}` }}
                  transition="transform 0.2s ease, box-shadow 0.2s ease"
                >
                  <Box position="relative">
                    <AspectRatio ratio={4 / 3} bg={mutedSurface}>
                      <Image
                        src={catalogue.imageUrl}
                        alt={catalogue.name}
                        objectFit="cover"
                        loading="lazy"
                        fallbackSrc="https://via.placeholder.com/900x675?text=Collection"
                      />
                    </AspectRatio>
                    <Box position="absolute" inset="0" bgGradient="linear(to-t, rgba(15,23,42,0.38), transparent 58%)" />
                    <Badge
                      position="absolute"
                      top={4}
                      left={4}
                      bg="whiteAlpha.900"
                      color={textColor}
                      borderRadius="full"
                      px={3}
                      py={1}
                      fontSize="9px"
                      fontWeight="700"
                      letterSpacing="0.08em"
                    >
                      {index === 0 ? 'FEATURED' : `COLLECTION ${String(index + 1).padStart(2, '0')}`}
                    </Badge>
                  </Box>

                  <Stack spacing={3} p={4.5}>
                    <HStack justify="space-between" align="start" spacing={3}>
                      <Box flex={1}>
                        <Heading as="h3" size="sm" color={textColor} noOfLines={2} fontSize="lg" fontWeight="800" letterSpacing="-0.02em">
                          {catalogue.name}
                        </Heading>
                        <Text color={descColor} fontSize="xs" mt={1} fontWeight="600">
                          Curated for fast browsing
                        </Text>
                      </Box>
                      <Center w="36px" h="36px" borderRadius="12px" bg={accentSoft} color={accentColor} flexShrink={0}>
                        <Icon as={FiArrowRight} boxSize={4} />
                      </Center>
                    </HStack>

                    <Text color={descColor} fontSize="sm" noOfLines={2} lineHeight="1.65" fontWeight="500">
                      {catalogue.description || 'A clean, focused assortment from this storefront.'}
                    </Text>

                    <HStack justify="space-between" pt={1} color={accentColor} fontSize="sm">
                      <Text fontWeight="800">Open collection</Text>
                      <Icon as={FiArrowRight} boxSize={3.5} />
                    </HStack>
                  </Stack>
                </Box>
              ))}
            </SimpleGrid>
          ) : (
            <Box
              bg={surfaceBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="22px"
              py={14}
              px={6}
              textAlign="center"
            >
              <Center w={16} h={16} bg={emptyIconBg} borderRadius="full" mx="auto" mb={5}>
                <Icon as={FiShoppingBag} w={8} h={8} color="gray.400" />
              </Center>
              <Heading size="md" color={textColor} mb={3} fontWeight="800">Collections are being prepared</Heading>
              <Text color={descColor} mb={6} maxW="520px" mx="auto" fontSize="sm" lineHeight="1.7">
                This storefront is live, and the catalog will appear as the store adds products.
              </Text>
              <HStack justify="center" spacing={3} flexWrap="wrap">
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
                {storeOwner.requestProductEnabled && (
                  <Button
                    as={RouterLink}
                    to="/request-product"
                    variant="outline"
                    borderRadius="full"
                    borderColor={borderColor}
                    color={textColor}
                    px={7}
                  >
                    Request a product
                  </Button>
                )}
              </HStack>
            </Box>
          )}
        </Box>

        {storeOwner.requestProductEnabled && (
          <Box
            mt={10}
            bg={surfaceBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="24px"
            p={{ base: 5, md: 7 }}
          >
            <Grid templateColumns={{ base: '1fr', md: '1.2fr 0.8fr' }} gap={6} alignItems="center">
              <Box>
                <Badge
                  bg={accentSoft}
                  color={accentColor}
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontWeight="700"
                  letterSpacing="0.08em"
                  fontSize="9px"
                >
                  REQUEST
                </Badge>
                <Heading as="h3" size="lg" color={textColor} mt={3} fontSize="2xl" fontWeight="900" letterSpacing="-0.02em">
                  Need a specific product?
                </Heading>
                <Text color={descColor} mt={2.5} lineHeight="1.7" maxW="700px" fontSize="sm" fontWeight="500">
                  Send a request directly to this store and keep the conversation in one place.
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
                  minW={{ md: '200px' }}
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