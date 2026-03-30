import React, { useState, useEffect } from 'react';
import {
  Container,
  Heading,
  Box,
  Text,
  Button,
  useColorModeValue,
  Icon,
  Flex,
  SimpleGrid,
  VStack,
  HStack,
  Center,
  Avatar,
  Skeleton,
  Image,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  FiArrowRight,
  FiShoppingBag,
  FiBarChart2,
  FiBell,
  FiBox,
  FiZap,
  FiStar,
  FiCheck,
  FiLink,
  FiPlus,
  FiShare2,
  FiExternalLink,
} from 'react-icons/fi';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

// Reusable Feature Card
const FeatureCard = ({ icon, title, description }) => {
  const bg = useColorModeValue('white', '#111116');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const iconBg = useColorModeValue('brand.50', 'whiteAlpha.100');
  const textColor = useColorModeValue('gray.800', 'white');
  const descColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <MotionBox
      variants={itemVariants}
      p={8}
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="20px"
      boxShadow="card"
      _hover={{ boxShadow: 'cardHover', transform: 'translateY(-4px)' }}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      cursor="default"
    >
      <Flex
        w={12}
        h={12}
        bg={iconBg}
        borderRadius="14px"
        align="center"
        justify="center"
        mb={5}
        color="brand.500"
      >
        <Icon as={icon} boxSize={6} />
      </Flex>
      <Heading size="md" mb={3} color={textColor} fontWeight="700">
        {title}
      </Heading>
      <Text color={descColor} fontSize="sm" lineHeight="1.7">
        {description}
      </Text>
    </MotionBox>
  );
};

// Step Card for How It Works
const StepCard = ({ step, icon, title, description }) => {
  const textColor = useColorModeValue('gray.800', 'white');
  const descColor = useColorModeValue('gray.500', 'gray.400');
  const stepBg = useColorModeValue('brand.500', 'brand.400');

  return (
    <MotionBox variants={itemVariants} textAlign="center">
      <Center mb={5}>
        <Box position="relative">
          <Flex
            w={16}
            h={16}
            bg={stepBg}
            borderRadius="20px"
            align="center"
            justify="center"
            color="white"
            boxShadow="0 8px 24px rgba(108,92,231,0.3)"
          >
            <Icon as={icon} boxSize={7} />
          </Flex>
          <Flex
            position="absolute"
            top="-8px"
            right="-8px"
            w={7}
            h={7}
            bg="white"
            borderRadius="full"
            align="center"
            justify="center"
            boxShadow="md"
            fontWeight="800"
            fontSize="xs"
            color="brand.600"
          >
            {step}
          </Flex>
        </Box>
      </Center>
      <Heading size="md" mb={2} color={textColor} fontWeight="700">
        {title}
      </Heading>
      <Text color={descColor} fontSize="sm" maxW="280px" mx="auto" lineHeight="1.6">
        {description}
      </Text>
    </MotionBox>
  );
};

// Testimonial Card
const TestimonialCard = ({ name, role, quote, rating }) => {
  const bg = useColorModeValue('white', '#111116');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const textColor = useColorModeValue('gray.800', 'white');
  const quoteColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <MotionBox
      variants={itemVariants}
      p={8}
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="20px"
      boxShadow="card"
    >
      <HStack spacing={1} mb={4}>
        {[...Array(rating)].map((_, i) => (
          <Icon key={i} as={FiStar} color="yellow.400" fill="currentColor" />
        ))}
      </HStack>
      <Text color={quoteColor} fontSize="sm" lineHeight="1.7" mb={5} fontStyle="italic">
        "{quote}"
      </Text>
      <HStack>
        <Flex
          w={10}
          h={10}
          bg="brand.100"
          borderRadius="full"
          align="center"
          justify="center"
          color="brand.600"
          fontWeight="800"
          fontSize="sm"
        >
          {name.charAt(0)}
        </Flex>
        <Box>
          <Text fontWeight="700" fontSize="sm" color={textColor}>{name}</Text>
          <Text fontSize="xs" color="gray.400">{role}</Text>
        </Box>
      </HStack>
    </MotionBox>
  );
};

// Stat Counter
const StatItem = ({ value, label }) => {
  const textColor = useColorModeValue('white', 'white');
  return (
    <VStack spacing={0}>
      <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="900" color={textColor}>
        {value}
      </Text>
      <Text fontSize="sm" color="whiteAlpha.800" fontWeight="500">
        {label}
      </Text>
    </VStack>
  );
};

// Store Card
const StoreCard = ({ store }) => {
  const bg = useColorModeValue('white', '#111116');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const textColor = useColorModeValue('gray.800', 'white');
  const descColor = useColorModeValue('gray.500', 'gray.400');
  const handleColor = useColorModeValue('brand.600', 'brand.300');

  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;
  const storeUrl = hostname.includes('localhost')
    ? `${protocol}//${store.storeHandle}.localhost${port ? ':' + port : ''}`
    : `${protocol}//${store.storeHandle}.${hostname.split('.').slice(-2).join('.')}`;

  return (
    <MotionBox
      variants={itemVariants}
      as="a"
      href={storeUrl}
      target="_blank"
      rel="noopener noreferrer"
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="20px"
      p={6}
      boxShadow="card"
      _hover={{ boxShadow: 'cardHover', transform: 'translateY(-4px)' }}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      cursor="pointer"
      display="block"
      textDecoration="none"
    >
      <VStack spacing={4} align="center" textAlign="center">
        {store.profileImageUrl ? (
          <Image
            src={store.profileImageUrl}
            alt={store.businessName}
            boxSize="64px"
            borderRadius="full"
            objectFit="cover"
          />
        ) : (
          <Flex
            w={16}
            h={16}
            bg="brand.100"
            borderRadius="full"
            align="center"
            justify="center"
            color="brand.600"
            fontWeight="800"
            fontSize="xl"
          >
            {(store.businessName || store.storeHandle || '?').charAt(0).toUpperCase()}
          </Flex>
        )}
        <Box>
          <Text fontWeight="700" fontSize="md" color={textColor} noOfLines={1}>
            {store.businessName || store.storeHandle}
          </Text>
          <HStack spacing={1} justify="center" mt={1}>
            <Icon as={FiLink} boxSize={3} color={handleColor} />
            <Text fontSize="xs" fontWeight="600" color={handleColor}>
              {store.storeHandle}
            </Text>
          </HStack>
        </Box>
        <HStack spacing={1} color={descColor} fontSize="xs">
          <Text>Visit Store</Text>
          <Icon as={FiExternalLink} boxSize={3} />
        </HStack>
      </VStack>
    </MotionBox>
  );
};


const HomePage = () => {
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('storeHandle', '!=', ''));
        const snapshot = await getDocs(q);
        const storeList = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(u => u.storeHandle);
        setStores(storeList);
      } catch (err) {
        console.error('Error fetching stores:', err);
      } finally {
        setLoadingStores(false);
      }
    };
    fetchStores();
  }, []);

  const scrollToStores = () => {
    document.getElementById('browse-stores')?.scrollIntoView({ behavior: 'smooth' });
  };

  const skeletonBg = useColorModeValue('gray.100', 'whiteAlpha.100');

  const heroBg = useColorModeValue(
    'linear(to-br, brand.600, #4C3EC0, accent.700)',
    'linear(to-br, brand.900, #1a1a2e, accent.900)'
  );
  const sectionBg = useColorModeValue('#F8F9FC', '#09090B');
  const sectionBgAlt = useColorModeValue('white', '#0F0F14');
  const headingColor = useColorModeValue('gray.800', 'white');
  const subtitleColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Box>
      {/* ============================================
          HERO SECTION
          ============================================ */}
      <Box
        bgGradient={heroBg}
        position="relative"
        overflow="hidden"
        py={{ base: 20, md: 28 }}
        px={6}
      >
        {/* Decorative blobs */}
        <Box position="absolute" top="-20%" right="-10%" w="600px" h="600px" bg="brand.400" filter="blur(150px)" opacity="0.15" borderRadius="full" />
        <Box position="absolute" bottom="-30%" left="-10%" w="500px" h="500px" bg="accent.500" filter="blur(150px)" opacity="0.1" borderRadius="full" />

        <Container maxW="container.lg" position="relative" zIndex={1}>
          <MotionFlex
            direction="column"
            align="center"
            textAlign="center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Tag */}
            <HStack
              bg="whiteAlpha.200"
              backdropFilter="blur(10px)"
              px={4}
              py={2}
              borderRadius="full"
              mb={6}
              spacing={2}
            >
              <Icon as={FiZap} color="yellow.300" />
              <Text color="white" fontSize="xs" fontWeight="600" letterSpacing="0.05em" textTransform="uppercase">
                Your Store, Your Brand, Your Rules
              </Text>
            </HStack>

            {/* Main Headline */}
            <Heading
              as="h1"
              fontSize={{ base: '3xl', md: '5xl', lg: '6xl' }}
              fontWeight="900"
              color="white"
              lineHeight="1.1"
              letterSpacing="-0.03em"
              mb={5}
              maxW="800px"
            >
              Launch your{' '}
              <Text as="span" bgGradient="linear(to-r, accent.300, accent.100)" bgClip="text">
                online store
              </Text>{' '}
              in minutes
            </Heading>

            {/* Subheadline */}
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color="whiteAlpha.800"
              maxW="600px"
              lineHeight="1.7"
              mb={8}
              fontWeight="400"
            >
              Create a beautiful storefront, manage inventory, receive real-time orders —
              all from your phone. No coding required.
            </Text>

            {/* CTAs */}
            <HStack spacing={4} flexDirection={{ base: 'column', sm: 'row' }} w={{ base: 'full', sm: 'auto' }}>
              <Button
                as={RouterLink}
                to="/signup"
                size="lg"
                bg="white"
                color="brand.600"
                px={8}
                borderRadius="full"
                fontWeight="700"
                _hover={{ transform: 'translateY(-2px)', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}
                rightIcon={<FiArrowRight />}
                w={{ base: 'full', sm: 'auto' }}
              >
                Start Your Store
              </Button>
              <Button
                size="lg"
                variant="outline"
                borderColor="whiteAlpha.400"
                color="white"
                px={8}
                borderRadius="full"
                fontWeight="600"
                _hover={{ bg: 'whiteAlpha.100', borderColor: 'whiteAlpha.600' }}
                w={{ base: 'full', sm: 'auto' }}
                onClick={scrollToStores}
              >
                Browse Stores
              </Button>
            </HStack>

            {/* Social Proof Counters */}
            <HStack
              mt={16}
              spacing={{ base: 8, md: 16 }}
              bg="whiteAlpha.100"
              backdropFilter="blur(10px)"
              px={10}
              py={5}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="whiteAlpha.200"
            >
              <StatItem value="500+" label="Stores Created" />
              <Box w="1px" h="40px" bg="whiteAlpha.300" />
              <StatItem value="10K+" label="Orders Processed" />
              <Box w="1px" h="40px" bg="whiteAlpha.300" display={{ base: 'none', md: 'block' }} />
              <StatItem value="99.9%" label="Uptime" />
            </HStack>
          </MotionFlex>
        </Container>
      </Box>

      {/* ============================================
          FEATURES SECTION
          ============================================ */}
      <Box bg={sectionBg} py={{ base: 16, md: 24 }}>
        <Container maxW="container.xl">
          <VStack spacing={4} mb={14} textAlign="center">
            <Text fontSize="sm" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="0.1em">
              Features
            </Text>
            <Heading fontSize={{ base: '2xl', md: '3xl' }} color={headingColor} maxW="600px">
              Everything you need to sell online
            </Heading>
            <Text color={subtitleColor} fontSize="md" maxW="500px">
              Powerful tools designed for small businesses and independent sellers.
            </Text>
          </VStack>

          <SimpleGrid
            columns={{ base: 1, md: 2, lg: 4 }}
            spacing={6}
            as={motion.div}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <FeatureCard
              icon={FiShoppingBag}
              title="Custom Storefronts"
              description="Get your own branded storefront at yourname.mmproperty.in — no website needed."
            />
            <FeatureCard
              icon={FiBarChart2}
              title="Analytics Dashboard"
              description="Track visits, orders, revenue, and abandoned carts — all in real-time on your phone."
            />
            <FeatureCard
              icon={FiBell}
              title="Instant Notifications"
              description="Get push notifications the second a new order is placed or a customer signs up."
            />
            <FeatureCard
              icon={FiBox}
              title="Inventory Management"
              description="Manage products, variants, pricing, stock levels, and bulk discounts with ease."
            />
          </SimpleGrid>
        </Container>
      </Box>

      {/* ============================================
          BROWSE STORES
          ============================================ */}
      <Box id="browse-stores" bg={sectionBgAlt} py={{ base: 16, md: 24 }}>
        <Container maxW="container.xl">
          <VStack spacing={4} mb={14} textAlign="center">
            <Text fontSize="sm" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="0.1em">
              Live Stores
            </Text>
            <Heading fontSize={{ base: '2xl', md: '3xl' }} color={headingColor}>
              Explore seller storefronts
            </Heading>
            <Text color={subtitleColor} fontSize="md" maxW="500px">
              Browse real stores powered by easySell. Click any store to visit their storefront.
            </Text>
          </VStack>

          {loadingStores ? (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
              {[1, 2, 3, 4].map(i => (
                <Box key={i} h="160px" borderRadius="20px" bg={skeletonBg} />
              ))}
            </SimpleGrid>
          ) : stores.length === 0 ? (
            <Center py={12}>
              <Text color={subtitleColor}>No stores found yet.</Text>
            </Center>
          ) : (
            <SimpleGrid
              columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
              spacing={6}
              as={motion.div}
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              {stores.map(store => (
                <StoreCard key={store.id} store={store} />
              ))}
            </SimpleGrid>
          )}
        </Container>
      </Box>

      {/* ============================================
          HOW IT WORKS
          ============================================ */}
      <Box bg={sectionBgAlt} py={{ base: 16, md: 24 }}>
        <Container maxW="container.lg">
          <VStack spacing={4} mb={14} textAlign="center">
            <Text fontSize="sm" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="0.1em">
              How It Works
            </Text>
            <Heading fontSize={{ base: '2xl', md: '3xl' }} color={headingColor}>
              Three simple steps to start selling
            </Heading>
          </VStack>

          <SimpleGrid
            columns={{ base: 1, md: 3 }}
            spacing={{ base: 10, md: 16 }}
            as={motion.div}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <StepCard
              step="1"
              icon={FiPlus}
              title="Create Your Store"
              description="Sign up, set your business name, and claim your unique store link."
            />
            <StepCard
              step="2"
              icon={FiBox}
              title="Add Products"
              description="Upload photos, set prices, manage variants and inventory from your Android app."
            />
            <StepCard
              step="3"
              icon={FiShare2}
              title="Share & Sell"
              description="Share your store link with customers. They browse, cart, and order — you get instant notifications."
            />
          </SimpleGrid>
        </Container>
      </Box>

      {/* ============================================
          TESTIMONIALS
          ============================================ */}
      <Box bg={sectionBg} py={{ base: 16, md: 24 }}>
        <Container maxW="container.xl">
          <VStack spacing={4} mb={14} textAlign="center">
            <Text fontSize="sm" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="0.1em">
              Testimonials
            </Text>
            <Heading fontSize={{ base: '2xl', md: '3xl' }} color={headingColor}>
              Loved by sellers everywhere
            </Heading>
          </VStack>

          <SimpleGrid
            columns={{ base: 1, md: 3 }}
            spacing={6}
            as={motion.div}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <TestimonialCard
              name="Rahul Sharma"
              role="Textile Wholesaler"
              quote="easySell transformed my business. I went from WhatsApp orders to a proper online store in 10 minutes. My orders doubled in the first month."
              rating={5}
            />
            <TestimonialCard
              name="Priya Patel"
              role="Jewelry Designer"
              quote="The analytics dashboard helps me understand my customers. I can see exactly what's selling and where to focus. Game changer."
              rating={5}
            />
            <TestimonialCard
              name="Amit Kumar"
              role="Electronics Retailer"
              quote="Push notifications for every order is incredible. I never miss a sale. The setup was so easy my 12-year-old could do it."
              rating={5}
            />
          </SimpleGrid>
        </Container>
      </Box>

      {/* ============================================
          FINAL CTA
          ============================================ */}
      <Box
        bgGradient="linear(to-r, brand.600, brand.500, accent.600)"
        py={{ base: 16, md: 20 }}
        position="relative"
        overflow="hidden"
      >
        <Box position="absolute" top="-50%" right="-10%" w="500px" h="500px" bg="white" filter="blur(200px)" opacity="0.08" borderRadius="full" />

        <Container maxW="container.md" position="relative" zIndex={1} textAlign="center">
          <VStack spacing={6}>
            <Heading color="white" fontSize={{ base: '2xl', md: '4xl' }} fontWeight="900" lineHeight="1.2">
              Ready to start selling?
            </Heading>
            <Text color="whiteAlpha.800" fontSize="md" maxW="480px" lineHeight="1.7">
              Join hundreds of sellers who already trust easySell. Set up your store in minutes — no coding, no fees to get started.
            </Text>
            <HStack spacing={4} flexDir={{ base: 'column', sm: 'row' }} w={{ base: 'full', sm: 'auto' }}>
              <Button
                as={RouterLink}
                to="/signup"
                size="lg"
                bg="white"
                color="brand.600"
                px={10}
                borderRadius="full"
                fontWeight="700"
                _hover={{ transform: 'translateY(-2px)', boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }}
                rightIcon={<FiArrowRight />}
                w={{ base: 'full', sm: 'auto' }}
              >
                Get Started Free
              </Button>
            </HStack>
            <HStack spacing={6} color="whiteAlpha.700" fontSize="xs" fontWeight="500">
              <HStack><Icon as={FiCheck} /><Text>Free to start</Text></HStack>
              <HStack><Icon as={FiCheck} /><Text>No credit card</Text></HStack>
              <HStack><Icon as={FiCheck} /><Text>Setup in 2 min</Text></HStack>
            </HStack>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;