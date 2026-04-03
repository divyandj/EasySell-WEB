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
  useColorModeValue,
  Flex,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  FormErrorMessage,
  Textarea,
  Image,
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FiUser, FiSmartphone, FiFileText, FiAlertCircle, FiCheckCircle, FiShield, FiBriefcase, FiMapPin, FiCamera, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

// --- SHARED WRAPPER ---
const PageWrapper = ({ children }) => {
  const bgGradient = useColorModeValue(
    'linear(to-br, brand.600, #4C3EC0, accent.700)',
    'linear(to-br, brand.900, #1a1a2e, accent.900)'
  );
  const cardBg = useColorModeValue('white', '#111116');
  const cardBorder = useColorModeValue('gray.100', 'whiteAlpha.100');

  return (
    <Flex minH="100vh" align="center" justify="center" bgGradient={bgGradient} p={4} position="relative" overflow="hidden">
      {/* Decorative blobs */}
      <Box position="absolute" top="-20%" left="-10%" w="600px" h="600px" bg="brand.400" filter="blur(150px)" opacity="0.12" borderRadius="full" />
      <Box position="absolute" bottom="-20%" right="-10%" w="500px" h="500px" bg="accent.500" filter="blur(150px)" opacity="0.08" borderRadius="full" />

      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        bg={cardBg}
        borderWidth="1px"
        borderColor={cardBorder}
        borderRadius="20px"
        boxShadow="0 25px 50px rgba(0,0,0,0.15)"
        p={{ base: 8, md: 10 }}
        w="full"
        maxW="440px"
        zIndex={1}
      >
        {children}
      </MotionBox>
    </Flex>
  );
};

const LoginPage = () => {
  const { googleLogin, getUserProfile, saveUserProfile, currentUser, userData, signOut, storeConfig } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [viewState, setViewState] = useState('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', gstPan: '', businessName: '', address: '' });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [cardPhotoFile, setCardPhotoFile] = useState(null);
  const [cardPhotoPreview, setCardPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Theme
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const successColor = "green.500";
  const errorColor = "red.500";
  const inputBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const isPublicStore = storeConfig?.storeMode === 'public';
  const pendingIconBg = useColorModeValue(isPublicStore ? 'green.50' : 'orange.50', 'whiteAlpha.100');
  const rejectedIconBg = useColorModeValue('red.50', 'whiteAlpha.100');
  const dividerColor = useColorModeValue('gray.200', 'whiteAlpha.200');

  // --- REDIRECT LOGIC ---
  useEffect(() => {
    if (currentUser) {
      if (storeConfig?.storeMode === 'public' && location.pathname !== '/signup') {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
        return;
      }

      if (userData) {
        if (userData.status === 'approved') {
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        } else if (userData.status === 'pending') {
          setViewState('pending');
        } else if (userData.status === 'rejected') {
          setViewState('rejected');
        } else if (userData.status === undefined) {
          if (viewState !== 'details') {
            setAuthUser(currentUser);
            setFormData(prev => ({
              ...prev,
              name: userData.displayName || currentUser.displayName || '',
              phone: userData.phoneNumber || '',
              gstPan: userData.gstPan || '',
              email: userData.email || currentUser.email || ''
            }));
            setViewState('details');
          }
        }
      } else {
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
  }, [currentUser, userData, navigate, location, viewState, storeConfig]);

  // --- VALIDATION ---
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
      if (!val) {
        if (!isPublicStore) error = "GST or PAN number is required";
      } else if (val.length === 10) {
        if (!panRegex.test(val)) error = "Invalid PAN format (e.g., ABCDE1234F)";
      } else if (val.length === 15) {
        if (!gstRegex.test(val)) error = "Invalid GSTIN format";
      } else {
        error = "Enter valid PAN (10 chars) or GSTIN (15 chars)";
      }
    }
    if (name === 'businessName') {
      if (!isPublicStore && !value.trim()) error = "Business name is required";
    }
    if (name === 'address') {
      if (!isPublicStore && !value.trim()) error = "Address is required";
    }
    return error;
  };

  // --- CARD PHOTO UPLOAD ---
  const handleCardPhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be under 5MB.", status: "error", duration: 3000 });
      return;
    }
    setCardPhotoFile(file);
    setCardPhotoPreview(URL.createObjectURL(file));
  };

  const removeCardPhoto = () => {
    setCardPhotoFile(null);
    if (cardPhotoPreview) URL.revokeObjectURL(cardPhotoPreview);
    setCardPhotoPreview(null);
  };

  const uploadCardPhotoToCloudinary = async (file) => {
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', 'easysell_unsigned');
    const res = await fetch('https://api.cloudinary.com/v1_1/dqplhh4y3/image/upload', { method: 'POST', body: data });
    const json = await res.json();
    if (json.secure_url) return json.secure_url;
    throw new Error(json.error?.message || 'Upload failed');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'phone') finalValue = value.replace(/\D/g, '').slice(0, 10);
    if (name === 'gstPan') finalValue = value.toUpperCase();
    setFormData(prev => ({ ...prev, [name]: finalValue }));
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
    const nameErr = validateField('name', formData.name);
    const phoneErr = validateField('phone', formData.phone);
    const gstErr = validateField('gstPan', formData.gstPan);
    const bizErr = validateField('businessName', formData.businessName);
    const addrErr = validateField('address', formData.address);
    const newErrors = { name: nameErr, phone: phoneErr, gstPan: gstErr, businessName: bizErr, address: addrErr };
    setErrors(newErrors);
    setTouched({ name: true, phone: true, gstPan: true, businessName: true, address: true });

    // Card photo required for private stores
    let photoValid = true;
    if (!isPublicStore && !cardPhotoFile && !cardPhotoPreview) {
      toast({ title: "Photo Required", description: "Please upload a visiting card or board photo.", status: "warning", duration: 3000 });
      photoValid = false;
    }
    return !nameErr && !phoneErr && !gstErr && !bizErr && !addrErr && photoValid;
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
      toast({ title: "Check Fields", description: "Please correct the errors highlighted in red.", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    setIsSubmitting(true);
    try {
      const targetUser = authUser || currentUser;
      if (!targetUser) throw new Error("Session expired. Please sign in again.");

      // Upload card photo if selected
      let cardPhotoUrl = '';
      if (cardPhotoFile) {
        setUploadingPhoto(true);
        try {
          cardPhotoUrl = await uploadCardPhotoToCloudinary(cardPhotoFile);
        } catch (err) {
          toast({ title: "Photo Upload Failed", description: "Couldn't upload card photo. Please try again.", status: "error", duration: 4000 });
          setIsSubmitting(false);
          setUploadingPhoto(false);
          return;
        }
        setUploadingPhoto(false);
      }

      await saveUserProfile(targetUser.uid, {
        ...formData,
        cardPhotoUrl,
        photoURL: targetUser.photoURL,
        email: targetUser.email
      });
      setViewState('pending');
      toast({
        title: isPublicStore ? "Profile Saved" : "Registration Successful",
        description: isPublicStore ? "You can now track your orders." : "Account under review.",
        status: "success",
        duration: 5000,
        isClosable: true
      });
    } catch (error) {
      toast({ title: "Registration Failed", description: error.message, status: "error", duration: 5000, isClosable: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER INPUT ---
  const renderInput = (label, name, placeholder, icon, type = "text", maxLength, isReq = true) => {
    const isError = !!errors[name];
    const isSuccess = touched[name] && !isError && formData[name].length > 0;

    return (
      <FormControl isRequired={isReq} isInvalid={isError && touched[name]}>
        <FormLabel fontSize="sm" fontWeight="600" color={mutedColor} mb={1}>{label}</FormLabel>
        <InputGroup>
          <InputLeftElement pointerEvents="none" h="44px" children={<Icon as={icon} color={isError ? errorColor : (isSuccess ? successColor : "gray.400")} />} />
          <Input
            name={name}
            type={type}
            value={formData[name]}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            maxLength={maxLength}
            borderColor={isError ? errorColor : inputBorder}
            borderRadius="12px"
            h="44px"
            _focus={{ borderColor: isError ? errorColor : 'brand.400', boxShadow: `0 0 0 1px ${isError ? 'var(--chakra-colors-red-400)' : 'var(--chakra-colors-brand-400)'}` }}
            _hover={{ borderColor: 'gray.300' }}
            color={textColor}
            bg="transparent"
          />
          {touched[name] && (
            <InputRightElement h="44px">
              {isError ? <Icon as={FiAlertCircle} color={errorColor} /> : <Icon as={FiCheckCircle} color={successColor} />}
            </InputRightElement>
          )}
        </InputGroup>
        <FormErrorMessage fontSize="xs" mt={1}>{errors[name]}</FormErrorMessage>
      </FormControl>
    );
  };

  // ============ VIEWS ============

  // Pending
  if (viewState === 'pending') {
    return (
      <PageWrapper>
        <VStack spacing={6} textAlign="center" py={4}>
          <Flex w={16} h={16} bg={pendingIconBg} borderRadius="full" align="center" justify="center">
            <Icon as={FiCheckCircle} boxSize={8} color={isPublicStore ? "green.400" : "orange.400"} />
          </Flex>
          <Heading size="lg" color={textColor} fontWeight="800">
            {isPublicStore ? "You're All Set!" : "Verification Pending"}
          </Heading>
          <Text color={mutedColor} fontSize="sm" lineHeight="1.6">
            {isPublicStore
              ? "Your profile is complete. You can now browse, order, and track everything from your account."
              : "We are verifying your business details. You'll be notified once approved."}
          </Text>
          <VStack spacing={3} w="full">
            {isPublicStore && (
              <Button colorScheme="brand" w="full" borderRadius="12px" h="44px" fontWeight="600" onClick={() => navigate('/')}>
                Continue Shopping
              </Button>
            )}
            <Button variant="ghost" color={mutedColor} w="full" borderRadius="12px" h="44px" onClick={() => { signOut(); setViewState('login'); }}>
              Sign Out
            </Button>
          </VStack>
        </VStack>
      </PageWrapper>
    );
  }

  // Rejected
  if (viewState === 'rejected') {
    return (
      <PageWrapper>
        <VStack spacing={6} textAlign="center" py={4}>
          <Flex w={16} h={16} bg={rejectedIconBg} borderRadius="full" align="center" justify="center">
            <Icon as={FiAlertCircle} boxSize={8} color="red.400" />
          </Flex>
          <Heading size="lg" color={textColor} fontWeight="800">Access Denied</Heading>
          <Text color={mutedColor} fontSize="sm">Your account request was declined. Please contact support.</Text>
          <Button variant="ghost" color={mutedColor} w="full" borderRadius="12px" h="44px" onClick={() => { signOut(); setViewState('login'); }}>
            Sign Out
          </Button>
        </VStack>
      </PageWrapper>
    );
  }

  // Details Form
  if (viewState === 'details') {
    return (
      <PageWrapper>
        <VStack spacing={1} mb={6} align="start" w="full">
          <Heading size="lg" color={textColor} fontWeight="800">Complete Profile</Heading>
          <Text fontSize="sm" color={mutedColor}>
            {isPublicStore ? "A few details to set up your account." : "Complete your details to request store access."}
          </Text>
        </VStack>

        <form onSubmit={handleDetailsSubmit} style={{ width: '100%' }} noValidate>
          <VStack spacing={4}>
            {renderInput("Full Name", "name", "John Doe", FiUser)}

            <FormControl isReadOnly>
              <FormLabel fontSize="sm" fontWeight="600" color={mutedColor} mb={1}>Email</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" h="44px" children={<Icon as={FiFileText} color="gray.400" />} />
                <Input
                  value={authUser?.email || currentUser?.email || ''}
                  isDisabled
                  borderRadius="12px"
                  h="44px"
                  opacity={0.6}
                  borderColor={inputBorder}
                />
              </InputGroup>
            </FormControl>

            {renderInput("Phone Number", "phone", "9876543210", FiSmartphone, "tel", 10)}
            {renderInput(
              isPublicStore ? "GST / PAN (Optional)" : "GST or PAN Number",
              "gstPan",
              "GSTIN or PAN",
              FiFileText,
              "text",
              15,
              !isPublicStore
            )}

            {/* --- Business fields (private stores only) --- */}
            {!isPublicStore && (
              <>
                {renderInput("Business Name", "businessName", "Your business or company name", FiBriefcase)}

                <FormControl isRequired={!isPublicStore} isInvalid={!!errors.address && touched.address}>
                  <FormLabel fontSize="sm" fontWeight="600" color={mutedColor} mb={1}>Address</FormLabel>
                  <Textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Shop/office address"
                    borderColor={errors.address && touched.address ? errorColor : inputBorder}
                    borderRadius="12px"
                    minH="80px"
                    _focus={{ borderColor: errors.address ? errorColor : 'brand.400', boxShadow: `0 0 0 1px ${errors.address ? 'var(--chakra-colors-red-400)' : 'var(--chakra-colors-brand-400)'}` }}
                    _hover={{ borderColor: 'gray.300' }}
                    color={textColor}
                    bg="transparent"
                    resize="vertical"
                  />
                  <FormErrorMessage fontSize="xs" mt={1}>{errors.address}</FormErrorMessage>
                </FormControl>

                <FormControl isRequired={!isPublicStore}>
                  <FormLabel fontSize="sm" fontWeight="600" color={mutedColor} mb={1}>Visiting Card / Board Photo</FormLabel>
                  {cardPhotoPreview ? (
                    <Box position="relative" borderRadius="12px" overflow="hidden" borderWidth="1px" borderColor={inputBorder}>
                      <Image src={cardPhotoPreview} alt="Card preview" w="full" maxH="160px" objectFit="cover" />
                      <Button
                        position="absolute" top={2} right={2}
                        size="xs" borderRadius="full" colorScheme="red" onClick={removeCardPhoto}
                        leftIcon={<Icon as={FiX} />}
                      >
                        Remove
                      </Button>
                    </Box>
                  ) : (
                    <Box
                      as="label"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      borderWidth="2px"
                      borderStyle="dashed"
                      borderColor={inputBorder}
                      borderRadius="12px"
                      py={6}
                      cursor="pointer"
                      _hover={{ borderColor: 'brand.400', bg: 'brand.50' }}
                      transition="all 0.2s"
                    >
                      <Icon as={FiCamera} boxSize={6} color="gray.400" mb={2} />
                      <Text fontSize="sm" color={mutedColor}>Click to upload photo</Text>
                      <Text fontSize="xs" color="gray.400">Max 5MB · JPG, PNG</Text>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        onChange={handleCardPhotoSelect}
                      />
                    </Box>
                  )}
                </FormControl>
              </>
            )}

            <Button
              type="submit"
              colorScheme="brand"
              w="full"
              h="48px"
              borderRadius="12px"
              mt={2}
              isLoading={isSubmitting}
              loadingText={uploadingPhoto ? "Uploading photo..." : (isPublicStore ? "Saving..." : "Requesting Access...")}
              fontWeight="700"
              boxShadow="0 4px 14px rgba(108,92,231,0.3)"
              _hover={{ transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(108,92,231,0.4)' }}
            >
              {isPublicStore ? "Save Profile" : "Request Access"}
            </Button>
          </VStack>
        </form>
      </PageWrapper>
    );
  }

  // Login (default)
  return (
    <PageWrapper>
      <VStack spacing={6} py={2}>
        {/* Logo */}
        <Box textAlign="center">
          <Text
            fontSize="3xl"
            fontWeight="900"
            bgGradient="linear(to-r, brand.500, accent.500)"
            bgClip="text"
            letterSpacing="-0.03em"
          >
            Vyparsetu
          </Text>
          <Text fontSize="sm" color={mutedColor} mt={1}>
            Sign in to continue
          </Text>
        </Box>

        {/* Google Button */}
        <Button
          w="full"
          h="52px"
          size="lg"
          variant="outline"
          leftIcon={<Icon as={FcGoogle} boxSize={6} />}
          onClick={handleGoogleClick}
          isLoading={isSubmitting}
          loadingText="Connecting..."
          borderWidth="1.5px"
          borderColor={inputBorder}
          borderRadius="12px"
          _hover={{ borderColor: 'brand.500', transform: 'translateY(-1px)', boxShadow: 'sm' }}
          transition="all 0.2s"
          fontWeight="600"
          color={textColor}
        >
          Continue with Google
        </Button>

        <HStack w="full">
          <Divider borderColor={dividerColor} />
          <HStack spacing={1.5}>
            <Icon as={FiShield} boxSize={3} color="gray.400" />
            <Text fontSize="xs" color="gray.400" whiteSpace="nowrap" fontWeight="500">
              Secure
            </Text>
          </HStack>
          <Divider borderColor={dividerColor} />
        </HStack>

        <Text fontSize="xs" color={mutedColor} textAlign="center" lineHeight="1.6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </VStack>
    </PageWrapper>
  );
};

export default LoginPage;