import React from 'react';
import {
  Box, Flex, Heading, Button, Badge, IconButton, HStack, Avatar, Menu, MenuButton, MenuList, MenuItem, MenuDivider, Text, useColorModeValue, Container, useColorMode,
  Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, useDisclosure, VStack, Divider
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiLogOut, FiUser, FiSun, FiMoon, FiMenu, FiPackage, FiChevronRight, FiStar } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBadge = motion(Badge);

const Navbar = () => {
  const { itemCount } = useCart();
  const { currentUser, userData, signOut, storeConfig, buyerPoints } = useAuth();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const { colorMode, toggleColorMode } = useColorMode();

  // Theme tokens
  const navBg = useColorModeValue('rgba(255, 255, 255, 0.85)', 'rgba(9, 9, 11, 0.85)');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const menuBg = useColorModeValue('white', '#111116');
  const menuBorderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const iconColor = useColorModeValue('gray.600', 'gray.300');
  const menuHoverBg = useColorModeValue('brand.50', 'whiteAlpha.100');
  const logoGradient = 'linear(to-r, brand.500, accent.500)';

  return (
    <Box
      as="nav"
      position="sticky"
      top="0"
      bg={navBg}
      zIndex="sticky"
      backdropFilter="blur(20px)"
      sx={{ WebkitBackdropFilter: 'blur(20px)' }}
      borderBottomWidth="1px"
      borderColor={borderColor}
      transition="all 0.3s"
    >
      <Container maxW="container.xl" px={{ base: 4, md: 6 }}>
        <Flex h={16} alignItems="center" justifyContent="space-between">

          {/* Logo */}
          <HStack spacing={3} alignItems="center">
            {/* Mobile menu button */}
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
              fontSize="xl"
              letterSpacing="-0.03em"
              bgGradient={logoGradient}
              bgClip="text"
              fontWeight="900"
              _hover={{ opacity: 0.8 }}
              transition="opacity 0.2s"
            >
              Vyparsetu
            </Heading>
          </HStack>

          {/* Right Side Actions */}
          <HStack alignItems="center" spacing={1}>
            {/* Theme Toggle */}
            <IconButton
              icon={colorMode === 'light' ? <FiMoon size="16px" /> : <FiSun size="16px" />}
              onClick={toggleColorMode}
              variant="ghost"
              aria-label="Toggle Theme"
              color={iconColor}
              _hover={{ bg: useColorModeValue('gray.100', 'whiteAlpha.100') }}
              borderRadius="full"
              size="sm"
            />

            {/* Complete Profile Prompt */}
            {currentUser && !userData && (
              <Button
                as={RouterLink}
                to="/signup"
                colorScheme="orange"
                variant="solid"
                bg="orange.400"
                size="xs"
                px={4}
                rounded="full"
                fontWeight="600"
                display={{ base: 'none', md: 'flex' }}
              >
                Complete Setup
              </Button>
            )}

            {/* Points Badge */}
            {currentUser && userData && storeConfig?.rewardsEnabled && (
              <Button
                as={RouterLink}
                to="/rewards"
                variant="ghost"
                size="sm"
                borderRadius="full"
                leftIcon={<FiStar size="14px" />}
                color="purple.500"
                fontWeight="700"
                fontSize="xs"
                _hover={{ bg: menuHoverBg }}
                px={3}
              >
                {buyerPoints?.points || 0} pts
              </Button>
            )}

            {/* Cart Icon */}
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
                <AnimatePresence>
                  {itemCount > 0 && (
                    <MotionBadge
                      key="cart-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      position="absolute"
                      top="-2px"
                      right="-2px"
                      fontSize="0.6em"
                      colorScheme="red"
                      variant="solid"
                      borderRadius="full"
                      w="16px"
                      h="16px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow={`0 0 0 2px ${colorMode === 'light' ? 'white' : '#09090B'}`}
                      pointerEvents="none"
                    >
                      {itemCount}
                    </MotionBadge>
                  )}
                </AnimatePresence>
              </Box>
            )}

            {/* User Menu */}
            {currentUser ? (
              <Menu>
                <MenuButton
                  as={Button}
                  rounded="full"
                  variant="link"
                  cursor="pointer"
                  minW={0}
                  ml={1}
                >
                  <Avatar
                    size="xs"
                    src={currentUser.photoURL || ''}
                    name={currentUser.displayName || currentUser.email || ''}
                    borderWidth="2px"
                    borderColor="brand.400"
                  />
                </MenuButton>
                <MenuList
                  bg={menuBg}
                  borderColor={menuBorderColor}
                  shadow="elevated"
                  py={2}
                  borderRadius="16px"
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
                        _hover={{ bg: menuHoverBg }}
                        icon={<FiPackage color="var(--chakra-colors-brand-500)" />}
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
                        _hover={{ bg: menuHoverBg }}
                        icon={<FiUser color="var(--chakra-colors-brand-500)" />}
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
                      fontWeight="600"
                      color="orange.500"
                      icon={<FiUser />}
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
                    _hover={{ bg: 'red.50' }}
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
                  fontWeight="500"
                  size="sm"
                  _hover={{ color: 'brand.500' }}
                >
                  Log In
                </Button>
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
              </HStack>
            )}
          </HStack>
        </Flex>
      </Container>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg={menuBg} maxW="280px">
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
            <Heading
              fontSize="lg"
              bgGradient={logoGradient}
              bgClip="text"
              fontWeight="900"
            >
              Vyparsetu
            </Heading>
          </DrawerHeader>
          <DrawerBody py={6}>
            <VStack spacing={1} align="stretch">
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
                    Log In
                  </Button>
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