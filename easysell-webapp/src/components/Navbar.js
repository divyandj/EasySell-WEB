import React from 'react';
import {
  Box, Flex, Heading, Button, Badge, IconButton, HStack, Avatar, Menu, MenuButton, MenuList, MenuItem, MenuDivider, Text, InputGroup, InputLeftElement, Input, useColorModeValue, Container, useColorMode
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiLogOut, FiUser, FiSearch, FiSun, FiMoon } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { itemCount } = useCart();
  const { currentUser, userData, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const { colorMode, toggleColorMode } = useColorMode();
  const navBg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(15, 23, 42, 0.85)');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const menuBg = useColorModeValue('white', 'gray.800');
  const menuBorderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const menuTextColor = useColorModeValue('gray.800', 'white');
  const iconColor = useColorModeValue('brand.500', 'brand.300'); // Vibrant icon color
  const menuHoverBg = useColorModeValue('brand.50', 'whiteAlpha.100'); // Moved to top level

  return (
    <Box
      as="nav"
      position="sticky"
      top="0"
      bg={navBg}
      zIndex="sticky"
      backdropFilter="blur(20px)"
      borderBottomWidth="1px"
      borderColor={borderColor}
      shadow="lg"
      transition="all 0.3s"
    >
      <Container maxW="container.xl" px={{ base: 4, md: 6 }}>
        <Flex h={20} alignItems="center" justifyContent="space-between">

          {/* Logo & Main Nav */}
          <HStack spacing={10} alignItems="center">
            <Heading
              as={RouterLink}
              to="/"
              size="xl"
              letterSpacing="tighter"
              bgGradient="linear(to-r, brand.300, accent.200)"
              bgClip="text"
              fontWeight="900"
              _hover={{ transform: 'scale(1.05)', bgGradient: "linear(to-r, brand.200, accent.100)" }}
              transition="all 0.2s"
            >
              easySell
            </Heading>
          </HStack>

          {/* Right Side Actions */}
          <HStack alignItems="center" spacing={{ base: 2, md: 4 }}>
            {/* Theme Toggle */}
            <IconButton
              icon={colorMode === 'light' ? <FiMoon size="20px" /> : <FiSun size="20px" />}
              onClick={toggleColorMode}
              variant="ghost"
              aria-label="Toggle Theme"
              color={iconColor}
              _hover={{ bg: 'whiteAlpha.100', transform: 'scale(1.1) rotate(15deg)', color: 'accent.400' }}
              transition="all 0.2s"
              borderRadius="full"
            />

            {/* Cart Icon */}
            {currentUser && (
              <Button
                as={RouterLink}
                to="/cart"
                variant="ghost"
                position="relative"
                aria-label="Cart"
                color={iconColor}
                _hover={{ bg: 'whiteAlpha.100', transform: 'scale(1.1)', color: 'accent.400' }}
                borderRadius="full"
                p={2}
                minW="auto"
                transition="all 0.2s"
              >
                <FiShoppingCart size="22px" />
                {itemCount > 0 && (
                  <Badge
                    position="absolute"
                    top="2px"
                    right="2px"
                    fontSize="0.7em"
                    colorScheme="red"
                    variant="solid"
                    borderRadius="full"
                    w="18px"
                    h="18px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 0 0 2px white"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* User Menu */}
            {currentUser ? (
              <Menu>
                <MenuButton
                  as={Button}
                  rounded={'full'}
                  variant={'link'}
                  cursor={'pointer'}
                  minW={0}
                  _hover={{ transform: 'scale(1.05)' }}
                  transition="all 0.2s"
                >
                  <Avatar
                    size={'sm'}
                    src={currentUser.photoURL || ''}
                    name={currentUser.displayName || currentUser.email || ''}
                    borderWidth="2px"
                    borderColor="brand.400"
                  />
                </MenuButton>
                <MenuList bg={menuBg} borderColor={menuBorderColor} shadow="2xl" py={2} borderRadius="xl">
                  <Box px={4} py={3} borderBottomWidth="1px" borderColor="whiteAlpha.100" mb={2}>
                    <Text fontWeight="bold" color={menuTextColor} fontSize="md">{currentUser.displayName || 'User'}</Text>
                    <Text fontSize="sm" color="gray.400" noOfLines={1}>{currentUser.email}</Text>
                  </Box>
                  <MenuItem as={RouterLink} to="/orders" _hover={{ bg: menuHoverBg }} icon={<FiShoppingCart color={iconColor} />}>My Orders</MenuItem>
                  <MenuItem _hover={{ bg: menuHoverBg }} icon={<FiUser color={iconColor} />}>Profile</MenuItem>
                  <MenuDivider borderColor="whiteAlpha.200" />
                  <MenuItem icon={<FiLogOut />} onClick={handleLogout} color="red.400" _hover={{ bg: 'red.50' }}>Logout</MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <HStack spacing={3}>
                <Button
                  as={RouterLink}
                  to="/login"
                  variant="ghost"
                  color={iconColor}
                  fontWeight="medium"
                  _hover={{ color: 'accent.400', bg: 'whiteAlpha.100', transform: 'translateY(-1px)' }}
                  size="md"
                >
                  Log In
                </Button>
                <Button
                  as={RouterLink}
                  to="/signup"
                  colorScheme="brand"
                  size="md"
                  px={6}
                  borderRadius="full"
                  boxShadow="lg"
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                >
                  Sign Up
                </Button>
              </HStack>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
};

export default Navbar;