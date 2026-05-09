import { extendTheme } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

const styles = {
    global: (props) => ({
        body: {
            bg: mode('linear-gradient(180deg, #F8FAFC 0%, #EEF4FB 100%)', '#090B12')(props),
            color: mode('gray.800', 'whiteAlpha.900')(props),
            transition: 'background-color 0.2s ease',
        },
        '::selection': {
            bg: 'accent.100',
            color: 'brand.900',
        },
    }),
};

const colors = {
    brand: {
        50: '#F8FAFC',
        100: '#F1F5F9',
        200: '#E2E8F0',
        300: '#CBD5E1',
        400: '#94A3B8',
        500: '#64748B',
        600: '#475569',
        700: '#334155',
        800: '#1E293B',
        900: '#0F172A',
    },
    accent: {
        50: '#EFF6FF',
        100: '#DBEAFE',
        200: '#BFDBFE',
        300: '#93C5FD',
        400: '#60A5FA',
        500: '#3B82F6',
        600: '#2563EB',
        700: '#1D4ED8',
        800: '#1E40AF',
        900: '#1E3A8A',
    },
    surface: {
        light: '#FFFFFF',
        dark: '#0F0F14',
    },
};

const fonts = {
    heading: `'Rubik', 'Segoe UI', sans-serif`,
    body: `'Nunito Sans', 'Segoe UI', sans-serif`,
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
            borderRadius: '999px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        variants: {
            solid: (props) => ({
                bg: mode('accent.600', 'accent.500')(props),
                color: 'white',
                _hover: {
                    bg: mode('accent.700', 'accent.600')(props),
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.24)',
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
                    borderColor: 'accent.500',
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
                        borderColor: 'accent.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-accent-500)',
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
