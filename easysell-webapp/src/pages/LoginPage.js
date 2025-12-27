// // import React, { useState } from 'react';
// // import { useAuth } from '../context/AuthContext';
// // import { Container, Heading, Button, VStack, useToast, Text, Icon, Center } from '@chakra-ui/react';
// // import { useNavigate, useLocation } from 'react-router-dom';
// // import { FcGoogle } from 'react-icons/fc'; // Google icon

// // const LoginPage = () => {
// //   const { signInWithGoogle, currentUser } = useAuth();
// //   const [isSubmitting, setIsSubmitting] = useState(false);
// //   const toast = useToast();
// //   const navigate = useNavigate();
// //   const location = useLocation();

// //   // Redirect if already logged in
// //   React.useEffect(() => {
// //     if (currentUser) {
// //       const from = location.state?.from?.pathname || '/'; // Redirect back or to home
// //       navigate(from, { replace: true });
// //     }
// //   }, [currentUser, navigate, location.state]);

// //   const handleGoogleSignIn = async () => {
// //     setIsSubmitting(true);
// //     const user = await signInWithGoogle();
// //     if (user) {
// //       toast({
// //         title: "Signed in successfully!",
// //         status: "success",
// //         duration: 3000,
// //         isClosable: true,
// //       });
// //       // Navigation is handled by the useEffect above
// //     } else {
// //       toast({
// //         title: "Sign in failed.",
// //         description: "Please try again.",
// //         status: "error",
// //         duration: 5000,
// //         isClosable: true,
// //       });
// //       setIsSubmitting(false);
// //     }
// //     // No need to set isSubmitting false on success, as the page redirects
// //   };

// //   return (
// //     <Container centerContent py={20}>
// //       <VStack spacing={8} w="full" maxW="md" bg="white" p={8} borderRadius="lg" boxShadow="md">
// //         <Heading size="lg" color="gray.700">Welcome Back!</Heading>
// //         <Text color="gray.500">Sign in to continue shopping.</Text>
// //         <Button
// //           w="full"
// //           colorScheme="gray"
// //           variant="outline"
// //           leftIcon={<Icon as={FcGoogle} />}
// //           onClick={handleGoogleSignIn}
// //           isLoading={isSubmitting}
// //           size="lg"
// //         >
// //           Sign in with Google
// //         </Button>
// //         {/* You can add back Email/Password or Phone Auth UI here if needed */}
// //       </VStack>
// //     </Container>
// //   );
// // };

// // export default LoginPage;



// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import {
//   Container,
//   Heading,
//   VStack,
//   FormControl,
//   FormLabel,
//   Input,
//   Button,
//   Text,
//   Icon,
//   useToast,
//   Tabs,
//   TabList,
//   TabPanels,
//   Tab,
//   TabPanel,
//   Box,
//   Divider,
//   HStack
// } from '@chakra-ui/react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { FcGoogle } from 'react-icons/fc';

// const LoginPage = () => {
//   const { signInWithGoogle, loginWithEmail, registerWithEmail, currentUser } = useAuth();
//   const [isSubmitting, setIsSubmitting] = useState(false);
  
//   // Login Form State
//   const [loginEmail, setLoginEmail] = useState('');
//   const [loginPass, setLoginPass] = useState('');

//   // Register Form State
//   const [regName, setRegName] = useState('');
//   const [regEmail, setRegEmail] = useState('');
//   const [regPhone, setRegPhone] = useState('');
//   const [regGst, setRegGst] = useState('');
//   const [regPass, setRegPass] = useState('');
//   const [regConfirmPass, setRegConfirmPass] = useState('');

//   const toast = useToast();
//   const navigate = useNavigate();
//   const location = useLocation();

//   // Redirect if already logged in
//   useEffect(() => {
//     if (currentUser) {
//       const from = location.state?.from?.pathname || '/';
//       navigate(from, { replace: true });
//     }
//   }, [currentUser, navigate, location.state]);

//   // --- HANDLERS ---

//   const handleGoogleSignIn = async () => {
//     setIsSubmitting(true);
//     try {
//       await signInWithGoogle();
//       toast({ title: "Welcome back!", status: "success", duration: 3000, isClosable: true });
//       // Navigation handled by useEffect
//     } catch (error) {
//       toast({ title: "Login Failed", description: error.message, status: "error", duration: 5000, isClosable: true });
//       setIsSubmitting(false);
//     }
//   };

//   const handleEmailLogin = async (e) => {
//     e.preventDefault();
//     if(!loginEmail || !loginPass) {
//         toast({ title: "Please enter email and password.", status: "warning" });
//         return;
//     }
//     setIsSubmitting(true);
//     try {
//       await loginWithEmail(loginEmail, loginPass);
//       toast({ title: "Welcome back!", status: "success", duration: 3000, isClosable: true });
//     } catch (error) {
//       toast({ title: "Login Failed", description: error.message, status: "error", duration: 5000, isClosable: true });
//       setIsSubmitting(false);
//     }
//   };

//   const handleRegistration = async (e) => {
//     e.preventDefault();
//     if(!regName || !regEmail || !regPhone || !regGst || !regPass) {
//         toast({ title: "All fields are required.", status: "warning" });
//         return;
//     }
//     if(regPass !== regConfirmPass) {
//         toast({ title: "Passwords do not match.", status: "error" });
//         return;
//     }

//     setIsSubmitting(true);
//     try {
//       const details = {
//           name: regName,
//           phone: regPhone,
//           gstPan: regGst
//       };
//       await registerWithEmail(regEmail, regPass, details);
      
//       // Success! Clear form and show message
//       toast({ 
//           title: "Registration Successful!", 
//           description: "Your account has been created and is awaiting admin approval. You can login once approved.", 
//           status: "success", 
//           duration: 8000, 
//           isClosable: true,
//           position: 'top'
//       });
      
//       // Reset form
//       setRegName(''); setRegEmail(''); setRegPhone(''); setRegGst(''); setRegPass(''); setRegConfirmPass('');
      
//       // Optionally switch tab or just stay here
//       // We don't navigate because they are signed out immediately after registration
//     } catch (error) {
//       toast({ title: "Registration Failed", description: error.message, status: "error", duration: 5000, isClosable: true });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <Container maxW="md" py={10}>
//       <Box bg="white" p={6} borderRadius="xl" boxShadow="lg" borderWidth="1px" borderColor="gray.200">
//         <Heading size="lg" textAlign="center" mb={6} color="teal.600">easySell</Heading>
        
//         <Tabs isFitted variant="enclosed" colorScheme="teal">
//           <TabList mb="1em">
//             <Tab fontWeight="semibold">Login</Tab>
//             <Tab fontWeight="semibold">Sign Up</Tab>
//           </TabList>
          
//           <TabPanels>
//             {/* --- LOGIN PANEL --- */}
//             <TabPanel>
//                 <VStack spacing={5}>
//                     {/* Google Login */}
//                     <Button
//                         w="full"
//                         variant="outline"
//                         leftIcon={<Icon as={FcGoogle} />}
//                         onClick={handleGoogleSignIn}
//                         isLoading={isSubmitting}
//                         size="lg"
//                     >
//                         Sign in with Google
//                     </Button>
                    
//                     <HStack w="full">
//                         <Divider />
//                         <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">OR EMAIL</Text>
//                         <Divider />
//                     </HStack>

//                     {/* Email Login Form */}
//                     <form onSubmit={handleEmailLogin} style={{ width: '100%' }}>
//                         <VStack spacing={4}>
//                             <FormControl>
//                                 <FormLabel>Email Address</FormLabel>
//                                 <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
//                             </FormControl>
//                             <FormControl>
//                                 <FormLabel>Password</FormLabel>
//                                 <Input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
//                             </FormControl>
//                             <Button type="submit" colorScheme="teal" w="full" size="lg" isLoading={isSubmitting}>
//                                 Login
//                             </Button>
//                         </VStack>
//                     </form>
//                 </VStack>
//             </TabPanel>

//             {/* --- REGISTER PANEL --- */}
//             <TabPanel>
//                 <form onSubmit={handleRegistration}>
//                     <VStack spacing={4}>
//                         <FormControl isRequired>
//                             <FormLabel>Full Name</FormLabel>
//                             <Input value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Business or Person Name" />
//                         </FormControl>
//                         <FormControl isRequired>
//                             <FormLabel>Email Address</FormLabel>
//                             <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
//                         </FormControl>
//                         <FormControl isRequired>
//                             <FormLabel>Phone Number</FormLabel>
//                             <Input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
//                         </FormControl>
//                         <FormControl isRequired>
//                             <FormLabel>GST / PAN Number</FormLabel>
//                             <Input value={regGst} onChange={(e) => setRegGst(e.target.value)} placeholder="GSTIN or PAN" />
//                         </FormControl>
//                         <FormControl isRequired>
//                             <FormLabel>Password</FormLabel>
//                             <Input type="password" value={regPass} onChange={(e) => setRegPass(e.target.value)} placeholder="Min 6 characters" />
//                         </FormControl>
//                         <FormControl isRequired>
//                             <FormLabel>Confirm Password</FormLabel>
//                             <Input type="password" value={regConfirmPass} onChange={(e) => setRegConfirmPass(e.target.value)} />
//                         </FormControl>
                        
//                         <Button type="submit" colorScheme="teal" w="full" size="lg" mt={2} isLoading={isSubmitting}>
//                             Register New Account
//                         </Button>
//                         <Text fontSize="xs" color="gray.500" textAlign="center">
//                             Registration requires admin approval.
//                         </Text>
//                     </VStack>
//                 </form>
//             </TabPanel>
//           </TabPanels>
//         </Tabs>
//       </Box>
//     </Container>
//   );
// };

// export default LoginPage;



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