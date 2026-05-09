import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Center,
  Container,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { FiArrowLeft, FiMail, FiPackage, FiShield, FiTruck, FiUser } from 'react-icons/fi';
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
      <Container maxW="container.lg" py={{ base: 8, md: 10 }}>
        <Button
          as={RouterLink}
          to="/"
          variant="ghost"
          leftIcon={<FiArrowLeft />}
          mb={5}
          color={textColor}
          borderRadius="10px"
          _hover={{ bg: mutedBg }}
        >
          Back to Storefront
        </Button>

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
              About Us
            </Badge>

            <Heading color={textColor} fontSize={{ base: '2xl', md: '4xl' }} lineHeight="1.1">
              {storeName}
            </Heading>

            <Text color={descColor} fontSize={{ base: 'md', md: 'lg' }} lineHeight="1.8">
              {storeDescription}
            </Text>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
              <Box bg={mutedBg} borderWidth="1px" borderColor={borderColor} borderRadius="14px" px={4} py={3}>
                <HStack spacing={2} color={textColor} mb={1}>
                  <Icon as={FiUser} />
                  <Text fontWeight="700" fontSize="sm">Managed by</Text>
                </HStack>
                <Text color={descColor} fontSize="sm">{storeOwner?.ownerName || 'Independent store team'}</Text>
              </Box>

              <Box bg={mutedBg} borderWidth="1px" borderColor={borderColor} borderRadius="14px" px={4} py={3}>
                <HStack spacing={2} color={textColor} mb={1}>
                  <Icon as={FiPackage} />
                  <Text fontWeight="700" fontSize="sm">Collections</Text>
                </HStack>
                <Text color={descColor} fontSize="sm">{catalogueCount}</Text>
              </Box>

              <Box bg={mutedBg} borderWidth="1px" borderColor={borderColor} borderRadius="14px" px={4} py={3}>
                <HStack spacing={2} color={textColor} mb={1}>
                  <Icon as={FiShield} />
                  <Text fontWeight="700" fontSize="sm">Store handle</Text>
                </HStack>
                <Text color={descColor} fontSize="sm">{subdomain || 'N/A'}</Text>
              </Box>
            </SimpleGrid>
          </VStack>
        </Box>

        <Box
          mt={6}
          bg={surfaceBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="14px"
          p={{ base: 6, md: 7 }}
        >
          <Heading as="h2" size="md" color={textColor} mb={4}>Service approach</Heading>
          <VStack align="start" spacing={4}>
            <HStack align="start" spacing={3}>
              <Center w="36px" h="36px" borderRadius="12px" bg={accentSoft} color={accentColor}>
                <Icon as={FiTruck} boxSize={4.5} />
              </Center>
              <Text color={descColor}>Orders are packed and dispatched quickly with practical delivery timelines.</Text>
            </HStack>
            <HStack align="start" spacing={3}>
              <Center w="36px" h="36px" borderRadius="12px" bg={accentSoft} color={accentColor}>
                <Icon as={FiMail} boxSize={4.5} />
              </Center>
              <Text color={descColor}>Support is handled directly by the store team for faster responses.</Text>
            </HStack>
          </VStack>

          <Button
            as={RouterLink}
            to="/contact"
            mt={6}
            bg={accentColor}
            color="white"
            _hover={{ bg: '#1D4ED8' }}
            borderRadius="12px"
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
