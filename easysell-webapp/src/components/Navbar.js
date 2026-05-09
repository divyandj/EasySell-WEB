import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Button,
  Badge,
  IconButton,
  HStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
  useColorModeValue,
  Container,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  VStack,
  Divider,
} from '@chakra-ui/react';
import { useColorMode } from '@chakra-ui/react';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  FiShoppingCart,
  FiLogOut,
  FiUser,
  FiMenu,
  FiPackage,
  FiChevronRight,
  FiStar,
} from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { resolveStoreContext } from '../utils/storeResolver';

const formatStoreLabel = (value = 'store') => (
  value
    .replace(/\..*$/, '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
);

const Navbar = ({ storeContext }) => {
  const { itemCount } = useCart();
  const { currentUser, userData, signOut, storeConfig, buyerPoints } = useAuth();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const context = storeContext || resolveStoreContext();
  const isStorefront = context.type === 'subdomain' || context.type === 'customDomain';
  const storeLabel = isStorefront
    ? formatStoreLabel(context.handle || context.domain || 'Store')
    : 'Vyparsetu';

  const desktopLinks = isStorefront
    ? [
      { label: 'Collections', to: '/#store-collections' },
      { label: 'About Us', to: '/about-us' },
      { label: 'Contact', to: '/contact' },
    ]
    : [];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const navSurface = useColorModeValue('rgba(255,255,255,0.84)', 'rgba(17,24,39,0.92)');
  const borderColor = useColorModeValue('#E2E8F0', 'whiteAlpha.200');
  const textColor = useColorModeValue('#334155', 'gray.200');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const iconColor = useColorModeValue('gray.600', 'gray.300');
  const menuBg = useColorModeValue('white', '#111827');
  const menuHoverBg = useColorModeValue('gray.100', 'whiteAlpha.100');
  const menuBorderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const dangerHoverBg = useColorModeValue('red.50', 'red.900');
  const storeBadgeBg = useColorModeValue('blue.50', 'blue.900');
  const storeBadgeColor = useColorModeValue('blue.700', 'blue.100');
  const defaultBrandColor = useColorModeValue('brand.700', 'brand.300');
  const brandColor = isStorefront ? '#0F172A' : defaultBrandColor;
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box
      as="nav"
      position="sticky"
      top="0"
      zIndex="sticky"
      bg={navSurface}
      borderBottomWidth="1px"
      borderColor={borderColor}
      backdropFilter="blur(18px)"
      boxShadow="sm"
    >
      <Container maxW="container.xl" px={{ base: 4, md: 6 }}>
        <Flex h={{ base: 14, md: 16 }} align="center" justify="space-between">
          <HStack spacing={3} align="center">
            <IconButton
              icon={<FiMenu />}
              variant="ghost"
              display={{ base: 'flex', md: 'none' }}
              onClick={onOpen}
              aria-label="Menu"
              color={iconColor}
              size="sm"
            />

            <Heading
              as={RouterLink}
              to="/"
              fontSize={{ base: 'lg', md: 'xl' }}
              letterSpacing="-0.02em"
              color={brandColor}
              fontWeight="900"
              _hover={{ opacity: 0.85 }}
            >
              {storeLabel}
            </Heading>

            {isStorefront && (
              <Badge
                display={{ base: 'none', md: 'inline-flex' }}
                borderRadius="full"
                px={2.5}
                py={1}
                bg={storeBadgeBg}
                color={storeBadgeColor}
                fontSize="10px"
                fontWeight="700"
                letterSpacing="0.06em"
              >
                Official Store
              </Badge>
            )}
          </HStack>

          {desktopLinks.length > 0 && (
            <HStack display={{ base: 'none', lg: 'flex' }} spacing={1}>
              {desktopLinks.map((link) => (
                <Button
                  key={link.label}
                  as={RouterLink}
                  to={link.to}
                  size="sm"
                  variant="ghost"
                  color={textColor}
                  fontWeight="600"
                  borderRadius="full"
                  _hover={{ bg: menuHoverBg, color: brandColor }}
                >
                  {link.label}
                </Button>
              ))}
            </HStack>
          )}

          <HStack align="center" spacing={1.5}>
            <IconButton
              aria-label="Toggle theme"
              variant="ghost"
              size="sm"
              onClick={toggleColorMode}
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              _hover={{ bg: menuHoverBg }}
            />
            {currentUser && !userData && (
              <Button
                as={RouterLink}
                to="/signup"
                colorScheme="orange"
                size="xs"
                px={4}
                borderRadius="full"
                display={{ base: 'none', md: 'inline-flex' }}
              >
                Complete Setup
              </Button>
            )}

            {currentUser && userData && storeConfig?.rewardsEnabled && !isStorefront && (
              <Button
                as={RouterLink}
                to="/rewards"
                variant="ghost"
                size="sm"
                borderRadius="full"
                leftIcon={<FiStar size="14px" />}
                color="accent.700"
                fontWeight="700"
                fontSize="xs"
                _hover={{ bg: menuHoverBg }}
                px={3}
              >
                {buyerPoints?.points || 0} pts
              </Button>
            )}

            {currentUser && userData && (
              <Box position="relative">
                <IconButton
                  as={RouterLink}
                  to="/cart"
                  variant="ghost"
                  aria-label="Cart"
                  icon={<FiShoppingCart size="18px" />}
                  color={iconColor}
                  _hover={{ bg: menuHoverBg }}
                  borderRadius="full"
                  size="sm"
                />
                {itemCount > 0 && (
                  <Badge
                    position="absolute"
                    top="-2px"
                    right="-2px"
                    fontSize="0.6em"
                    colorScheme="red"
                    borderRadius="full"
                    w="16px"
                    h="16px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    pointerEvents="none"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Box>
            )}

            {currentUser ? (
              <Menu>
                <MenuButton as={Button} variant="link" rounded="full" minW={0} ml={1}>
                  <Avatar
                    size="xs"
                    src={currentUser.photoURL || ''}
                    name={currentUser.displayName || currentUser.email || ''}
                    borderWidth="2px"
                    borderColor={brandColor}
                  />
                </MenuButton>
                <MenuList
                  bg={menuBg}
                  borderColor={menuBorderColor}
                  shadow="elevated"
                  py={2}
                  borderRadius="14px"
                  minW="220px"
                >
                  <Box px={4} py={3} borderBottomWidth="1px" borderColor={borderColor} mb={1}>
                    <Text fontWeight="700" color={textColor} fontSize="sm">{currentUser.displayName || 'User'}</Text>
                    <Text fontSize="xs" color={mutedColor} noOfLines={1}>{currentUser.email}</Text>
                  </Box>

                  {userData && (
                    <>
                      <MenuItem
                        as={RouterLink}
                        to="/orders"
                        icon={<FiPackage />}
                        _hover={{ bg: menuHoverBg }}
                        fontSize="sm"
                        borderRadius="md"
                        mx={2}
                        w="auto"
                      >
                        My Orders
                      </MenuItem>
                      <MenuItem
                        as={RouterLink}
                        to="/profile"
                        icon={<FiUser />}
                        _hover={{ bg: menuHoverBg }}
                        fontSize="sm"
                        borderRadius="md"
                        mx={2}
                        w="auto"
                      >
                        Profile
                      </MenuItem>
                      <MenuDivider borderColor={borderColor} />
                    </>
                  )}

                  {!userData && (
                    <MenuItem
                      as={RouterLink}
                      to="/signup"
                      icon={<FiUser />}
                      fontWeight="600"
                      color="orange.500"
                      fontSize="sm"
                      borderRadius="md"
                      mx={2}
                      w="auto"
                    >
                      Complete Setup
                    </MenuItem>
                  )}

                  <MenuItem
                    icon={<FiLogOut />}
                    onClick={handleLogout}
                    color="red.500"
                    _hover={{ bg: dangerHoverBg }}
                    fontSize="sm"
                    borderRadius="md"
                    mx={2}
                    w="auto"
                  >
                    Logout
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <HStack spacing={2}>
                <Button
                  as={RouterLink}
                  to="/login"
                  variant="ghost"
                  color={textColor}
                  fontWeight="600"
                  size="sm"
                  _hover={{ bg: menuHoverBg, color: brandColor }}
                >
                  Sign In
                </Button>
                {!isStorefront && (
                  <Button
                    as={RouterLink}
                    to="/signup"
                    colorScheme="brand"
                    size="sm"
                    px={5}
                    borderRadius="full"
                    fontWeight="600"
                  >
                    Sign Up
                  </Button>
                )}
              </HStack>
            )}
          </HStack>
        </Flex>
      </Container>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg={menuBg} maxW="280px">
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
            <Heading fontSize="lg" color={brandColor} fontWeight="900">
              {storeLabel}
            </Heading>
          </DrawerHeader>

          <DrawerBody py={6}>
            <VStack spacing={1} align="stretch">
              {desktopLinks.map((link) => (
                <Button
                  key={link.label}
                  as={RouterLink}
                  to={link.to}
                  variant="ghost"
                  justifyContent="space-between"
                  rightIcon={<FiChevronRight />}
                  onClick={onClose}
                  fontWeight="500"
                  size="lg"
                >
                  {link.label}
                </Button>
              ))}

              {desktopLinks.length > 0 && <Divider my={3} borderColor={borderColor} />}

              {currentUser && userData && (
                <>
                  <Button
                    as={RouterLink}
                    to="/orders"
                    variant="ghost"
                    justifyContent="space-between"
                    rightIcon={<FiChevronRight />}
                    onClick={onClose}
                    fontWeight="500"
                    size="lg"
                  >
                    My Orders
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/profile"
                    variant="ghost"
                    justifyContent="space-between"
                    rightIcon={<FiChevronRight />}
                    onClick={onClose}
                    fontWeight="500"
                    size="lg"
                  >
                    Profile
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/cart"
                    variant="ghost"
                    justifyContent="space-between"
                    rightIcon={
                      <HStack>
                        {itemCount > 0 && (
                          <Badge colorScheme="red" borderRadius="full" fontSize="xs">{itemCount}</Badge>
                        )}
                        <FiChevronRight />
                      </HStack>
                    }
                    onClick={onClose}
                    fontWeight="500"
                    size="lg"
                  >
                    Cart
                  </Button>
                  <Divider my={3} borderColor={borderColor} />
                </>
              )}

              {currentUser && !userData && (
                <Button
                  as={RouterLink}
                  to="/signup"
                  colorScheme="orange"
                  onClick={onClose}
                  size="lg"
                  borderRadius="xl"
                >
                  Complete Setup
                </Button>
              )}

              {!currentUser && (
                <>
                  <Button
                    as={RouterLink}
                    to="/login"
                    variant="ghost"
                    onClick={onClose}
                    fontWeight="500"
                    size="lg"
                  >
                    Sign In
                  </Button>
                  {!isStorefront && (
                    <Button
                      as={RouterLink}
                      to="/signup"
                      colorScheme="brand"
                      onClick={onClose}
                      borderRadius="xl"
                      size="lg"
                    >
                      Sign Up
                    </Button>
                  )}
                </>
              )}

              {currentUser && (
                <>
                  <Divider my={3} borderColor={borderColor} />
                  <Button
                    variant="ghost"
                    color="red.500"
                    onClick={() => { handleLogout(); onClose(); }}
                    leftIcon={<FiLogOut />}
                    fontWeight="500"
                    size="lg"
                  >
                    Logout
                  </Button>
                </>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Navbar;