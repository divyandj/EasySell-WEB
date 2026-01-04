import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Icon,
  useToast,
  Box,
  Divider,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Flex
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const LoginPage = () => {
  const { googleLogin, getUserProfile, saveUserProfile, currentUser, userData, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // State to manage the view: 'login', 'details', 'pending'
  const [viewState, setViewState] = useState('login');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data for new users
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gstPan: ''
  });

  // --- THEME COLORS ---
  const bgGradient = useColorModeValue('linear(to-br, brand.600, purple.700)', 'linear(to-br, brand.900, gray.900)');
  const cardBg = useColorModeValue('whiteAlpha.900', 'blackAlpha.600');
  const cardBorder = useColorModeValue('white', 'whiteAlpha.200');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  // --- REDIRECT LOGIC ---
  useEffect(() => {
    if (currentUser && userData) {
      if (userData.status === 'approved' || userData.status === undefined) {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else if (userData.status === 'pending') {
        setViewState('pending');
      } else if (userData.status === 'rejected') {
        setViewState('rejected');
      }
    }
  }, [currentUser, userData, navigate, location]);

  // --- HANDLER: Google Sign In ---
  const handleGoogleClick = async () => {
    setIsSubmitting(true);
    try {
      const user = await googleLogin(); // 1. Auth with Google
      // 2. Check if profile exists
      const profile = await getUserProfile(user.uid);

      if (profile) {
        toast({ title: "Signed In", status: "success", duration: 2000 });
      } else {
        // 3. NEW USER -> Switch to Details Form
        setFormData(prev => ({ ...prev, name: user.displayName, email: user.email }));
        setViewState('details');
      }
    } catch (error) {
      toast({ title: "Login Failed", description: error.message, status: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HANDLER: Submit Additional Details ---
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone || !formData.gstPan) {
      toast({ title: "Missing Fields", description: "Please fill in all details.", status: "warning" });
      return;
    }

    setIsSubmitting(true);
    try {
      await saveUserProfile(currentUser.uid, {
        ...formData,
        photoURL: currentUser.photoURL,
        email: currentUser.email
      });
      setViewState('pending');
      toast({ title: "Registration Successful", status: "success" });
    } catch (error) {
      toast({ title: "Error", description: error.message, status: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ANIMATION VARIANTS ---
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  // --- SHARED WRAPPER ---
  const PageWrapper = ({ children }) => (
    <Flex minH="100vh" align="center" justify="center" bgGradient={bgGradient} p={4} position="relative" overflow="hidden">
      {/* Decorative BG Elements */}
      <Box position="absolute" top="-10%" left="-5%" w="300px" h="300px" bg="whiteAlpha.200" rounded="full" filter="blur(80px)" animation="float 10s infinite alternate" />
      <Box position="absolute" bottom="-10%" right="-5%" w="400px" h="400px" bg="brand.500" rounded="full" filter="blur(100px)" opacity={0.3} />

      <MotionBox
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        bg={cardBg}
        backdropFilter="blur(20px)"
        borderWidth="1px"
        borderColor={cardBorder}
        borderRadius="2xl"
        boxShadow="2xl"
        p={{ base: 8, md: 10 }}
        w="full"
        maxW="md"
        textAlign="center"
        zIndex={1}
      >
        {children}
      </MotionBox>
    </Flex>
  );

  // --- VIEW 1: PENDING ---
  if (viewState === 'pending') {
    return (
      <PageWrapper>
        <Alert status="warning" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" borderRadius="xl" mb={6} bg="orange.50">
          <AlertIcon boxSize="40px" mr={0} color="orange.500" />
          <AlertTitle mt={4} mb={1} fontSize="xl" color="orange.700">Awaiting Approval</AlertTitle>
          <AlertDescription maxWidth="sm" color="orange.600">
            Account created! We are verifying your business details. You'll get access soon.
          </AlertDescription>
        </Alert>
        <Button size="lg" w="full" onClick={() => { signOut(); setViewState('login'); }}>Sign Out</Button>
      </PageWrapper>
    );
  }

  // --- VIEW 2: DETAILS FORM ---
  if (viewState === 'details') {
    return (
      <PageWrapper>
        <Heading size="lg" mb={2} color={textColor}>Complete Profile</Heading>
        <Text fontSize="md" color={mutedColor} mb={6}>One last step to set up your business account.</Text>

        <form onSubmit={handleDetailsSubmit}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel color={textColor}>Full Name</FormLabel>
              <Input variant="filled" size="lg" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </FormControl>
            <FormControl isReadOnly>
              <FormLabel color={textColor}>Email</FormLabel>
              <Input variant="filled" size="lg" value={currentUser?.email} isDisabled bg="blackAlpha.50" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel color={textColor}>Phone Number</FormLabel>
              <Input variant="filled" size="lg" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel color={textColor}>GST / PAN Number</FormLabel>
              <Input variant="filled" size="lg" value={formData.gstPan} onChange={(e) => setFormData({ ...formData, gstPan: e.target.value })} />
            </FormControl>

            <Button type="submit" colorScheme="brand" w="full" size="lg" mt={4} isLoading={isSubmitting} shadow="lg">
              Complete Registration
            </Button>
          </VStack>
        </form>
      </PageWrapper>
    );
  }

  // --- VIEW 3: REJECTED ---
  if (viewState === 'rejected') {
    return (
      <PageWrapper>
        <Box bg="red.50" p={6} borderRadius="xl" mb={6}>
          <Heading size="md" color="red.600" mb={2}>Access Denied</Heading>
          <Text color="red.800">Your account request was declined by the administrator.</Text>
        </Box>
        <Button colorScheme="red" variant="outline" w="full" size="lg" onClick={() => { signOut(); setViewState('login'); }}>Sign Out</Button>
      </PageWrapper>
    );
  }

  // --- VIEW 4: DEFAULT LOGIN ---
  return (
    <PageWrapper>
      <VStack spacing={6}>
        <Box>
          <Heading size="2xl" mb={2} fontWeight="900" bgGradient="linear(to-r, brand.500, accent.500)" bgClip="text">easySell</Heading>
          <Text fontSize="lg" color={mutedColor}>B2B Wholesale Portal</Text>
        </Box>

        <Button
          w="full"
          h="60px"
          size="lg"
          variant="outline"
          leftIcon={<Icon as={FcGoogle} boxSize={6} />}
          onClick={handleGoogleClick}
          isLoading={isSubmitting}
          borderWidth="2px"
          borderColor="brand.200"
          _hover={{ bg: 'brand.50', borderColor: 'brand.500', transform: 'translateY(-2px)', shadow: 'md' }}
          transition="all 0.2s"
          fontSize="lg"
        >
          Sign in with Google
        </Button>

        <HStack w="full">
          <Divider borderColor={mutedColor} />
          <Text fontSize="xs" color={mutedColor} whiteSpace="nowrap" textTransform="uppercase" letterSpacing="widest">Secure Login</Text>
          <Divider borderColor={mutedColor} />
        </HStack>

        <Text fontSize="sm" color={mutedColor}>
          By signing in, you agree to our Terms of Service. New accounts require admin approval.
        </Text>
      </VStack>
    </PageWrapper>
  );
};

export default LoginPage;