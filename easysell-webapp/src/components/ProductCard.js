import React from 'react';
import {
  Box,
  Image,
  Text,
  Badge,
  Button,
  Flex,
  useToast,
  AspectRatio,
  VStack,
  Heading
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiShoppingCart, FiClock } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const toast = useToast();

  // Stock & Price Logic
  const qty = product.availableQuantity;
  const isUnlimited = qty === -1;
  const effectivelyInStock = isUnlimited || product.inStock;
  const allowBackorder = product.allowBackorders === true;

  // It is only "Out of Stock" if it's NOT in stock AND backorders are NOT allowed.
  const isOutOfStock = !effectivelyInStock && !allowBackorder;
  const isPreOrder = !effectivelyInStock && allowBackorder;

  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevent navigation if adding to cart
    if (product.hasVariants || isOutOfStock) return;
    addToCart(product, 1);
    toast({
      title: `${product.title} added to cart.`,
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top',
    });
  };

  const price = product.discountedPrice > 0 ? product.discountedPrice : product.price;
  const imageUrl = product.media?.find(m => m.type === 'image')?.url;

  return (
    <MotionBox
      position="relative"
      bg="white" // Clean white card
      borderRadius="3xl" // Extra rounded premium feel
      overflow="hidden"
      boxShadow="lg" // Soft shadow
      whileHover={{ y: -8, boxShadow: '2xl' }} // Lift effect
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      role="group" // For hover parent
    >
      <RouterLink to={`/product/${product.id}`}>
        <Box position="relative" overflow="hidden">
          <AspectRatio ratio={3 / 4}>
            <Image
              src={imageUrl}
              alt={product.title}
              objectFit="cover"
              fallbackSrc="https://via.placeholder.com/300"
              transition="transform 0.4s ease"
              _groupHover={{ transform: 'scale(1.05)' }} // Zoom image on card hover
            />
          </AspectRatio>

          {/* Overlays */}
          {isOutOfStock && (
            <Box position="absolute" top={0} left={0} w="full" h="full" bg="blackAlpha.600" display="flex" alignItems="center" justifyContent="center">
              <Badge colorScheme="red" fontSize="md" px={3} py={1} borderRadius="full">Sold Out</Badge>
            </Box>
          )}

          {isPreOrder && (
            <Box position="absolute" top={4} right={4}>
              <Badge colorScheme="orange" variant="solid" fontSize="xs" px={2} py={1} borderRadius="full" shadow="md">
                Pre-Order
              </Badge>
            </Box>
          )}

          {/* Floating Action Button (Visible on Hover) */}
          <Box
            position="absolute"
            bottom="4"
            right="4"
            opacity={{ base: 1, md: 0 }}
            _groupHover={{ opacity: 1 }}
            transition="opacity 0.2s"
          >
            <Button
              colorScheme={isPreOrder ? "orange" : "brand"}
              size="md"
              rounded="full"
              shadow="xl"
              w="12"
              h="12"
              p={0}
              isDisabled={isOutOfStock}
              onClick={product.hasVariants ? undefined : handleAddToCart}
            >
              {isPreOrder ? <FiClock size={18} /> : <FiShoppingCart size={18} />}
            </Button>
          </Box>
        </Box>

        <VStack p="5" align="start" spacing={1}>
          <Text fontSize="xs" fontWeight="bold" letterSpacing="wider" color="gray.400" textTransform="uppercase">
            {product.tags?.[0] || 'Exclusive'}
          </Text>

          <Heading as="h3" size="md" color="gray.800" fontWeight="bold" lineHeight="tall" noOfLines={1} _groupHover={{ color: 'brand.500' }} transition="color 0.2s">
            {product.title}
          </Heading>

          <Flex align="baseline" mt={1}>
            <Text fontSize="lg" fontWeight="extrabold" color="gray.900">
              ₹{price.toFixed(2)}
            </Text>
            {product.discountedPrice > 0 && (
              <Text as="s" ml="2" fontSize="sm" color="gray.400">
                ₹{product.price.toFixed(2)}
              </Text>
            )}
          </Flex>
        </VStack>
      </RouterLink>
    </MotionBox>
  );
};

export default ProductCard;