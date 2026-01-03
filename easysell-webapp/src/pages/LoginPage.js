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
  AlertDescription
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';

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

  // --- REDIRECT LOGIC ---
  // Only redirect if user is logged in AND has a profile AND is NOT pending/rejected
  useEffect(() => {
    if (currentUser && userData) {
      if (userData.status === 'approved' || userData.status === undefined) { // Assuming undefined implies old data or auto-approve
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
        // User exists - useEffect above will handle the redirect or status check
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
      // Create the Firestore profile
      await saveUserProfile(currentUser.uid, {
        ...formData,
        photoURL: currentUser.photoURL,
        email: currentUser.email
      });
      
      // Switch to pending view
      setViewState('pending');
      toast({ title: "Registration Successful", status: "success" });

    } catch (error) {
      toast({ title: "Error", description: error.message, status: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER: VIEW 1 - PENDING APPROVAL ---
  if (viewState === 'pending') {
    return (
      <Container centerContent py={20}>
        <Box p={8} borderWidth={1} borderRadius="xl" shadow="lg" maxW="md" textAlign="center" bg="white">
          <Alert status="warning" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" borderRadius="md" mb={6}>
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">Awaiting Approval</AlertTitle>
            <AlertDescription maxWidth="sm">
              Your account has been created successfully and sent for admin approval. You will be able to access the catalogue once approved.
            </AlertDescription>
          </Alert>
          <Button colorScheme="gray" onClick={() => { signOut(); setViewState('login'); }}>Sign Out</Button>
        </Box>
      </Container>
    );
  }

  // --- RENDER: VIEW 2 - DETAILS FORM (For New Users) ---
  if (viewState === 'details') {
    return (
      <Container maxW="md" py={10}>
        <Box bg="white" p={8} borderRadius="xl" boxShadow="lg" borderWidth="1px" borderColor="gray.200">
          <Heading size="md" mb={2}>Complete Your Profile</Heading>
          <Text fontSize="sm" color="gray.500" mb={6}>
            Welcome, <b>{currentUser?.displayName}</b>! We just need a few more details to set up your business account.
          </Text>
          
          <form onSubmit={handleDetailsSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </FormControl>
              <FormControl isReadOnly>
                <FormLabel>Email</FormLabel>
                <Input value={currentUser?.email} isDisabled bg="gray.50" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Phone Number</FormLabel>
                <Input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Enter phone number" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>GST / PAN Number</FormLabel>
                <Input value={formData.gstPan} onChange={(e) => setFormData({...formData, gstPan: e.target.value})} placeholder="Enter GST or PAN" />
              </FormControl>
              
              <Button type="submit" colorScheme="teal" w="full" size="lg" mt={4} isLoading={isSubmitting}>
                Complete Registration
              </Button>
            </VStack>
          </form>
        </Box>
      </Container>
    );
  }

  // --- RENDER: VIEW 3 - REJECTED ---
  if (viewState === 'rejected') {
    return (
      <Container centerContent py={20}>
        <Box p={8} borderWidth={1} borderRadius="xl" shadow="lg" bg="red.50" borderColor="red.200" textAlign="center">
          <Heading size="md" color="red.600" mb={2}>Access Denied</Heading>
          <Text color="red.800" mb={6}>Your account request was declined by the administrator.</Text>
          <Button colorScheme="red" variant="outline" onClick={() => { signOut(); setViewState('login'); }}>Sign Out</Button>
        </Box>
      </Container>
    );
  }

  // --- RENDER: VIEW 4 - DEFAULT LOGIN ---
  return (
    <Container maxW="md" py={20}>
      <Box bg="white" p={8} borderRadius="xl" boxShadow="lg" borderWidth="1px" borderColor="gray.200" textAlign="center">
        <Heading size="lg" mb={2} color="teal.600">easySell</Heading>
        <Text color="gray.500" mb={8}>Sign in to access your catalogue</Text>
        
        <Button
          w="full"
          size="lg"
          variant="outline"
          leftIcon={<Icon as={FcGoogle} />}
          onClick={handleGoogleClick}
          isLoading={isSubmitting}
          borderWidth="2px"
        >
          Sign in with Google
        </Button>

        <HStack my={6}>
          <Divider />
          <Text fontSize="xs" color="gray.400" whiteSpace="nowrap">SECURE LOGIN</Text>
          <Divider />
        </HStack>

        <Text fontSize="xs" color="gray.400">
          New users will be asked to register after signing in.
        </Text>
      </Box>
    </Container>
  );
};

export default LoginPage;