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
  useColorModeValue
} from "@chakra-ui/react";
import { FiTrash2, FiMinus, FiPlus, FiShoppingCart, FiArrowRight } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";

import SpinnerComponent from "../components/Spinner";

// Helper to format currency
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

  // --- NEW STATE: Billing Mode ---
  // Default to 'withBill' (Tax included)
  const [billingMode, setBillingMode] = useState("withBill");

  // --- THEME COLORS ---
  const bgCard = useColorModeValue('white', 'whiteAlpha.50');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const highlightColor = useColorModeValue('teal.600', 'brand.200');
  const hoverBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const radioBg = useColorModeValue('gray.50', 'whiteAlpha.100'); // For radio buttons

  const grandTotalGradient = useColorModeValue(
    "linear(to-r, teal.600, blue.600)",
    "linear(to-r, brand.200, accent.200)"
  );

  // --- Dynamic Calculation Logic ---
  // If 'withoutBill', Tax is 0 and Grand Total equals Subtotal.
  const displayTax = billingMode === "withBill" ? cartTotalTax : 0;
  const displayGrandTotal =
    billingMode === "withBill" ? cartGrandTotal : cartSubtotal;

  const handleRemove = (cartId, title) => {
    removeFromCart(cartId);
    toast({
      title: "Item removed",
      description: `${title} has been removed from your cart.`,
      status: "info",
      duration: 2000,
      isClosable: true,
      position: "top",
    });
  };

  const handleCheckout = () => {
    // We can pass the billing mode state to the checkout page if we wanted to persist it,
    // but typically the Checkout page has its own selector.
    // For now, we just navigate.
    navigate("/checkout");
  };

  if (loadingProductData) {
    return <SpinnerComponent />;
  }

  if (cartItems.length === 0) {
    return (
      <Container maxW="container.lg" py={20} centerContent>
        <VStack spacing={6} p={10} bg={bgCard} borderRadius="2xl" shadow="xl" backdropFilter="blur(10px)">
          <Icon as={FiShoppingCart} boxSize={16} color={mutedColor} />
          <Heading size="lg" color={textColor}>
            Your Cart is Empty
          </Heading>
          <Text color={mutedColor}>
            Looks like you haven't added anything yet.
          </Text>
          <Button colorScheme="brand" size="lg" as={RouterLink} to="/" px={8} borderRadius="full">
            Start Shopping
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={12}>
      <Heading mb={8} fontSize="3xl" color={textColor}>Shopping Cart <Text as="span" fontSize="xl" color={mutedColor} fontWeight="normal">({itemCount} items)</Text></Heading>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={10}>
        {/* --- LEFT COLUMN: Cart Items List --- */}
        <Box gridColumn={{ lg: "span 2" }}>
          <VStack spacing={4} align="stretch">
            {cartItems.map((item) => {
              // Determine line total to display based on billing mode for individual items
              const priceDetails = item.priceDetails || {}; // Safety check
              const productData = item.productData || {};

              const lineTotal =
                billingMode === "withBill"
                  ? priceDetails.lineItemTotal
                  : priceDetails.lineItemSubtotal;

              const totalUnitDiscount =
                (priceDetails.discountAmountUnit || 0) +
                (priceDetails.bulkDiscountAmountUnit || 0);

              return (
                <Box
                  key={item.cartId}
                  p={6}
                  borderWidth="1px"
                  borderRadius="2xl"
                  overflow="hidden"
                  bg={bgCard}
                  borderColor={borderColor}
                  shadow="lg"
                  backdropFilter="blur(10px)"
                  transition="all 0.2s"
                  _hover={{ borderColor: 'brand.400', shadow: 'xl' }}
                >
                  <Flex
                    direction={{ base: "column", sm: "row" }}
                    align="center"
                    gap={6}
                  >
                    {/* Product Image */}
                    <Box borderRadius="xl" overflow="hidden" boxSize="120px" bg="white">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        boxSize="100%"
                        objectFit="contain"
                        fallbackSrc="https://via.placeholder.com/100"
                      />
                    </Box>

                    {/* Product Info */}
                    <Box flex="1" w="full">
                      <Flex justify="space-between" align="start">
                        <Box>
                          <Heading
                            size="md"
                            mb={2}
                            noOfLines={2}
                            title={item.title}
                            color={textColor}
                          >
                            {item.title}
                          </Heading>
                          <Text fontSize="sm" color={mutedColor} mb={2}>
                            {item.variant
                              ? Object.values(item.variant.options).join(" / ")
                              : "Standard"}
                          </Text>

                          {/* --- VISIBLE PRICE BREAKDOWN PER UNIT --- */}
                          <VStack
                            align="start"
                            spacing={0}
                            mt={3}
                            fontSize="xs"
                            color={mutedColor}
                          >
                            <HStack>
                              <Text minW="70px">Base Price:</Text>
                              <Text
                                as={totalUnitDiscount > 0 ? "s" : "span"}
                                color={
                                  totalUnitDiscount > 0
                                    ? "gray.500"
                                    : "gray.300"
                                }
                              >
                                {formatCurrency(priceDetails.baseUnitPrice)}
                              </Text>
                            </HStack>
                            {totalUnitDiscount > 0 && (
                              <HStack color="green.300">
                                <Text minW="70px">Discount:</Text>
                                <Text>
                                  -{formatCurrency(totalUnitDiscount)}
                                </Text>
                              </HStack>
                            )}
                            {priceDetails.variantModifierUnit !== 0 && (
                              <HStack>
                                <Text minW="70px">Variant:</Text>
                                <Text>
                                  {priceDetails.variantModifierUnit > 0
                                    ? "+"
                                    : ""}
                                  {formatCurrency(
                                    priceDetails.variantModifierUnit
                                  )}
                                </Text>
                              </HStack>
                            )}
                            <HStack
                              borderTopWidth="1px"
                              borderColor={borderColor}
                              pt={1}
                              mt={1}
                              w="full"
                            >
                              <Text minW="70px" fontWeight="medium">
                                Subtotal:
                              </Text>
                              <Text fontWeight="medium">
                                {formatCurrency(
                                  priceDetails.effectiveUnitPricePreTax
                                )}
                              </Text>
                            </HStack>
                            <HStack>
                              <Text minW="70px">
                                Tax ({productData.taxRate || 0}%):
                              </Text>
                              <Text>
                                +{formatCurrency(priceDetails.taxAmountUnit)}
                              </Text>
                            </HStack>
                            <HStack
                              borderTopWidth="1px"
                              borderColor="whiteAlpha.200"
                              pt={1}
                              mt={1}
                              w="full"
                            >
                              <Text
                                minW="70px"
                                fontWeight="bold"
                                color={textColor}
                              >
                                Total/unit:
                              </Text>
                              <Text fontWeight="bold" color={textColor}>
                                {formatCurrency(
                                  priceDetails.finalUnitPriceWithTax
                                )}{" "}
                                {productData.priceUnit || ""}
                              </Text>
                            </HStack>
                          </VStack>
                        </Box>

                        {/* Line Total Display (Dynamic based on billing mode) */}
                        <Text fontWeight="bold" fontSize="lg" color={highlightColor}>
                          {formatCurrency(lineTotal)}
                        </Text>
                      </Flex>

                      {/* Controls: Quantity & Remove */}
                      <Flex mt={5} justify="space-between" align="center">
                        <HStack spacing={0} borderWidth="1px" borderColor={borderColor} borderRadius="xl" overflow="hidden">
                          <IconButton
                            icon={<FiMinus />}
                            size="sm"
                            aria-label="Decrease quantity"
                            variant="ghost"
                            color={textColor}
                            _hover={{ bg: hoverBg }}
                            onClick={() =>
                              updateQuantity(item.cartId, item.quantity - 1)
                            }
                            isDisabled={
                              item.quantity <= 1 &&
                              item.productData?.minOrderQty <= 1
                            }
                          />
                          <Text fontWeight="bold" w="40px" textAlign="center" color={textColor}>
                            {item.quantity}
                          </Text>
                          <IconButton
                            icon={<FiPlus />}
                            size="sm"
                            aria-label="Increase quantity"
                            variant="ghost"
                            color={textColor}
                            _hover={{ bg: hoverBg }}
                            onClick={() =>
                              updateQuantity(item.cartId, item.quantity + 1)
                            }
                          />
                        </HStack>
                        <Button
                          leftIcon={<FiTrash2 />}
                          variant="ghost"
                          colorScheme="red"
                          size="sm"
                          _hover={{ bg: 'red.900', color: 'red.200' }}
                          onClick={() => handleRemove(item.cartId, item.title)}
                        >
                          Remove
                        </Button>
                      </Flex>
                    </Box>
                  </Flex>
                </Box>
              );
            })}
          </VStack>

          <Box mt={6} textAlign="right">
            <Button variant="outline" colorScheme="whiteAlpha" color="gray.300" _hover={{ bg: 'whiteAlpha.100' }} onClick={clearCart}>
              Clear Cart
            </Button>
          </Box>
        </Box>

        {/* --- RIGHT COLUMN: Order Summary --- */}
        <Box>
          <VStack
            p={8}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="2xl"
            bg={bgCard}
            spacing={5}
            align="stretch"
            position="sticky"
            top="120px" // Sticky positioning for desktop
            shadow="xl"
            backdropFilter="blur(16px)"
          >
            <Heading size="md" color={textColor}>Order Summary</Heading>

            <Divider borderColor={borderColor} />

            {/* --- NEW: Billing Preference Toggle --- */}
            <Box py={2}>
              <Text fontSize="sm" fontWeight="semibold" mb={3} color={mutedColor}>
                Billing Preference
              </Text>
              <RadioGroup onChange={setBillingMode} value={billingMode}>
                <Stack direction="column" spacing={3}>
                  <Radio
                    value="withBill"
                    colorScheme="brand"
                    bg={radioBg}
                    p={3}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={
                      billingMode === "withBill" ? "brand.400" : borderColor
                    }
                    _hover={{ borderColor: "brand.300", bg: hoverBg }}
                  >
                    <HStack justify="space-between" w="100%">
                      <Text fontSize="sm" color={textColor}>With Bill</Text>
                      <Badge colorScheme="green" fontSize="0.6em">
                        Tax Incl.
                      </Badge>
                    </HStack>
                  </Radio>
                  <Radio
                    value="withoutBill"
                    colorScheme="brand"
                    bg={radioBg}
                    p={3}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={
                      billingMode === "withoutBill" ? "brand.400" : borderColor
                    }
                    _hover={{ borderColor: "brand.300", bg: hoverBg }}
                  >
                    <HStack justify="space-between" w="100%">
                      <Text fontSize="sm" color={textColor}>Without Bill</Text>
                      <Badge colorScheme="purple" fontSize="0.6em">
                        Tax Excl.
                      </Badge>
                    </HStack>
                  </Radio>
                </Stack>
              </RadioGroup>
            </Box>

            <Divider borderColor={borderColor} />

            {/* Totals Section */}
            <VStack spacing={3} align="stretch">
              <Flex justify="space-between">
                <Text color={mutedColor}>Subtotal</Text>
                <Text fontWeight="medium" color={textColor}>{formatCurrency(cartSubtotal)}</Text>
              </Flex>

              <Flex justify="space-between">
                <Text
                  color={billingMode === "withBill" ? mutedColor : "gray.600"}
                >
                  Tax{" "}
                  {billingMode === "withoutBill" && (
                    <Badge ml={1} colorScheme="purple" variant="outline">Excluded</Badge>
                  )}
                </Text>
                <Text
                  fontWeight="medium"
                  color={billingMode === "withBill" ? textColor : "gray.600"}
                  textDecoration={
                    billingMode === "withoutBill" ? "line-through" : "none"
                  }
                >
                  {formatCurrency(cartTotalTax)}
                </Text>
              </Flex>

              <Divider my={2} borderColor={borderColor} />

              <Flex justify="space-between" align="center">
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  Grand Total
                </Text>
                <Text fontSize="2xl" fontWeight="bold" bgGradient={grandTotalGradient} bgClip="text">
                  {formatCurrency(displayGrandTotal)}
                </Text>
              </Flex>
            </VStack>

            <Button
              colorScheme="brand"
              size="lg"
              w="full"
              mt={4}
              rightIcon={<FiArrowRight />}
              onClick={handleCheckout}
              shadow="lg"
              _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
            >
              Proceed to Checkout
            </Button>

            <Text fontSize="xs" color="gray.500" textAlign="center">
              Shipping & taxes calculated at checkout.
            </Text>
          </VStack>
        </Box>
      </SimpleGrid>
    </Container>
  );
};

export default CartPage;