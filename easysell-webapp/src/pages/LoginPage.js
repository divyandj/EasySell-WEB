import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Heading, Button, VStack, useToast, Text, Icon, Center } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc'; // Google icon

const LoginPage = () => {
  const { signInWithGoogle, currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      const from = location.state?.from?.pathname || '/'; // Redirect back or to home
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, location.state]);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    const user = await signInWithGoogle();
    if (user) {
      toast({
        title: "Signed in successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // Navigation is handled by the useEffect above
    } else {
      toast({
        title: "Sign in failed.",
        description: "Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsSubmitting(false);
    }
    // No need to set isSubmitting false on success, as the page redirects
  };

  return (
    <Container centerContent py={20}>
      <VStack spacing={8} w="full" maxW="md" bg="white" p={8} borderRadius="lg" boxShadow="md">
        <Heading size="lg" color="gray.700">Welcome Back!</Heading>
        <Text color="gray.500">Sign in to continue shopping.</Text>
        <Button
          w="full"
          colorScheme="gray"
          variant="outline"
          leftIcon={<Icon as={FcGoogle} />}
          onClick={handleGoogleSignIn}
          isLoading={isSubmitting}
          size="lg"
        >
          Sign in with Google
        </Button>
        {/* You can add back Email/Password or Phone Auth UI here if needed */}
      </VStack>
    </Container>
  );
};

export default LoginPage;