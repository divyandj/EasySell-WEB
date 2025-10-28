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
  Heading // IMPORT ADDED
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiShoppingCart } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { getProxiedUrl } from '../config';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const toast = useToast();

  const handleAddToCart = () => {
    if (product.hasVariants || !product.inStock) return;
    addToCart(product, 1);
    toast({
      title: `${product.title} added to cart.`,
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top',
    });
  };

  const isOutOfStock = !product.hasVariants && !product.inStock;
  const price = product.discountedPrice > 0 ? product.discountedPrice : product.price;

  const firstImage = product.media?.find(m => m.type === 'image');
  const imageUrl = getProxiedUrl(firstImage?.url);

  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="lg"
      overflow="hidden"
      bg="white"
      transition="all 0.3s cubic-bezier(.08,.52,.52,1)"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
    >
      <RouterLink to={`/product/${product.id}`}>
        <AspectRatio ratio={1}>
          <Image
            src={imageUrl}
            alt={product.title}
            objectFit="cover"
            fallbackSrc="https://via.placeholder.com/300"
          />
        </AspectRatio>
      </RouterLink>
      <VStack p="5" align="stretch" spacing={3}>
        <Flex justifyContent="space-between" alignItems="center">
            <Text fontSize="xs" color="gray.500" textTransform="uppercase">{product.tags?.[0] || 'New'}</Text>
            {isOutOfStock && (
              <Badge borderRadius="full" px="2" colorScheme="red">
                Out of Stock
              </Badge>
            )}
            {product.hasVariants && !isOutOfStock && (
              <Badge borderRadius="full" px="2" colorScheme="purple">
                Options
              </Badge>
            )}
        </Flex>

        <Heading as="h3" size="sm" fontWeight="semibold" lineHeight="tight" noOfLines={2}>
          {product.title}
        </Heading>
        
        {price > 0 && (
          <Flex>
            <Text fontSize="lg" fontWeight="bold" color="teal.600">
              ₹{price.toFixed(2)}
            </Text>
            {product.discountedPrice > 0 && (
              <Text as="s" ml="2" fontSize="sm" color="gray.500" alignSelf="flex-end">
                ₹{product.price.toFixed(2)}
              </Text>
            )}
          </Flex>
        )}
      </VStack>
      <Box px="5" pb="5">
        <Button
          w="full"
          colorScheme="teal"
          variant={product.hasVariants ? "outline" : "solid"}
          leftIcon={<FiShoppingCart />}
          onClick={(e) => {
            if (!product.hasVariants) e.preventDefault();
            handleAddToCart();
          }}
          as={product.hasVariants ? RouterLink : Button}
          to={`/product/${product.id}`}
          isDisabled={isOutOfStock}
        >
          {product.hasVariants ? "Select Options" : "Add to Cart"}
        </Button>
      </Box>
    </Box>
  );
};

export default ProductCard;