import { extendTheme } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

const styles = {
    global: (props) => ({
        body: {
            bg: mode('#F8F9FC', '#09090B')(props),
            color: mode('gray.800', 'whiteAlpha.900')(props),
            transition: 'background-color 0.2s ease',
        },
        '::selection': {
            bg: 'brand.100',
            color: 'brand.900',
        },
    }),
};

const colors = {
    brand: {
        50: '#F3F0FF',
        100: '#E0DBFF',
        200: '#C4B5FD',
        300: '#A78BFA',
        400: '#8B5CF6',
        500: '#6C5CE7',
        600: '#5B4BD5',
        700: '#4C3EC0',
        800: '#3B2F9E',
        900: '#2D2275',
    },
    accent: {
        50: '#ECFEFF',
        100: '#CFFAFE',
        200: '#A5F3FC',
        300: '#67E8F9',
        400: '#22D3EE',
        500: '#00D2FF',
        600: '#0891B2',
        700: '#0E7490',
        800: '#155E75',
        900: '#164E63',
    },
    surface: {
        light: '#FFFFFF',
        dark: '#0F0F14',
    },
};

const fonts = {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
};

const shadows = {
    card: '0 1px 3px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.06)',
    cardHover: '0 4px 12px rgba(0,0,0,0.06), 0 12px 36px rgba(0,0,0,0.1)',
    elevated: '0 8px 30px rgba(0,0,0,0.08)',
    soft: '0 2px 8px rgba(0,0,0,0.04)',
};

const components = {
    Button: {
        baseStyle: {
            fontWeight: '600',
            borderRadius: '12px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        variants: {
            solid: (props) => ({
                bg: mode('brand.500', 'brand.400')(props),
                color: 'white',
                _hover: {
                    bg: mode('brand.600', 'brand.500')(props),
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 14px rgba(108,92,231,0.4)',
                },
                _active: {
                    transform: 'translateY(0)',
                    boxShadow: 'none',
                },
            }),
            outline: (props) => ({
                borderColor: mode('gray.200', 'whiteAlpha.200')(props),
                color: mode('gray.700', 'white')(props),
                borderWidth: '1.5px',
                _hover: {
                    bg: mode('gray.50', 'whiteAlpha.50')(props),
                    borderColor: 'brand.400',
                    transform: 'translateY(-1px)',
                },
            }),
            ghost: (props) => ({
                color: mode('gray.600', 'gray.300')(props),
                _hover: {
                    bg: mode('gray.100', 'whiteAlpha.100')(props),
                },
            }),
        },
    },
    Card: {
        baseStyle: (props) => ({
            container: {
                bg: mode('white', '#111116')(props),
                borderColor: mode('gray.100', 'whiteAlpha.100')(props),
                borderWidth: '1px',
                borderRadius: '16px',
                boxShadow: 'card',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            },
        }),
    },
    Badge: {
        baseStyle: {
            borderRadius: 'full',
            px: 3,
            py: 1,
            fontWeight: '600',
            fontSize: 'xs',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
        },
    },
    Input: {
        variants: {
            outline: (props) => ({
                field: {
                    borderRadius: '12px',
                    borderColor: mode('gray.200', 'whiteAlpha.200')(props),
                    _focus: {
                        borderColor: 'brand.400',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
                    },
                    _hover: {
                        borderColor: mode('gray.300', 'whiteAlpha.300')(props),
                    },
                },
            }),
        },
    },
    Heading: {
        baseStyle: {
            fontWeight: '800',
            letterSpacing: '-0.02em',
        },
    },
};

const config = {
    initialColorMode: 'light',
    useSystemColorMode: false,
};

const theme = extendTheme({ config, styles, colors, fonts, shadows, components });

export default theme;
