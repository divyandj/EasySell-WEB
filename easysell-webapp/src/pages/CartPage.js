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
  Spacer,
  Tooltip,
  Radio,
  RadioGroup,
  Stack,
  Badge,
} from "@chakra-ui/react";
import { FiTrash2, FiMinus, FiPlus, FiArrowRight } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { getProxiedUrl } from "../config";
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
        <VStack spacing={6}>
          <Heading size="lg" color="gray.600">
            Your Cart is Empty
          </Heading>
          <Text color="gray.500">
            Looks like you haven't added anything yet.
          </Text>
          <Button colorScheme="teal" size="lg" as={RouterLink} to="/">
            Start Shopping
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={10}>
      <Heading mb={6}>Shopping Cart ({itemCount} items)</Heading>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={10}>
        {/* --- LEFT COLUMN: Cart Items List --- */}
        <Box gridColumn={{ lg: "span 2" }}>
          <VStack spacing={4} align="stretch">
            {cartItems.map((item) => {
              // Determine line total to display based on billing mode for individual items
              // Note: Usually cart items show unit price, but if you show line totals:
              const lineTotal =
                billingMode === "withBill"
                  ? item.priceDetails.lineItemTotal
                  : item.priceDetails.lineItemSubtotal;

              // Helper variables for the commented out section if enabled later
              const priceDetails = item.priceDetails;
              const productData = item.productData;
              const totalUnitDiscount =
                (priceDetails.discountAmountUnit || 0) +
                (priceDetails.bulkDiscountAmountUnit || 0);

              return (
                <Box
                  key={item.cartId}
                  p={4}
                  borderWidth="1px"
                  borderRadius="lg"
                  overflow="hidden"
                  bg="white"
                  shadow="sm"
                >
                  <Flex
                    direction={{ base: "column", sm: "row" }}
                    align="center"
                    gap={4}
                  >
                    {/* Product Image */}
                    <Image
                      src={getProxiedUrl(item.imageUrl)}
                      alt={item.title}
                      boxSize="100px"
                      objectFit="cover"
                      borderRadius="md"
                      fallbackSrc="https://via.placeholder.com/100"
                    />

                    {/* Product Info */}
                    <Box flex="1" w="full">
                      <Flex justify="space-between" align="start">
                        <Box>
                          <Heading
                            size="sm"
                            mb={1}
                            noOfLines={2}
                            title={item.title}
                          >
                            {item.title}
                          </Heading>
                          <Text fontSize="sm" color="gray.500">
                            {item.variant
                              ? Object.values(item.variant.options).join(" / ")
                              : "Standard"}
                          </Text>
                          {/* Price Breakdown Tooltip */}
                          {/* <Tooltip
                            label={`Unit Price: ${formatCurrency(
                              item.priceDetails.effectiveUnitPricePreTax
                            )} + Tax: ${formatCurrency(
                              item.priceDetails.taxAmountUnit
                            )}`}
                            hasArrow
                            placement="top"
                          >
                            <Text
                              fontSize="sm"
                              fontWeight="medium"
                              color="teal.600"
                              mt={1}
                              
                            >
                              Price:{" "}
                              {formatCurrency(
                                item.priceDetails.finalUnitPriceWithTax
                              )}{" "}
                              / unit
                            </Text>
                          </Tooltip> */}

                          {/* --- VISIBLE PRICE BREAKDOWN PER UNIT (RESTORED AS REQUESTED) --- */}
                          <VStack
                            align="start"
                            spacing={0}
                            mt={2}
                            fontSize="xs"
                            color="gray.600"
                          >
                            <HStack>
                              <Text minW="70px">Base Price:</Text>
                              <Text
                                as={totalUnitDiscount > 0 ? "s" : "span"}
                                color={
                                  totalUnitDiscount > 0
                                    ? "gray.400"
                                    : "gray.600"
                                }
                              >
                                {formatCurrency(priceDetails.baseUnitPrice)}
                              </Text>
                            </HStack>
                            {totalUnitDiscount > 0 && (
                              <HStack color="green.600">
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
                              borderColor="gray.300"
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
                              borderColor="gray.300"
                              pt={1}
                              mt={1}
                              w="full"
                            >
                              <Text
                                minW="70px"
                                fontWeight="bold"
                                color="gray.800"
                              >
                                Total/unit:
                              </Text>
                              <Text fontWeight="bold" color="gray.800">
                                {formatCurrency(
                                  priceDetails.finalUnitPriceWithTax
                                )}{" "}
                                {productData.priceUnit || ""}
                              </Text>
                            </HStack>
                          </VStack>

                          {/* --- END VISIBLE PRICE BREAKDOWN --- */}
                        </Box>

                        {/* Line Total Display (Dynamic based on billing mode) */}
                        <Text fontWeight="bold" fontSize="lg">
                          {formatCurrency(lineTotal)}
                        </Text>
                      </Flex>

                      {/* Controls: Quantity & Remove */}
                      <Flex mt={4} justify="space-between" align="center">
                        <HStack spacing={3}>
                          <IconButton
                            icon={<FiMinus />}
                            size="sm"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              updateQuantity(item.cartId, item.quantity - 1)
                            }
                            isDisabled={
                              item.quantity <= 1 &&
                              item.productData?.minOrderQty <= 1
                            }
                          />
                          <Text fontWeight="bold" w="30px" textAlign="center">
                            {item.quantity}
                          </Text>
                          <IconButton
                            icon={<FiPlus />}
                            size="sm"
                            aria-label="Increase quantity"
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
            <Button variant="outline" colorScheme="gray" onClick={clearCart}>
              Clear Cart
            </Button>
          </Box>
        </Box>

        {/* --- RIGHT COLUMN: Order Summary --- */}
        <Box>
          <VStack
            p={6}
            borderWidth="1px"
            borderRadius="lg"
            bg="gray.50"
            spacing={4}
            align="stretch"
            position="sticky"
            top="80px" // Sticky positioning for desktop
            shadow="md"
          >
            <Heading size="md">Order Summary</Heading>

            <Divider />

            {/* --- NEW: Billing Preference Toggle --- */}
            <Box py={2}>
              <Text fontSize="sm" fontWeight="semibold" mb={2} color="gray.600">
                Billing Preference
              </Text>
              <RadioGroup onChange={setBillingMode} value={billingMode}>
                <Stack direction="column" spacing={2}>
                  <Radio
                    value="withBill"
                    colorScheme="teal"
                    bg="white"
                    p={2}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={
                      billingMode === "withBill" ? "teal.500" : "gray.200"
                    }
                  >
                    <HStack justify="space-between" w="100%">
                      <Text fontSize="sm">With Bill</Text>
                      <Badge colorScheme="green" fontSize="0.6em">
                        Tax Incl.
                      </Badge>
                    </HStack>
                  </Radio>
                  <Radio
                    value="withoutBill"
                    colorScheme="teal"
                    bg="white"
                    p={2}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={
                      billingMode === "withoutBill" ? "teal.500" : "gray.200"
                    }
                  >
                    <HStack justify="space-between" w="100%">
                      <Text fontSize="sm">Without Bill</Text>
                      <Badge colorScheme="gray" fontSize="0.6em">
                        Tax Excl.
                      </Badge>
                    </HStack>
                  </Radio>
                </Stack>
              </RadioGroup>
            </Box>

            <Divider />

            {/* Totals Section */}
            <VStack spacing={2} align="stretch">
              <Flex justify="space-between">
                <Text color="gray.600">Subtotal</Text>
                <Text fontWeight="medium">{formatCurrency(cartSubtotal)}</Text>
              </Flex>

              <Flex justify="space-between">
                <Text
                  color={billingMode === "withBill" ? "gray.600" : "gray.400"}
                >
                  Tax{" "}
                  {billingMode === "withoutBill" && (
                    <Badge ml={1}>Excluded</Badge>
                  )}
                </Text>
                <Text
                  fontWeight="medium"
                  color={billingMode === "withBill" ? "black" : "gray.400"}
                  textDecoration={
                    billingMode === "withoutBill" ? "line-through" : "none"
                  }
                >
                  {formatCurrency(cartTotalTax)}
                </Text>
              </Flex>

              <Divider my={2} />

              <Flex justify="space-between" align="center">
                <Text fontSize="lg" fontWeight="bold">
                  Grand Total
                </Text>
                <Text fontSize="xl" fontWeight="bold" color="teal.600">
                  {formatCurrency(displayGrandTotal)}
                </Text>
              </Flex>
            </VStack>

            <Button
              colorScheme="teal"
              size="lg"
              w="full"
              mt={4}
              rightIcon={<FiArrowRight />}
              onClick={handleCheckout}
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
