import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Image,
  Input,
  Link,
  Text,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { db } from '../firebase';
import SpinnerComponent from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import {
  createPaymentOrder,
  cancelPaymentOrder,
  correctPaymentUtr,
  getPaymentApiErrorDetails,
  getPaymentStatus,
  submitPaymentUtr,
} from '../services/paymentApi';
import { resolveStoreContext } from '../utils/storeResolver';

const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

const RETRYABLE_PAYMENT_SETUP_CODES = new Set([
  'NO_BUCKET_AVAILABLE',
  'ORDER_TOO_LARGE_FOR_BUCKETS',
  'TRANSACTION_RETRY_EXHAUSTED',
  'SUFFIX_POOL_EXHAUSTED',
  'ORDER_CREATE_ATOMICITY_FAILED',
]);

const getSubdomain = () => {
  const context = resolveStoreContext();
  return (context.type === 'subdomain' || context.type === 'customDomain') ? context.handle || context.domain : null;
};

const OrderPaymentPage = () => {
  const { catalogueId, orderId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [utrInput, setUtrInput] = useState('');
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);
  const [paymentSetupLoading, setPaymentSetupLoading] = useState(false);

  const pageBg = useColorModeValue('#F8F9FC', '#09090B');
  const cardBg = useColorModeValue('white', '#111116');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  const paymentOrderId = order?.paymentOrderId || null;
  const paymentSetupStatus = order?.paymentSetupStatus || (paymentOrderId ? 'READY' : 'PENDING');
  const paymentSetupError = String(order?.paymentIntegrationError || '').trim();
  const paymentSetupErrorCode = String(order?.paymentIntegrationErrorCode || '').trim();
  const paymentSetupRetryable = Boolean(order?.paymentIntegrationRetryable);
  const effectivePaymentStatus = paymentInfo?.paymentStatus || order?.paymentStatus || 'PENDING';
  const canSubmitUtr = ['PENDING', 'UTR_SUBMITTED'].includes(effectivePaymentStatus);
  const canCorrectUtr = ['UTR_SUBMITTED', 'PAYMENT_UNDER_REVIEW'].includes(effectivePaymentStatus);
  const canCancelPayment = ['PENDING'].includes(effectivePaymentStatus);

  const resolveStoreHandleForPayment = () => {
    const fromOrder = String(order?.paymentStoreHandle || order?.storeHandle || '').trim().toLowerCase();
    const fromContext = String(getSubdomain() || '').trim().toLowerCase();
    return fromOrder || fromContext;
  };

  const syncPaymentStatus = useCallback(async (paymentOrderIdValue, orderDocId, orderCatalogueId) => {
    if (!paymentOrderIdValue || !currentUser) return;
    try {
      const statusData = await getPaymentStatus(currentUser, paymentOrderIdValue);
      setPaymentInfo(statusData);
      await setDoc(
        doc(db, 'catalogues', orderCatalogueId, 'orders', orderDocId),
        {
          paymentStatus: statusData?.paymentStatus || null,
          paymentCancelledAtMs: statusData?.cancelledAt || null,
          paymentExpiresAtMs: statusData?.expiresAt || null,
        },
        { merge: true }
      );
      setOrder((prev) => prev ? {
        ...prev,
        paymentStatus: statusData?.paymentStatus || prev.paymentStatus || null,
        paymentCancelledAtMs: statusData?.cancelledAt || prev.paymentCancelledAtMs || null,
        paymentExpiresAtMs: statusData?.expiresAt || prev.paymentExpiresAtMs || null,
      } : prev);
    } catch (statusError) {
      console.error('Payment status sync failed:', statusError?.response?.data || statusError.message || statusError);
      toast({ title: 'Could not refresh payment status.', status: 'warning', duration: 3000, isClosable: true });
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setError('Please log in to continue.');
      return;
    }

    if (!catalogueId || !orderId) {
      setLoading(false);
      setError('Order details are missing.');
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const orderRef = doc(db, 'catalogues', catalogueId, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
          setError('Order not found.');
          return;
        }

        const orderData = orderSnap.data();
        if (orderData.userId !== currentUser.uid) {
          setError('Access denied for this order.');
          return;
        }

        setOrder({ id: orderSnap.id, ...orderData });

        if (orderData.paymentOrderId) {
          await syncPaymentStatus(orderData.paymentOrderId, orderSnap.id, catalogueId);
        }
      } catch (fetchError) {
        console.error('Fetch payment screen order failed:', fetchError);
        setError('Failed to load payment details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [catalogueId, currentUser, orderId, syncPaymentStatus]);

  const handlePaymentAction = async (mode) => {
    if (!paymentOrderId || !currentUser) return;

    const normalizedUtr = utrInput.trim();
    if ((mode === 'submit' || mode === 'correct') && !/^\d{12}$/.test(normalizedUtr)) {
      toast({ title: 'UTR must be exactly 12 digits.', status: 'warning', duration: 3000, isClosable: true });
      return;
    }

    setPaymentActionLoading(true);
    try {
      if (mode === 'submit') {
        await submitPaymentUtr(currentUser, paymentOrderId, normalizedUtr);
        toast({ title: 'UTR submitted successfully.', status: 'success', duration: 3000, isClosable: true });
      } else if (mode === 'correct') {
        await correctPaymentUtr(currentUser, paymentOrderId, normalizedUtr);
        toast({ title: 'UTR corrected successfully.', status: 'success', duration: 3000, isClosable: true });
      } else if (mode === 'cancel') {
        await cancelPaymentOrder(currentUser, paymentOrderId);
        toast({ title: 'Payment order cancelled.', status: 'success', duration: 3000, isClosable: true });
      }

      await syncPaymentStatus(paymentOrderId, order.id, catalogueId);
      setUtrInput('');
    } catch (actionError) {
      const message = actionError?.response?.data?.message || actionError.message || 'Payment action failed.';
      toast({ title: message, status: 'error', duration: 4000, isClosable: true });
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const handleRetryPaymentSetup = async () => {
    if (!order || !currentUser) return;

    const orderAmount = Number(order?.totalAmount || order?.paymentUniquePayableAmount || 0);
    if (orderAmount <= 0) {
      toast({ title: 'Order amount is invalid for payment setup.', status: 'error', duration: 4000, isClosable: true });
      return;
    }

    const storeHandle = resolveStoreHandleForPayment();
    const orderRef = doc(db, 'catalogues', catalogueId, 'orders', order.id);

    setPaymentSetupLoading(true);
    try {
      const paymentData = await createPaymentOrder(currentUser, {
        buyerId: currentUser.uid,
        orderAmount,
        storeHandle,
      });

      if (!paymentData?.orderId) {
        throw new Error('Payment setup did not return an order id.');
      }

      const setupAt = Timestamp.fromDate(new Date());
      const nextOrderPatch = {
        paymentOrderId: paymentData.orderId,
        paymentStatus: 'PENDING',
        paymentUniquePayableAmount: paymentData.uniquePayableAmount || null,
        paymentQrImageUrl: paymentData.qrImageUrl || null,
        paymentUpiDeepLink: paymentData.upiDeepLink || null,
        paymentExpiresAtMs: paymentData.expiresAt || null,
        paymentCreatedAt: setupAt,
        paymentSetupStatus: 'READY',
        paymentIntegrationError: null,
        paymentIntegrationErrorCode: null,
        paymentIntegrationRetryable: false,
        paymentSetupLastAttemptAt: setupAt,
        paymentStoreHandle: storeHandle || null,
      };

      await setDoc(orderRef, nextOrderPatch, { merge: true });
      setOrder((prev) => prev ? { ...prev, ...nextOrderPatch } : prev);
      setPaymentInfo({ paymentStatus: 'PENDING' });
      toast({ title: 'Payment setup completed. You can pay now.', status: 'success', duration: 3500, isClosable: true });
    } catch (setupError) {
      const { code, message } = getPaymentApiErrorDetails(setupError);
      const retryable = RETRYABLE_PAYMENT_SETUP_CODES.has(code);

      const failurePatch = {
        paymentSetupStatus: 'FAILED',
        paymentIntegrationError: String(message),
        paymentIntegrationErrorCode: code,
        paymentIntegrationRetryable: retryable,
        paymentSetupLastAttemptAt: Timestamp.fromDate(new Date()),
        paymentStoreHandle: storeHandle || null,
      };

      await setDoc(orderRef, failurePatch, { merge: true });
      setOrder((prev) => prev ? { ...prev, ...failurePatch } : prev);
      toast({
        title: 'Payment setup failed',
        description: message,
        status: retryable ? 'warning' : 'error',
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setPaymentSetupLoading(false);
    }
  };

  if (loading) return <SpinnerComponent />;

  return (
    <Box bg={pageBg} minH="100vh" py={{ base: 6, md: 10 }}>
      <Container maxW="container.md">
        <VStack spacing={5} align="stretch">
          <Box p={6} borderWidth="1px" borderColor={borderColor} borderRadius="16px" bg={cardBg} boxShadow="card">
            <HStack justify="space-between" align="start" flexWrap="wrap" spacing={4}>
              <Box>
                <Heading fontSize={{ base: 'lg', md: 'xl' }} color={textColor} fontWeight="800" letterSpacing="-0.02em">
                  Complete Payment
                </Heading>
                <Text fontSize="sm" color={mutedColor} mt={1}>
                  Order ID: {orderId}
                </Text>
                <Text fontSize="xs" color={mutedColor} mt={1}>
                  Setup Status: {paymentSetupStatus}
                </Text>
              </Box>
              <HStack spacing={2}>
                {!paymentOrderId && (
                  <Button size="sm" colorScheme="brand" onClick={handleRetryPaymentSetup} isLoading={paymentSetupLoading}>
                    Retry Payment Setup
                  </Button>
                )}
                <Button size="sm" variant="outline" colorScheme="brand" onClick={() => navigate(`/order-details/${catalogueId}/${orderId}`)}>
                  View Order Details
                </Button>
              </HStack>
            </HStack>
          </Box>

          {error && (
            <Alert status="error" borderRadius="12px">
              <AlertIcon />
              <AlertTitle mr={2}>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!error && !paymentOrderId && (
            <Alert status={paymentSetupStatus === 'FAILED' ? 'warning' : 'info'} borderRadius="12px">
              <AlertIcon />
              <Box>
                <AlertTitle>No payment order found</AlertTitle>
                <AlertDescription>
                  Payment setup is currently unavailable for this order. Retry setup to continue with payment.
                </AlertDescription>
                {paymentSetupError && (
                  <Text fontSize="sm" mt={2} color={textColor}>
                    {paymentSetupErrorCode ? `[${paymentSetupErrorCode}] ` : ''}{paymentSetupError}
                  </Text>
                )}
                <HStack mt={3} spacing={2}>
                  <Button size="sm" colorScheme="brand" onClick={handleRetryPaymentSetup} isLoading={paymentSetupLoading}>
                    Retry Payment Setup
                  </Button>
                  {paymentSetupRetryable && (
                    <Badge colorScheme="yellow">Retryable</Badge>
                  )}
                </HStack>
              </Box>
            </Alert>
          )}

          {!error && paymentOrderId && (
            <Box p={6} borderWidth="1px" borderColor={borderColor} borderRadius="16px" bg={cardBg} boxShadow="card">
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between" align="start">
                  <Box>
                    <Text fontSize="xs" fontWeight="700" color={mutedColor} textTransform="uppercase" letterSpacing="0.06em">
                      Payment Tracking
                    </Text>
                    <Text fontSize="xs" color={mutedColor} mt={1}>
                      Payment Order ID: {paymentOrderId}
                    </Text>
                  </Box>
                  <Badge colorScheme={effectivePaymentStatus === 'RECONCILED' ? 'green' : effectivePaymentStatus === 'DISPUTED' ? 'red' : 'blue'}>
                    {effectivePaymentStatus}
                  </Badge>
                </HStack>

                <Text fontSize="sm" color={textColor}>
                  Payable: {formatCurrency(Number(order?.paymentUniquePayableAmount || order?.totalAmount || 0))}
                </Text>

                {order?.paymentQrImageUrl && (
                  <Box>
                    <Text fontSize="xs" color={mutedColor} mb={2}>Scan to Pay</Text>
                    <Image
                      src={order.paymentQrImageUrl}
                      alt="UPI Payment QR"
                      maxW="260px"
                      borderRadius="12px"
                      borderWidth="1px"
                      borderColor={borderColor}
                    />
                  </Box>
                )}

                {order?.paymentUpiDeepLink && (
                  <Link href={order.paymentUpiDeepLink} isExternal color="brand.500" fontWeight="600" w="fit-content">
                    Open UPI App
                  </Link>
                )}

                <FormControl>
                  <FormLabel fontSize="xs" color={mutedColor}>UTR Number (12 digits)</FormLabel>
                  <Input
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="Enter UTR"
                    maxLength={12}
                  />
                </FormControl>

                <HStack spacing={2} flexWrap="wrap">
                  <Button size="sm" colorScheme="blue" onClick={() => handlePaymentAction('submit')} isDisabled={!canSubmitUtr} isLoading={paymentActionLoading}>
                    Submit UTR
                  </Button>
                  <Button size="sm" variant="outline" colorScheme="orange" onClick={() => handlePaymentAction('correct')} isDisabled={!canCorrectUtr} isLoading={paymentActionLoading}>
                    Correct UTR
                  </Button>
                  <Button size="sm" variant="outline" colorScheme="red" onClick={() => handlePaymentAction('cancel')} isDisabled={!canCancelPayment} isLoading={paymentActionLoading}>
                    Cancel Payment
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => syncPaymentStatus(paymentOrderId, order.id, catalogueId)} isLoading={paymentActionLoading}>
                    Refresh Status
                  </Button>
                </HStack>
              </VStack>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default OrderPaymentPage;