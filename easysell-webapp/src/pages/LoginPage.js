import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
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
  InputRightElement,
  FormErrorMessage,
  FormHelperText,
  Fade
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FiUser, FiSmartphone, FiFileText, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

// --- SHARED WRAPPER COMPONENT ---
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
      <Box position="absolute" top="-10%" left="-5%" w="500px" h="500px" bg="whiteAlpha.100" rounded="full" filter="blur(80px)" animation="float 10s infinite alternate" />
      <Box position="absolute" bottom="-10%" right="-5%" w="400px" h="400px" bg="brand.500" rounded="full" filter="blur(100px)" opacity={0.2} />

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
        textAlign="left"
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
  const [authUser, setAuthUser] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gstPan: ''
  });

  // Validation State
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const successColor = "green.500";
  const errorColor = "red.500";
  const inputBg = useColorModeValue('white', 'whiteAlpha.50');

  // --- REDIRECT LOGIC ---
  // --- REDIRECT LOGIC ---
  useEffect(() => {
    if (currentUser) {
      if (userData) {
        // Profile Exists - Check Status
        if (userData.status === 'approved' || userData.status === undefined) {
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        } else if (userData.status === 'pending') {
          setViewState('pending');
        } else if (userData.status === 'rejected') {
          setViewState('rejected');
        }
      } else {
        // NEW: Profile Missing -> Auto-show Details Form
        // We only do this if we are NOT already in the details view to avoid loops/resets
        // and if we haven't already set the authUser for editing
        if (viewState !== 'details') {
          setAuthUser(currentUser);
          setFormData(prev => ({
            ...prev,
            name: currentUser.displayName || '',
            email: currentUser.email || ''
          }));
          setViewState('details');
        }
      }
    }
  }, [currentUser, userData, navigate, location, viewState]);

  // --- VALIDATION LOGIC (Real-time) ---
  const validateField = (name, value) => {
    let error = "";
    if (name === 'name') {
      if (!value.trim()) error = "Full name is required";
      else if (value.trim().length < 3) error = "Name must be at least 3 characters";
    }
    if (name === 'phone') {
      const phoneRegex = /^[0-9]{10}$/;
      if (!value) error = "Phone number is required";
      else if (!phoneRegex.test(value)) error = "Must be a valid 10-digit number";
    }
    if (name === 'gstPan') {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      const val = value.trim().toUpperCase();

      if (!val) error = "GST or PAN number is required";
      else if (val.length === 10) {
        if (!panRegex.test(val)) error = "Invalid PAN format (e.g., ABCDE1234F)";
      } else if (val.length === 15) {
        if (!gstRegex.test(val)) error = "Invalid GSTIN format";
      } else {
        error = "Enter valid PAN (10 chars) or GSTIN (15 chars)";
      }
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    // Auto-transform logic
    if (name === 'phone') finalValue = value.replace(/\D/g, '').slice(0, 10);
    if (name === 'gstPan') finalValue = value.toUpperCase();

    setFormData(prev => ({ ...prev, [name]: finalValue }));

    // Real-time validation if already touched
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, finalValue) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const isValid = () => {
    // Check all fields
    const nameErr = validateField('name', formData.name);
    const phoneErr = validateField('phone', formData.phone);
    const gstErr = validateField('gstPan', formData.gstPan);

    const newErrors = { name: nameErr, phone: phoneErr, gstPan: gstErr };
    setErrors(newErrors);
    setTouched({ name: true, phone: true, gstPan: true });

    return !nameErr && !phoneErr && !gstErr;
  };

  // --- GOOGLE SIGN IN ---
  const handleGoogleClick = async () => {
    setIsSubmitting(true);
    try {
      const user = await googleLogin();
      const profile = await getUserProfile(user.uid);
      if (profile) {
        toast({ title: "Welcome Back", description: "Signed in successfully.", status: "success", duration: 3000, isClosable: true });
      } else {
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

  // --- SUBMIT DETAILS ---
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!isValid()) {
      toast({ title: "Check Fields", description: "Please correct the errors highlighting in red.", status: "warning", duration: 3000, isClosable: true });
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
      toast({ title: "Registration Successful", description: "Account under review.", status: "success", duration: 5000, isClosable: true });
    } catch (error) {
      toast({ title: "Registration Failed", description: error.message, status: "error", duration: 5000, isClosable: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDERERS ---
  const renderInput = (label, name, placeholder, icon, type = "text", maxLength) => {
    const isError = !!errors[name];
    const isSuccess = touched[name] && !isError && formData[name].length > 0;

    return (
      <FormControl isRequired isInvalid={isError && touched[name]}>
        <FormLabel fontSize="sm" fontWeight="bold" color={mutedColor} mb={1}>{label}</FormLabel>
        <InputGroup size="lg">
          <InputLeftElement pointerEvents="none" children={<Icon as={icon} color={isError ? errorColor : (isSuccess ? successColor : "gray.300")} />} />
          <Input
            name={name}
            type={type}
            value={formData[name]}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            maxLength={maxLength}
            variant="filled"
            bg={inputBg}
            borderColor={isError ? errorColor : (isSuccess ? successColor : 'transparent')}
            _focus={{ borderColor: isError ? errorColor : (isSuccess ? successColor : 'brand.500'), bg: 'transparent' }}
            _hover={{ bg: 'transparent' }}
            transition="all 0.2s"
          />
          {touched[name] && (
            <InputRightElement>
              {isError ? <Icon as={FiAlertCircle} color={errorColor} /> : <Icon as={FiCheckCircle} color={successColor} />}
            </InputRightElement>
          )}
        </InputGroup>
        <FormErrorMessage fontSize="xs" mt={1}>{errors[name]}</FormErrorMessage>
      </FormControl>
    );
  };

  // --- VIEWS ---
  if (viewState === 'pending') {
    return (
      <PageWrapper>
        <VStack spacing={6} textAlign="center">
          <Icon as={FiCheckCircle} boxSize="60px" color="orange.400" />
          <Heading size="lg" color="orange.500">Verification Pending</Heading>
          <Text color={mutedColor}>Thanks for registering! We are currently verifying your business details. You will be notified once approved.</Text>
          <Button variant="outline" onClick={() => { signOut(); setViewState('login'); }}>Sign Out</Button>
        </VStack>
      </PageWrapper>
    );
  }

  if (viewState === 'rejected') {
    return (
      <PageWrapper>
        <VStack spacing={6} textAlign="center">
          <Icon as={FiAlertCircle} boxSize="60px" color="red.500" />
          <Heading size="lg" color="red.500">Access Denied</Heading>
          <Text color={mutedColor}>Your account request was declined. Please contact support.</Text>
          <Button variant="outline" onClick={() => { signOut(); setViewState('login'); }}>Sign Out</Button>
        </VStack>
      </PageWrapper>
    );
  }

  if (viewState === 'details') {
    return (
      <PageWrapper>
        <VStack spacing={2} mb={6} align="start" w="full">
          <Heading size="lg" color={textColor}>Complete Profile</Heading>
          <Text fontSize="sm" color={mutedColor}>We need a few more details to set up your account.</Text>
        </VStack>

        <form onSubmit={handleDetailsSubmit} style={{ width: '100%' }} noValidate>
          <VStack spacing={5}>
            {renderInput("Full Name", "name", "John Doe", FiUser)}

            <FormControl isReadOnly>
              <FormLabel fontSize="sm" fontWeight="bold" color={mutedColor} mb={1}>Email Address</FormLabel>
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none" children={<Icon as={FiFileText} color="gray.300" />} />
                <Input value={authUser?.email || currentUser?.email || ''} isDisabled bg="blackAlpha.50" opacity={0.7} />
              </InputGroup>
            </FormControl>

            {renderInput("Phone Number", "phone", "9876543210", FiSmartphone, "tel", 10)}
            {renderInput("GST or PAN Number", "gstPan", "GSTIN or PAN", FiFileText, "text", 15)}

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
              _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
            >
              Complete Registration
            </Button>
          </VStack>
        </form>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <VStack spacing={8} py={4}>
        <Box textAlign="center">
          <Heading size="3xl" mb={2} fontWeight="900" bgGradient="linear(to-r, brand.500, accent.500)" bgClip="text" letterSpacing="inperit">
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
            <Text fontSize="xs" color="gray.400" whiteSpace="nowrap" textTransform="uppercase" letterSpacing="widest" fontWeight="semibold">Secure Access</Text>
            <Divider borderColor="gray.300" />
          </HStack>
        </VStack>

        <Text fontSize="xs" color={mutedColor} textAlign="center" lineHeight="tall">
          By continuing, you acknowledge that this is a restricted B2B platform.
        </Text>
      </VStack>
    </PageWrapper>
  );
};

export default LoginPage;