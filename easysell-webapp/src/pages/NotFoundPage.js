// src/pages/NotFoundPage.js
import React from 'react';
import { Box, Heading, Text, Button, Center } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <Center h="80vh">
      <Box textAlign="center">
        <Heading display="inline-block" as="h2" size="2xl" bg="teal.400" backgroundClip="text">
          404
        </Heading>
        <Text fontSize="18px" mt={3} mb={2}>
          Page Not Found
        </Text>
        <Text color={'gray.500'} mb={6}>
          The page you're looking for does not seem to exist.
        </Text>

        <Button
          as={RouterLink}
          to="/"
          colorScheme="teal"
          variant="solid">
          Go to Home
        </Button>
      </Box>
    </Center>
  );
};

export default NotFoundPage;