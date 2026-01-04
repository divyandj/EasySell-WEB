import React from 'react';
import {
    Box,
    Container,
    Stack,
    SimpleGrid,
    Text,
    Link,
    VisuallyHidden,
    chakra,
    useColorModeValue,
    Icon,
    Input,
    IconButton,
    Flex
} from '@chakra-ui/react';
import { FaTwitter, FaYoutube, FaInstagram, FaFacebook } from 'react-icons/fa';
import { FiMail } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';

const SocialButton = ({ children, label, href }) => {
    return (
        <chakra.button
            bg={useColorModeValue('blackAlpha.100', 'whiteAlpha.100')}
            rounded={'full'}
            w={8}
            h={8}
            cursor={'pointer'}
            as={'a'}
            href={href}
            display={'inline-flex'}
            alignItems={'center'}
            justifyContent={'center'}
            transition={'background 0.3s ease'}
            _hover={{
                bg: useColorModeValue('blackAlpha.200', 'whiteAlpha.200'),
            }}
        >
            <VisuallyHidden>{label}</VisuallyHidden>
            {children}
        </chakra.button>
    );
};

const ListHeader = ({ children }) => {
    return (
        <Text fontWeight={'500'} fontSize={'lg'} mb={2} color={useColorModeValue('brand.600', 'brand.200')}>
            {children}
        </Text>
    );
};

export default function Footer() {
    const bg = useColorModeValue('gray.50', 'gray.900');
    const color = useColorModeValue('gray.700', 'gray.200');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    return (
        <Box
            bg={bg}
            color={color}
            borderTopWidth={1}
            borderTopStyle={'solid'}
            borderColor={borderColor}
            mt="auto"
        >
            <Container as={Stack} maxW={'container.xl'} py={10}>
                <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={8}>
                    <Stack align={'flex-start'}>
                        <ListHeader>Company</ListHeader>
                        <Link as={RouterLink} to={'/'}>About Us</Link>
                        <Link as={RouterLink} to={'/'}>Blog</Link>
                        <Link as={RouterLink} to={'/'}>Carrers</Link>
                        <Link as={RouterLink} to={'/'}>Contact Us</Link>
                    </Stack>

                    <Stack align={'flex-start'}>
                        <ListHeader>Support</ListHeader>
                        <Link as={RouterLink} to={'/'}>Help Center</Link>
                        <Link as={RouterLink} to={'/'}>Safety Center</Link>
                        <Link as={RouterLink} to={'/'}>Community Guidelines</Link>
                    </Stack>

                    <Stack align={'flex-start'}>
                        <ListHeader>Legal</ListHeader>
                        <Link as={RouterLink} to={'/'}>Cookies Policy</Link>
                        <Link as={RouterLink} to={'/'}>Privacy Policy</Link>
                        <Link as={RouterLink} to={'/'}>Terms of Service</Link>
                        <Link as={RouterLink} to={'/'}>Law Enforcement</Link>
                    </Stack>

                    <Stack align={'flex-start'}>
                        <ListHeader>Stay up to date</ListHeader>
                        <Stack direction={'row'}>
                            <Input
                                placeholder={'Your email address'}
                                bg={useColorModeValue('blackAlpha.100', 'whiteAlpha.100')}
                                border={0}
                                _focus={{
                                    bg: 'whiteAlpha.300',
                                }}
                            />
                            <IconButton
                                bg={useColorModeValue('brand.400', 'brand.600')}
                                color={useColorModeValue('white', 'gray.800')}
                                _hover={{
                                    bg: 'brand.500',
                                }}
                                aria-label="Subscribe"
                                icon={<FiMail />}
                            />
                        </Stack>
                    </Stack>
                </SimpleGrid>
            </Container>

            <Box borderTopWidth={1} borderStyle={'solid'} borderColor={borderColor}>
                <Container
                    as={Stack}
                    maxW={'container.xl'}
                    py={4}
                    direction={{ base: 'column', md: 'row' }}
                    spacing={4}
                    justify={{ base: 'center', md: 'space-between' }}
                    align={{ base: 'center', md: 'center' }}
                >
                    <Text>© 2026 easySell. All rights reserved</Text>
                    <Stack direction={'row'} spacing={6}>
                        <SocialButton label={'Twitter'} href={'#'}>
                            <FaTwitter />
                        </SocialButton>
                        <SocialButton label={'YouTube'} href={'#'}>
                            <FaYoutube />
                        </SocialButton>
                        <SocialButton label={'Instagram'} href={'#'}>
                            <FaInstagram />
                        </SocialButton>
                    </Stack>
                </Container>
            </Box>
        </Box>
    );
}
