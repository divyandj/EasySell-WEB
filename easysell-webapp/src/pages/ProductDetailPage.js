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
  Tag,
  VStack,
  HStack,
  ButtonGroup,
  useToast,
  SimpleGrid,
  AspectRatio,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
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
  Tooltip,
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
import { FiPlayCircle, FiShoppingCart, FiCheckCircle, FiXCircle, FiClock, FiLock, FiStar, FiInfo, FiArrowUp, FiMaximize2 } from 'react-icons/fi';

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
  const { currentUser, userData } = useAuth();
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

  const isApproved = currentUser && userData && (userData.status === 'approved' || userData.status === undefined) && userData.status !== 'pending' && userData.status !== 'rejected';

  // --- THEME COLORS ---
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'whiteAlpha.100');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const textPrimary = useColorModeValue('gray.800', 'white');
  const textSecondary = useColorModeValue('gray.600', 'gray.300');
  const textMuted = useColorModeValue('gray.500', 'gray.400');

  const headingGradient = useColorModeValue(
    "linear(to-r, gray.700, gray.900)",
    "linear(to-r, white, gray.200)"
  );
  const alternateRowBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const promptBg = useColorModeValue('gray.50', 'whiteAlpha.50');

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
    if (!currentUser) return navigate('/login', { state: { from: location } });
    if (!isApproved) return;

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

    // Create a temporary selection with the current option value
    const tempOptions = { ...selectedOptions, [optionName]: value };

    // We can only definitely show a price if we have enough info to resolve a variant, 
    // OR if this option consistently adds price regardless of others (hard to verify without resolving).
    // Strategy: Try to find the variant assuming current selections for other fields are kept.

    // Check if we have all keys required for a variant
    const requiredKeys = Object.keys(product.variantOptions || {});
    // If we rely on valid check: 
    // If the user hasn't selected other keys, we can't be sure of the combination.
    // So we only show diff if we have a resolved variant for this specific potential state.

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
    const allowBackorder = product.allowBackorders === true;

    // Stock Logic
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

    let stockStatus, stockColor, stockIcon, buttonText, buttonColorScheme;

    if (effectiveInStock) {
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
      stockStatus = 'Out of Stock';
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

    const isAddToCartDisabled = (product.hasVariants && !isVariantSelected) || (!effectiveInStock && !allowBackorder);

    const minQty = product.minOrderQty > 0 ? product.minOrderQty : 1;
    const maxQty = (isUnlimitedStock || allowBackorder) ? undefined : (availableQty < minQty ? minQty : availableQty);

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
      isBackorder: !effectiveInStock && allowBackorder
    };
  }, [product, selectedVariant]);

  useEffect(() => {
    if (displayDetails.minQty && quantity < displayDetails.minQty) {
      setQuantity(displayDetails.minQty);
    }
  }, [displayDetails.minQty, quantity]);

  if (loading) return <SpinnerComponent />;
  if (error) return <Center h="80vh"><Text color="red.500">{error}</Text></Center>;
  if (!product) return <Center h="80vh"><Text>Product not found.</Text></Center>;

  return (
    <Box minH="100vh" bg={pageBg} py={{ base: 6, md: 12 }}>
      <Container maxW="container.xl">
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 8, lg: 16 }}>

          {/* --- LEFT COLUMN: MEDIA GALLERY --- */}
          <VStack spacing={4} align="stretch" position={{ base: 'relative', lg: 'sticky' }} top={{ lg: '80px' }} h="max-content">
            <AspectRatio ratio={1} w="100%">
              <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" overflow="hidden" shadow="sm" position="relative" role="group">
                {!activeMedia ? (
                  <Skeleton height="100%" />
                ) : activeMedia.type === 'video' ? (
                  <Box as="video" src={activeMedia.url} controls autoPlay muted loop playsInline width="100%" height="100%" objectFit="contain" />
                ) : (
                  <Image src={activeMedia.url} alt={product.title} objectFit="contain" w="100%" h="100%" fallbackSrc="https://via.placeholder.com/600" cursor="zoom-in" onClick={onOpen} />
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
                    bg="blackAlpha.600"
                    color="white"
                    _hover={{ bg: "blackAlpha.800" }}
                    rounded="full"
                    size="sm"
                  />
                )}
              </Box>
            </AspectRatio>
            {/* Thumbnails */}
            {displayMedia.length > 1 && (
              <HStack spacing={3} overflowX="auto" py={2} css={{ '&::-webkit-scrollbar': { display: 'none' } }}>
                {displayMedia.map((mediaItem) => (
                  <Box key={mediaItem.url} as="button" w="80px" h="80px" minW="80px" borderWidth="2px" borderRadius="xl" overflow="hidden" position="relative" borderColor={activeMedia?.url === mediaItem.url ? 'brand.500' : 'transparent'} onClick={() => setActiveMedia(mediaItem)}>
                    {mediaItem.type === 'video' ? (
                      <Center w="full" h="full" bg="gray.100"><Icon as={FiPlayCircle} /></Center>
                    ) : (
                      <Image src={mediaItem.url} objectFit="cover" w="100%" h="100%" />
                    )}
                  </Box>
                ))}
              </HStack>
            )}
          </VStack>

          {/* --- RIGHT COLUMN: BUYING CONTEXT --- */}
          <VStack align="stretch" spacing={6}>
            {/* Header Area */}
            <Box>
              {product.category && (
                <Badge colorScheme="brand" variant="solid" rounded="full" px={3} py={1} mb={3} fontSize="xs" letterSpacing="wide">
                  {product.category}
                </Badge>
              )}
              <Heading as="h1" size="2xl" fontWeight="900" lineHeight="tight" letterSpacing="tight" bgGradient={headingGradient} bgClip="text" mb={2}>
                {product.title}
              </Heading>

              {/* Stock Row */}
              <HStack color={displayDetails.stockColor + '.500'} mb={2}>
                <Icon as={displayDetails.stockIcon} />
                <Text fontWeight="bold" fontSize="sm">{displayDetails.stockStatus}</Text>
              </HStack>
            </Box>

            {/* Price Area - COMPACT & CLEAN */}
            <Box p={6} bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} shadow="sm">
              {isApproved ? (
                <VStack align="start" spacing={0}>
                  <Text fontSize="md" color={textMuted} fontWeight="medium">Total Price (Incl. Tax)</Text>
                  <HStack align="baseline" spacing={3}>
                    <Text fontSize="4xl" fontWeight="800" color={textPrimary} lineHeight="tight">
                      {formatCurrency(displayDetails.finalPriceWithTax)}
                    </Text>
                    {displayDetails.showStrikeThrough && (
                      <Text as="s" color="gray.400" fontSize="xl">
                        {formatCurrency(displayDetails.originalPriceWithTax)}
                      </Text>
                    )}
                  </HStack>
                  <Text fontSize="sm" color={textSecondary} mt={1}>
                    {formatCurrency(displayDetails.effectivePricePreTax)} + {formatCurrency(displayDetails.taxAmount)} Tax ({displayDetails.taxRatePercent}%)
                  </Text>
                </VStack>
              ) : (
                <HStack spacing={3} color="gray.500">
                  <Icon as={FiLock} boxSize={5} />
                  <Text fontSize="lg" fontWeight="medium">
                    {currentUser ? (userData?.status === 'pending' ? "Verification Pending" : "Login to view pricing") : "Login to view pricing"}
                  </Text>
                </HStack>
              )}
            </Box>

            {/* PROFESSIONAL VARIANT SELECTOR */}
            {product.hasVariants && product.variantOptions && (
              <VStack align="start" spacing={4}>
                {Object.entries(product.variantOptions).map(([optionName, values]) => (
                  <Box key={optionName} w="full">
                    <HStack mb={3} justify="space-between">
                      <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" letterSpacing="widest" color={textMuted}>
                        {optionName}
                      </Text>
                      {/* Optional: Show selected value nicely */}
                      {selectedOptions[optionName] && (
                        <Text fontSize="xs" fontWeight="semibold" color="brand.500">{selectedOptions[optionName]}</Text>
                      )}
                    </HStack>

                    <Flex wrap="wrap" gap={3}>
                      {values.map(value => {
                        const isSelected = selectedOptions[optionName] === value;
                        const priceDiff = getVariantPriceDiff(optionName, value);

                        return (
                          <Box
                            as="button"
                            key={value}
                            onClick={() => handleOptionSelect(optionName, value)}
                            borderRadius="lg"
                            px={6}
                            py={3}
                            minW="80px"
                            fontSize="sm"
                            fontWeight="bold"
                            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                            borderWidth="2px"
                            // STATES
                            bg={isSelected ? 'brand.50' : 'transparent'} // Light background when selected
                            borderColor={isSelected ? 'brand.500' : borderColor} // Active Border
                            color={isSelected ? 'brand.600' : textPrimary} // Active Text
                            _hover={{
                              borderColor: isSelected ? 'brand.600' : 'gray.400',
                              bg: isSelected ? 'brand.100' : 'gray.50'
                            }}
                            _active={{
                              transform: 'scale(0.96)'
                            }}
                            position="relative"
                            overflow="hidden"
                            textAlign="center"
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            gap={1}
                          >
                            <Text lineHeight="1">{value}</Text>
                            {isApproved && priceDiff !== null && (
                              <Text fontSize="xs" color={priceDiff > 0 ? "orange.500" : "green.500"} fontWeight="extrabold">
                                {priceDiff > 0 ? '+' : ''}{formatCurrency(priceDiff)}
                              </Text>
                            )}

                            {isSelected && (
                              <Box position="absolute" bottom="0" right="0" w="0" h="0"
                                borderStyle="solid"
                                borderWidth="0 0 12px 12px"
                                borderColor={`transparent transparent currentcolor transparent`}
                                color="brand.500"
                                opacity={0.6}
                              />
                            )}
                          </Box>
                        )
                      })}
                    </Flex>
                  </Box>
                ))}

                {selectedVariant === 'unavailable' && <Text color="red.500" fontSize="sm" fontWeight="medium">This combination is unavailable.</Text>}

                {product.hasVariants && !selectedVariant && (
                  <Center p={4} borderRadius="xl" borderWidth="1px" borderColor="brand.400" bg={promptBg} position="relative" overflow="hidden">
                    <Box position="absolute" top="0" left="0" w="4px" h="full" bg="brand.400" />
                    <HStack spacing={3}>
                      <Icon as={FiArrowUp} color="brand.500" boxSize={5} animation={bounceAnimation} />
                      <Text fontSize="sm" fontWeight="bold" color="brand.600">
                        Please select {Object.entries(product.variantOptions).filter(([k]) => !selectedOptions[k]).map(([k]) => k).join(' & ')} above
                      </Text>
                    </HStack>
                  </Center>
                )}
              </VStack>
            )}

            {/* Backorder Alert */}
            {displayDetails.isBackorder && (
              <Alert status="warning" variant="left-accent" borderRadius="md" py={2}>
                <AlertIcon />
                <Text fontSize="sm">Pre-order item. Shipping may be delayed.</Text>
              </Alert>
            )}

            {/* Action Bar */}
            <Flex gap={3} pt={2}>
              {isApproved ? (
                <>
                  <NumberInput size="lg" maxW="120px" defaultValue={1} min={displayDetails.minQty} max={displayDetails.maxQty} onChange={(val) => setQuantity(parseInt(val) || 1)} value={quantity}>
                    <NumberInputField borderRadius="2xl" fontWeight="bold" h="14" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Button
                    size="lg"
                    flex="1"
                    colorScheme={displayDetails.buttonColorScheme}
                    borderRadius="2xl"
                    h="14"
                    fontSize="lg"
                    onClick={handleAddToCart}
                    isDisabled={displayDetails.isAddToCartDisabled}
                    leftIcon={<Icon as={displayDetails.isBackorder ? FiClock : FiShoppingCart} />}
                    shadow="xl"
                    _hover={{ transform: 'translateY(-2px)', shadow: '2xl' }}
                    _disabled={{ opacity: 0.6, cursor: 'not-allowed', bg: 'gray.200', color: 'gray.500', boxShadow: 'none' }}
                  >
                    {displayDetails.buttonText}
                  </Button>
                </>
              ) : (
                <Button
                  w="full"
                  size="lg"
                  colorScheme={currentUser && !userData ? "brand" : (currentUser ? "gray" : "brand")}
                  variant="solid"
                  isDisabled={currentUser && !!userData}
                  borderRadius="2xl"
                  h="14"
                  onClick={currentUser && !userData ? () => navigate('/signup') : (currentUser ? undefined : () => navigate('/login', { state: { from: location } }))}
                  leftIcon={currentUser && !!userData ? <Icon as={FiLock} /> : undefined}
                >
                  {currentUser
                    ? (userData ? (userData.status === 'pending' ? "Account Under Review" : "Account Rejected") : "Complete Profile Setup")
                    : "Login to Purchase"
                  }
                </Button>
              )}
            </Flex>

            {/* Volume Pricing (Compact) */}
            {product.bulkDiscounts && product.bulkDiscounts.length > 0 && isApproved && (
              <Box pt={4}>
                <Text fontSize="sm" fontWeight="bold" mb={2} color={textMuted} textTransform="uppercase">Volume Discounts</Text>
                <TableContainer borderWidth="1px" borderColor={borderColor} borderRadius="lg">
                  <Table variant='simple' size="sm">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th py={2}>Qty</Th>
                        <Th py={2} isNumeric>Unit Price</Th>
                        <Th py={2} isNumeric width="80px"></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {product.bulkDiscounts.sort((a, b) => a.startQty - b.startQty).map((discount, index) => (
                        <Tr key={index}>
                          <Td fontSize="sm" py={2}>{discount.startQty}+</Td>
                          <Td isNumeric fontSize="sm" fontWeight="bold" py={2}>{formatCurrency(discount.pricePerUnit)}</Td>
                          <Td isNumeric py={2}>
                            <Badge colorScheme="green" fontSize="xs">-{Math.round(((product.price - discount.pricePerUnit) / product.price) * 100)}%</Badge>
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

        {/* --- BOTTOM SECTION: DETAILS --- */}
        <Box mt={16}>
          <Divider mb={10} borderColor={borderColor} />

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            {/* Description */}
            <Box gridColumn={{ md: "span 2" }}>
              <Heading size="lg" mb={6} color={textPrimary} letterSpacing="tight">Product Description</Heading>
              <Text color={textSecondary} fontSize="lg" lineHeight="1.8" whiteSpace="pre-wrap">
                {product.description || "No description available."}
              </Text>
            </Box>

            {/* Specifications */}
            <Box>
              <Heading size="lg" mb={6} color={textPrimary} letterSpacing="tight">Specifications</Heading>
              <VStack align="stretch" spacing={0} borderWidth="1px" borderColor={borderColor} borderRadius="xl" overflow="hidden">
                {product.sku && (
                  <Flex p={4} bg={alternateRowBg} justify="space-between" borderBottomWidth="1px" borderColor={borderColor}>
                    <Text color={textMuted} fontWeight="medium">SKU</Text>
                    <Text fontWeight="bold" color={textPrimary}>{product.sku}</Text>
                  </Flex>
                )}
                {product.weight > 0 && (
                  <Flex p={4} justify="space-between" borderBottomWidth="1px" borderColor={borderColor}>
                    <Text color={textMuted} fontWeight="medium">Weight</Text>
                    <Text fontWeight="bold" color={textPrimary}>{product.weight} {product.weightUnit}</Text>
                  </Flex>
                )}
                <Flex p={4} bg={alternateRowBg} justify="space-between" borderBottomWidth="1px" borderColor={borderColor}>
                  <Text color={textMuted} fontWeight="medium">Backorders</Text>
                  <Badge colorScheme={product.allowBackorders ? 'green' : 'red'}>{product.allowBackorders ? 'Allowed' : 'No'}</Badge>
                </Flex>
                {product.customFields && Object.entries(product.customFields).map(([k, v], i) => (
                  <Flex key={k} p={4} bg={i % 2 !== 0 ? alternateRowBg : 'transparent'} justify="space-between" borderBottomWidth="1px" borderColor={borderColor}>
                    <Text color={textMuted} fontWeight="medium">{k}</Text>
                    <Text fontWeight="bold" color={textPrimary}>{String(v)}</Text>
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