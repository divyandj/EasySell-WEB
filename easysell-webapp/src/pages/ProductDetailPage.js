import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Box,
  Container,
  Flex,
  Image,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  useToast,
  SimpleGrid,
  AspectRatio,
  Input,
  Divider,
  Center,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Alert,
  AlertIcon,
  useColorModeValue,
  Skeleton,
  keyframes,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton
} from '@chakra-ui/react';
import { FiPlayCircle, FiShoppingCart, FiCheckCircle, FiXCircle, FiClock, FiLock, FiInfo, FiArrowUp, FiMaximize2, FiShield, FiTruck, FiRefreshCw, FiMinus, FiPlus } from 'react-icons/fi';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import SpinnerComponent from '../components/Spinner';

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;
const bounceAnimation = `${bounce} 1.5s infinite`;

// Helper to format currency
const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

const ProductDetailPage = () => {
  // --- STATE MANAGEMENT ---
  const { productId } = useParams();
  const { addToCart } = useCart();
  const { currentUser, userData, storeConfig } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeMedia, setActiveMedia] = useState(null);

  const isPublicStore = storeConfig?.storeMode === 'public';
  const isApprovedBuyer = currentUser && userData && userData.status === 'approved';
  const hasAccess = isPublicStore || isApprovedBuyer;

  // --- THEME COLORS ---
  const pageBg = useColorModeValue('#F8F9FC', '#09090B');
  const cardBg = useColorModeValue('white', '#111116');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  const textPrimary = useColorModeValue('gray.800', 'white');
  const textSecondary = useColorModeValue('gray.600', 'gray.300');
  const textMuted = useColorModeValue('gray.500', 'gray.400');
  const alternateRowBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const promptBg = useColorModeValue('brand.50', 'whiteAlpha.50');
  const imageBg = useColorModeValue('gray.50', '#0D0D12');
  const trustBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const hoverBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const quantityInputBgActive = useColorModeValue('blackAlpha.50', 'whiteAlpha.100');

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const productData = { id: productSnap.id, ...productSnap.data() };
          setProduct(productData);
          if (productData.minOrderQty > 1) setQuantity(productData.minOrderQty);
          else setQuantity(1);
        } else {
          setError('Product not found.');
        }
      } catch (err) {
        setError('Failed to fetch product details.');
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchProduct();
    else { setError('Product ID is missing.'); setLoading(false); }
  }, [productId]);

  // --- VARIANT SELECTION ---
  useEffect(() => {
    if (product?.hasVariants && product.variantOptions && Object.keys(selectedOptions).length === Object.keys(product.variantOptions).length) {
      const foundVariant = product.variants?.find(variant =>
        Object.entries(selectedOptions).every(([key, value]) => variant?.options?.[key] === value)
      );
      setSelectedVariant(foundVariant || 'unavailable');
    } else {
      setSelectedVariant(null);
    }
  }, [selectedOptions, product]);

  // --- MEDIA GALLERY ---
  const displayMedia = useMemo(() => {
    if (!product) return [];
    let allMedia = [...(product.media || [])].filter(item => item && item.url);
    if (selectedVariant && selectedVariant !== 'unavailable' && selectedVariant.imageUrl) {
      const variantMedia = { url: selectedVariant.imageUrl, type: 'image' };
      if (variantMedia.url && (!allMedia.length || allMedia[0]?.url !== variantMedia.url)) {
        allMedia = allMedia.filter(item => item.url !== variantMedia.url);
        allMedia.unshift(variantMedia);
      }
    }
    return allMedia;
  }, [product, selectedVariant]);

  useEffect(() => {
    if (selectedVariant && selectedVariant !== 'unavailable' && selectedVariant.imageUrl) {
      setActiveMedia({ url: selectedVariant.imageUrl, type: 'image' });
    } else if (displayMedia.length > 0) {
      setActiveMedia(displayMedia[0]);
    } else {
      setActiveMedia(null);
    }
  }, [selectedVariant, displayMedia]);

  // --- EVENT HANDLERS ---
  const handleOptionSelect = (optionName, value) => {
    setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
  };

  const handleAddToCart = () => {
    if (!hasAccess) return;
    if (isPublicStore && !currentUser) {
      toast({
        title: "Please login to add to cart.",
        status: "info",
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return navigate('/login', { state: { from: location } });
    }

    const itemToAdd = product;
    const variantInfo = selectedVariant && selectedVariant !== 'unavailable' ? selectedVariant : null;
    addToCart(itemToAdd, quantity, variantInfo);
    toast({
      title: `Added to cart!`,
      description: `${quantity} x ${product.title} has been added.`,
      status: "success",
      duration: 3000,
      isClosable: true,
      position: 'top'
    });
  };

  const getVariantPriceDiff = (optionName, value) => {
    if (!product?.variants) return null;
    const tempOptions = { ...selectedOptions, [optionName]: value };
    const requiredKeys = Object.keys(product.variantOptions || {});
    const potentialVariant = product.variants.find(v =>
      requiredKeys.every(key => v.options[key] === tempOptions[key])
    );
    if (potentialVariant && potentialVariant.priceModifier !== 0) {
      return potentialVariant.priceModifier;
    }
    return null;
  };

  // --- DERIVED STATE / LOGIC ---
  const displayDetails = useMemo(() => {
    if (!product) return {};

    const isVariantSelected = product.hasVariants && selectedVariant && selectedVariant !== 'unavailable';
    const inventoryOff = storeConfig?.inventoryTracking === false;
    const allowBackorder = inventoryOff ? false : (product.allowBackorders === true);

    const variantQty = isVariantSelected ? (selectedVariant.quantity) : undefined;
    const productQty = product.availableQuantity;
    const relevantQty = isVariantSelected ? variantQty : productQty;
    const isUnlimitedStock = relevantQty === -1;

    let effectiveInStock = false;
    if (isUnlimitedStock) effectiveInStock = true;
    else {
      const variantFlag = isVariantSelected ? selectedVariant.inStock : undefined;
      if (variantFlag !== undefined) effectiveInStock = variantFlag;
      else effectiveInStock = product.inStock === true;
    }

    const availableQty = isUnlimitedStock ? Infinity : (relevantQty || 0);
    const minQty = product.minOrderQty > 0 ? product.minOrderQty : 1;
    const canMeetMOQ = inventoryOff || allowBackorder || isUnlimitedStock || availableQty >= minQty;

    if (!canMeetMOQ) {
      effectiveInStock = false;
    }

    let stockStatus, stockColor, stockIcon, buttonText, buttonColorScheme;

    if (inventoryOff || effectiveInStock) {
      stockStatus = 'In Stock';
      stockColor = 'green';
      stockIcon = FiCheckCircle;
      buttonText = 'Add to Cart';
      buttonColorScheme = 'brand';
    }
    else if (allowBackorder) {
      stockStatus = 'Available for Pre-Order';
      stockColor = 'orange';
      stockIcon = FiClock;
      buttonText = 'Pre-Order Now';
      buttonColorScheme = 'orange';
    }
    else {
      stockStatus = (!canMeetMOQ && availableQty > 0) ? `Min order ${minQty}, but only ${availableQty} left` : 'Out of Stock';
      stockColor = 'red';
      stockIcon = FiXCircle;
      buttonText = 'Sold Out';
      buttonColorScheme = 'gray';
    }

    const basePrice = product.price > 0 ? product.price : 0;
    const discountedPriceValue = product.discountedPrice > 0 && product.discountedPrice < basePrice ? product.discountedPrice : null;
    const priceBeforeVariant = discountedPriceValue ?? basePrice;
    const priceModifier = isVariantSelected ? selectedVariant.priceModifier || 0 : 0;

    const effectivePricePreTax = priceBeforeVariant + priceModifier;
    const taxRatePercent = (product.taxRate || 0);
    const taxRateDecimal = taxRatePercent / 100;
    const taxAmount = effectivePricePreTax * taxRateDecimal;
    const finalPriceWithTax = effectivePricePreTax + taxAmount;

    const originalPriceWithTax = (basePrice + priceModifier) * (1 + taxRateDecimal);
    const showStrikeThrough = discountedPriceValue !== null;

    const isAddToCartDisabled = inventoryOff
      ? (product.hasVariants && !isVariantSelected)
      : ((product.hasVariants && !isVariantSelected) || (!effectiveInStock && !allowBackorder));

    const maxQty = inventoryOff ? undefined : ((isUnlimitedStock || allowBackorder) ? undefined : (availableQty < minQty ? minQty : availableQty));

    return {
      finalPriceWithTax,
      effectivePricePreTax,
      taxAmount,
      taxRatePercent,
      originalPriceWithTax,
      showStrikeThrough,
      stockStatus, stockColor, stockIcon,
      buttonText, buttonColorScheme,
      isAddToCartDisabled,
      minQty, maxQty, availableQty, isUnlimitedStock,
      isBackorder: !inventoryOff && !effectiveInStock && allowBackorder,
      inventoryOff
    };
  }, [product, selectedVariant]);

  // Removed aggressive quantity clamp useEffect here so user can clear the input while typing.

  if (loading) return <SpinnerComponent />;
  if (error) return (
    <Center h="80vh" bg={pageBg}>
      <VStack spacing={4}>
        <Text color="red.500" fontWeight="600">{error}</Text>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </VStack>
    </Center>
  );
  if (!product) return <Center h="80vh" bg={pageBg}><Text color={textMuted}>Product not found.</Text></Center>;

  return (
    <Box minH="100vh" bg={pageBg} py={{ base: 4, md: 10 }}>
      <Container maxW="container.xl">
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 6, lg: 12 }}>

          {/* ====== LEFT COLUMN: MEDIA GALLERY ====== */}
          <VStack spacing={3} align="stretch" position={{ base: 'relative', lg: 'sticky' }} top={{ lg: '80px' }} h="max-content">
            <AspectRatio ratio={1} w="100%">
              <Box
                bg={imageBg}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="20px"
                overflow="hidden"
                position="relative"
                role="group"
              >
                {!activeMedia ? (
                  <Skeleton height="100%" borderRadius="20px" />
                ) : activeMedia.type === 'video' ? (
                  <Box as="video" src={activeMedia.url} controls autoPlay muted loop playsInline width="100%" height="100%" objectFit="contain" />
                ) : (
                  <Image src={activeMedia.url} alt={product.title} objectFit="contain" w="100%" h="100%" fallbackSrc="https://placehold.co/600x600?text=No+Image" cursor="zoom-in" onClick={onOpen} transition="transform 0.3s" _hover={{ transform: 'scale(1.02)' }} />
                )}
                {activeMedia && activeMedia.type !== 'video' && (
                  <IconButton
                    aria-label="View Fullscreen"
                    icon={<FiMaximize2 />}
                    position="absolute"
                    top="4"
                    right="4"
                    onClick={(e) => { e.stopPropagation(); onOpen(); }}
                    opacity="0"
                    _groupHover={{ opacity: 1 }}
                    transition="opacity 0.2s"
                    bg="blackAlpha.500"
                    color="white"
                    _hover={{ bg: "blackAlpha.700" }}
                    rounded="full"
                    size="sm"
                  />
                )}
              </Box>
            </AspectRatio>

            {/* Thumbnails */}
            {displayMedia.length > 1 && (
              <HStack spacing={2} overflowX="auto" py={1} css={{ '&::-webkit-scrollbar': { display: 'none' } }}>
                {displayMedia.map((mediaItem) => (
                  <Box
                    key={mediaItem.url}
                    as="button"
                    w="68px"
                    h="68px"
                    minW="68px"
                    borderWidth="2px"
                    borderRadius="12px"
                    overflow="hidden"
                    position="relative"
                    borderColor={activeMedia?.url === mediaItem.url ? 'brand.500' : borderColor}
                    onClick={() => setActiveMedia(mediaItem)}
                    transition="border-color 0.2s"
                    _hover={{ borderColor: 'brand.400' }}
                  >
                    {mediaItem.type === 'video' ? (
                      <Center w="full" h="full" bg={imageBg}><Icon as={FiPlayCircle} color={textMuted} /></Center>
                    ) : (
                      <Image src={mediaItem.url} objectFit="cover" w="100%" h="100%" />
                    )}
                  </Box>
                ))}
              </HStack>
            )}
          </VStack>

          {/* ====== RIGHT COLUMN: BUYING CONTEXT ====== */}
          <VStack align="stretch" spacing={5}>
            {/* Header */}
            <Box>
              {product.category && (
                <Badge
                  bg="brand.50"
                  color="brand.600"
                  rounded="full"
                  px={3}
                  py={1}
                  mb={3}
                  fontSize="xs"
                  fontWeight="700"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                >
                  {product.category}
                </Badge>
              )}
              <Heading
                as="h1"
                fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
                fontWeight="800"
                lineHeight="1.2"
                letterSpacing="-0.02em"
                color={textPrimary}
                mb={3}
              >
                {product.title}
              </Heading>

              {/* Stock */}
              {!displayDetails.inventoryOff && (
              <HStack spacing={2}>
                <Flex
                  w={6}
                  h={6}
                  borderRadius="full"
                  bg={`${displayDetails.stockColor}.50`}
                  color={`${displayDetails.stockColor}.500`}
                  align="center"
                  justify="center"
                >
                  <Icon as={displayDetails.stockIcon} boxSize={3.5} />
                </Flex>
                <Text fontWeight="600" fontSize="sm" color={`${displayDetails.stockColor}.500`}>
                  {displayDetails.stockStatus}
                </Text>
              </HStack>
              )}
            </Box>

            {/* ======== PRICE CARD ======== */}
            <Box
              p={5}
              bg={cardBg}
              borderRadius="16px"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="card"
            >
              {hasAccess ? (
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color={textMuted} fontWeight="600" textTransform="uppercase" letterSpacing="0.06em">
                    {displayDetails.taxRatePercent > 0 ? 'Price (incl. tax)' : 'Price'}
                  </Text>
                  <HStack align="baseline" spacing={3}>
                    <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800" color={textPrimary} lineHeight="1">
                      {formatCurrency(displayDetails.finalPriceWithTax)}
                    </Text>
                    {displayDetails.showStrikeThrough && (
                      <Text as="s" color="gray.400" fontSize="lg">
                        {formatCurrency(displayDetails.originalPriceWithTax)}
                      </Text>
                    )}
                    {displayDetails.showStrikeThrough && (
                      <Badge colorScheme="green" borderRadius="full" fontSize="xs">
                        {Math.round((1 - displayDetails.finalPriceWithTax / displayDetails.originalPriceWithTax) * 100)}% OFF
                      </Badge>
                    )}
                  </HStack>
                  {displayDetails.taxRatePercent > 0 && (
                    <Text fontSize="xs" color={textMuted}>
                      {formatCurrency(displayDetails.effectivePricePreTax)} + ₹{displayDetails.taxAmount?.toFixed(2)} tax ({displayDetails.taxRatePercent}%)
                    </Text>
                  )}
                </VStack>
              ) : (
                <HStack spacing={3} color={textMuted} py={2}>
                  <Icon as={FiLock} boxSize={5} />
                  <Text fontSize="md" fontWeight="500">
                    {currentUser
                      ? (userData?.status === 'pending'
                        ? "Verification Pending"
                        : (userData?.status === 'rejected'
                          ? "Verification Rejected"
                          : "Request access to view pricing"))
                      : "Login to view pricing"}
                  </Text>
                </HStack>
              )}
            </Box>

            {/* ======== VARIANT SELECTOR ======== */}
            {product.hasVariants && product.variantOptions && (
              <VStack align="start" spacing={4}>
                {Object.entries(product.variantOptions).map(([optionName, values]) => (
                  <Box key={optionName} w="full">
                    <HStack mb={2.5} justify="space-between">
                      <Text fontWeight="700" fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color={textMuted}>
                        {optionName}
                      </Text>
                      {selectedOptions[optionName] && (
                        <Text fontSize="xs" fontWeight="600" color="brand.500">{selectedOptions[optionName]}</Text>
                      )}
                    </HStack>

                    <Flex wrap="wrap" gap={2}>
                      {values.map(value => {
                        const isSelected = selectedOptions[optionName] === value;
                        const priceDiff = getVariantPriceDiff(optionName, value);

                        return (
                          <Box
                            as="button"
                            key={value}
                            onClick={() => handleOptionSelect(optionName, value)}
                            borderRadius="12px"
                            px={5}
                            py={2.5}
                            minW="70px"
                            fontSize="sm"
                            fontWeight="600"
                            transition="all 0.2s"
                            borderWidth="1.5px"
                            bg={isSelected ? 'brand.50' : 'transparent'}
                            borderColor={isSelected ? 'brand.500' : borderColor}
                            color={isSelected ? 'brand.600' : textPrimary}
                            boxShadow={isSelected ? '0 0 0 1px var(--chakra-colors-brand-500)' : 'none'}
                            _hover={{
                              borderColor: isSelected ? 'brand.600' : 'gray.300',
                              bg: isSelected ? 'brand.100' : hoverBg
                            }}
                            _active={{ transform: 'scale(0.96)' }}
                            textAlign="center"
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            gap={0.5}
                          >
                            <Text lineHeight="1">{value}</Text>
                            {hasAccess && priceDiff !== null && (
                              <Text fontSize="xs" color={priceDiff > 0 ? "orange.500" : "green.500"} fontWeight="700">
                                {priceDiff > 0 ? '+' : ''}{formatCurrency(priceDiff)}
                              </Text>
                            )}
                          </Box>
                        )
                      })}
                    </Flex>
                  </Box>
                ))}

                {selectedVariant === 'unavailable' && (
                  <Text color="red.500" fontSize="sm" fontWeight="500">This combination is unavailable.</Text>
                )}

                {product.hasVariants && !selectedVariant && (
                  <Flex
                    w="full"
                    p={3}
                    borderRadius="12px"
                    bg={promptBg}
                    borderWidth="1px"
                    borderColor="brand.200"
                    align="center"
                    gap={3}
                  >
                    <Icon as={FiArrowUp} color="brand.500" boxSize={4} animation={bounceAnimation} />
                    <Text fontSize="sm" fontWeight="600" color="brand.600">
                      Select {Object.entries(product.variantOptions).filter(([k]) => !selectedOptions[k]).map(([k]) => k).join(' & ')} above
                    </Text>
                  </Flex>
                )}
              </VStack>
            )}

            {/* Backorder Alert */}
            {!displayDetails.inventoryOff && displayDetails.isBackorder && (
              <Alert status="warning" variant="left-accent" borderRadius="12px" py={2.5} fontSize="sm">
                <AlertIcon />
                Pre-order item. Shipping may be delayed.
              </Alert>
            )}

            {/* ======== ACTION BAR ======== */}
            <Flex gap={3} pt={1} align="stretch" w="full">
              {hasAccess ? (
                <>
                  <HStack
                    spacing={0}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="12px"
                    overflow="hidden"
                    h="52px"
                    w="130px"
                    flexShrink={0}
                  >
                    <IconButton
                      icon={<FiMinus size="16px" />}
                      aria-label="Decrease"
                      variant="ghost"
                      color={textPrimary}
                      h="full"
                      w="40px"
                      borderRadius="0"
                      onClick={() => setQuantity(Math.max(displayDetails.minQty, quantity - 1))}
                      isDisabled={quantity <= displayDetails.minQty}
                      _hover={{ bg: hoverBg }}
                    />
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setQuantity(val);
                        else setQuantity('');
                      }}
                      onBlur={() => {
                        let val = parseInt(quantity, 10);
                        if (isNaN(val) || val < displayDetails.minQty) {
                          val = displayDetails.minQty;
                          toast({
                            title: `Minimum Order Quantity is ${displayDetails.minQty}`,
                            status: 'info',
                            duration: 3000,
                            isClosable: true,
                            position: 'top-right'
                          });
                        }
                        if (displayDetails.maxQty && val > displayDetails.maxQty) val = displayDetails.maxQty;
                        setQuantity(val);
                      }}
                      flex="1"
                      h="full"
                      textAlign="center"
                      fontSize="md"
                      fontWeight="700"
                      color={textPrimary}
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
                      icon={<FiPlus size="16px" />}
                      aria-label="Increase"
                      variant="ghost"
                      color={textPrimary}
                      h="full"
                      w="40px"
                      borderRadius="0"
                      onClick={() => setQuantity(quantity + 1)}
                      isDisabled={displayDetails.maxQty && quantity >= displayDetails.maxQty}
                      _hover={{ bg: hoverBg }}
                    />
                  </HStack>

                  <Button
                    size="lg"
                    flex="1"
                    colorScheme={displayDetails.buttonColorScheme}
                    borderRadius="12px"
                    h="52px"
                    fontSize="md"
                    onClick={handleAddToCart}
                    isDisabled={displayDetails.isAddToCartDisabled}
                    leftIcon={<Icon as={displayDetails.isBackorder ? FiClock : FiShoppingCart} />}
                    boxShadow={displayDetails.isAddToCartDisabled ? 'none' : '0 4px 14px rgba(108,92,231,0.3)'}
                    _hover={{
                      transform: displayDetails.isAddToCartDisabled ? 'none' : 'translateY(-2px)',
                      boxShadow: displayDetails.isAddToCartDisabled ? 'none' : '0 6px 20px rgba(108,92,231,0.4)'
                    }}
                    _disabled={{ opacity: 0.5, cursor: 'not-allowed', boxShadow: 'none' }}
                  >
                    {displayDetails.buttonText}
                  </Button>
                </>
              ) : (
                <Button
                  w="full"
                  size="lg"
                  colorScheme={currentUser && !!userData && (userData.status === 'pending' || userData.status === 'rejected') ? "gray" : "brand"}
                  variant="solid"
                  isDisabled={currentUser && !!userData && (userData.status === 'pending' || userData.status === 'rejected')}
                  borderRadius="12px"
                  h="52px"
                  onClick={() => navigate('/login', { state: { from: location } })}
                  leftIcon={currentUser && !!userData && userData.status !== undefined ? <Icon as={FiLock} /> : undefined}
                >
                  {currentUser
                    ? (userData ? (userData.status === 'pending' ? "Account Under Review" : (userData.status === 'rejected' ? "Account Rejected" : "Request Access")) : "Complete Profile Setup")
                    : "Login to Purchase"
                  }
                </Button>
              )}
            </Flex>

            {/* ======== TRUST BADGES ======== */}
            <HStack
              spacing={0}
              bg={trustBg}
              borderRadius="12px"
              p={3}
              justify="space-around"
              flexWrap="wrap"
              gap={2}
            >
              <HStack spacing={2} px={3}>
                <Icon as={FiShield} color="brand.500" boxSize={4} />
                <Text fontSize="xs" fontWeight="600" color={textMuted}>Secure Checkout</Text>
              </HStack>
              <Box w="1px" h="20px" bg={borderColor} display={{ base: 'none', md: 'block' }} />
              <HStack spacing={2} px={3}>
                <Icon as={FiTruck} color="brand.500" boxSize={4} />
                <Text fontSize="xs" fontWeight="600" color={textMuted}>Fast Shipping</Text>
              </HStack>
              <Box w="1px" h="20px" bg={borderColor} display={{ base: 'none', md: 'block' }} />
              <HStack spacing={2} px={3}>
                <Icon as={FiRefreshCw} color="brand.500" boxSize={4} />
                <Text fontSize="xs" fontWeight="600" color={textMuted}>Easy Returns</Text>
              </HStack>
            </HStack>

            {/* ======== VOLUME PRICING ======== */}
            {product.bulkDiscounts && product.bulkDiscounts.length > 0 && hasAccess && (
              <Box>
                <Text fontSize="xs" fontWeight="700" mb={2} color={textMuted} textTransform="uppercase" letterSpacing="0.06em">
                  Volume Discounts
                </Text>
                <TableContainer borderWidth="1px" borderColor={borderColor} borderRadius="12px" overflow="hidden">
                  <Table variant='simple' size="sm">
                    <Thead bg={alternateRowBg}>
                      <Tr>
                        <Th py={2.5} fontSize="xs">Quantity</Th>
                        <Th py={2.5} isNumeric fontSize="xs">Unit Price</Th>
                        <Th py={2.5} isNumeric fontSize="xs" w="80px">Savings</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {product.bulkDiscounts.sort((a, b) => a.startQty - b.startQty).map((discount, index) => (
                        <Tr key={index}>
                          <Td fontSize="sm" py={2.5} fontWeight="500">{discount.startQty}+ units</Td>
                          <Td isNumeric fontSize="sm" fontWeight="700" py={2.5}>{formatCurrency(discount.pricePerUnit)}</Td>
                          <Td isNumeric py={2.5}>
                            <Badge colorScheme="green" fontSize="xs" borderRadius="full">
                              -{Math.round(((product.price - discount.pricePerUnit) / product.price) * 100)}%
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </VStack>
        </SimpleGrid>

        {/* ====== BOTTOM: PRODUCT DETAILS ====== */}
        <Box mt={{ base: 10, md: 16 }}>
          <Divider mb={10} borderColor={borderColor} />

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            {/* Description */}
            <Box gridColumn={{ md: "span 2" }}>
              <Text fontSize="xs" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="0.1em" mb={2}>
                About This Product
              </Text>
              <Heading size="lg" mb={5} color={textPrimary} fontWeight="800" letterSpacing="-0.02em">
                Description
              </Heading>
              <Text color={textSecondary} fontSize="md" lineHeight="1.8" whiteSpace="pre-wrap">
                {product.description || "No description available."}
              </Text>
            </Box>

            {/* Specifications */}
            <Box>
              <Text fontSize="xs" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="0.1em" mb={2}>
                Details
              </Text>
              <Heading size="lg" mb={5} color={textPrimary} fontWeight="800" letterSpacing="-0.02em">
                Specifications
              </Heading>
              <VStack align="stretch" spacing={0} borderWidth="1px" borderColor={borderColor} borderRadius="16px" overflow="hidden">
                {product.sku && (
                  <Flex p={4} bg={alternateRowBg} justify="space-between" borderBottomWidth="1px" borderColor={borderColor}>
                    <Text color={textMuted} fontWeight="500" fontSize="sm">SKU</Text>
                    <Text fontWeight="700" color={textPrimary} fontSize="sm">{product.sku}</Text>
                  </Flex>
                )}
                {product.weight > 0 && (
                  <Flex p={4} justify="space-between" borderBottomWidth="1px" borderColor={borderColor}>
                    <Text color={textMuted} fontWeight="500" fontSize="sm">Weight</Text>
                    <Text fontWeight="700" color={textPrimary} fontSize="sm">{product.weight} {product.weightUnit}</Text>
                  </Flex>
                )}
                {!displayDetails.inventoryOff && (
                <Flex p={4} bg={alternateRowBg} justify="space-between" borderBottomWidth="1px" borderColor={borderColor}>
                  <Text color={textMuted} fontWeight="500" fontSize="sm">Backorders</Text>
                  <Badge colorScheme={product.allowBackorders ? 'green' : 'red'} borderRadius="full" fontSize="xs">{product.allowBackorders ? 'Allowed' : 'No'}</Badge>
                </Flex>
                )}
                {product.customFields && Object.entries(product.customFields).map(([k, v], i) => (
                  <Flex key={k} p={4} bg={i % 2 !== 0 ? alternateRowBg : 'transparent'} justify="space-between" borderBottomWidth="1px" borderColor={borderColor}>
                    <Text color={textMuted} fontWeight="500" fontSize="sm">{k}</Text>
                    <Text fontWeight="700" color={textPrimary} fontSize="sm">{String(v)}</Text>
                  </Flex>
                ))}
              </VStack>
            </Box>
          </SimpleGrid>
        </Box>
      </Container>

      {/* Full Screen Lightbox */}
      <Modal isOpen={isOpen} onClose={onClose} size="full" isCentered motionPreset="scale">
        <ModalOverlay bg="blackAlpha.900" backdropFilter="blur(10px)" />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalCloseButton color="white" size="lg" position="absolute" top={4} right={4} zIndex={9999} bg="blackAlpha.400" rounded="full" />
          <ModalBody p={0} display="flex" alignItems="center" justifyContent="center" height="100vh" onClick={onClose}>
            {activeMedia && (
              activeMedia.type === 'video' ? (
                <Box as="video" src={activeMedia.url} controls autoPlay width="90%" height="90%" objectFit="contain" onClick={(e) => e.stopPropagation()} />
              ) : (
                <Image src={activeMedia.url} maxH="95vh" maxW="95vw" objectFit="contain" onClick={(e) => e.stopPropagation()} shadow="2xl" borderRadius="md" />
              )
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ProductDetailPage;