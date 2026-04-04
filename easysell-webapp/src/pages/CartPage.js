import React, { useEffect, useState } from "react";
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
  Input,
} from "@chakra-ui/react";
import { FiTrash2, FiMinus, FiPlus, FiShoppingCart, FiArrowRight, FiShield, FiGift } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import SpinnerComponent from "../components/Spinner";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

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
  const { storeConfig, buyerPoints, selectedRedeemReward, selectRedeemReward, clearRedeemReward } = useAuth();
  const [billingMode, setBillingMode] = useState("withBill");
  const [availableRewards, setAvailableRewards] = useState([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);

  // Theme
  const pageBg = useColorModeValue('#F8F9FC', '#09090B');
  const cardBg = useColorModeValue('white', '#111116');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const hoverBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const priceColor = useColorModeValue('brand.600', 'brand.300');
  const stepBg = useColorModeValue('brand.50', 'whiteAlpha.100');
  const stepActiveColor = useColorModeValue('brand.600', 'brand.300');
  const emptyIconBg = useColorModeValue('gray.100', 'whiteAlpha.100');
  const imageBg = useColorModeValue('gray.50', '#0D0D12');
  const quantityInputBgActive = useColorModeValue('blackAlpha.50', 'whiteAlpha.100');

  const displayGrandTotal = billingMode === "withBill" ? cartGrandTotal : cartSubtotal;
  const currentPoints = buyerPoints?.points || 0;
  const rewardsEnabled = storeConfig?.rewardsEnabled && (storeConfig?.rewardsAllowCheckoutRedeem !== false);
  const rewardOwnerUid = storeConfig?.uid || selectedRedeemReward?.sellerUid || null;
  const rewardBaseTotal = displayGrandTotal;
  const getRewardSavings = (reward, total) => {
    if (!reward || reward.active === false) return 0;
    if (reward.type === 'percent_off') return total * ((Number(reward.value || 0)) / 100);
    if (reward.type === 'flat_off') return Math.min(Number(reward.value || 0), total);
    return 0;
  };
  const getRewardLabel = (reward) => reward?.type === 'percent_off'
    ? `${Number(reward.value || 0)}% off`
    : `₹${Number(reward.value || 0)} off`;

  const suggestedRewards = availableRewards
    .filter((reward) => reward.active !== false && currentPoints >= Number(reward.pointsCost || 0))
    .map((reward) => ({ reward, savings: getRewardSavings(reward, rewardBaseTotal) }))
    .filter(({ savings }) => savings > 0)
    .sort((left, right) => right.savings - left.savings)
    .slice(0, 3);
  const suggestedRewardById = new Map(
    suggestedRewards.map(({ reward, savings }) => [reward.id, savings])
  );
  const topSuggestedRewardId = suggestedRewards[0]?.reward?.id || null;

  const rewardDiscountPreview = (() => {
    if (!selectedRedeemReward) return 0;
    const total = billingMode === "withBill" ? cartGrandTotal : cartSubtotal;
    if (selectedRedeemReward.type === 'percent_off') {
      return total * ((Number(selectedRedeemReward.value || 0)) / 100);
    }
    if (selectedRedeemReward.type === 'flat_off') {
      return Math.min(Number(selectedRedeemReward.value || 0), total);
    }
    return 0;
  })();

  useEffect(() => {
    const fetchRewards = async () => {
      if (!rewardsEnabled || !rewardOwnerUid) {
        setRewardsLoading(false);
        setAvailableRewards([]);
        return;
      }
      setRewardsLoading(true);
      try {
        const itemsRef = collection(db, 'users', rewardOwnerUid, 'reward_items');
        const snap = await getDocs(itemsRef);
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((item) => item.active !== false && (item.type === 'percent_off' || item.type === 'flat_off'));
        setAvailableRewards(items);
      } catch (err) {
        console.error('Failed to load rewards in cart:', err);
        setAvailableRewards([]);
      } finally {
        setRewardsLoading(false);
      }
    };
    fetchRewards();
  }, [rewardsEnabled, rewardOwnerUid, selectedRedeemReward?.sellerUid]);

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

  const handleCheckout = () => navigate("/checkout", {
    state: {
      billingMode,
      preselectedRewardId: selectedRedeemReward?.id || null,
    },
  });

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
                          fallbackSrc="https://placehold.co/100x100?text=No+Image"
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
                              {priceDetails.taxAmountUnit > 0 && (
                                <Text>
                                  Unit: {formatCurrency(priceDetails.effectiveUnitPricePreTax)} + ₹{priceDetails.taxAmountUnit?.toFixed(2)} tax
                                </Text>
                              )}
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
                            <Input
                              type="number"
                              key={`qty-${item.cartId}-${item.quantity}`}
                              defaultValue={item.quantity}
                              onBlur={(e) => {
                                let val = parseInt(e.target.value, 10);
                                const minQty = item.productData?.minOrderQty || 1;
                                if (isNaN(val) || val < minQty) {
                                  val = minQty;
                                  toast({
                                    title: `Minimum Order Quantity is ${minQty}`,
                                    status: 'info',
                                    duration: 3000,
                                    isClosable: true,
                                    position: 'top-right'
                                  });
                                }
                                updateQuantity(item.cartId, val);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.target.blur();
                                }
                              }}
                              w="46px"
                              h="32px"
                              textAlign="center"
                              fontSize="sm"
                              fontWeight="700"
                              color={textColor}
                              bg="transparent"
                              border="none"
                              _focus={{ boxShadow: 'none', bg: quantityInputBgActive }}
                              px={0}
                              sx={{
                                '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
                                  WebkitAppearance: 'none',
                                  margin: 0,
                                },
                                MozAppearance: 'textfield',
                              }}
                            />
                            <IconButton
                              icon={<FiPlus size="14px" />}
                              size="sm"
                              aria-label="Increase"
                              variant="ghost"
                              color={textColor}
                              _hover={{ bg: hoverBg }}
                              onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                              isDisabled={(() => {
                                if (storeConfig?.inventoryTracking === false) return false;
                                const maxStock = item.productData?.availableQuantity;
                                if (maxStock > 0 && maxStock !== -1 && !item.productData?.allowBackorders) {
                                  return item.quantity >= maxStock;
                                }
                                return false;
                              })()}
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

              {cartTotalTax > 0 && (
                <>
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
              </>
              )}

              {/* Totals */}
              <VStack spacing={2.5} align="stretch">
                {rewardsEnabled && (
                  <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="12px" p={4}>
                    <HStack justify="space-between" mb={1.5}>
                      <HStack spacing={2}>
                        <Icon as={FiGift} color={stepActiveColor} />
                        <Text fontSize="sm" fontWeight="700" color={textColor}>Rewards & Discounts</Text>
                      </HStack>
                      <Badge colorScheme="gray" borderRadius="full" fontSize="xs" px={2.5} py={1}>{currentPoints} pts</Badge>
                    </HStack>
                    <Text fontSize="xs" color={mutedColor} mb={3}>Choose one reward to apply</Text>
                    {rewardsLoading && (
                      <Text fontSize="xs" color={mutedColor}>Loading rewards...</Text>
                    )}
                    {!rewardsLoading && availableRewards.length === 0 && (
                      <VStack align="stretch" spacing={2}>
                        <Text fontSize="xs" color={mutedColor}>No discount rewards are currently available.</Text>
                        <Button size="sm" variant="outline" colorScheme="brand" onClick={() => navigate('/rewards')}>Browse Rewards</Button>
                      </VStack>
                    )}
                    <VStack align="stretch" spacing={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="gray"
                        borderRadius="10px"
                        onClick={clearRedeemReward}
                      >
                        Do Not Use Reward Points
                      </Button>
                      {availableRewards.map((reward) => {
                        const canAfford = currentPoints >= Number(reward.pointsCost || 0);
                        const isSelected = selectedRedeemReward?.id === reward.id;
                        const suggestedSavings = suggestedRewardById.get(reward.id);
                        return (
                          <Box
                            key={reward.id}
                            p={2.5}
                            borderRadius="10px"
                            borderWidth="1px"
                            bg={isSelected ? stepBg : 'transparent'}
                            borderColor={isSelected ? stepActiveColor : inputBorder}
                            color={textColor}
                            opacity={canAfford ? 1 : 0.6}
                            cursor={canAfford ? 'pointer' : 'not-allowed'}
                            onClick={() => {
                              if (!canAfford) return;
                              if (isSelected) {
                                clearRedeemReward();
                              } else {
                                selectRedeemReward(reward);
                              }
                            }}
                            transition="all 0.2s"
                            _hover={canAfford ? { borderColor: stepActiveColor, bg: isSelected ? stepBg : hoverBg } : {}}
                          >
                            <Flex justify="space-between" align="center">
                              <VStack align="start" spacing={0.5}>
                                <HStack spacing={2}>
                                  <Text fontSize="sm" fontWeight="600" color={textColor}>{reward.title}</Text>
                                  {topSuggestedRewardId === reward.id && (
                                    <Badge colorScheme="green" variant="subtle" borderRadius="full" fontSize="0.65rem">Best value</Badge>
                                  )}
                                </HStack>
                                <Text fontSize="xs" color={mutedColor}>
                                  {getRewardLabel(reward)}
                                  {suggestedSavings ? ` • Save ${formatCurrency(suggestedSavings)}` : ''}
                                </Text>
                              </VStack>
                              <Badge ml={2} colorScheme="purple" borderRadius="full" fontSize="xs" px={2.5} py={1}>{reward.pointsCost} pts</Badge>
                            </Flex>
                          </Box>
                        );
                      })}
                    </VStack>
                  </Box>
                )}

                <Flex justify="space-between">
                  <Text fontSize="sm" color={mutedColor}>Subtotal</Text>
                  <Text fontSize="sm" fontWeight="600" color={textColor}>{formatCurrency(cartSubtotal)}</Text>
                </Flex>
                {rewardDiscountPreview > 0 && (
                  <Flex justify="space-between">
                    <HStack spacing={1}>
                      <Text fontSize="sm" color="green.600">Reward Discount</Text>
                    </HStack>
                    <Text fontSize="sm" fontWeight="600" color="green.600">-{formatCurrency(rewardDiscountPreview)}</Text>
                  </Flex>
                )}
                {cartTotalTax > 0 && (
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
                )}

                <Divider borderColor={borderColor} />

                <Flex justify="space-between" align="center" pt={1}>
                  <Text fontSize="md" fontWeight="700" color={textColor}>Total</Text>
                  <Text fontSize="xl" fontWeight="800" color={priceColor}>
                    {formatCurrency(Math.max(0, displayGrandTotal - rewardDiscountPreview))}
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
                Checkout · {formatCurrency(Math.max(0, displayGrandTotal - rewardDiscountPreview))}
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