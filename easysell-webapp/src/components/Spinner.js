import React from 'react';
import { Center, Spinner, VStack, Text, useColorModeValue } from '@chakra-ui/react';

const SpinnerComponent = ({ message = "Loading..." }) => {
  const bg = useColorModeValue('#F8F9FC', '#09090B');
  const textColor = useColorModeValue('gray.400', 'gray.500');

  return (
    <Center h="80vh" bg={bg}>
      <VStack spacing={4}>
        <Spinner
          size="lg"
          color="brand.500"
          thickness="3px"
          speed="0.8s"
          emptyColor={useColorModeValue('gray.100', 'whiteAlpha.100')}
        />
        <Text fontSize="sm" color={textColor} fontWeight="500">
          {message}
        </Text>
      </VStack>
    </Center>
  );
};

export default SpinnerComponent;