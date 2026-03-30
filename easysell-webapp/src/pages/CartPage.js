import React, { useState } from "react";
import {
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Image,
  IconButton,
  Divider,
  SimpleGrid,
  useToast,
  Flex,
  Radio,
  RadioGroup,
  Stack,
  Badge,
  Icon,
  useColorModeValue,
  Center,
} from "@chakra-ui/react";
import { FiTrash2, FiMinus, FiPlus, FiShoppingCart, FiArrowRight, FiShield } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import SpinnerComponent from "../components/Spinner";

const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

const CartPage = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartSubtotal,
    cartTotalTax,
    cartGrandTotal,
    itemCount,
    loadingProductData,
  } = useCart();

  const navigate = useNavigate();
  const toast = useToast();
  const [billingMode, setBillingMode] = useState("withBill");

  // Theme
  const pageBg = useColorModeValue('#F8F9FC', '#09090B');
  const cardBg = useColorModeValue('white', '#111116');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const hoverBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const radioBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const priceColor = useColorModeValue('brand.600', 'brand.300');
  const emptyIconBg = useColorModeValue('gray.100', 'whiteAlpha.100');
  const imageBg = useColorModeValue('gray.50', '#0D0D12');

  const displayTax = billingMode === "withBill" ? cartTotalTax : 0;
  const displayGrandTotal = billingMode === "withBill" ? cartGrandTotal : cartSubtotal;

  const handleRemove = (cartId, title) => {
    removeFromCart(cartId);
    toast({
      title: "Item removed",
      description: `${title} removed from cart.`,
      status: "info",
      duration: 2000,
      isClosable: true,
      position: "top",
    });
  };

  const handleCheckout = () => navigate("/checkout");

  if (loadingProductData) return <SpinnerComponent />;

  if (cartItems.length === 0) {
    return (
      <Box bg={pageBg} minH="80vh">
        <Container maxW="container.md" py={20} centerContent>
          <VStack spacing={6} p={10} bg={cardBg} borderRadius="20px" borderWidth="1px" borderColor={borderColor} boxShadow="card">
            <Flex w={20} h={20} bg={emptyIconBg} borderRadius="full" align="center" justify="center">
              <Icon as={FiShoppingCart} boxSize={10} color="gray.400" />
            </Flex>
            <Heading size="lg" color={textColor}>Your Cart is Empty</Heading>
            <Text color={mutedColor}>Looks like you haven't added anything yet.</Text>
            <Button colorScheme="brand" size="lg" as={RouterLink} to="/" px={8} borderRadius="full">
              Start Shopping
            </Button>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={pageBg} minH="100vh" py={{ base: 6, md: 10 }}>
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center" mb={8}>
          <HStack spacing={3} align="baseline">
            <Heading fontSize={{ base: 'xl', md: '2xl' }} color={textColor} fontWeight="800" letterSpacing="-0.02em">
              Shopping Cart
            </Heading>
            <Text fontSize="md" color={mutedColor} fontWeight="500">({itemCount} items)</Text>
          </HStack>
          <Button variant="ghost" color={mutedColor} size="sm" onClick={clearCart} _hover={{ color: 'red.500' }}>
            Clear All
          </Button>
        </Flex>

        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={{ base: 6, lg: 8 }}>
          {/* ====== LEFT: Cart Items ====== */}
          <Box gridColumn={{ lg: "span 2" }}>
            <VStack spacing={3} align="stretch">
              {cartItems.map((item) => {
                const priceDetails = item.priceDetails || {};
                const productData = item.productData || {};
                const lineTotal = billingMode === "withBill" ? priceDetails.lineItemTotal : priceDetails.lineItemSubtotal;
                const totalUnitDiscount = (priceDetails.discountAmountUnit || 0) + (priceDetails.bulkDiscountAmountUnit || 0);

                return (
                  <Box
                    key={item.cartId}
                    p={{ base: 4, md: 5 }}
                    borderWidth="1px"
                    borderRadius="16px"
                    bg={cardBg}
                    borderColor={borderColor}
                    boxShadow="card"
                    transition="all 0.2s"
                    _hover={{ borderColor: 'brand.200' }}
                  >
                    <Flex direction={{ base: "column", sm: "row" }} gap={4}>
                      {/* Image */}
                      <Box borderRadius="12px" overflow="hidden" w={{ base: "full", sm: "100px" }} h={{ base: "200px", sm: "100px" }} bg={imageBg} flexShrink={0}>
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          w="100%"
                          h="100%"
                          objectFit="contain"
                          fallbackSrc="https://via.placeholder.com/100"
                        />
                      </Box>

                      {/* Info */}
                      <Box flex="1" w="full">
                        <Flex justify="space-between" align="start" gap={3}>
                          <Box flex="1">
                            <Heading size="sm" noOfLines={2} color={textColor} mb={1} fontWeight="700">
                              {item.title}
                            </Heading>
                            <Text fontSize="xs" color={mutedColor}>
                              {item.variant ? Object.values(item.variant.options).join(" / ") : "Standard"}
                            </Text>

                            {/* Compact price breakdown */}
                            <VStack align="start" spacing={0} mt={2} fontSize="xs" color={mutedColor}>
                              <HStack spacing={2}>
                                <Text>Base: {formatCurrency(priceDetails.baseUnitPrice)}</Text>
                                {totalUnitDiscount > 0 && (
                                  <Text color="green.500">-{formatCurrency(totalUnitDiscount)}</Text>
                                )}
                                {priceDetails.variantModifierUnit !== 0 && (
                                  <Text>Variant: {priceDetails.variantModifierUnit > 0 ? "+" : ""}{formatCurrency(priceDetails.variantModifierUnit)}</Text>
                                )}
                              </HStack>
                              <Text>
                                Unit: {formatCurrency(priceDetails.effectiveUnitPricePreTax)} + ₹{priceDetails.taxAmountUnit?.toFixed(2)} tax
                              </Text>
                            </VStack>
                          </Box>

                          {/* Line Total */}
                          <VStack align="end" spacing={0}>
                            <Text fontWeight="800" fontSize="lg" color={priceColor}>
                              {formatCurrency(lineTotal)}
                            </Text>
                            <Text fontSize="xs" color={mutedColor}>×{item.quantity}</Text>
                          </VStack>
                        </Flex>

                        {/* Controls */}
                        <Flex mt={3} justify="space-between" align="center">
                          <HStack
                            spacing={0}
                            borderWidth="1px"
                            borderColor={borderColor}
                            borderRadius="10px"
                            overflow="hidden"
                          >
                            <IconButton
                              icon={<FiMinus size="14px" />}
                              size="sm"
                              aria-label="Decrease"
                              variant="ghost"
                              color={textColor}
                              _hover={{ bg: hoverBg }}
                              onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                              isDisabled={item.quantity <= 1 && item.productData?.minOrderQty <= 1}
                              h="32px"
                              w="32px"
                            />
                            <Text fontWeight="700" w="36px" textAlign="center" fontSize="sm" color={textColor}>
                              {item.quantity}
                            </Text>
                            <IconButton
                              icon={<FiPlus size="14px" />}
                              size="sm"
                              aria-label="Increase"
                              variant="ghost"
                              color={textColor}
                              _hover={{ bg: hoverBg }}
                              onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                              h="32px"
                              w="32px"
                            />
                          </HStack>
                          <IconButton
                            icon={<FiTrash2 size="15px" />}
                            variant="ghost"
                            color="red.400"
                            size="sm"
                            aria-label="Remove"
                            _hover={{ bg: 'red.50', color: 'red.600' }}
                            onClick={() => handleRemove(item.cartId, item.title)}
                          />
                        </Flex>
                      </Box>
                    </Flex>
                  </Box>
                );
              })}
            </VStack>
          </Box>

          {/* ====== RIGHT: Order Summary ====== */}
          <Box>
            <VStack
              p={6}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="20px"
              bg={cardBg}
              spacing={5}
              align="stretch"
              position="sticky"
              top="80px"
              boxShadow="card"
            >
              <Heading size="sm" color={textColor} fontWeight="700">Order Summary</Heading>
              <Divider borderColor={borderColor} />

              {/* Billing Toggle */}
              <Box>
                <Text fontSize="xs" fontWeight="700" mb={2.5} color={mutedColor} textTransform="uppercase" letterSpacing="0.06em">
                  Billing Preference
                </Text>
                <RadioGroup onChange={setBillingMode} value={billingMode}>
                  <Stack direction="column" spacing={2}>
                    <Radio
                      value="withBill"
                      colorScheme="brand"
                      size="sm"
                    >
                      <HStack spacing={2}>
                        <Text fontSize="sm" color={textColor} fontWeight="500">With Bill</Text>
                        <Badge colorScheme="green" fontSize="0.6em" borderRadius="full">Tax Incl.</Badge>
                      </HStack>
                    </Radio>
                    <Radio
                      value="withoutBill"
                      colorScheme="brand"
                      size="sm"
                    >
                      <HStack spacing={2}>
                        <Text fontSize="sm" color={textColor} fontWeight="500">Without Bill</Text>
                        <Badge colorScheme="purple" fontSize="0.6em" borderRadius="full">Tax Excl.</Badge>
                      </HStack>
                    </Radio>
                  </Stack>
                </RadioGroup>
              </Box>

              <Divider borderColor={borderColor} />

              {/* Totals */}
              <VStack spacing={2.5} align="stretch">
                <Flex justify="space-between">
                  <Text fontSize="sm" color={mutedColor}>Subtotal</Text>
                  <Text fontSize="sm" fontWeight="600" color={textColor}>{formatCurrency(cartSubtotal)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <HStack spacing={1}>
                    <Text fontSize="sm" color={billingMode === "withBill" ? mutedColor : "gray.400"}>Tax</Text>
                    {billingMode === "withoutBill" && (
                      <Badge colorScheme="purple" variant="outline" fontSize="0.5em" borderRadius="full">Excl.</Badge>
                    )}
                  </HStack>
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color={billingMode === "withBill" ? textColor : "gray.400"}
                    textDecoration={billingMode === "withoutBill" ? "line-through" : "none"}
                  >
                    {formatCurrency(cartTotalTax)}
                  </Text>
                </Flex>

                <Divider borderColor={borderColor} />

                <Flex justify="space-between" align="center" pt={1}>
                  <Text fontSize="md" fontWeight="700" color={textColor}>Total</Text>
                  <Text fontSize="xl" fontWeight="800" color={priceColor}>
                    {formatCurrency(displayGrandTotal)}
                  </Text>
                </Flex>
              </VStack>

              <Button
                colorScheme="brand"
                size="lg"
                w="full"
                borderRadius="12px"
                rightIcon={<FiArrowRight />}
                onClick={handleCheckout}
                fontWeight="700"
                h="52px"
                boxShadow="0 4px 14px rgba(108,92,231,0.3)"
                _hover={{ transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(108,92,231,0.4)' }}
              >
                Checkout · {formatCurrency(displayGrandTotal)}
              </Button>

              {/* Trust */}
              <HStack justify="center" spacing={2} pt={1}>
                <Icon as={FiShield} color="green.400" boxSize={3.5} />
                <Text fontSize="xs" color={mutedColor}>Secure Checkout · Easy Returns</Text>
              </HStack>
            </VStack>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default CartPage;