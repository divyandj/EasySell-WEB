import React, { useState, useEffect } from 'react';
import {
  Container, Heading, VStack, FormControl, FormLabel, Input, Button,
  Box, Text, useToast, SimpleGrid, Divider, Alert, AlertIcon,
  AlertTitle, AlertDescription, HStack, Radio, RadioGroup, Stack, Badge, useColorModeValue, Icon, Flex, IconButton
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, Timestamp, runTransaction, doc, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import SpinnerComponent from '../components/Spinner';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FiShield, FiArrowRight, FiMapPin, FiCreditCard, FiShoppingBag, FiMinus, FiPlus, FiStar, FiGift } from 'react-icons/fi';
import { resolveStoreContext } from '../utils/storeResolver';

const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;



const getSubdomain = () => {
  const context = resolveStoreContext();
  return (context.type === 'subdomain' || context.type === 'customDomain') ? context.handle || context.domain : null;
};

const CheckoutPage = () => {
  const { currentUser, userData, storeConfig, buyerPoints, fetchBuyerPoints, selectedRedeemReward, selectRedeemReward, clearRedeemReward } = useAuth();
  const { cartItems, cartSubtotal, cartTotalTax, cartGrandTotal, clearCart, itemCount, loadingProductData, updateQuantity } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [shippingInfo, setShippingInfo] = useState({
    name: '', address: '', city: '', pincode: '', phone: '', transportName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [billingMode, setBillingMode] = useState(location.state?.billingMode || 'withBill');

  // --- REWARDS STATE ---
  const [availableRewards, setAvailableRewards] = useState([]);
  const rewardsEnabled = storeConfig?.rewardsEnabled && (storeConfig?.rewardsAllowCheckoutRedeem !== false);
  const currentPoints = buyerPoints?.points || 0;
  const selectedReward = selectedRedeemReward;

  const isDiscountReward = (reward) => reward?.type === 'percent_off' || reward?.type === 'flat_off';

  useEffect(() => {
    const fetchRewards = async () => {
      if (!rewardsEnabled || !storeConfig?.uid) return;
      try {
        const itemsRef = collection(db, 'users', storeConfig.uid, 'reward_items');
        const snap = await getDocs(itemsRef);
        const items = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(item => item.active !== false);
        setAvailableRewards(items);
      } catch (err) { console.error('Failed to fetch rewards:', err); }
    };
    fetchRewards();
  }, [rewardsEnabled, storeConfig?.uid]);

  useEffect(() => {
    if (!availableRewards.length) return;

    const preselectedRewardId = location.state?.preselectedRewardId;
    if (preselectedRewardId) {
      const match = availableRewards.find(r => r.id === preselectedRewardId);
      if (match && isDiscountReward(match)) {
        selectRedeemReward(match);
      }
      return;
    }
  }, [availableRewards, location.state, selectedReward?.id, selectRedeemReward]);

  useEffect(() => {
    const hasExplicitSelection = Boolean(location.state?.preselectedRewardId);
    if (!hasExplicitSelection) {
      clearRedeemReward();
    }
  }, [location.state, clearRedeemReward]);

  // Calculate reward discount
  const getRewardDiscount = () => {
    if (!selectedReward) return 0;
    if (!isDiscountReward(selectedReward)) return 0;
    const total = billingMode === 'withBill' ? cartGrandTotal : cartSubtotal;
    if (selectedReward.type === 'percent_off') return total * ((selectedReward.value || 0) / 100);
    if (selectedReward.type === 'flat_off') return Math.min(selectedReward.value || 0, total);
    return 0;
  };
  const rewardDiscount = getRewardDiscount();

  // Analytics
  const orderPlacedRef = React.useRef(false);
  const cartStateRef = React.useRef({ count: 0, value: 0, tracked: false });

  useEffect(() => {
    cartStateRef.current.count = cartItems.length;
    cartStateRef.current.value = billingMode === 'withBill' ? cartGrandTotal : cartSubtotal;
  }, [cartItems, cartGrandTotal, cartSubtotal, billingMode]);

  useEffect(() => {
    const trackAbandonment = () => {
      const state = cartStateRef.current;
      if (!orderPlacedRef.current && state.count > 0 && !state.tracked) {
        state.tracked = true;
        axios.post(`${API_BASE_URL}/api/analytics/abandoned`, {
          storeHandle: getSubdomain() || '',
          cartValue: state.value
        }).catch(e => console.error("Abandonment tracking failed", e));
      }
    };
    window.addEventListener('beforeunload', trackAbandonment);
    return () => {
      window.removeEventListener('beforeunload', trackAbandonment);
      trackAbandonment();
    };
  }, []);

  // Theme
  const pageBg = useColorModeValue('#F8F9FC', '#09090B');
  const cardBg = useColorModeValue('white', '#111116');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const priceColor = useColorModeValue('brand.600', 'brand.300');
  const stepBg = useColorModeValue('brand.50', 'whiteAlpha.100');
  const stepActiveColor = useColorModeValue('brand.600', 'brand.300');
  const selectedBillingBg = useColorModeValue('brand.50', 'whiteAlpha.50');
  const quantityInputBgActive = useColorModeValue('blackAlpha.50', 'whiteAlpha.100');

  useEffect(() => {
    if (currentUser) {
      try {
        const savedInfo = localStorage.getItem(`shipping_${currentUser.uid}`);
        if (savedInfo) {
          const parsed = JSON.parse(savedInfo);
          setShippingInfo({ transportName: '', ...parsed });
        }
      } catch (e) { console.error("Error loading saved shipping info", e); }
    }
  }, [currentUser]);

  const displayTax = billingMode === 'withBill' ? cartTotalTax : 0;
  const preRewardTotal = billingMode === 'withBill' ? cartGrandTotal : cartSubtotal;
  const displayGrandTotal = Math.max(0, preRewardTotal - rewardDiscount);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'phone') {
      newValue = value.replace(/\D/g, '');
      if (newValue.length > 10) newValue = newValue.slice(0, 10);
    }
    const newInfo = { ...shippingInfo, [name]: newValue };
    setShippingInfo(newInfo);
    if (currentUser) {
      localStorage.setItem(`shipping_${currentUser.uid}`, JSON.stringify(newInfo));
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      toast({ title: "You must be logged in.", status: "error", duration: 3000, isClosable: true });
      return;
    }

    const isPublicStore = storeConfig?.storeMode === 'public';
    const isApprovedBuyer = currentUser && userData && userData.status === 'approved';
    const hasAccess = isPublicStore || isApprovedBuyer;

    if (!hasAccess) {
      toast({ title: "Account Not Approved", description: "Your account is under review or rejected.", status: "error", duration: 5000, isClosable: true });
      return;
    }

    if (shippingInfo.phone.length !== 10) {
      toast({ title: "Invalid Phone Number", description: "Please enter a valid 10-digit phone number.", status: "warning", duration: 3000, isClosable: true });
      return;
    }

    if (cartItems.length === 0 || !cartItems[0]?.productData?.catalogueId || !cartItems[0]?.productData?.sellerId) {
      toast({ title: "Invalid Cart", description: "Cart is empty or missing catalogue data.", status: "warning", duration: 3000, isClosable: true });
      return;
    }

    const activeReward = selectedReward
      ? availableRewards.find(r => r.id === selectedReward.id && r.active !== false)
      : null;
    if (selectedReward && !activeReward) {
      toast({ title: 'Selected reward is no longer available.', status: 'warning', duration: 3000, isClosable: true });
      clearRedeemReward();
      return;
    }
    if (activeReward && !isDiscountReward(activeReward)) {
      toast({ title: 'Custom rewards require seller approval and cannot be redeemed at checkout.', status: 'info', duration: 3500, isClosable: true });
      clearRedeemReward();
      return;
    }
    if (activeReward && currentPoints < Number(activeReward.pointsCost || 0)) {
      toast({ title: 'Not enough points for selected reward.', status: 'warning', duration: 3000, isClosable: true });
      return;
    }

    setIsSubmitting(true);

    const catalogueId = cartItems[0].productData.catalogueId;
    const sellerId = cartItems[0].productData.sellerId;

    if (!catalogueId || !sellerId) {
      setError("Critical Error: Catalogue or Seller ID is missing.");
      setIsSubmitting(false);
      return;
    }

    const orderData = {
      userId: currentUser.uid,
      catalogueId: catalogueId,
      sellerId: sellerId,
      billingType: billingMode,
      items: cartItems.map(item => {
        const details = item.priceDetails;
        const adjustedDetails = billingMode === 'withBill' ? details : {
          ...details,
          taxAmountUnit: 0,
          finalUnitPriceWithTax: details.effectiveUnitPricePreTax,
          lineItemTax: 0,
          lineItemTotal: details.lineItemSubtotal
        };

        return {
          productId: item.productId,
          title: item.title,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          variant: item.variant ? {
            options: item.variant.options,
            skuOverride: item.variant.skuOverride,
            imageUrl: item.variant.imageUrl,
          } : null,
          priceDetails: {
            baseUnitPrice: adjustedDetails.baseUnitPrice,
            discountAmountUnit: adjustedDetails.discountAmountUnit,
            bulkDiscountAmountUnit: adjustedDetails.bulkDiscountAmountUnit,
            variantModifierUnit: adjustedDetails.variantModifierUnit,
            effectiveUnitPricePreTax: adjustedDetails.effectiveUnitPricePreTax,
            taxAmountUnit: adjustedDetails.taxAmountUnit,
            finalUnitPriceWithTax: adjustedDetails.finalUnitPriceWithTax,
            lineItemSubtotal: adjustedDetails.lineItemSubtotal,
            lineItemTax: adjustedDetails.lineItemTax,
            lineItemTotal: adjustedDetails.lineItemTotal,
          },
          productSnapshot: {
            priceUnit: item.productData.priceUnit,
            taxRate: billingMode === 'withBill' ? item.productData.taxRate : 0,
          }
        };
      }),
      orderSubtotal: cartSubtotal,
      orderTax: displayTax,
      rewardDiscount: rewardDiscount,
      rewardRedeemed: activeReward ? { id: activeReward.id, title: activeReward.title, type: activeReward.type, pointsCost: activeReward.pointsCost } : null,
      totalAmount: displayGrandTotal,
      transportName: shippingInfo.transportName || "",
      shippingAddress: shippingInfo,
      orderDate: Timestamp.fromDate(new Date()),
      status: "Placed",
    };

    try {
      const newOrderId = await runTransaction(db, async (transaction) => {
        const productUpdates = [];
        const inventoryOn = storeConfig?.inventoryTracking !== false;

        for (const item of cartItems) {
          const productRef = doc(db, "products", item.productId);
          const productSnap = await transaction.get(productRef);
          if (!productSnap.exists())
            throw new Error(`Product "${item.title}" not found.`);

          // Skip stock validation & decrement when inventory tracking is OFF
          if (!inventoryOn) continue;

          const productData = productSnap.data();
          const allowBackorder = productData.allowBackorders === true;

          if (item.variant) {
            const variantIndex = productData.variants?.findIndex(
              (v) => JSON.stringify(v.options) === JSON.stringify(item.variant.options)
            );
            if (variantIndex === -1 || variantIndex === undefined)
              throw new Error(`Variant not found for "${item.title}".`);

            const currentVariant = productData.variants[variantIndex];
            const currentInStock = currentVariant.inStock !== undefined ? currentVariant.inStock : productData.inStock;
            const currentQuantity = currentVariant.quantity !== undefined ? currentVariant.quantity : 0;
            const isInfiniteStock = currentQuantity === -1;

            const effectivelyInStock = isInfiniteStock || currentInStock;
            if (!effectivelyInStock && !allowBackorder)
              throw new Error(`Variant for "${item.title}" is out of stock.`);
            if (!isInfiniteStock && !allowBackorder && currentQuantity < item.quantity)
              throw new Error(`Insufficient stock for "${item.title}".`);

            const updatedVariants = [...productData.variants];
            const newQuantity = isInfiniteStock ? -1 : (currentQuantity - item.quantity);
            updatedVariants[variantIndex] = {
              ...currentVariant,
              quantity: newQuantity,
              inStock: allowBackorder ? currentVariant.inStock : (isInfiniteStock ? true : newQuantity > 0),
            };
            productUpdates.push({ ref: productRef, data: { variants: updatedVariants } });
          } else {
            const currentInStock = productData.inStock;
            const currentQuantity = productData.availableQuantity !== undefined ? productData.availableQuantity : 0;
            const isInfiniteStock = currentQuantity === -1;

            const effectivelyInStock = isInfiniteStock || currentInStock;
            if (!effectivelyInStock && !allowBackorder)
              throw new Error(`Product "${item.title}" is out of stock.`);
            if (!isInfiniteStock && !allowBackorder && currentQuantity < item.quantity)
              throw new Error(`Insufficient stock for "${item.title}".`);

            const newQuantity = isInfiniteStock ? -1 : (currentQuantity - item.quantity);
            productUpdates.push({
              ref: productRef,
              data: {
                availableQuantity: newQuantity,
                inStock: allowBackorder ? productData.inStock : (isInfiniteStock ? true : newQuantity > 0),
              },
            });
          }
        }

        productUpdates.forEach((update) => transaction.update(update.ref, update.data));
        const newOrderRef = doc(collection(db, "catalogues", catalogueId, "orders"));
        transaction.set(newOrderRef, orderData);
        return newOrderRef.id;
      });

      axios.post(`${API_BASE_URL}/api/notify-order`, {
        orderId: newOrderId,
        catalogueId: catalogueId,
        amount: displayGrandTotal,
        customerName: shippingInfo.name,
        storeHandle: getSubdomain() || ''
      }).catch((err) => console.error("Notification Failed:", err));

      orderPlacedRef.current = true;

      // --- REWARDS: Earn points & deduct redeemed ---
      if (storeConfig?.rewardsEnabled && currentUser) {
        try {
          const subdomain = getSubdomain();
          const pointsDocId = `${currentUser.uid}__${subdomain}`;
          const pointsRef = doc(db, 'buyer_points', pointsDocId);
          const pointsSnap = await getDoc(pointsRef);
          const existingData = pointsSnap.exists() ? pointsSnap.data() : { points: 0, totalEarned: 0, totalRedeemed: 0, transactions: [] };

          const ppr = storeConfig.rewardsPointsPerRupee || 1;
          const earnedPoints = Math.floor(displayGrandTotal * ppr);

          // Welcome bonus for first purchase
          const isFirstPurchase = existingData.totalEarned === 0;
          const welcomeBonus = (isFirstPurchase && storeConfig.rewardsWelcomeBonus) ? storeConfig.rewardsWelcomeBonus : 0;
          const totalEarnedNow = earnedPoints + welcomeBonus;

          const redeemedPoints = activeReward ? (activeReward.pointsCost || 0) : 0;

          const newTransactions = [...(existingData.transactions || [])];
          if (totalEarnedNow > 0) {
            newTransactions.push({ type: 'earn', amount: totalEarnedNow, orderId: newOrderId, date: Timestamp.fromDate(new Date()) });
          }
          if (redeemedPoints > 0) {
            newTransactions.push({ type: 'redeem_discount', amount: -redeemedPoints, rewardTitle: activeReward.title, orderId: newOrderId, date: Timestamp.fromDate(new Date()) });
          }

          await setDoc(pointsRef, {
            points: existingData.points + totalEarnedNow - redeemedPoints,
            totalEarned: existingData.totalEarned + totalEarnedNow,
            totalRedeemed: existingData.totalRedeemed + redeemedPoints,
            lastEarnedAt: Timestamp.fromDate(new Date()),
            transactions: newTransactions,
          });

          if (fetchBuyerPoints) fetchBuyerPoints(currentUser.uid);

          if (totalEarnedNow > 0) {
            toast({ title: `🎉 You earned ${totalEarnedNow} points!`, status: 'info', duration: 4000, position: 'top' });
          }
        } catch (err) { console.error('Failed to update buyer points:', err); }
      }

      axios.post(`${API_BASE_URL}/api/analytics/order`, {
        storeHandle: getSubdomain() || '',
        orderData: {
          gmv: displayGrandTotal,
          buyerName: shippingInfo.name,
          buyerEmail: currentUser.email || '',
          items: cartItems.map((i) => ({
            id: i.productId,
            name: i.title,
            qty: i.quantity,
            price: i.priceDetails.finalUnitPriceWithTax
          }))
        }
      }).catch((err) => console.error("Analytics Order Tracking Failed:", err));

      toast({
        title: "Order placed successfully!",
        description: `Order ID: ${newOrderId}`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      clearCart();
      clearRedeemReward();
      navigate(`/order-details/${catalogueId}/${newOrderId}`);
    } catch (error) {
      console.error("Transaction failed: ", error);
      setError(`Order failed: ${error.message}`);
      toast({ title: "Error", description: error.message, status: "error", position: "top", duration: 5000, isClosable: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingProductData) return <SpinnerComponent />;
  if (cartItems.length === 0 && !isSubmitting) {
    return (
      <Box bg={pageBg} minH="80vh">
        <Container centerContent py={20}>
          <VStack spacing={4}>
            <Heading size="md" color={textColor}>Your cart is empty.</Heading>
            <Button colorScheme="brand" onClick={() => navigate('/')}>Continue Shopping</Button>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={pageBg} minH="100vh" py={{ base: 6, md: 10 }}>
      <Container maxW="container.xl">
        {/* Header */}
        <Heading fontSize={{ base: 'xl', md: '2xl' }} color={textColor} fontWeight="800" letterSpacing="-0.02em" mb={8}>
          Checkout
        </Heading>

        {error && (
          <Alert status="error" mb={6} borderRadius="12px">
            <AlertIcon />
            <AlertTitle mr={2}>Order Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <SimpleGrid columns={{ base: 1, lg: 5 }} spacing={{ base: 6, lg: 8 }}>
          {/* ====== LEFT: Form (3 cols) ====== */}
          <Box gridColumn={{ lg: "span 3" }}>
            {/* Step 1: Billing */}
            {cartTotalTax > 0 && (
              <Box
                mb={6}
                p={6}
                borderWidth="1px"
                borderRadius="16px"
                borderColor={borderColor}
                bg={cardBg}
                boxShadow="card"
              >
                <HStack spacing={3} mb={4}>
                  <Flex w={8} h={8} bg={stepBg} borderRadius="10px" align="center" justify="center">
                    <Icon as={FiCreditCard} color={stepActiveColor} boxSize={4} />
                  </Flex>
                  <Text fontSize="sm" fontWeight="700" color={textColor} textTransform="uppercase" letterSpacing="0.06em">
                    Billing Type
                  </Text>
                </HStack>
                <RadioGroup onChange={setBillingMode} value={billingMode}>
                  <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
                    <Box
                      flex="1"
                      p={4}
                      borderWidth="1.5px"
                      borderRadius="12px"
                      borderColor={billingMode === 'withBill' ? 'brand.500' : borderColor}
                      bg={billingMode === 'withBill' ? selectedBillingBg : 'transparent'}
                      cursor="pointer"
                      onClick={() => setBillingMode('withBill')}
                      transition="all 0.2s"
                    >
                      <Radio value='withBill' colorScheme='brand' size="sm">
                        <VStack align="start" spacing={0} ml={1}>
                          <Text fontWeight="600" fontSize="sm" color={textColor}>With Bill</Text>
                          <Text fontSize="xs" color={mutedColor}>Tax included in total</Text>
                        </VStack>
                      </Radio>
                    </Box>
                    <Box
                      flex="1"
                      p={4}
                      borderWidth="1.5px"
                      borderRadius="12px"
                      borderColor={billingMode === 'withoutBill' ? 'brand.500' : borderColor}
                      bg={billingMode === 'withoutBill' ? selectedBillingBg : 'transparent'}
                      cursor="pointer"
                      onClick={() => setBillingMode('withoutBill')}
                      transition="all 0.2s"
                    >
                      <Radio value='withoutBill' colorScheme='brand' size="sm">
                        <VStack align="start" spacing={0} ml={1}>
                          <Text fontWeight="600" fontSize="sm" color={textColor}>Without Bill</Text>
                          <Text fontSize="xs" color={mutedColor}>Tax excluded from total</Text>
                        </VStack>
                      </Radio>
                    </Box>
                  </Stack>
                </RadioGroup>
              </Box>
            )}

            {/* Step 2: Shipping */}
            <Box
              p={6}
              borderWidth="1px"
              borderRadius="16px"
              borderColor={borderColor}
              bg={cardBg}
              boxShadow="card"
            >
              <HStack spacing={3} mb={5}>
                <Flex w={8} h={8} bg={stepBg} borderRadius="10px" align="center" justify="center">
                  <Icon as={FiMapPin} color={stepActiveColor} boxSize={4} />
                </Flex>
                <Text fontSize="sm" fontWeight="700" color={textColor} textTransform="uppercase" letterSpacing="0.06em">
                  Shipping Address
                </Text>
              </HStack>

              <form onSubmit={handlePlaceOrder}>
                <VStack spacing={4}>
                  <FormControl isRequired id="name">
                    <FormLabel fontSize="sm" fontWeight="600" color={mutedColor}>Full Name</FormLabel>
                    <Input
                      name="name"
                      borderColor={inputBorder}
                      borderRadius="12px"
                      color={textColor}
                      h="44px"
                      _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
                      _hover={{ borderColor: 'gray.300' }}
                      onChange={handleInputChange}
                      value={shippingInfo.name}
                      placeholder="John Doe"
                    />
                  </FormControl>

                  <FormControl isRequired id="phone">
                    <FormLabel fontSize="sm" fontWeight="600" color={mutedColor}>
                      Phone Number
                    </FormLabel>
                    <Input
                      name="phone"
                      type="tel"
                      borderColor={inputBorder}
                      borderRadius="12px"
                      color={textColor}
                      h="44px"
                      _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
                      _hover={{ borderColor: 'gray.300' }}
                      onChange={handleInputChange}
                      value={shippingInfo.phone}
                      placeholder="9876543210"
                      maxLength={10}
                    />
                  </FormControl>

                  <FormControl isRequired id="address">
                    <FormLabel fontSize="sm" fontWeight="600" color={mutedColor}>Address</FormLabel>
                    <Input
                      name="address"
                      borderColor={inputBorder}
                      borderRadius="12px"
                      color={textColor}
                      h="44px"
                      _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
                      _hover={{ borderColor: 'gray.300' }}
                      onChange={handleInputChange}
                      value={shippingInfo.address}
                      placeholder="123 Main Street, Apt 4B"
                    />
                  </FormControl>

                  <HStack w="full" spacing={4}>
                    <FormControl isRequired id="city">
                      <FormLabel fontSize="sm" fontWeight="600" color={mutedColor}>City</FormLabel>
                      <Input
                        name="city"
                        borderColor={inputBorder}
                        borderRadius="12px"
                        color={textColor}
                        h="44px"
                        _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
                        _hover={{ borderColor: 'gray.300' }}
                        onChange={handleInputChange}
                        value={shippingInfo.city}
                        placeholder="Mumbai"
                      />
                    </FormControl>
                    <FormControl isRequired id="pincode">
                      <FormLabel fontSize="sm" fontWeight="600" color={mutedColor}>Pincode</FormLabel>
                      <Input
                        name="pincode"
                        borderColor={inputBorder}
                        borderRadius="12px"
                        color={textColor}
                        h="44px"
                        _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
                        _hover={{ borderColor: 'gray.300' }}
                        onChange={handleInputChange}
                        value={shippingInfo.pincode}
                        placeholder="400001"
                      />
                    </FormControl>
                  </HStack>

                  <FormControl id="transportName">
                    <FormLabel fontSize="sm" fontWeight="600" color={mutedColor}>
                      Preferred Transport Name (Optional)
                    </FormLabel>
                    <Input
                      name="transportName"
                      borderColor={inputBorder}
                      borderRadius="12px"
                      color={textColor}
                      h="44px"
                      _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
                      _hover={{ borderColor: 'gray.300' }}
                      onChange={handleInputChange}
                      value={shippingInfo.transportName}
                      placeholder="e.g., VRL Logistics, XYZ Cargo"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    w="full"
                    mt={4}
                    h="52px"
                    borderRadius="12px"
                    isLoading={isSubmitting}
                    loadingText="Processing Order..."
                    disabled={isSubmitting || cartItems.length === 0 || loadingProductData}
                    rightIcon={<FiArrowRight />}
                    fontWeight="700"
                    boxShadow="0 4px 14px rgba(108,92,231,0.3)"
                    _hover={{ transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(108,92,231,0.4)' }}
                  >
                    Place Order · {formatCurrency(displayGrandTotal)}
                  </Button>

                  <HStack justify="center" spacing={2} pt={1}>
                    <Icon as={FiShield} color="green.400" boxSize={3.5} />
                    <Text fontSize="xs" color={mutedColor}>Your information is secure and encrypted</Text>
                  </HStack>
                </VStack>
              </form>
            </Box>
          </Box>

          {/* ====== RIGHT: Order Summary (2 cols) ====== */}
          <Box gridColumn={{ lg: "span 2" }}>
            <VStack
              spacing={4}
              align="stretch"
              p={6}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="20px"
              bg={cardBg}
              boxShadow="card"
              position="sticky"
              top="80px"
            >
              <HStack spacing={3}>
                <Flex w={8} h={8} bg={stepBg} borderRadius="10px" align="center" justify="center">
                  <Icon as={FiShoppingBag} color={stepActiveColor} boxSize={4} />
                </Flex>
                <Text fontSize="sm" fontWeight="700" color={textColor} textTransform="uppercase" letterSpacing="0.06em">
                  Order Summary
                </Text>
                <Badge borderRadius="full" colorScheme="brand" ml="auto">{itemCount} items</Badge>
              </HStack>

              <Divider borderColor={borderColor} />

              {/* Items */}
              <VStack spacing={3} align="stretch">
                {cartItems.map(item => {
                  const lineTotal = billingMode === 'withBill' ? item.priceDetails.lineItemTotal : item.priceDetails.lineItemSubtotal;
                  return (
                    <HStack key={item.cartId} justify="space-between" fontSize="sm" align="start">
                      <Box flex={1}>
                        <Text fontWeight="600" noOfLines={1} color={textColor} fontSize="sm">{item.title}</Text>
                        <Text fontSize="xs" color={mutedColor} mb={1}>
                          {item.variant ? Object.values(item.variant.options).join('/') : ''}
                        </Text>
                        <HStack
                          spacing={0}
                          borderWidth="1px"
                          borderColor={borderColor}
                          borderRadius="8px"
                          overflow="hidden"
                          w="fit-content"
                          mt={1}
                        >
                          <IconButton
                            icon={<FiMinus size="12px" />}
                            size="xs"
                            aria-label="Decrease"
                            variant="ghost"
                            color={textColor}
                            onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                            isDisabled={item.quantity <= 1 && item.productData?.minOrderQty <= 1}
                            h="24px"
                            w="28px"
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
                              if (e.key === 'Enter') e.target.blur();
                            }}
                            w="40px"
                            h="24px"
                            textAlign="center"
                            fontSize="xs"
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
                            icon={<FiPlus size="12px" />}
                            size="xs"
                            aria-label="Increase"
                            variant="ghost"
                            color={textColor}
                            onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                            isDisabled={(() => {
                              if (storeConfig?.inventoryTracking === false) return false;
                              const maxStock = item.productData?.availableQuantity;
                              if (maxStock > 0 && maxStock !== -1 && !item.productData?.allowBackorders) {
                                return item.quantity >= maxStock;
                              }
                              return false;
                            })()}
                            h="24px"
                            w="28px"
                          />
                        </HStack>
                      </Box>
                      <Text fontWeight="700" whiteSpace="nowrap" color={priceColor} fontSize="sm" mt={1}>
                        {formatCurrency(lineTotal)}
                      </Text>
                    </HStack>
                  );
                })}
              </VStack>

              <Divider borderColor={borderColor} />

              {/* Rewards Redemption */}
              {rewardsEnabled && availableRewards.length > 0 && (
                <Box bg="purple.50" borderRadius="12px" p={4} mb={2}>
                  <HStack mb={2}>
                    <Icon as={FiGift} color="purple.500" />
                    <Text fontSize="sm" fontWeight="700" color="purple.700">Redeem a Reward</Text>
                    <Badge colorScheme="purple" borderRadius="full" fontSize="xs">{currentPoints} pts</Badge>
                  </HStack>
                  <VStack align="stretch" spacing={2}>
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="gray"
                      onClick={clearRedeemReward}
                    >
                      Do Not Use Reward Points
                    </Button>
                    {availableRewards.map(reward => {
                      const canAfford = currentPoints >= (reward.pointsCost || 0);
                      return (
                        <Box
                          key={reward.id}
                          p={3}
                          borderRadius="8px"
                          bg={selectedReward?.id === reward.id ? 'purple.100' : 'white'}
                          borderWidth="1px"
                          borderColor={selectedReward?.id === reward.id ? 'purple.300' : 'gray.200'}
                          cursor={canAfford ? 'pointer' : 'not-allowed'}
                          opacity={canAfford ? 1 : 0.6}
                          onClick={() => {
                            if (!canAfford) return;
                            if (!isDiscountReward(reward)) {
                              toast({ title: 'Custom rewards must be claimed from Rewards page.', status: 'info', duration: 2500, isClosable: true });
                              return;
                            }
                            selectRedeemReward(selectedReward?.id === reward.id ? null : reward);
                          }}
                          transition="all 0.2s"
                          _hover={canAfford ? { borderColor: 'purple.300' } : {}}
                        >
                          <Flex justify="space-between" align="center">
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="600" color="gray.800">{reward.title}</Text>
                              <Text fontSize="xs" color="gray.500">
                                {reward.type === 'percent_off' ? `${reward.value}% off` :
                                 reward.type === 'flat_off' ? `₹${reward.value} off` :
                                reward.type === 'free_shipping' ? 'Free shipping' : 'Custom reward (approval needed)'}
                              </Text>
                              {!canAfford && (
                                <Text fontSize="xs" color="red.400" mt={1}>Need {reward.pointsCost - currentPoints} more pts</Text>
                              )}
                            </VStack>
                            <Badge colorScheme="purple" variant="subtle" fontSize="xs">{reward.pointsCost} pts</Badge>
                          </Flex>
                        </Box>
                      );
                    })}
                  </VStack>
                  {selectedReward && rewardDiscount > 0 && (
                    <Text fontSize="xs" color="green.600" fontWeight="600" mt={2}>
                      🎉 You save {formatCurrency(rewardDiscount)}!
                    </Text>
                  )}
                  {selectedReward && selectedReward.type === 'custom' && (
                    <Text fontSize="xs" color="purple.600" fontWeight="600" mt={2}>
                      🎁 "{selectedReward.title}" will be included with your order!
                    </Text>
                  )}
                </Box>
              )}

              {/* Points Earn Preview */}
              {storeConfig?.rewardsEnabled && (
                <Box bg="green.50" borderRadius="8px" px={4} py={2} mb={1}>
                  <HStack>
                    <Icon as={FiStar} color="green.500" boxSize={3} />
                    <Text fontSize="xs" color="green.700" fontWeight="600">
                      You'll earn ~{Math.floor(displayGrandTotal * (storeConfig.rewardsPointsPerRupee || 1))} points from this order
                    </Text>
                  </HStack>
                </Box>
              )}

              {/* Totals */}
              <VStack spacing={2} align="stretch">
                <Flex justify="space-between">
                  <Text fontSize="sm" color={mutedColor}>Subtotal</Text>
                  <Text fontSize="sm" fontWeight="600" color={textColor}>{formatCurrency(cartSubtotal)}</Text>
                </Flex>
                {cartTotalTax > 0 && (
                <Flex justify="space-between">
                  <HStack spacing={1}>
                    <Text fontSize="sm" color={billingMode === 'withBill' ? mutedColor : "gray.400"}>Tax</Text>
                    {billingMode === 'withoutBill' && (
                      <Badge colorScheme="purple" variant="outline" fontSize="0.5em" borderRadius="full">Excl.</Badge>
                    )}
                  </HStack>
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color={billingMode === 'withBill' ? textColor : "gray.400"}
                    textDecoration={billingMode === 'withoutBill' ? 'line-through' : 'none'}
                  >
                    {formatCurrency(cartTotalTax)}
                  </Text>
                </Flex>
                )}
                {rewardDiscount > 0 && (
                  <Flex justify="space-between">
                    <HStack spacing={1}>
                      <Icon as={FiGift} color="green.500" boxSize={3} />
                      <Text fontSize="sm" color="green.600">Reward Discount</Text>
                    </HStack>
                    <Text fontSize="sm" fontWeight="600" color="green.600">-{formatCurrency(rewardDiscount)}</Text>
                  </Flex>
                )}

                <Divider borderColor={borderColor} />

                <Flex justify="space-between" align="center" pt={1}>
                  <Text fontSize="md" fontWeight="700" color={textColor}>Total</Text>
                  <Text fontSize="xl" fontWeight="800" color={priceColor}>
                    {formatCurrency(displayGrandTotal)}
                  </Text>
                </Flex>
              </VStack>
            </VStack>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default CheckoutPage;