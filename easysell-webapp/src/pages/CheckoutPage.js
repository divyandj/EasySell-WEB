import React, { useState, useEffect } from 'react';
import {
  Container, Heading, VStack, FormControl, FormLabel, Input, Button,
  Box, Text, useToast, SimpleGrid, Divider, Alert, AlertIcon,
  AlertTitle, AlertDescription, Spinner, Center, HStack, Radio, RadioGroup, Stack, Badge
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { collection, Timestamp, runTransaction, doc } from 'firebase/firestore';
import { db } from '../firebase';
import SpinnerComponent from '../components/Spinner';
import axios from 'axios';

const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

const CheckoutPage = () => {
  const { currentUser } = useAuth();
  const { cartItems, cartSubtotal, cartTotalTax, cartGrandTotal, clearCart, itemCount, loadingProductData } = useCart();
  const navigate = useNavigate();
  const toast = useToast();

  const [shippingInfo, setShippingInfo] = useState({
    name: '', address: '', city: '', pincode: '', phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [billingMode, setBillingMode] = useState('withBill');

  // --- RESTORE SHIPPING INFO ON LOAD ---
  useEffect(() => {
    if (currentUser) {
        try {
            const savedInfo = localStorage.getItem(`shipping_${currentUser.uid}`);
            if (savedInfo) {
                setShippingInfo(JSON.parse(savedInfo));
            }
        } catch (e) { console.error("Error loading saved shipping info", e); }
    }
  }, [currentUser]);

  // Derived values
  const displayTax = billingMode === 'withBill' ? cartTotalTax : 0;
  const displayGrandTotal = billingMode === 'withBill' ? cartGrandTotal : cartSubtotal;

  // --- HANDLER: INPUT CHANGE ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // **VALIDATION LOGIC FOR PHONE NUMBER**
    if (name === 'phone') {
        // Remove any non-digit characters
        newValue = value.replace(/\D/g, '');
        // Limit to 10 digits
        if (newValue.length > 10) {
            newValue = newValue.slice(0, 10);
        }
    }

    const newInfo = { ...shippingInfo, [name]: newValue };
    setShippingInfo(newInfo);
    
    // SAVE SHIPPING INFO ON CHANGE
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
    
    // **VALIDATION CHECK BEFORE SUBMIT**
    if (shippingInfo.phone.length !== 10) {
        toast({ title: "Invalid Phone Number", description: "Please enter a valid 10-digit phone number.", status: "warning", duration: 3000, isClosable: true });
        return;
    }
    
    if (cartItems.length === 0 || !cartItems[0]?.productData?.catalogueId || !cartItems[0]?.productData?.sellerId) {
      toast({ title: "Invalid Cart", description: "Cart is empty or missing catalogue data.", status: "warning", duration: 3000, isClosable: true });
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
      totalAmount: displayGrandTotal,
      shippingAddress: shippingInfo,
      orderDate: Timestamp.fromDate(new Date()),
      status: "Placed",
    };

    try {
      const newOrderId = await runTransaction(db, async (transaction) => {
        const productUpdates = [];

        for (const item of cartItems) {
          const productRef = doc(db, "products", item.productId);
          const productSnap = await transaction.get(productRef);
          if (!productSnap.exists())
            throw new Error(`Product "${item.title}" not found.`);

          const productData = productSnap.data();
          const allowBackorder = productData.allowBackorders === true;

          if (item.variant) {
            const variantIndex = productData.variants?.findIndex(
              (v) =>
                JSON.stringify(v.options) ===
                JSON.stringify(item.variant.options)
            );
            if (variantIndex === -1 || variantIndex === undefined)
              throw new Error(`Variant not found for "${item.title}".`);

            const currentVariant = productData.variants[variantIndex];
            const currentInStock =
              currentVariant.inStock !== undefined
                ? currentVariant.inStock
                : productData.inStock;
            const currentQuantity = currentVariant.quantity || 0;

            if (!currentInStock && !allowBackorder)
              throw new Error(`Variant for "${item.title}" is out of stock.`);
            if (!allowBackorder && currentQuantity < item.quantity)
              throw new Error(`Insufficient stock for "${item.title}".`);

            const updatedVariants = [...productData.variants];
            const newQuantity = currentQuantity - item.quantity;
            updatedVariants[variantIndex] = {
              ...currentVariant,
              quantity: newQuantity,
              inStock: allowBackorder
                ? currentVariant.inStock
                : newQuantity > 0,
            };
            productUpdates.push({
              ref: productRef,
              data: { variants: updatedVariants },
            });
          } else {
            const currentInStock = productData.inStock;
            const currentQuantity = productData.availableQuantity || 0;

            if (!currentInStock && !allowBackorder)
              throw new Error(`Product "${item.title}" is out of stock.`);
            if (!allowBackorder && currentQuantity < item.quantity)
              throw new Error(`Insufficient stock for "${item.title}".`);

            const newQuantity = currentQuantity - item.quantity;
            productUpdates.push({
              ref: productRef,
              data: {
                availableQuantity: newQuantity,
                inStock: allowBackorder ? productData.inStock : newQuantity > 0,
              },
            });
          }
        }

        productUpdates.forEach((update) =>
          transaction.update(update.ref, update.data)
        );
        const newOrderRef = doc(
          collection(db, "catalogues", catalogueId, "orders")
        );
        transaction.set(newOrderRef, orderData);
        return newOrderRef.id;
      });

      // --- 2. NEW: TRIGGER NOTIFICATION ---
      // Remove 'await'. The code will trigger this and immediately move to the next line.
      axios
        .post("http://localhost:3001/api/notify-order", {
          orderId: newOrderId,
          amount: displayGrandTotal,
          customerName: shippingInfo.name,
        })
        .catch((err) => console.error("Notification Failed:", err));

      toast({
        title: "Order placed successfully!",
        description: `Order ID: ${newOrderId}`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      clearCart();
      navigate(`/order-details/${catalogueId}/${newOrderId}`);
    } catch (error) {
      console.error("Transaction failed: ", error);
      setError(`Order failed: ${error.message}`);
      toast({ title: "Error", description: error.message, status: "error", position: "top" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingProductData) return <SpinnerComponent />;
  if (cartItems.length === 0 && !isSubmitting) {
      return (
          <Container centerContent py={20}>
              <Heading size="md">Your cart is empty.</Heading>
              <Button mt={4} colorScheme="teal" onClick={() => navigate('/')}>Continue Shopping</Button>
          </Container>
      );
  }

  return (
    <Container maxW="container.xl" py={10}>
      <Heading mb={6}>Checkout</Heading>

      {error && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon />
          <AlertTitle mr={2}>Order Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
        <Box>
          <Box mb={8} p={5} borderWidth="1px" borderRadius="lg" borderColor="blue.200" bg="blue.50" shadow="sm">
            <Heading size="sm" mb={4} color="blue.800">1. Choose Billing Type</Heading>
            <RadioGroup onChange={setBillingMode} value={billingMode}>
                <Stack direction={{ base: 'column', sm: 'row' }} spacing={5}>
                    <Radio value='withBill' colorScheme='blue' size="lg" bg="white"><Box><Text fontWeight="bold">With Bill</Text><Text fontSize="xs" color="gray.600">Includes Taxes</Text></Box></Radio>
                    <Radio value='withoutBill' colorScheme='blue' size="lg" bg="white"><Box><Text fontWeight="bold">Without Bill</Text><Text fontSize="xs" color="gray.600">Tax Excluded</Text></Box></Radio>
                </Stack>
            </RadioGroup>
          </Box>

          <Heading size="md" mb={4}>2. Shipping Information</Heading>
          <form onSubmit={handlePlaceOrder}>
            <VStack spacing={4}>
              <FormControl isRequired id="name"><FormLabel>Full Name</FormLabel><Input name="name" bg="white" onChange={handleInputChange} value={shippingInfo.name} /></FormControl>
              
              {/* --- UPDATED PHONE INPUT --- */}
              <FormControl isRequired id="phone">
                  <FormLabel>
                      Phone Number 
                      <Text as="span" fontSize="xs" color="gray.500" fontWeight="normal" ml={2}>
                          (Enter 10 digit phone number)
                      </Text>
                  </FormLabel>
                  <Input 
                      name="phone" 
                      type="tel" 
                      bg="white" 
                      onChange={handleInputChange} 
                      value={shippingInfo.phone} 
                      placeholder="e.g. 9876543210"
                      maxLength={10} // HTML attribute limit
                  />
              </FormControl>
              {/* --- END UPDATE --- */}

              <FormControl isRequired id="address"><FormLabel>Address</FormLabel><Input name="address" bg="white" onChange={handleInputChange} value={shippingInfo.address} /></FormControl>
              <HStack w="full">
                <FormControl isRequired id="city"><FormLabel>City</FormLabel><Input name="city" bg="white" onChange={handleInputChange} value={shippingInfo.city} /></FormControl>
                <FormControl isRequired id="pincode"><FormLabel>Pincode</FormLabel><Input name="pincode" bg="white" onChange={handleInputChange} value={shippingInfo.pincode} /></FormControl>
              </HStack>
              <Button type="submit" colorScheme="teal" size="lg" w="full" mt={6} isLoading={isSubmitting} loadingText="Processing Order" disabled={isSubmitting || cartItems.length === 0 || loadingProductData}>
                Place Order - {formatCurrency(displayGrandTotal)}
              </Button>
            </VStack>
          </form>
        </Box>

        <Box>
          <Heading size="md" mb={4}>Order Summary</Heading>
          <VStack spacing={4} align="stretch" p={6} borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="gray.50" shadow="sm">
            <VStack spacing={3} align="stretch" divider={<Divider />}>
                {cartItems.map(item => {
                    const lineTotal = billingMode === 'withBill' ? item.priceDetails.lineItemTotal : item.priceDetails.lineItemSubtotal;
                    return (
                        <HStack key={item.cartId} justifyContent="space-between" fontSize="sm" align="start">
                            <Box flex={1}>
                                <Text fontWeight="semibold" noOfLines={2}>{item.title}</Text>
                                <Text fontSize="xs" color="gray.500">{item.variant ? `${Object.values(item.variant.options).join('/')}` : ''} {item.variant ? ' • ' : ''} Qty: {item.quantity}</Text>
                            </Box>
                            <Text fontWeight="bold" whiteSpace="nowrap">{formatCurrency(lineTotal)}</Text>
                        </HStack>
                    );
                })}
            </VStack>
            <Divider borderColor="gray.300" />
            <VStack spacing={2} align="stretch">
                 <HStack justifyContent="space-between"><Text color="gray.600">Subtotal (excl. tax)</Text><Text fontWeight="medium">{formatCurrency(cartSubtotal)}</Text></HStack>
                 <HStack justifyContent="space-between">
                     <Text color={billingMode === 'withBill' ? "gray.600" : "gray.400"}>Taxes {billingMode === 'withoutBill' && <Badge ml={2}>Excluded</Badge>}</Text>
                     <Text fontWeight="medium" color={billingMode === 'withBill' ? "black" : "gray.400"} textDecoration={billingMode === 'withoutBill' ? 'line-through' : 'none'}>{formatCurrency(cartTotalTax)}</Text>
                 </HStack>
                 <Divider borderColor="gray.300" />
                 <HStack justifyContent="space-between" pt={1}><Text fontWeight="bold" fontSize="xl">Grand Total</Text><Text fontWeight="bold" fontSize="xl" color="teal.600">{formatCurrency(displayGrandTotal)}</Text></HStack>
            </VStack>
          </VStack>
        </Box>
      </SimpleGrid>
    </Container>
  );
};

export default CheckoutPage;