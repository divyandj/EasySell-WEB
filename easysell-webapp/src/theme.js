import { extendTheme } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

const styles = {
    global: (props) => ({
        body: {
            bg: mode('gray.50', '#0f172a')(props), // Deep blue/slate for dark mode
            color: mode('gray.800', 'whiteAlpha.900')(props),
        },
    }),
};

const colors = {
    brand: {
        50: '#f0fdfa',
        100: '#ccfbf1',
        200: '#99f6e4',
        300: '#5eead4',
        400: '#2dd4bf',
        500: '#14b8a6',
        600: '#0d9488',
        700: '#0f766e',
        800: '#115e59',
        900: '#134e4a',
    },
    accent: {
        100: '#38bdf8', // Light Blue
        200: '#818cf8', // Indigo
    }
};

const fonts = {
    heading: `'Outfit', sans-serif`,
    body: `'Outfit', sans-serif`,
};

const components = {
    Button: {
        baseStyle: {
            fontWeight: 'bold',
            borderRadius: 'lg',
        },
        variants: {
            solid: (props) => ({
                bg: mode('brand.500', 'brand.400')(props),
                color: 'white',
                _hover: {
                    bg: mode('brand.600', 'brand.500')(props),
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                },
                transition: 'all 0.2s',
            }),
            outline: {
                borderColor: 'brand.400',
                color: 'brand.400',
                _hover: {
                    bg: 'whiteAlpha.100',
                },
            },
            ghost: {
                _hover: {
                    bg: 'whiteAlpha.200',
                },
            },
        },
    },
    Card: {
        baseStyle: (props) => ({
            container: {
                bg: mode('white', 'whiteAlpha.100')(props),
                backdropFilter: 'blur(10px)',
                borderColor: mode('gray.200', 'whiteAlpha.200')(props),
                borderWidth: '1px',
            },
        }),
    },
    Badge: {
        baseStyle: {
            borderRadius: 'full',
            px: 2,
            textTransform: 'uppercase',
        }
    }
};

const config = {
    initialColorMode: 'dark',
    useSystemColorMode: false,
};

const theme = extendTheme({ config, styles, colors, fonts, components });

export default theme;
