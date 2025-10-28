import React from 'react';
import {
  Box, Flex, Heading, Button, Badge, IconButton, HStack, Avatar, Menu, MenuButton, MenuList, MenuItem, MenuDivider, Text
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiLogOut, FiUser } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
// No need to import signOut from firebase/auth here anymore

const Navbar = () => {
  const { itemCount } = useCart();
  const { currentUser, userData, signOut } = useAuth(); // Get signOut from context
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(); // Use the signOut function from AuthContext
      navigate('/'); // Navigate to home after sign out
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <Box
      as="nav"
      position="sticky"
      top="0"
      bg="whiteAlpha.900" // Slightly less transparent
      zIndex="overlay"
      backdropFilter="saturate(180%) blur(5px)"
      borderBottomWidth="1px"
      borderColor="gray.200"
      shadow="sm" // Added a subtle shadow
    >
      <Flex h={16} alignItems="center" justifyContent="space-between" maxW="container.xl" mx="auto" px={{ base: 4, md: 6 }}>
        <Heading as={RouterLink} to="/" size="md" color="teal.600" fontWeight="bold">
          easySell
        </Heading>

        <HStack alignItems="center" spacing={{ base: 3, md: 5 }}>
          <Button as={RouterLink} to="/cart" variant="ghost" position="relative" aria-label="Cart">
            <FiShoppingCart size="20px" />
            {itemCount > 0 && (
              <Badge
                position="absolute"
                top="-1px"
                right="-1px"
                fontSize="0.7em"
                colorScheme="red"
                borderRadius="full"
                px={1.5}
              >
                {itemCount}
              </Badge>
            )}
          </Button>

          {currentUser ? (
            <Menu>
              <MenuButton
                as={Button}
                rounded={'full'}
                variant={'link'}
                cursor={'pointer'}
                minW={0}>
                <Avatar
                  size={'sm'}
                  src={currentUser.photoURL || ''} // Use photoURL from auth object
                  name={currentUser.displayName || currentUser.email || ''} // Use displayName or email
                />
              </MenuButton>
              <MenuList>
                <MenuItem as={RouterLink} to="/orders">My Orders</MenuItem>
                {userData && <MenuItem isDisabled><Text fontSize="sm" color="gray.500">Role: {userData.userType}</Text></MenuItem>}
                <MenuDivider />
                <MenuItem icon={<FiLogOut />} onClick={handleLogout}>Logout</MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <Button as={RouterLink} to="/login" leftIcon={<FiUser />} colorScheme="teal" variant="solid" size="sm">
              Login
            </Button>
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;  