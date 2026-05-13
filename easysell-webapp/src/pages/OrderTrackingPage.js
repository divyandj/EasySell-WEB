import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  Container, Heading, Text, VStack, Box, Center, Divider,
  SimpleGrid, Image, Flex, Alert, AlertIcon, AlertTitle,
  AlertDescription, HStack, Tooltip, useColorModeValue, Icon, Badge,
  Button, FormControl, FormLabel, Input, Link, useToast
} from '@chakra-ui/react';
import { FiCheck, FiPackage, FiClock, FiTruck, FiCheckCircle, FiMapPin, FiMessageCircle, FiPhone, FiAlertTriangle, FiUpload, FiX } from 'react-icons/fi';
import SpinnerComponent from '../components/Spinner';
import {
  getPaymentStatus,
  submitPaymentUtr,
  correctPaymentUtr,
  cancelPaymentOrder,
} from '../services/paymentApi';
import { uploadImageToCloudinary } from '../utils/cloudinaryUpload';

const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

const OrderTrackingPage = () => {
  const { catalogueId, orderId } = useParams();
  const navigate = useNavigate();
  const { currentUser, storeConfig } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [utrInput, setUtrInput] = useState('');
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [paymentProofUploading, setPaymentProofUploading] = useState(false);
  const [cancelOrderLoading, setCancelOrderLoading] = useState(false);
  const toast = useToast();

  const pageBg = useColorModeValue('#F8F9FC', '#09090B');
  const cardBg = useColorModeValue('white', '#111116');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const priceColor = useColorModeValue('brand.600', 'brand.300');
  const altBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const successColor = useColorModeValue('green.600', 'green.300');

  const paymentOrderId = order?.paymentOrderId || null;
  const effectivePaymentStatus = String(paymentInfo?.paymentStatus || order?.paymentStatus || '').toUpperCase();
  const hasPaymentSetupFailure = Boolean(order?.paymentIntegrationError);
  const hasPendingPayment = Boolean(paymentOrderId) && !['RECONCILED'].includes(effectivePaymentStatus);
  const showCompletePaymentCta = hasPaymentSetupFailure || hasPendingPayment;

  const canSubmitUtr = ['PENDING', 'UTR_SUBMITTED'].includes(paymentInfo?.paymentStatus || '');
  const canCorrectUtr = ['UTR_SUBMITTED', 'PAYMENT_UNDER_REVIEW'].includes(paymentInfo?.paymentStatus || '');

  // Order can be cancelled if status is Placed AND no payment has been made (PENDING or no paymentOrderId)
  const orderStatus = order?.status || '';
  const canCancelOrder = orderStatus === 'Placed' && (
    !paymentOrderId || effectivePaymentStatus === 'PENDING' || effectivePaymentStatus === ''
  );

  // Payment has progressed beyond PENDING — show Contact Support
  const paymentInProgress = ['UTR_SUBMITTED', 'PAYMENT_UNDER_REVIEW', 'RECONCILED', 'DISPUTED'].includes(effectivePaymentStatus);

  // Support contact info from store config
  const supportWhatsapp = storeConfig?.contactWhatsapp || storeConfig?.contactPhone || storeConfig?.phone || '';
  const supportPhone = storeConfig?.contactPhone || storeConfig?.phone || '';

  const syncPaymentStatus = useCallback(async (paymentOrderIdValue, orderDocId, orderCatalogueId) => {
    if (!paymentOrderIdValue || !currentUser) return;
    try {
      const statusData = await getPaymentStatus(currentUser, paymentOrderIdValue);
      setPaymentInfo(statusData);
      await setDoc(
        doc(db, 'catalogues', orderCatalogueId, 'orders', orderDocId),
        {
          paymentStatus: statusData?.paymentStatus || null,
          paymentUtrNumber: statusData?.utrNumber || null,
          paymentProofUrl: statusData?.paymentProofUrl || null,
          paymentCancelledAtMs: statusData?.cancelledAt || null,
          paymentExpiresAtMs: statusData?.expiresAt || null,
        },
        { merge: true }
      );
      setOrder((prev) => prev ? {
        ...prev,
        paymentStatus: statusData?.paymentStatus || prev.paymentStatus || null,
        paymentUtrNumber: statusData?.utrNumber || prev.paymentUtrNumber || null,
        paymentProofUrl: statusData?.paymentProofUrl || prev.paymentProofUrl || null,
        paymentCancelledAtMs: statusData?.cancelledAt || prev.paymentCancelledAtMs || null,
        paymentExpiresAtMs: statusData?.expiresAt || prev.paymentExpiresAtMs || null,
      } : prev);
      setPaymentProofUrl((prev) => String(statusData?.paymentProofUrl || prev || '').trim());
    } catch (statusError) {
      console.error('Payment status sync failed:', statusError?.response?.data || statusError.message || statusError);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) { setLoading(false); setError("Please log in to view orders."); return; }
    if (!orderId || !catalogueId) { setLoading(false); setError("Order ID or Catalogue ID is missing."); return; }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const orderRef = doc(db, 'catalogues', catalogueId, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          if (orderData.userId === currentUser.uid) {
            setOrder({ id: orderSnap.id, ...orderData });
            setPaymentProofUrl(String(orderData?.paymentProofUrl || '').trim());
            setPaymentProofPreview(String(orderData?.paymentProofUrl || '').trim());
            if (orderData.paymentOrderId) {
              await syncPaymentStatus(orderData.paymentOrderId, orderSnap.id, catalogueId);
            }
          } else {
            setError("Access Denied: You don't have permission to view this order.");
          }
        } else {
          setError(`Order "${orderId}" not found.`);
        }
      } catch (err) {
        setError("Failed to fetch order details.");
        console.error("Fetch Order Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, catalogueId, currentUser, syncPaymentStatus]);

  if (loading) return <SpinnerComponent />;

  if (error) {
    return (
      <Box bg={pageBg} minH="80vh">
        <Container maxW="container.lg" py={12}>
          <Alert status="error" borderRadius="12px">
            <AlertIcon />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </Container>
      </Box>
    );
  }

  if (!order) return <Center h="50vh" bg={pageBg}><Text color={mutedColor}>Order not found.</Text></Center>;

  const handlePaymentProofSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Screenshot must be under 5MB.', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    const preview = URL.createObjectURL(file);
    setPaymentProofFile(file);
    setPaymentProofPreview(preview);
    setPaymentProofUrl('');
  };

  const handleRemovePaymentProof = () => {
    if (paymentProofPreview && paymentProofPreview.startsWith('blob:')) {
      URL.revokeObjectURL(paymentProofPreview);
    }
    setPaymentProofFile(null);
    setPaymentProofPreview('');
    setPaymentProofUrl('');
  };

  const handlePaymentAction = async (mode) => {
    if (!paymentOrderId || !currentUser) return;
    const normalizedUtr = utrInput.trim();

    if (mode === 'correct' && !/^\d{12}$/.test(normalizedUtr)) {
      toast({ title: 'UTR must be exactly 12 digits.', status: 'warning', duration: 3000, isClosable: true });
      return;
    }
    if (mode === 'submit' && normalizedUtr && !/^\d{12}$/.test(normalizedUtr)) {
      toast({ title: 'UTR must be exactly 12 digits when provided.', status: 'warning', duration: 3000, isClosable: true });
      return;
    }

    setPaymentActionLoading(true);
    try {
      if (mode === 'submit') {
        let proofUrlToSend = String(paymentProofUrl || '').trim();
        if (!proofUrlToSend && paymentProofFile) {
          setPaymentProofUploading(true);
          proofUrlToSend = await uploadImageToCloudinary(paymentProofFile);
          setPaymentProofUrl(proofUrlToSend);
          setPaymentProofPreview(proofUrlToSend);
        }
        if (!proofUrlToSend) {
          throw new Error('Payment screenshot is required.');
        }
        await submitPaymentUtr(currentUser, paymentOrderId, normalizedUtr || null, proofUrlToSend);
        toast({ title: 'Payment proof submitted successfully.', status: 'success', duration: 3000, isClosable: true });
      } else if (mode === 'correct') {
        await correctPaymentUtr(currentUser, paymentOrderId, normalizedUtr);
        toast({ title: 'UTR corrected successfully.', status: 'success', duration: 3000, isClosable: true });
      }

      await syncPaymentStatus(paymentOrderId, order.id, catalogueId);
      setUtrInput('');
    } catch (actionErr) {
      const msg = actionErr?.response?.data?.message || actionErr.message || 'Payment action failed.';
      toast({ title: msg, status: 'error', duration: 4000, isClosable: true });
    } finally {
      setPaymentProofUploading(false);
      setPaymentActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !currentUser || !catalogueId) return;

    setCancelOrderLoading(true);
    try {
      // 1. If a payment order exists and is still PENDING, cancel the backend reservation
      if (paymentOrderId && effectivePaymentStatus === 'PENDING') {
        try {
          await cancelPaymentOrder(currentUser, paymentOrderId);
        } catch (cancelErr) {
          console.error('Payment cancel failed (may already be expired):', cancelErr?.response?.data || cancelErr.message);
          // Continue with Firestore order cancellation regardless
        }
      }

      // 2. Restore inventory stock (best-effort, skip infinite stock items)
      const items = order.items || [];
      for (const item of items) {
        try {
          const productRef = doc(db, 'products', item.productId);
          const productSnap = await getDoc(productRef);
          if (!productSnap.exists()) continue;

          const productData = productSnap.data();
          if (item.variant) {
            const variantIndex = productData.variants?.findIndex(
              (v) => JSON.stringify(v.options) === JSON.stringify(item.variant.options)
            );
            if (variantIndex === -1 || variantIndex === undefined) continue;
            const currentVariant = productData.variants[variantIndex];
            const isInfinite = currentVariant.quantity === -1;
            if (isInfinite) continue;

            const updatedVariants = [...productData.variants];
            const restoredQty = (currentVariant.quantity || 0) + item.quantity;
            updatedVariants[variantIndex] = {
              ...currentVariant,
              quantity: restoredQty,
              inStock: restoredQty > 0,
            };
            await updateDoc(productRef, { variants: updatedVariants });
          } else {
            const isInfinite = productData.availableQuantity === -1;
            if (isInfinite) continue;

            const restoredQty = (productData.availableQuantity || 0) + item.quantity;
            await updateDoc(productRef, {
              availableQuantity: restoredQty,
              inStock: restoredQty > 0,
            });
          }
        } catch (stockErr) {
          console.error(`Stock restore failed for ${item.productId}:`, stockErr);
          // Non-blocking — continue cancelling
        }
      }

      // 3. Update Firestore order status to Cancelled
      const orderRef = doc(db, 'catalogues', catalogueId, 'orders', order.id);
      await setDoc(orderRef, {
        status: 'Cancelled',
        cancelledAt: Timestamp.fromDate(new Date()),
        cancelledBy: 'buyer',
      }, { merge: true });

      setOrder((prev) => prev ? { ...prev, status: 'Cancelled', cancelledAt: Timestamp.fromDate(new Date()) } : prev);
      toast({ title: 'Order cancelled successfully.', description: 'Inventory has been restored.', status: 'success', duration: 4000, isClosable: true });
    } catch (err) {
      const msg = err?.message || 'Failed to cancel order.';
      toast({ title: msg, status: 'error', duration: 4000, isClosable: true });
    } finally {
      setCancelOrderLoading(false);
    }
  };

  const {
    shippingAddress = {},
    items = [],
    orderSubtotal = 0,
    orderTax = 0,
    rewardDiscount = 0,
    rewardRedeemed = null,
    totalAmount = 0,
    status = 'Unknown',
    orderDate
  } = order;
  const steps = ['Placed', 'Processing', 'Shipped', 'Delivered'];
  const currentIdx = steps.indexOf(status);
  const isCancelled = status === 'Cancelled';

  return (
    <Box minH="100vh" bg={pageBg} py={{ base: 6, md: 10 }}>
      <Container maxW="container.lg">
        <VStack spacing={6} align="stretch">

          {/* Header */}
          <Box p={6} borderWidth="1px" borderColor={borderColor} borderRadius="16px" bg={cardBg} boxShadow="card">
            <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
              <Box>
                <Heading fontSize={{ base: 'lg', md: 'xl' }} color={textColor} fontWeight="800" letterSpacing="-0.02em">
                  Order Details
                </Heading>
                <Text fontSize="xs" color={mutedColor} mt={1}>ID: {order.id}</Text>
                <Text fontSize="xs" color={mutedColor}>
                  {orderDate?.toDate ? orderDate.toDate().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                </Text>
              </Box>
              <Badge
                borderRadius="full"
                px={4}
                py={1.5}
                fontSize="xs"
                fontWeight="700"
                colorScheme={status === 'Placed' ? 'blue' : status === 'Processing' ? 'purple' : status === 'Shipped' ? 'orange' : status === 'Delivered' ? 'green' : status === 'Cancelled' ? 'red' : 'gray'}
              >
                {status}
              </Badge>
              {showCompletePaymentCta && (
                <Button size="sm" colorScheme="brand" onClick={() => navigate(`/order-payment/${catalogueId}/${orderId}`)}>
                  Complete Payment
                </Button>
              )}
              {canCancelOrder && (
                <Button size="sm" variant="outline" colorScheme="red" onClick={handleCancelOrder} isLoading={cancelOrderLoading}>
                  Cancel Order
                </Button>
              )}
            </Flex>
          </Box>

          {/* Progress Stepper */}
          <Box p={6} borderWidth="1px" borderColor={borderColor} borderRadius="16px" bg={cardBg} boxShadow="card">
            <Text fontSize="xs" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="0.1em" mb={5}>
              Order Progress
            </Text>

            <Box position="relative">
              {/* Track BG */}
              <Box position="absolute" top="16px" left="0" w="full" h="3px" bg={altBg} borderRadius="full" zIndex={0} />
              {/* Active */}
              <Box
                position="absolute"
                top="16px"
                left="0"
                w={isCancelled ? '0%' : currentIdx === 0 ? '10%' : currentIdx === 1 ? '40%' : currentIdx === 2 ? '70%' : currentIdx === 3 ? '100%' : '0%'}
                h="3px"
                bg={isCancelled ? 'red.400' : 'brand.500'}
                borderRadius="full"
                transition="width 0.8s ease"
              />

              <Flex justify="space-between" position="relative" zIndex={1}>
                {steps.map((step, index) => {
                  const isCompleted = currentIdx >= index;
                  const isCurrent = currentIdx === index;
                  const stepIcons = [FiPackage, FiClock, FiTruck, FiCheckCircle];

                  return (
                    <VStack key={step} spacing={2} align="center" w="24%">
                      <Flex
                        w={8} h={8}
                        borderRadius="full"
                        bg={isCancelled ? (index === 0 ? 'red.500' : altBg) : (isCompleted ? 'brand.500' : altBg)}
                        color={isCompleted || (isCancelled && index === 0) ? 'white' : mutedColor}
                        align="center" justify="center"
                        transition="all 0.3s"
                        boxShadow={isCurrent && !isCancelled ? '0 0 0 4px rgba(108,92,231,0.2)' : 'none'}
                      >
                        {isCompleted ? <Icon as={FiCheck} boxSize={3.5} /> : <Icon as={stepIcons[index]} boxSize={3.5} />}
                      </Flex>
                      <Text fontSize="xs" fontWeight={isCurrent ? "700" : "500"} color={isCurrent ? textColor : mutedColor} textAlign="center">
                        {step}
                      </Text>
                    </VStack>
                  );
                })}
              </Flex>

              {isCancelled && (
                <Center mt={5}>
                  <Badge colorScheme="red" borderRadius="full" px={4} py={1.5} fontSize="sm" fontWeight="700">
                    ORDER CANCELLED
                  </Badge>
                </Center>
              )}
            </Box>
          </Box>

          {/* Items */}
          <Box>
            <Text fontSize="xs" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="0.1em" mb={4}>
              Items ({items.length})
            </Text>
            <VStack spacing={3} align="stretch">
              {items.map((item, index) => {
                const priceDetails = item.priceDetails || {};
                const variantOptions = item.variant?.options ? Object.entries(item.variant.options).map(([key, value]) => `${key}: ${value}`).join(', ') : '';

                return (
                  <Flex
                    key={`${item.productId}-${index}`}
                    p={4}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="14px"
                    bg={cardBg}
                    align="center"
                    gap={4}
                    direction={{ base: 'column', sm: 'row' }}
                  >
                    <Image
                      src={item.imageUrl || item.variant?.imageUrl}
                      boxSize={{ base: "60px", md: "70px" }}
                      objectFit="cover"
                      borderRadius="10px"
                      fallbackSrc="https://via.placeholder.com/70"
                      flexShrink={0}
                    />
                    <Box flex="1" w="full">
                      <Text fontWeight="600" fontSize="sm" color={textColor} noOfLines={1}>{item.title}</Text>
                      {variantOptions && <Text fontSize="xs" color={mutedColor}>{variantOptions}</Text>}
                      <Text fontSize="xs" color={mutedColor}>Qty: {item.quantity}</Text>
                      {priceDetails.taxAmountUnit > 0 ? (
                      <Tooltip
                        label={`Unit: ${formatCurrency(priceDetails.effectiveUnitPricePreTax)} + Tax: ${formatCurrency(priceDetails.taxAmountUnit)} = ${formatCurrency(priceDetails.finalUnitPriceWithTax)}`}
                        placement='bottom-start' hasArrow
                      >
                        <Text fontSize="xs" color={mutedColor} cursor="help" mt={0.5}>
                          {formatCurrency(priceDetails.finalUnitPriceWithTax)} / unit
                        </Text>
                      </Tooltip>
                      ) : (
                        <Text fontSize="xs" color={mutedColor} mt={0.5}>
                          {formatCurrency(priceDetails.finalUnitPriceWithTax)} / unit
                        </Text>
                      )}
                    </Box>
                    <VStack align="end" spacing={0} flexShrink={0}>
                      <Text fontWeight="700" fontSize="sm" color={priceColor}>{formatCurrency(priceDetails.lineItemTotal)}</Text>
                      {priceDetails.lineItemTax > 0 && (
                        <Text fontSize="xs" color={mutedColor}>Tax: {formatCurrency(priceDetails.lineItemTax)}</Text>
                      )}
                    </VStack>
                  </Flex>
                );
              })}
            </VStack>
          </Box>

          {/* Summary */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box p={5} borderWidth="1px" borderColor={borderColor} borderRadius="16px" bg={cardBg} boxShadow="card">
              <HStack spacing={2} mb={3}>
                <Icon as={FiMapPin} color="brand.500" boxSize={4} />
                <Text fontSize="xs" fontWeight="700" color={mutedColor} textTransform="uppercase" letterSpacing="0.06em">Shipping Address</Text>
              </HStack>
              <VStack align="start" spacing={1} fontSize="sm" color={textColor}>
                <Text fontWeight="600">{shippingAddress.name}</Text>
                <Text color={mutedColor}>{shippingAddress.address}</Text>
                <Text color={mutedColor}>{shippingAddress.city}, {shippingAddress.pincode}</Text>
                <Text color={mutedColor}>Phone: {shippingAddress.phone}</Text>
                {order.transportName && (
                  <Text color={mutedColor} mt={2}>
                    <Text as="span" fontWeight="600" color={textColor}>Transport: </Text>
                    {order.transportName}
                  </Text>
                )}
              </VStack>
            </Box>
            <Box p={5} borderWidth="1px" borderColor={borderColor} borderRadius="16px" bg={altBg} boxShadow="card">
              <Text fontSize="xs" fontWeight="700" color={mutedColor} textTransform="uppercase" letterSpacing="0.06em" mb={3}>
                Order Totals
              </Text>
              <VStack align="stretch" spacing={2} fontSize="sm">
                <Flex justify="space-between"><Text color={mutedColor}>Subtotal</Text><Text fontWeight="600" color={textColor}>{formatCurrency(orderSubtotal)}</Text></Flex>
                {rewardDiscount > 0 && (
                  <Box>
                    <Flex justify="space-between" align="start">
                      <Text color={mutedColor}>Reward Discount</Text>
                      <Text fontWeight="700" color={successColor}>-{formatCurrency(rewardDiscount)}</Text>
                    </Flex>
                    {rewardRedeemed?.title && (
                      <Text fontSize="xs" color={mutedColor} mt={1} textAlign="right">
                        {rewardRedeemed.title}{rewardRedeemed.type ? ` • ${rewardRedeemed.type.replace('_', ' ')}` : ''}
                      </Text>
                    )}
                  </Box>
                )}
                {orderTax > 0 && (
                  <Flex justify="space-between"><Text color={mutedColor}>Tax</Text><Text fontWeight="600" color={textColor}>{formatCurrency(orderTax)}</Text></Flex>
                )}
                <Divider borderColor={borderColor} />
                <Flex justify="space-between" pt={1}>
                  <Text fontWeight="700" color={textColor}>Total</Text>
                  <Text fontWeight="800" fontSize="lg" color={priceColor}>{formatCurrency(totalAmount)}</Text>
                </Flex>
              </VStack>
            </Box>
          </SimpleGrid>

          {/* B2B Payment Panel */}
          {paymentOrderId && (
            <Box p={5} borderWidth="1px" borderColor={borderColor} borderRadius="16px" bg={cardBg} boxShadow="card">
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between" align="start">
                  <Box>
                    <Text fontSize="xs" fontWeight="700" color={mutedColor} textTransform="uppercase" letterSpacing="0.06em">
                      Payment Tracking
                    </Text>
                    <Text fontSize="xs" color={mutedColor} mt={1}>Payment Order ID: {paymentOrderId}</Text>
                  </Box>
                  <Badge colorScheme={paymentInfo?.paymentStatus === 'RECONCILED' ? 'green' : paymentInfo?.paymentStatus === 'DISPUTED' ? 'red' : 'blue'}>
                    {paymentInfo?.paymentStatus || order.paymentStatus || 'PENDING'}
                  </Badge>
                </HStack>

                {order.paymentUniquePayableAmount && (
                  <Text fontSize="sm" color={textColor}>Payable: {formatCurrency(Number(order.paymentUniquePayableAmount || 0))}</Text>
                )}

                {order.paymentUpiDeepLink && (
                  <Link href={order.paymentUpiDeepLink} color="brand.500" fontWeight="600" isExternal>
                    Open UPI App
                  </Link>
                )}

                <FormControl isRequired>
                  <FormLabel fontSize="xs" color={mutedColor}>Payment Screenshot (Required)</FormLabel>
                  {paymentProofPreview ? (
                    <Box position="relative" borderRadius="12px" overflow="hidden" borderWidth="1px" borderColor={borderColor}>
                      <Image src={paymentProofPreview} alt="Payment proof" maxW="280px" borderRadius="12px" />
                      <Button
                        size="xs"
                        colorScheme="red"
                        borderRadius="full"
                        position="absolute"
                        top={2}
                        right={2}
                        onClick={handleRemovePaymentProof}
                      >
                        <FiX />
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      variant="outline"
                      leftIcon={<FiUpload />}
                      onClick={() => document.getElementById('payment-proof-upload-track').click()}
                      isDisabled={paymentProofUploading}
                    >
                      Upload Screenshot
                    </Button>
                  )}
                  <Input
                    id="payment-proof-upload-track"
                    type="file"
                    accept="image/*"
                    onChange={handlePaymentProofSelect}
                    display="none"
                  />
                  <Text fontSize="xs" color={mutedColor} mt={1}>
                    Upload screenshot is mandatory. UTR is optional.
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" color={mutedColor}>UTR Number (Optional, 12 digits)</FormLabel>
                  <Input
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="Enter UTR (optional)"
                    maxLength={12}
                  />
                </FormControl>

                <HStack spacing={2} flexWrap="wrap">
                  <Button size="sm" colorScheme="blue" onClick={() => handlePaymentAction('submit')} isDisabled={!canSubmitUtr || paymentProofUploading} isLoading={paymentActionLoading || paymentProofUploading}>
                    Submit Payment Proof
                  </Button>
                  <Button size="sm" variant="outline" colorScheme="orange" onClick={() => handlePaymentAction('correct')} isDisabled={!canCorrectUtr} isLoading={paymentActionLoading}>
                    Correct UTR
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => syncPaymentStatus(paymentOrderId, order.id, catalogueId)} isLoading={paymentActionLoading}>
                    Refresh Status
                  </Button>
                </HStack>
              </VStack>
            </Box>
          )}

          {!paymentOrderId && hasPaymentSetupFailure && (
            <Alert status="warning" borderRadius="12px">
              <AlertIcon />
              <Box>
                <AlertTitle>Payment setup pending</AlertTitle>
                <AlertDescription>
                  {order.paymentIntegrationError || 'Payment is not set up for this order yet.'}
                </AlertDescription>
                <Button mt={3} size="sm" colorScheme="brand" onClick={() => navigate(`/order-payment/${catalogueId}/${orderId}`)}>
                  Open Payment Screen
                </Button>
              </Box>
            </Alert>
          )}

          {/* Contact Support — shown when payment has progressed beyond PENDING */}
          {paymentInProgress && (
            <Box p={5} borderWidth="1px" borderColor={borderColor} borderRadius="16px" bg={cardBg} boxShadow="card">
              <HStack spacing={2} mb={3}>
                <Icon as={FiAlertTriangle} color="orange.400" boxSize={4} />
                <Text fontSize="xs" fontWeight="700" color={mutedColor} textTransform="uppercase" letterSpacing="0.06em">
                  Need Help?
                </Text>
              </HStack>
              <Text fontSize="sm" color={mutedColor} mb={4}>
                Payment has been initiated. If you need to cancel or have any issues, please contact the store directly.
              </Text>
              <Flex gap={3} flexWrap="wrap">
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="brand"
                  onClick={() => navigate('/contact')}
                  leftIcon={<Icon as={FiPhone} />}
                >
                  Contact Support
                </Button>
                {supportWhatsapp && (
                  <Button
                    size="sm"
                    as="a"
                    href={`https://wa.me/${supportWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I need help with my order ${order.id}. Payment status: ${effectivePaymentStatus}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    bg="#25D366"
                    color="white"
                    _hover={{ bg: '#1DA851' }}
                    leftIcon={<Icon as={FiMessageCircle} />}
                  >
                    WhatsApp Support
                  </Button>
                )}
              </Flex>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default OrderTrackingPage;