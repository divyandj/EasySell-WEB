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

          <Box position="relative" p={{ base: 4, md: 6 }}>
            <Grid templateColumns={{ base: '1fr', xl: '1.15fr 0.85fr' }} gap={{ base: 5, xl: 6 }} alignItems="start">
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
                  STOREFRONT
                </Badge>

                <Heading
                  as="h1"
                  color={textColor}
                  fontSize={{ base: '2.4xl', md: '4xl', xl: '4.75xl' }}
                  lineHeight="1.06"
                  fontWeight="900"
                  letterSpacing="-0.03em"
                  mt={3}
                  maxW="12ch"
                >
                  {storeTitle}
                </Heading>

                <Text color={descColor} fontSize={{ base: 'sm', md: 'md' }} lineHeight="1.7" mt={3} maxW="640px" fontWeight="500">
                  {storeDescription}
                </Text>

                <HStack spacing={2.5} flexWrap="wrap" mt={5}>
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

                {/* removed duplicate chips to reduce redundancy with quick-access panel */}

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
                borderRadius="22px"
                p={4.5}
                backdropFilter="blur(16px)"
              >
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between" align="start" spacing={3}>
                    <Box>
                      <Text color={descColor} fontSize="xs" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase">
                        Quick access
                      </Text>
                      <Heading color={textColor} mt={1} fontSize="xl" fontWeight="900" letterSpacing="-0.02em">
                        Start here
                      </Heading>
                    </Box>
                    <Center w="48px" h="48px" borderRadius="16px" bg={accentSoft} color={accentColor} fontWeight="900" fontSize="md">
                      {storeInitials || 'SS'}
                    </Center>
                  </HStack>

                  <VStack align="stretch" spacing={1}>
                    <Button as="a" href="#store-collections" variant="ghost" justifyContent="space-between" rightIcon={<Icon as={FiArrowRight} />} color={textColor} borderRadius="14px" px={3} py={6} _hover={{ bg: chipBg }}>
                      Browse collections
                    </Button>
                    <Button as={RouterLink} to="/contact" variant="ghost" justifyContent="space-between" rightIcon={<Icon as={FiArrowRight} />} color={textColor} borderRadius="14px" px={3} py={6} _hover={{ bg: chipBg }}>
                      Contact store
                    </Button>
                    {storeOwner.requestProductEnabled && (
                      <Button as={RouterLink} to="/request-product" variant="ghost" justifyContent="space-between" rightIcon={<Icon as={FiArrowRight} />} color={textColor} borderRadius="14px" px={3} py={6} _hover={{ bg: chipBg }}>
                        Request product
                      </Button>
                    )}
                    <Button as={RouterLink} to="/about-us" variant="ghost" justifyContent="space-between" rightIcon={<Icon as={FiArrowRight} />} color={textColor} borderRadius="14px" px={3} py={6} _hover={{ bg: chipBg }}>
                      About this store
                    </Button>
                  </VStack>

                  <Box pt={2} borderTopWidth="1px" borderColor={borderColor}>
                    <Text color={descColor} fontSize="sm" fontWeight="600">
                      {String(catalogues.length).padStart(2, '0')} collections ready to browse
                    </Text>
                  </Box>
                </VStack>
              </Box>
            </Grid>
          </Box>
        </Box>

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
                Shop collections
              </Heading>
              <Text color={descColor} fontSize="sm" maxW="620px" fontWeight="500" lineHeight="1.65">
                A compact, browse-first layout that makes it easy to scan categories and tap through quickly.
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
            <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
              {catalogues.map((catalogue, index) => (
                <Box
                  key={catalogue.id}
                  as={RouterLink}
                  to={`/catalogue/${catalogue.id}`}
                  display="block"
                  bg={surfaceBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="20px"
                  overflow="hidden"
                  boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                  cursor="pointer"
                  touchAction="manipulation"
                  _hover={{ boxShadow: '0 8px 20px rgba(0,0,0,0.08)', borderColor: borderColor, transform: 'translateY(-2px)' }}
                  _focusVisible={{ boxShadow: `0 0 0 2px ${accentColor}` }}
                  transition="transform 0.2s ease, box-shadow 0.2s ease"
                >
                  <Box position="relative">
                    <AspectRatio ratio={1} bg={mutedSurface}>
                      <Image
                        src={catalogue.imageUrl}
                        alt={catalogue.name}
                        objectFit="cover"
                        loading="lazy"
                        fallbackSrc="https://via.placeholder.com/900x675?text=Collection"
                      />
                    </AspectRatio>
                    <Box position="absolute" inset="0" bgGradient="linear(to-t, rgba(15,23,42,0.34), transparent 60%)" />
                    <Badge
                      position="absolute"
                      top={4}
                      left={4}
                      bg="whiteAlpha.900"
                      color={textColor}
                      borderRadius="full"
                      px={2.5}
                      py={0.5}
                      fontSize="9px"
                      fontWeight="700"
                      letterSpacing="0.08em"
                    >
                      {index === 0 ? 'FEATURED' : `COLLECTION ${String(index + 1).padStart(2, '0')}`}
                    </Badge>
                  </Box>

                  <Stack spacing={2.5} p={4}>
                    <Heading as="h3" size="sm" color={textColor} noOfLines={2} fontSize="md" fontWeight="800" letterSpacing="-0.02em">
                      {catalogue.name}
                    </Heading>

                    <Text color={descColor} fontSize="xs" noOfLines={2} lineHeight="1.55" fontWeight="500">
                      {catalogue.description || 'A focused assortment from this storefront.'}
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
              borderRadius="20px"
              py={12}
              px={6}
              textAlign="center"
            >
              <Center w={16} h={16} bg={emptyIconBg} borderRadius="full" mx="auto" mb={5}>
                <Icon as={FiShoppingBag} w={8} h={8} color="gray.400" />
              </Center>
              <Heading size="md" color={textColor} mb={3} fontWeight="800">Collections are being prepared</Heading>
              <Text color={descColor} mb={6} maxW="520px" mx="auto" fontSize="sm" lineHeight="1.7">
                This storefront is live, and the catalog will appear as the store adds products. Check back soon or contact the store team if you need help.
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

        {/* Request product banner removed to simplify storefront */}
      </Container>
    </Box>
  );
};

export default StorefrontPage;