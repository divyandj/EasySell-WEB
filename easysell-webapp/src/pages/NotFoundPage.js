import React from 'react';
import { Box, Heading, Text, Button, Center, VStack, Flex, Icon, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';

const NotFoundPage = () => {
  const pageBg = useColorModeValue('#F8F9FC', '#09090B');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Center minH="80vh" bg={pageBg}>
      <VStack spacing={6} textAlign="center" px={6}>
        <Text fontSize="8xl" fontWeight="900" bgGradient="linear(to-r, brand.500, accent.500)" bgClip="text" lineHeight="1">
          404
        </Text>
        <Heading size="lg" color={textColor} fontWeight="800">Page Not Found</Heading>
        <Text color={mutedColor} maxW="400px">
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <Button
          as={RouterLink}
          to="/"
          colorScheme="brand"
          borderRadius="12px"
          px={8}
          leftIcon={<FiHome />}
          fontWeight="600"
        >
          Go Home
        </Button>
      </VStack>
    </Center>
  );
};

export default NotFoundPage;