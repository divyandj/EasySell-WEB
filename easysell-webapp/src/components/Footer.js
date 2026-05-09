import React from 'react';
import {
  Box,
  Container,
  Text,
  Link,
  Flex,
  HStack,
  VStack,
} from '@chakra-ui/react';
import { useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { resolveStoreContext } from '../utils/storeResolver';

const formatStoreLabel = (value = 'store') => (
  value
    .replace(/\..*$/, '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
);

export default function Footer({ storeContext }) {
  const context = storeContext || resolveStoreContext();
  const isStorefront = context.type === 'subdomain' || context.type === 'customDomain';
  const storeLabel = isStorefront
    ? formatStoreLabel(context.handle || context.domain || 'Store')
    : 'Vyparsetu';

  const bg = useColorModeValue(isStorefront ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.94)', 'rgba(17,24,39,0.92)');
  const borderColor = useColorModeValue('#E2E8F0', 'whiteAlpha.200');
  const textColor = useColorModeValue('#64748B', 'gray.400');
  const titleColor = useColorModeValue('#0F172A', 'whiteAlpha.900');
  const linkColor = useColorModeValue('#475569', 'gray.300');
  const linkHoverColor = useColorModeValue('brand.600', 'brand.300');

  return (
    <Box bg={bg} borderTopWidth="1px" borderColor={borderColor} mt="auto">
      <Container maxW="container.xl" py={8}>
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          gap={3}
        >
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" color={titleColor} fontWeight="700">
              {storeLabel}
            </Text>
            <Text fontSize="xs" color={textColor}>
              {isStorefront
                ? 'Official storefront with secure checkout, direct support, and focused browsing.'
                : 'Modern commerce experience built for confident buying.'}
            </Text>
          </VStack>

          <HStack spacing={4} fontSize="xs" color={linkColor}>
            <Link as={RouterLink} to="/about-us" _hover={{ color: linkHoverColor }} transition="color 0.2s">
              About Us
            </Link>
            <Link as={RouterLink} to="/contact" _hover={{ color: linkHoverColor }} transition="color 0.2s">
              Store Support
            </Link>
          </HStack>
        </Flex>

        <Text fontSize="xs" color={textColor} mt={5}>
          (c) {new Date().getFullYear()} {storeLabel}. All rights reserved.
        </Text>
      </Container>
    </Box>
  );
}