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
  Flex,
  InputGroup,
  InputLeftElement,
  FormErrorMessage
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FiUser, FiSmartphone, FiFileText, FiAlertCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

// --- SHARED WRAPPER COMPONENT (Moved Outside to Fix Re-render Bug) ---
const PageWrapper = ({ children }) => {
  const bgGradient = useColorModeValue('linear(to-br, brand.600, purple.700)', 'linear(to-br, brand.900, gray.900)');
  const cardBg = useColorModeValue('whiteAlpha.900', 'blackAlpha.600');
  const cardBorder = useColorModeValue('white', 'whiteAlpha.200');

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bgGradient={bgGradient} p={4} position="relative" overflow="hidden">
      {/* Decorative BG Elements (Animated) */}
      <Box
        position="absolute"
        top="-10%"
        left="-5%"
        w="500px"
        h="500px"
        bg="whiteAlpha.100"
        rounded="full"
        filter="blur(80px)"
        animation="float 10s infinite alternate"
      />
      <Box
        position="absolute"
        bottom="-10%"
        right="-5%"
        w="400px"
        h="400px"
        bg="brand.500"
        rounded="full"
        filter="blur(100px)"
        opacity={0.2}
      />

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
};

const LoginPage = () => {
  const { googleLogin, getUserProfile, saveUserProfile, currentUser, userData, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // State to manage the view: 'login', 'details', 'pending', 'rejected'
  const [viewState, setViewState] = useState('login');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for authenticated but unregistered user
  const [authUser, setAuthUser] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gstPan: ''
  });

  // Validation Errors
  const [errors, setErrors] = useState({});

  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  // --- REDIRECT LOGIC ---
  useEffect(() => {
    // Only redirect if fully authenticated AND has a profile
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

  // --- VALIDATION HELPER ---
  const validate = () => {
    const newErrors = {};

    // Name
    if (!formData.name.trim()) newErrors.name = "Full name is required";

    // Phone (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit number";
    }

    // GST or PAN validation
    // Simple alphanumeric check for now, can be stricter if needed
    // GST: 15 chars, PAN: 10 chars
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!formData.gstPan) {
      newErrors.gstPan = "GST or PAN number is required";
    } else {
      const val = formData.gstPan.trim().toUpperCase();
      if (val.length === 10) {
        if (!panRegex.test(val)) newErrors.gstPan = "Invalid PAN number format";
      } else if (val.length === 15) {
        if (!gstRegex.test(val)) newErrors.gstPan = "Invalid GSTIN format";
      } else {
        newErrors.gstPan = "Enter valid PAN (10 chars) or GSTIN (15 chars)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- HANDLER: Google Sign In ---
  const handleGoogleClick = async () => {
    setIsSubmitting(true);
    try {
      const user = await googleLogin(); // 1. Auth with Google
      // 2. Check if profile exists
      const profile = await getUserProfile(user.uid);

      if (profile) {
        toast({ title: "Welcome Back", description: "You have signed in successfully.", status: "success", duration: 3000, isClosable: true });
      } else {
        // 3. NEW USER -> Switch to Details Form
        setFormData(prev => ({ ...prev, name: user.displayName || '', email: user.email }));
        setAuthUser(user);
        setViewState('details');
      }
    } catch (error) {
      toast({ title: "Login Failed", description: error.message, status: "error", duration: 5000, isClosable: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HANDLER: Submit Additional Details ---
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast({ title: "Validation Error", description: "Please correct the errors in the form before submitting.", status: "warning", duration: 4000, isClosable: true });
      return;
    }

    setIsSubmitting(true);
    try {
      const targetUser = authUser || currentUser;
      if (!targetUser) throw new Error("Session expired. Please sign in again.");

      await saveUserProfile(targetUser.uid, {
        ...formData,
        photoURL: targetUser.photoURL,
        email: targetUser.email
      });
      setViewState('pending');
      toast({ title: "Registration Successful", description: "Your account is under review.", status: "success", duration: 5000, isClosable: true });
    } catch (error) {
      toast({ title: "Registration Failed", description: error.message, status: "error", duration: 5000, isClosable: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- VIEW: PENDING ---
  if (viewState === 'pending') {
    return (
      <PageWrapper>
        <Alert status="warning" variant="subtle" flexDirection="column" alignItems="center" justify="center" textAlign="center" borderRadius="xl" mb={6} bg="orange.50" py={6}>
          <AlertIcon boxSize="40px" mr={0} color="orange.500" />
          <AlertTitle mt={4} mb={1} fontSize="xl" color="orange.700">Verification Pending</AlertTitle>
          <AlertDescription maxWidth="sm" color="orange.600" fontSize="sm">
            Thanks for searching us! We are currently verifying your business details. You will receive access once approved.
          </AlertDescription>
        </Alert>
        <Button size="lg" w="full" onClick={() => { signOut(); setViewState('login'); }}>Sign Out</Button>
      </PageWrapper>
    );
  }

  // --- VIEW: REJECTED ---
  if (viewState === 'rejected') {
    return (
      <PageWrapper>
        <Box bg="red.50" p={6} borderRadius="xl" mb={6}>
          <Icon as={FiAlertCircle} color="red.500" w={10} h={10} mb={3} />
          <Heading size="md" color="red.600" mb={2}>Access Denied</Heading>
          <Text color="red.800" fontSize="sm">Your account request was declined by the administrator. Please contact support.</Text>
        </Box>
        <Button colorScheme="red" variant="outline" w="full" size="lg" onClick={() => { signOut(); setViewState('login'); }}>Sign Out</Button>
      </PageWrapper>
    );
  }

  // --- VIEW: DETAILS FORM ---
  if (viewState === 'details') {
    return (
      <PageWrapper>
        <VStack spacing={2} mb={8}>
          <Heading size="lg" color={textColor}>Complete Profile</Heading>
          <Text fontSize="sm" color={mutedColor}>Few more details to setup your business account.</Text>
        </VStack>

        <form onSubmit={handleDetailsSubmit} style={{ width: '100%' }}>
          <VStack spacing={5}>
            {/* Full Name */}
            <FormControl isRequired isInvalid={!!errors.name}>
              <FormLabel fontSize="sm" color={mutedColor}>Full Name</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" children={<FiUser color="gray.300" />} />
                <Input
                  variant="filled"
                  size="lg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </InputGroup>
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            {/* Email (Read Only) */}
            <FormControl isReadOnly>
              <FormLabel fontSize="sm" color={mutedColor}>Email Address</FormLabel>
              <Input variant="filled" size="lg" value={authUser?.email || currentUser?.email || ''} isDisabled bg="blackAlpha.50" opacity={0.7} />
            </FormControl>

            {/* Phone */}
            <FormControl isRequired isInvalid={!!errors.phone}>
              <FormLabel fontSize="sm" color={mutedColor}>Phone Number</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" children={<FiSmartphone color="gray.300" />} />
                <Input
                  variant="filled"
                  size="lg"
                  type="tel"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); // Only numbers
                    setFormData({ ...formData, phone: val });
                  }}
                  placeholder="9876543210"
                />
              </InputGroup>
              <FormErrorMessage>{errors.phone}</FormErrorMessage>
            </FormControl>

            {/* GST / PAN */}
            <FormControl isRequired isInvalid={!!errors.gstPan}>
              <FormLabel fontSize="sm" color={mutedColor}>GST or PAN Number</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" children={<FiFileText color="gray.300" />} />
                <Input
                  variant="filled"
                  size="lg"
                  value={formData.gstPan}
                  onChange={(e) => setFormData({ ...formData, gstPan: e.target.value.toUpperCase() })}
                  placeholder="GSTIN or PAN"
                />
              </InputGroup>
              <FormErrorMessage>{errors.gstPan}</FormErrorMessage>
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              w="full"
              size="lg"
              mt={4}
              h="56px"
              isLoading={isSubmitting}
              loadingText="Creating Account..."
              shadow="lg"
            >
              Complete Registration
            </Button>
          </VStack>
        </form>
      </PageWrapper>
    );
  }

  // --- VIEW: DEFAULT LOGIN ---
  return (
    <PageWrapper>
      <VStack spacing={8}>
        <Box>
          <Heading size="2xl" mb={3} fontWeight="900" bgGradient="linear(to-r, brand.500, accent.500)" bgClip="text" letterSpacing="tight">
            easySell
          </Heading>
          <Text fontSize="lg" color={mutedColor} fontWeight="medium">B2B Wholesale Portal</Text>
        </Box>

        <VStack w="full" spacing={4}>
          <Button
            w="full"
            h="60px"
            size="lg"
            variant="outline"
            leftIcon={<Icon as={FcGoogle} boxSize={7} mr={2} />}
            onClick={handleGoogleClick}
            isLoading={isSubmitting}
            loadingText="Connecting..."
            borderWidth="2px"
            borderColor="gray.200"
            _hover={{ bg: 'gray.50', borderColor: 'brand.500', transform: 'translateY(-2px)', shadow: 'md' }}
            transition="all 0.2s"
            fontSize="lg"
            fontWeight="bold"
            color="gray.700"
            bg="white"
          >
            Sign in with Google
          </Button>

          <HStack w="full" pt={2}>
            <Divider borderColor="gray.300" />
            <Text fontSize="xs" color="gray.400" whiteSpace="nowrap" textTransform="uppercase" letterSpacing="widest" fontWeight="semibold">
              Secure Access
            </Text>
            <Divider borderColor="gray.300" />
          </HStack>
        </VStack>

        <Text fontSize="xs" color={mutedColor} textAlign="center" px={4} lineHeight="tall">
          By continuing, you acknowledge that this is a restricted B2B platform. New accounts require administrative approval.
        </Text>
      </VStack>
    </PageWrapper>
  );
};

export default LoginPage;