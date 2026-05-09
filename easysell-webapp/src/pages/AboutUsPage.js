import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Center,
  Container,
  Divider,
  Grid,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Stack,
  Skeleton,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { FiArrowLeft, FiCheckCircle, FiMail, FiPackage, FiShield, FiShoppingBag, FiTruck, FiUser } from 'react-icons/fi';
import { db } from '../firebase';
import { resolveStoreContext } from '../utils/storeResolver';

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
  || 'We focus on reliable products, clear communication, and a smooth buying experience.'
);

const servicePillars = [
  {
    title: 'Clear product guidance',
    description: 'Collections stay organized so shoppers can compare options quickly.',
    icon: FiShoppingBag,
  },
  {
    title: 'Reliable service',
    description: 'Orders, updates, and follow-up are handled by the store team directly.',
    icon: FiTruck,
  },
  {
    title: 'Confident checkout',
    description: 'The buying flow is designed to keep the important steps simple and visible.',
    icon: FiShield,
  },
];

const supportPromises = [
  'Fast answers from the store team',
  'Order status is easy to track',
  'Requests stay tied to the storefront',
];

const AboutUsPage = () => {
  const context = resolveStoreContext();
  const subdomain = context.type === 'subdomain' || context.type === 'customDomain'
    ? (context.handle || context.domain || '').toLowerCase()
    : '';

  const [storeOwner, setStoreOwner] = useState(null);
  const [catalogueCount, setCatalogueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const pageBg = useColorModeValue('#F4F6F8', '#090B12');
  const surfaceBg = useColorModeValue('white', '#111827');
  const borderColor = useColorModeValue('#E2E8F0', 'whiteAlpha.200');
  const textColor = useColorModeValue('#0F172A', 'whiteAlpha.900');
  const descColor = useColorModeValue('#334155', 'gray.300');
  const mutedBg = useColorModeValue('#F1F5F9', '#1F2937');
  const accentColor = '#2563EB';
  const accentSoft = useColorModeValue('#DBEAFE', 'rgba(37, 99, 235, 0.22)');
  const softBorder = useColorModeValue('#CBD5E1', 'whiteAlpha.300');
  const panelBg = useColorModeValue('rgba(255,255,255,0.84)', 'rgba(17,24,39,0.94)');

  useEffect(() => {
    const fetchStoreInfo = async () => {
      if (!subdomain) {
        setLoading(false);
        return;
      }

      try {
        const usersRef = collection(db, 'users');
        const ownerQuery = query(usersRef, where('storeHandle', '==', subdomain));
        const userSnapshot = await getDocs(ownerQuery);

        if (userSnapshot.empty) {
          setLoading(false);
          return;
        }

        const ownerData = userSnapshot.docs[0].data();
        const ownerId = userSnapshot.docs[0].id;
        setStoreOwner({ id: ownerId, ...ownerData });

        const catRef = collection(db, 'catalogues');
        const catQuery = query(catRef, where('userId', '==', ownerId));
        const catSnapshot = await getDocs(catQuery);
        setCatalogueCount(catSnapshot.docs.length);
      } catch (error) {
        console.error('Failed to fetch store about info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreInfo();
  }, [subdomain]);

  const storeName = useMemo(() => {
    if (storeOwner?.businessName) return storeOwner.businessName;
    return formatStoreHandle(subdomain || 'Store');
  }, [storeOwner, subdomain]);

  const storeDescription = getStoreDescription(storeOwner);

  if (loading) {
    return (
      <Box bg={pageBg} minH="100vh">
        <Container maxW="container.lg" py={{ base: 8, md: 10 }}>
          <Skeleton height="260px" borderRadius="20px" mb={5} />
          <Skeleton height="180px" borderRadius="20px" />
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={pageBg} minH="100vh">
      <Container maxW="container.xl" py={{ base: 6, md: 10 }}>
        <Button
          as={RouterLink}
          to="/"
          variant="ghost"
          leftIcon={<FiArrowLeft />}
          mb={5}
          color={textColor}
          borderRadius="full"
          _hover={{ bg: mutedBg }}
        >
          Back to Storefront
        </Button>

        <Box
          position="relative"
          overflow="hidden"
          bg={surfaceBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius={{ base: '24px', md: '32px' }}
          boxShadow="card"
        >
          <Box position="absolute" inset="0" bgGradient="linear(to-br, rgba(37,99,235,0.12), transparent 38%, transparent 68%, rgba(15,23,42,0.04))" />

          <Box position="relative" p={{ base: 6, md: 10 }}>
            <Grid templateColumns={{ base: '1fr', xl: '1.1fr 0.9fr' }} gap={{ base: 8, xl: 10 }} alignItems="stretch">
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
                  About this store
                </Badge>

                <Heading color={textColor} fontSize={{ base: '3xl', md: '5xl' }} lineHeight="1.05" mt={4} maxW="11ch">
                  {storeName}
                </Heading>

                <Text color={descColor} fontSize={{ base: 'md', md: 'lg' }} lineHeight="1.85" mt={5} maxW="720px">
                  {storeDescription}
                </Text>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full" mt={7}>
                  <Box bg={mutedBg} borderWidth="1px" borderColor={borderColor} borderRadius="20px" px={4} py={4}>
                    <HStack spacing={2} color={textColor} mb={2}>
                      <Icon as={FiUser} />
                      <Text fontWeight="800" fontSize="sm">Managed by</Text>
                    </HStack>
                    <Text color={descColor} fontSize="sm" lineHeight="1.7">{storeOwner?.ownerName || 'Independent store team'}</Text>
                  </Box>

                  <Box bg={mutedBg} borderWidth="1px" borderColor={borderColor} borderRadius="20px" px={4} py={4}>
                    <HStack spacing={2} color={textColor} mb={2}>
                      <Icon as={FiPackage} />
                      <Text fontWeight="800" fontSize="sm">Collections</Text>
                    </HStack>
                    <Text color={descColor} fontSize="sm" lineHeight="1.7">{catalogueCount}</Text>
                  </Box>

                  <Box bg={mutedBg} borderWidth="1px" borderColor={borderColor} borderRadius="20px" px={4} py={4}>
                    <HStack spacing={2} color={textColor} mb={2}>
                      <Icon as={FiShield} />
                      <Text fontWeight="800" fontSize="sm">Store handle</Text>
                    </HStack>
                    <Text color={descColor} fontSize="sm" lineHeight="1.7">{subdomain || 'N/A'}</Text>
                  </Box>
                </SimpleGrid>
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
                      Service focus
                    </Text>
                    <Heading size="lg" color={textColor} mt={1}>
                      Built for easy buying
                    </Heading>
                  </Box>

                  <Divider borderColor={borderColor} />

                  {servicePillars.map((pillar) => (
                    <HStack key={pillar.title} align="start" spacing={3} p={3.5} borderRadius="20px" bg={mutedBg} borderWidth="1px" borderColor={softBorder}>
                      <Center w="42px" h="42px" borderRadius="14px" bg={accentSoft} color={accentColor} flexShrink={0}>
                        <Icon as={pillar.icon} boxSize={4.5} />
                      </Center>
                      <Box>
                        <Text color={textColor} fontWeight="800" fontSize="sm">{pillar.title}</Text>
                        <Text color={descColor} fontSize="sm" lineHeight="1.7" mt={1}>
                          {pillar.description}
                        </Text>
                      </Box>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </Grid>
          </Box>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mt={6}>
          <Box bg={surfaceBg} borderWidth="1px" borderColor={borderColor} borderRadius="22px" p={5}>
            <Center w="42px" h="42px" borderRadius="14px" bg={accentSoft} color={accentColor} mb={4}>
              <Icon as={FiTruck} boxSize={4.5} />
            </Center>
            <Heading as="h3" size="sm" color={textColor} mb={2}>Fast delivery updates</Heading>
            <Text color={descColor} fontSize="sm" lineHeight="1.75">
              Orders are packed and dispatched with practical timelines and visible progress.
            </Text>
          </Box>

          <Box bg={surfaceBg} borderWidth="1px" borderColor={borderColor} borderRadius="22px" p={5}>
            <Center w="42px" h="42px" borderRadius="14px" bg={accentSoft} color={accentColor} mb={4}>
              <Icon as={FiMail} boxSize={4.5} />
            </Center>
            <Heading as="h3" size="sm" color={textColor} mb={2}>Direct store support</Heading>
            <Text color={descColor} fontSize="sm" lineHeight="1.75">
              Messages stay with the store team, which keeps follow-up simple and consistent.
            </Text>
          </Box>

          <Box bg={surfaceBg} borderWidth="1px" borderColor={borderColor} borderRadius="22px" p={5}>
            <Center w="42px" h="42px" borderRadius="14px" bg={accentSoft} color={accentColor} mb={4}>
              <Icon as={FiCheckCircle} boxSize={4.5} />
            </Center>
            <Heading as="h3" size="sm" color={textColor} mb={2}>Focused buying flow</Heading>
            <Text color={descColor} fontSize="sm" lineHeight="1.75">
              The storefront keeps key actions visible so customers can move through the journey quickly.
            </Text>
          </Box>
        </SimpleGrid>

        <Box
          mt={6}
          bg={surfaceBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="28px"
          p={{ base: 6, md: 8 }}
        >
          <Grid templateColumns={{ base: '1fr', md: '1.1fr 0.9fr' }} gap={6} alignItems="center">
            <Box>
              <Badge bg={accentSoft} color={accentColor} borderRadius="full" px={3.5} py={1.5} fontWeight="800" letterSpacing="0.08em" fontSize="10px">
                Support notes
              </Badge>
              <Heading as="h2" size="lg" color={textColor} mt={4}>
                Direct, simple communication
              </Heading>
              <Text color={descColor} mt={3} lineHeight="1.8">
                This store keeps service practical: the team responds directly, the order path stays visible, and customers do not need to navigate extra layers.
              </Text>
            </Box>

            <Stack spacing={3}>
              {supportPromises.map((item) => (
                <HStack key={item} spacing={3} px={4} py={3} bg={mutedBg} borderRadius="18px" borderWidth="1px" borderColor={borderColor}>
                  <Center w="34px" h="34px" borderRadius="12px" bg={accentSoft} color={accentColor} flexShrink={0}>
                    <Icon as={FiCheckCircle} boxSize={4} />
                  </Center>
                  <Text color={textColor} fontWeight="700" fontSize="sm">{item}</Text>
                </HStack>
              ))}
            </Stack>
          </Grid>

          <Button
            as={RouterLink}
            to="/contact"
            mt={6}
            bg={accentColor}
            color="white"
            _hover={{ bg: '#1D4ED8' }}
            borderRadius="full"
            px={7}
          >
            Contact Store
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default AboutUsPage;
