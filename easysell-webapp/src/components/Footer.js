import React from 'react';
import {
    Box,
    Container,
    Text,
    Link,
    useColorModeValue,
    Flex,
    HStack,
    Divider
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

export default function Footer() {
    const bg = useColorModeValue('white', '#0F0F14');
    const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
    const textColor = useColorModeValue('gray.500', 'gray.500');
    const linkColor = useColorModeValue('gray.600', 'gray.400');
    const brandGradient = 'linear(to-r, brand.500, accent.500)';

    return (
        <Box
            bg={bg}
            borderTopWidth="1px"
            borderColor={borderColor}
            mt="auto"
        >
            <Container maxW="container.xl" py={6}>
                <Flex
                    direction={{ base: 'column', md: 'row' }}
                    justify="space-between"
                    align="center"
                    gap={4}
                >
                    {/* Left: Branding */}
                    <HStack spacing={2}>
                        <Text fontSize="sm" color={textColor}>
                            Powered by
                        </Text>
                        <Text
                            fontSize="sm"
                            fontWeight="800"
                            bgGradient={brandGradient}
                            bgClip="text"
                            letterSpacing="-0.02em"
                        >
                            easySell
                        </Text>
                    </HStack>

                    {/* Right: Links */}
                    <HStack spacing={6} fontSize="xs" color={linkColor}>
                        <Link as={RouterLink} to="/" _hover={{ color: 'brand.500' }} transition="color 0.2s">
                            Privacy
                        </Link>
                        <Link as={RouterLink} to="/" _hover={{ color: 'brand.500' }} transition="color 0.2s">
                            Terms
                        </Link>
                        <Link as={RouterLink} to="/" _hover={{ color: 'brand.500' }} transition="color 0.2s">
                            Support
                        </Link>
                    </HStack>
                </Flex>

                <Divider my={4} borderColor={borderColor} />

                <Text fontSize="xs" color={textColor} textAlign="center">
                    © {new Date().getFullYear()} easySell. All rights reserved.
                </Text>
            </Container>
        </Box>
    );
}
