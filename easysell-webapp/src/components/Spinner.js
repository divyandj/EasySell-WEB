// src/components/Spinner.js
import React from 'react';
import { Center, Spinner as ChakraSpinner } from '@chakra-ui/react';

/**
 * A reusable loading spinner component that is centered on the page.
 * The height is calculated to fill the viewport minus the height of the fixed navbar (60px),
 * ensuring the spinner is always vertically centered in the main content area.
 */
const Spinner = () => {
  return (
    <Center h="calc(100vh - 60px)">
      <ChakraSpinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="teal.500"
        size="xl"
      />
    </Center>
  );
};

export default Spinner;