import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Image,
  Text,
  VStack,
  useColorModeValue,
  Flex,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiShoppingCart } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const MotionBox = motion(Box);

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

const ProductCard = ({ product }) => {
  const location = useLocation();
  const { storeConfig } = useAuth();
  const { billingMode } = useCart();

  // Derive catalogue ID from product or current URL
  const catalogueId = product.catalogueId || location.pathname.split('/catalogue/')?.[1];

  // Theme colors
  const bg = useColorModeValue('white', '#111116');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const textColor = useColorModeValue('gray.800', 'white');
  const priceColor = useColorModeValue('gray.900', 'white');
  const originalPriceColor = useColorModeValue('gray.400', 'gray.500');
  const descColor = useColorModeValue('gray.500', 'gray.400');
  const imageBg = useColorModeValue('gray.50', '#0D0D12');

  // Price calculations
  const taxMultiplier = billingMode === 'withoutBill' ? 1 : (1 + (product.taxRate || 0) / 100);

  const basePricePreTax = product.price > 0 ? product.price : 0;
  const discountedPricePreTax = (product.discountedPrice > 0 && product.discountedPrice < basePricePreTax) ? product.discountedPrice : null;
  
  // Use variant price if available, otherwise display standard price
  const variantPricePreTax = product.variants?.[0]?.price;

  const basePrice = Math.round(basePricePreTax * taxMultiplier);
  const discountedPrice = discountedPricePreTax ? Math.round(discountedPricePreTax * taxMultiplier) : null;
  const variantPrice = variantPricePreTax ? Math.round(variantPricePreTax * taxMultiplier) : null;

  const displayPrice = variantPrice || discountedPrice || basePrice;
  const originalPrice = discountedPrice ? basePrice : null;
  const discountPercent = discountedPricePreTax ? Math.round(((basePricePreTax - discountedPricePreTax) / basePricePreTax) * 100) : null;

  // Stock status
  const inventoryOn = storeConfig?.inventoryTracking !== false;
  const allowBackorders = product.allowBackorders === true;
  let isOutOfStock = false;
  let isLowStock = false;

  if (inventoryOn) {
    const minQty = product.minOrderQty > 0 ? product.minOrderQty : 1;
    
    if (product.variants && product.variants.length > 0) {
      const anyInStock = product.variants.some(v => v.inStock === true || v.quantity >= minQty || v.quantity === -1);
      isOutOfStock = !anyInStock && !allowBackorders;
      if (!isOutOfStock) {
        const finiteVariants = product.variants.filter(v => v.quantity !== -1 && v.quantity >= minQty);
        if (finiteVariants.length > 0) {
          const maxQty = Math.max(...finiteVariants.map(v => v.quantity));
          if (maxQty <= 5) isLowStock = true;
        }
      }
    } else {
      const isUnlimited = product.availableQuantity === -1;
      const effectiveQty = isUnlimited ? Infinity : (product.availableQuantity || 0);
      const canMeetMOQ = isUnlimited || product.inStock === true || effectiveQty >= minQty;
      
      isOutOfStock = !canMeetMOQ && !allowBackorders;
      
      if (!isOutOfStock && !isUnlimited && effectiveQty >= minQty && effectiveQty <= 5) {
        isLowStock = true;
      }
    }
  }

  return (
    <MotionBox
      variants={itemVariants}
      as={RouterLink}
      to={`/product/${catalogueId}/${product.id}`}
      display="block"
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="16px"
      overflow="hidden"
      boxShadow="card"
      _hover={{ boxShadow: 'cardHover', transform: 'translateY(-4px)' }}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      role="group"
      position="relative"
    >
      {/* Image Container — aspect ratio box */}
      <Box position="relative" overflow="hidden" bg={imageBg} w="full" h="0" pb="100%">
        <Image
          src={product.media?.find(m => m.type === 'image')?.url || product.media?.[0]?.url || product.imageUrl || product.images?.[0]}
          alt={product.title}
          w="full"
          h="full"
          objectFit="cover"
          objectPosition="center"
          position="absolute"
          top="0"
          left="0"
          fallbackSrc="https://via.placeholder.com/400x400?text=Product"
          transition="transform 0.4s ease"
          _groupHover={{ transform: 'scale(1.06)' }}
          loading="lazy"
        />

        {/* Badges Container */}
        <Flex position="absolute" top={3} left={3} direction="column" gap={2} alignItems="flex-start" zIndex={2}>
          {/* Discount Badge */}
          {discountPercent && (
            <Badge
              bg="red.500"
              color="white"
              fontSize="xs"
              fontWeight="700"
              px={2.5}
              py={1}
              borderRadius="full"
              boxShadow="md"
            >
              {discountPercent}% OFF
            </Badge>
          )}

          {/* Low Stock Badge */}
          {isLowStock && (
            <Badge
              bg="orange.500"
              color="white"
              fontSize="xs"
              fontWeight="700"
              px={2.5}
              py={1}
              borderRadius="full"
              boxShadow="md"
            >
              Only a few left
            </Badge>
          )}
        </Flex>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <Flex
            position="absolute"
            inset="0"
            bg="blackAlpha.600"
            align="center"
            justify="center"
            backdropFilter="blur(2px)"
          >
            <Badge
              bg="white"
              color="gray.800"
              fontSize="sm"
              fontWeight="700"
              px={4}
              py={2}
              borderRadius="full"
            >
              Out of Stock
            </Badge>
          </Flex>
        )}

        {/* Quick-add hover indicator */}
        <Flex
          position="absolute"
          bottom={3}
          right={3}
          w={9}
          h={9}
          bg="brand.500"
          borderRadius="full"
          align="center"
          justify="center"
          color="white"
          opacity={0}
          transform="translateY(8px)"
          _groupHover={{ opacity: 1, transform: 'translateY(0)' }}
          transition="all 0.3s ease"
          boxShadow="0 4px 14px rgba(108,92,231,0.4)"
        >
          <Icon as={FiShoppingCart} boxSize={4} />
        </Flex>
      </Box>

      {/* Content */}
      <VStack align="stretch" p={4} spacing={2}>
        {/* Category */}
        {product.category && (
          <Text
            fontSize="xs"
            fontWeight="600"
            color="brand.500"
            textTransform="uppercase"
            letterSpacing="0.06em"
          >
            {product.category}
          </Text>
        )}

        {/* Title */}
        <Text
          fontWeight="600"
          fontSize="sm"
          noOfLines={2}
          color={textColor}
          lineHeight="1.4"
          _groupHover={{ color: 'brand.500' }}
          transition="color 0.2s"
        >
          {product.title}
        </Text>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <Flex gap={1} flexWrap="wrap" mt={1}>
            {product.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} colorScheme="brand" variant="subtle" fontSize="5xs" borderRadius="full" px={1.5} py={0.5}>
                {tag}
              </Badge>
            ))}
            {product.tags.length > 3 && (
              <Badge colorScheme="gray" variant="subtle" fontSize="5xs" borderRadius="full" px={1.5} py={0.5}>
                +{product.tags.length - 3}
              </Badge>
            )}
          </Flex>
        )}

        {/* Price */}
        <Flex align="center" gap={2} mt={1}>
          <Text fontWeight="800" fontSize="lg" color={priceColor}>
            ₹{displayPrice.toLocaleString('en-IN')}
          </Text>
          {originalPrice && (
            <Text fontSize="sm" color={originalPriceColor} textDecoration="line-through">
              ₹{originalPrice.toLocaleString('en-IN')}
            </Text>
          )}
        </Flex>
      </VStack>
    </MotionBox>
  );
};

export default ProductCard;