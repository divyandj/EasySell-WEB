import React from 'react';
import { useCart } from '../context/CartContext';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Image,
  CloseButton,
  Center,
  Divider,
  Spinner,
  Flex,
  Tooltip, // Removed Tooltip
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge, // Added Badge for discount display
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { getProxiedUrl } from '../config';
import { FiShoppingCart, FiTrash2 } from 'react-icons/fi';

// Helper to format currency
const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

const CartPage = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    cartTotalTax,
    cartGrandTotal,
    itemCount,
    loadingProductData
  } = useCart();
  const navigate = useNavigate();

  return (
    <Container maxW="container.lg" py={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Your Cart</Heading>
        {itemCount > 0 && <Text fontSize="lg" color="gray.600">{itemCount} items</Text>}
      </Flex>

      {loadingProductData && (
        <Center my={10}>
          <Spinner size="lg" color="teal.500" />
          <Text ml={3} color="gray.500">Updating cart prices...</Text>
        </Center>
      )}

      {cartItems.length === 0 && !loadingProductData ? (
        <Center flexDirection="column" h="50vh" bg="gray.50" borderRadius="md" p={10} borderWidth="1px" borderColor="gray.200">
          <Icon as={FiShoppingCart} boxSize={16} color="gray.400" mb={4} />
          <Text fontSize="xl" color="gray.600">Your shopping cart is empty.</Text>
          <Button mt={6} colorScheme="teal" onClick={() => navigate('/')}>
            Continue Shopping
          </Button>
        </Center>
      ) : (
        <VStack spacing={5} align="stretch">
          {/* Cart Item Headers (Desktop) */}
          <HStack px={4} py={2} borderBottomWidth="1px" borderColor="gray.200" display={{ base: 'none', md: 'flex' }} spacing={4}>
            <Text flex={3} fontWeight="semibold" color="gray.600">Product</Text>
            <Text flex={1.5} fontWeight="semibold" color="gray.600" textAlign="center">Quantity</Text>
            <Text flex={1.5} fontWeight="semibold" color="gray.600" textAlign="right">Total</Text>
            <Box w="40px"></Box> {/* Spacer */}
          </HStack>

          {/* Cart Items List */}
          {cartItems.map(item => {
            const priceDetails = item.priceDetails || {};
            const productData = item.productData || {};
            const minQty = productData.minOrderQty || 1;
            const variantOptions = item.variant?.options ? Object.entries(item.variant.options).map(([key, value]) => `${key}: ${value}`).join(', ') : '';

            // Calculate total discount per unit for display
            const totalUnitDiscount = (priceDetails.discountAmountUnit || 0) + (priceDetails.bulkDiscountAmountUnit || 0);

            return (
              <Flex
                key={item.cartId}
                p={4}
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="md"
                align={{ base: 'flex-start', md: 'center' }}
                direction={{ base: 'column', md: 'row' }}
                w="full"
                gap={4}
              >
                {/* Product Info */}
                <HStack spacing={4} flex={{ base: '1', md: '3' }} w="full" align="flex-start">
                  <Image
                    src={getProxiedUrl(item.imageUrl)}
                    alt={item.title}
                    boxSize={{ base: '80px', md: '100px' }}
                    objectFit="cover"
                    borderRadius="md"
                    fallbackSrc="https://via.placeholder.com/100"
                  />
                  <VStack align="start" spacing={1} flex="1">
                    <Text fontWeight="semibold" fontSize="md" noOfLines={2}>{item.title}</Text>
                    {variantOptions && (
                      <Text fontSize="sm" color="gray.500">
                        {variantOptions}
                      </Text>
                    )}

                    {/* --- VISIBLE PRICE BREAKDOWN PER UNIT --- */}
                    <VStack align="start" spacing={0} mt={2} fontSize="xs" color="gray.600">
                       <HStack>
                           <Text minW="70px">Base Price:</Text>
                           <Text as={totalUnitDiscount > 0 ? 's' : 'span'} color={totalUnitDiscount > 0 ? 'gray.400' : 'gray.600'}>
                               {formatCurrency(priceDetails.baseUnitPrice)}
                           </Text>
                       </HStack>
                       {totalUnitDiscount > 0 && (
                           <HStack color="green.600">
                               <Text minW="70px">Discount:</Text>
                               <Text>-{formatCurrency(totalUnitDiscount)}</Text>
                           </HStack>
                       )}
                       {priceDetails.variantModifierUnit !== 0 && (
                           <HStack>
                               <Text minW="70px">Variant:</Text>
                               <Text>{priceDetails.variantModifierUnit > 0 ? '+' : ''}{formatCurrency(priceDetails.variantModifierUnit)}</Text>
                           </HStack>
                       )}
                       <HStack borderTopWidth="1px" borderColor="gray.300" pt={1} mt={1} w="full">
                           <Text minW="70px" fontWeight="medium">Subtotal:</Text>
                           <Text fontWeight="medium">{formatCurrency(priceDetails.effectiveUnitPricePreTax)}</Text>
                       </HStack>
                       <HStack>
                           <Text minW="70px">Tax ({productData.taxRate || 0}%):</Text>
                           <Text>+{formatCurrency(priceDetails.taxAmountUnit)}</Text>
                       </HStack>
                       <HStack borderTopWidth="1px" borderColor="gray.300" pt={1} mt={1} w="full">
                           <Text minW="70px" fontWeight="bold" color="gray.800">Total/unit:</Text>
                           <Text fontWeight="bold" color="gray.800">{formatCurrency(priceDetails.finalUnitPriceWithTax)} {productData.priceUnit || ''}</Text>
                       </HStack>
                    </VStack>
                    {/* --- END VISIBLE PRICE BREAKDOWN --- */}

                  </VStack>
                </HStack>

                {/* Quantity Selector */}
                <Flex flex={{ base: '1', md: '1.5' }} justify={{ base: 'flex-start', md: 'center' }} w={{ base: '150px', md: 'auto' }} pt={{ base: 2, md: 0 }}>
                  <NumberInput
                    size="sm"
                    maxW="100px"
                    value={item.quantity}
                    min={minQty}
                    onChange={(valueAsString, valueAsNumber) => {
                        updateQuantity(item.cartId, isNaN(valueAsNumber) ? minQty : valueAsNumber);
                    }}
                    allowMouseWheel
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </Flex>

                {/* Line Item Total */}
                <VStack align={{ base: 'flex-start', md: 'flex-end'}} spacing={0} flex={{ base: '1', md: '1.5' }} w={{ base: 'full', md: 'auto' }} mt={{base:2, md:0}}>
                    <Text fontWeight="semibold" fontSize="md" textAlign="right">
                        {formatCurrency(priceDetails.lineItemTotal)}
                    </Text>
                    <Text fontSize="xs" color="gray.500" textAlign="right">
                        (Subtotal: {formatCurrency(priceDetails.lineItemSubtotal)}, Tax: {formatCurrency(priceDetails.lineItemTax)})
                    </Text>
                </VStack>

                {/* Remove Button */}
                <Center w="40px" pl={{ md: 2 }} alignSelf={{ base: 'flex-end', md: 'center' }}>
                   <Tooltip label="Remove Item" aria-label="Remove Item Tooltip">
                     <CloseButton as={Button} variant="ghost" colorScheme="red" size="sm" onClick={() => removeFromCart(item.cartId)} aria-label={`Remove ${item.title} from cart`} icon={<Icon as={FiTrash2} boxSize={4}/>} />
                   </Tooltip>
                </Center>
              </Flex>
            )
          })}

          {/* Totals Section */}
          <VStack pt={8} spacing={3} align="stretch" w={{ base: 'full', md: '50%' }} ml="auto" bg="gray.50" p={5} borderRadius="lg" borderWidth="1px" borderColor="gray.200">
             <HStack justifyContent="space-between">
                 <Text color="gray.600">Subtotal (excl. tax)</Text>
                 <Text fontWeight="medium">{formatCurrency(cartSubtotal)}</Text>
             </HStack>
             <HStack justifyContent="space-between">
                 <Text color="gray.600">Taxes</Text>
                 <Text fontWeight="medium">{formatCurrency(cartTotalTax)}</Text>
             </HStack>
             {/* Add Shipping estimate here if needed */}
             <Divider my={2} />
             <HStack justifyContent="space-between">
                 <Text fontWeight="bold" fontSize="xl">Grand Total</Text>
                 <Text fontWeight="bold" fontSize="xl" color="teal.600">{formatCurrency(cartGrandTotal)}</Text>
             </HStack>
            <Button
                mt={4}
                colorScheme="teal"
                size="lg"
                onClick={() => navigate('/checkout')}
                isDisabled={itemCount === 0 || loadingProductData}
                isLoading={loadingProductData}
                w="full"
            >
              Proceed to Checkout
            </Button>
          </VStack>
        </VStack>
      )}
    </Container>
  );
};

export default CartPage;