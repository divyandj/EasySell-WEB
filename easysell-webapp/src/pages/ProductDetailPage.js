// import React, { useState, useEffect, useMemo } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { doc, getDoc } from 'firebase/firestore';
// import { db } from '../firebase';
// import {
//   Box,
//   Container,
//   Flex,
//   Image,
//   Heading,
//   Text,
//   Button,
//   Tag,
//   VStack,
//   HStack,
//   ButtonGroup,
//   useToast,
//   SimpleGrid,
//   AspectRatio,
//   NumberInput,
//   NumberInputField,
//   NumberInputStepper,
//   NumberIncrementStepper,
//   NumberDecrementStepper,
//   Divider,
//   Center,
//   Icon,
//   Table,
//   Thead,
//   Tbody,
//   Tr,
//   Th,
//   Td,
//   TableContainer,
//   Badge,
//   Alert,
//   AlertIcon
// } from '@chakra-ui/react';
// import { FiPlayCircle, FiShoppingCart, FiCheckCircle, FiXCircle, FiClock, FiLock } from 'react-icons/fi';
// import { useCart } from '../context/CartContext';
// import { useAuth } from '../context/AuthContext'; // Import AuthContext
// import { getProxiedUrl } from '../config';
// import SpinnerComponent from '../components/Spinner';

// // Helper to format currency
// const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

// const ProductDetailPage = () => {
//   // --- STATE MANAGEMENT ---
//   const { productId } = useParams();
//   const { addToCart } = useCart();
//   const { currentUser } = useAuth(); // Get User
//   const navigate = useNavigate();
//   const toast = useToast();

//   const [product, setProduct] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const [quantity, setQuantity] = useState(1);
//   const [selectedOptions, setSelectedOptions] = useState({});
//   const [selectedVariant, setSelectedVariant] = useState(null);
//   const [activeMedia, setActiveMedia] = useState(null);

//   // --- DATA FETCHING & INITIAL STATE ---
//   useEffect(() => {
//     const fetchProduct = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const productRef = doc(db, 'products', productId);
//         const productSnap = await getDoc(productRef);
//         if (productSnap.exists()) {
//           const productData = { id: productSnap.id, ...productSnap.data() };
//           setProduct(productData);
//           if (productData.minOrderQty > 1) {
//             setQuantity(productData.minOrderQty);
//           } else {
//             setQuantity(1);
//           }
//         } else {
//           setError('Product not found.');
//         }
//       } catch (err) {
//         setError('Failed to fetch product details.');
//         console.error("Fetch Error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (productId) {
//       fetchProduct();
//     } else {
//        setError('Product ID is missing.');
//        setLoading(false);
//     }
//   }, [productId]);

//   // --- VARIANT SELECTION LOGIC ---
//   useEffect(() => {
//     if (product?.hasVariants && product.variantOptions && Object.keys(selectedOptions).length === Object.keys(product.variantOptions).length) {
//       const foundVariant = product.variants?.find(variant =>
//         Object.entries(selectedOptions).every(([key, value]) => variant?.options?.[key] === value)
//       );
//       setSelectedVariant(foundVariant || 'unavailable');
//     } else {
//       setSelectedVariant(null);
//     }
//   }, [selectedOptions, product]);

//   // --- MEDIA GALLERY LOGIC ---
//   const displayMedia = useMemo(() => {
//     if (!product) return [];
//     let allMedia = [...(product.media || [])].filter(item => item && item.url);

//     if (selectedVariant && selectedVariant !== 'unavailable' && selectedVariant.imageUrl) {
//       const variantMedia = { url: selectedVariant.imageUrl, type: 'image' };
//       if (variantMedia.url && (!allMedia.length || allMedia[0]?.url !== variantMedia.url)) {
//           allMedia = allMedia.filter(item => item.url !== variantMedia.url);
//           allMedia.unshift(variantMedia);
//       }
//     }
//     return allMedia;
//   }, [product, selectedVariant]);

//   useEffect(() => {
//     if (selectedVariant && selectedVariant !== 'unavailable' && selectedVariant.imageUrl) {
//         setActiveMedia({ url: selectedVariant.imageUrl, type: 'image' });
//     } else if (displayMedia.length > 0) {
//         setActiveMedia(displayMedia[0]);
//     } else {
//         setActiveMedia(null);
//     }
//   }, [selectedVariant, displayMedia]);


//   // --- EVENT HANDLERS ---
//   const handleOptionSelect = (optionName, value) => {
//     setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
//   };

//   const handleAddToCart = () => {
//     if (!currentUser) return navigate('/login');
    
//     const itemToAdd = product;
//     const variantInfo = selectedVariant && selectedVariant !== 'unavailable' ? selectedVariant : null;
//     addToCart(itemToAdd, quantity, variantInfo);
//     toast({
//       title: `Added to cart!`,
//       description: `${quantity} x ${product.title} has been added.`,
//       status: "success",
//       duration: 3000,
//       isClosable: true,
//       position: 'top'
//     });
//   };

//   // --- DERIVED STATE & CALCULATIONS ---
//   const displayDetails = useMemo(() => {
//     if (!product) return {};

//     const isVariantSelected = product.hasVariants && selectedVariant && selectedVariant !== 'unavailable';
//     const allowBackorder = product.allowBackorders === true;
//     const taxRatePercent = product.taxRate > 0 ? product.taxRate : 0;
//     const taxRateDecimal = taxRatePercent / 100;

//     // Stock Logic
//     const variantInStock = isVariantSelected ? selectedVariant.inStock : undefined;
//     const inStock = variantInStock !== undefined ? variantInStock : (product.inStock === true);
//     const availableQty = isVariantSelected ? (selectedVariant.quantity || 0) : (product.availableQuantity || 0);

//     let stockStatus, stockColor, stockIcon;
//     if (inStock) {
//       stockStatus = `In Stock`;
//       stockColor = 'green';
//       stockIcon = FiCheckCircle;
//     } else if (allowBackorder) {
//       stockStatus = 'Available on Backorder';
//       stockColor = 'blue';
//       stockIcon = FiClock;
//     } else {
//       stockStatus = 'Out of Stock';
//       stockColor = 'red';
//       stockIcon = FiXCircle;
//     }

//     // Price Logic
//     const basePrice = product.price > 0 ? product.price : 0;
//     const discountedPriceValue = product.discountedPrice > 0 && product.discountedPrice < basePrice ? product.discountedPrice : null;
//     const priceBeforeVariant = discountedPriceValue ?? basePrice;
//     const priceModifier = isVariantSelected ? selectedVariant.priceModifier || 0 : 0;
//     const effectivePricePreTax = priceBeforeVariant + priceModifier;
//     const taxAmount = effectivePricePreTax * taxRateDecimal;
//     const finalPriceWithTax = effectivePricePreTax + taxAmount;

//     // Strikethrough Logic
//     const originalPriceWithTax = basePrice * (1 + taxRateDecimal);
//     const showStrikeThrough = discountedPriceValue !== null || priceModifier !== 0;
//     const discountAmount = discountedPriceValue ? basePrice - discountedPriceValue : 0;
//     const discountPercent = discountAmount > 0 && basePrice > 0 ? Math.round((discountAmount / basePrice) * 100) : 0;

//     const isAddToCartDisabled = (product.hasVariants && (!isVariantSelected || (!inStock && !allowBackorder))) || (!product.hasVariants && !inStock && !allowBackorder);

//     const minQty = product.minOrderQty > 0 ? product.minOrderQty : 1;
//     const maxQty = allowBackorder ? undefined : (availableQty < minQty ? minQty : availableQty);

//     return {
//       basePrice,
//       discountedPriceValue,
//       priceModifier,
//       effectivePricePreTax,
//       finalPriceWithTax,
//       taxAmount,
//       taxRatePercent,
//       originalPriceWithTax,
//       showStrikeThrough,
//       discountPercent,
//       stockStatus, stockColor, stockIcon,
//       isAddToCartDisabled,
//       minQty, maxQty, availableQty
//     };
//   }, [product, selectedVariant]);

//   useEffect(() => {
//       if (displayDetails.minQty && quantity < displayDetails.minQty) {
//           setQuantity(displayDetails.minQty);
//       }
//   }, [displayDetails.minQty, quantity]);


//   // --- RENDERING ---
//   if (loading) return <SpinnerComponent />;
//   if (error) return <Center h="80vh" flexDirection="column"><Heading size="md" color="red.500">Error</Heading><Text mt={2}>{error}</Text></Center>;
//   if (!product) return <Center h="80vh"><Text>Product data could not be loaded.</Text></Center>;

//   return (
//     <Container maxW="container.xl" py={{ base: 6, md: 12 }}>
//       <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 8, lg: 16 }}>

//         {/* --- MEDIA GALLERY COLUMN --- */}
//         <VStack spacing={4} align="stretch" position={{ base: 'relative', lg: 'sticky' }} top={{ lg: '80px' }} h="max-content">
//           <AspectRatio ratio={1} w="100%">
//             <Box bg="gray.100" borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflow="hidden">
//               {!activeMedia ? (
//                  <Center h="100%" bg="gray.200"><Text color="gray.500">No Image Available</Text></Center>
//               ) : activeMedia.type === 'video' ? (
//                 <Box as="video" src={getProxiedUrl(activeMedia.url)} controls autoPlay muted loop playsInline width="100%" height="100%" objectFit="contain" />
//               ) : (
//                 <Image src={getProxiedUrl(activeMedia.url)} alt={`${product.title} - view`} objectFit="contain" w="100%" h="100%" fallbackSrc="https://via.placeholder.com/600?text=Image+Not+Found" />
//               )}
//             </Box>
//           </AspectRatio>
//           {displayMedia.length > 1 && (
//             <HStack spacing={3} overflowX="auto" py={2} css={{ '&::-webkit-scrollbar': { height: '8px' }, '&::-webkit-scrollbar-track': { background: '#f1f1f1' }, '&::-webkit-scrollbar-thumb': { background: '#cccccc', borderRadius: '4px' }, '&::-webkit-scrollbar-thumb:hover': { background: '#aaaaaa' } }}>
//               {displayMedia.map((mediaItem) => (
//                 <Box key={mediaItem.url} as="button" w="80px" h="80px" minW="80px" borderWidth="2px" borderRadius="md" overflow="hidden" position="relative" bg="gray.100" borderColor={activeMedia?.url === mediaItem.url ? 'teal.500' : 'transparent'} onClick={() => setActiveMedia(mediaItem)} _focus={{ outline: 'none', shadow: 'outline' }}>
//                   {mediaItem.type === 'video' ? (
//                     <Flex align="center" justify="center" w="100%" h="100%" bg="gray.300" color="gray.600">
//                       <Icon as={FiPlayCircle} boxSize={8} />
//                     </Flex>
//                   ) : (
//                     <Image src={getProxiedUrl(mediaItem.url)} alt={`${product.title} - thumbnail`} objectFit="cover" w="100%" h="100%" fallbackSrc="https://via.placeholder.com/80?text=!" />
//                   )}
//                 </Box>
//               ))}
//             </HStack>
//           )}
//         </VStack>

//         {/* --- PRODUCT INFO COLUMN --- */}
//         <VStack align="flex-start" spacing={5}>
//           <Heading as="h1" size="xl" fontWeight="800" color="gray.800">{product.title}</Heading>

//           <VStack align="stretch" w="full" spacing={5}>
//             {/* --- ENHANCED PRICE DISPLAY --- */}
//             <Box p={4} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
//                 {currentUser ? (
//                     // LOGGED IN VIEW
//                     <>
//                         <HStack align="baseline" spacing={3} wrap="wrap">
//                             <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color="teal.600">
//                               {formatCurrency(displayDetails.finalPriceWithTax)}
//                             </Text>
//                             {displayDetails.showStrikeThrough && (
//                                <Text as="s" color="gray.400" fontSize="xl" fontWeight="normal">
//                                  {formatCurrency(displayDetails.originalPriceWithTax)}
//                                </Text>
//                              )}
//                              {displayDetails.discountPercent > 0 && (
//                                 <Badge colorScheme='green' variant="subtle" fontSize="sm" px={2} py={0.5} borderRadius="md">
//                                     {displayDetails.discountPercent}% OFF
//                                 </Badge>
//                              )}
//                         </HStack>
//                        <Text fontSize="sm" color="gray.600" mt={1}>
//                          (Price before tax: {formatCurrency(displayDetails.effectivePricePreTax)} + {formatCurrency(displayDetails.taxAmount)} tax ({displayDetails.taxRatePercent}%))
//                          {product.priceUnit && ` ${product.priceUnit}`}
//                        </Text>
//                    </>
//                 ) : (
//                     // GUEST VIEW
//                     <HStack spacing={3}>
//                         <Icon as={FiLock} color="gray.500" boxSize={6} />
//                         <VStack align="start" spacing={0}>
//                             <Text fontWeight="bold" color="gray.600">Price hidden</Text>
//                             <Text fontSize="sm" color="gray.500">Please log in to view pricing.</Text>
//                         </VStack>
//                     </HStack>
//                 )}
//             </Box>

//             {/* Stock Status */}
//             <Flex align="center">
//                 <Tag size="md" variant="subtle" colorScheme={displayDetails.stockColor} mr={3}>
//                     <Icon as={displayDetails.stockIcon} mr={2} />
//                     {displayDetails.stockStatus}
//                 </Tag>
//                 {displayDetails.stockColor === 'green' && <Text fontSize="sm" color="gray.600">{displayDetails.availableQty} units available</Text>}
//             </Flex>

//             {/* Description */}
//             {product.description && <Text color="gray.700" fontSize="md" lineHeight="tall">{product.description}</Text>}
//           </VStack>

//           {/* Variants Selection */}
//           {product.hasVariants && product.variantOptions && (
//             <VStack align="flex-start" w="full" spacing={4} pt={4}>
//               {Object.entries(product.variantOptions).map(([optionName, values]) => (
//                 values && values.length > 0 && (
//                     <Box key={optionName} w="full">
//                       <Text fontWeight="semibold" mb={2} fontSize="md" color="gray.700">{optionName}</Text>
//                       <ButtonGroup flexWrap="wrap" gap={2} isAttached={false} variant="outline">
//                         {values.map(value => (
//                           <Button key={value} onClick={() => handleOptionSelect(optionName, value)} isActive={selectedOptions[optionName] === value} _active={{ bg: 'teal.500', color: 'white', borderColor: 'teal.500' }} px={4} size="sm">
//                             {value}
//                           </Button>
//                         ))}
//                       </ButtonGroup>
//                     </Box>
//                 )
//               ))}
//               {selectedVariant === 'unavailable' && <Text color="red.500" mt={2}>This combination is not available.</Text>}
//             </VStack>
//           )}

//           {/* Add to Cart Section */}
//           <VStack w="full" spacing={4} pt={6}>
//             {currentUser ? (
//                 // LOGGED IN USER
//                 <HStack w="full">
//                   <NumberInput size="lg" w="120px" value={quantity} min={displayDetails.minQty} max={displayDetails.maxQty} onChange={(valStr, valNum) => setQuantity(isNaN(valNum) ? displayDetails.minQty : valNum)} isDisabled={displayDetails.isAddToCartDisabled || !displayDetails.maxQty || displayDetails.maxQty < displayDetails.minQty} allowMouseWheel>
//                     <NumberInputField />
//                     <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
//                   </NumberInput>
//                   <Button colorScheme="teal" size="lg" onClick={handleAddToCart} isDisabled={displayDetails.isAddToCartDisabled} flex="1" leftIcon={<FiShoppingCart />} _hover={!displayDetails.isAddToCartDisabled ? { transform: 'translateY(-2px)', boxShadow: 'lg' } : {}} transition="all 0.2s">
//                     Add to Cart
//                   </Button>
//                 </HStack>
//             ) : (
//                 // GUEST USER
//                 <Box w="full">
//                      <Alert status="info" borderRadius="md" mb={4}>
//                           <AlertIcon />
//                           You must be logged in to add items to your cart.
//                       </Alert>
//                       <Button colorScheme="teal" size="lg" w="full" onClick={() => navigate('/login')}>
//                           Login to Buy
//                       </Button>
//                 </Box>
//             )}

//             {displayDetails.minQty > 1 && <Text fontSize="sm" color="gray.500" w="full">Minimum order quantity: {displayDetails.minQty}.</Text>}
//              {/* Show max quantity if relevant */}
//             {!product.allowBackorders && displayDetails.availableQty > 0 && displayDetails.availableQty < Infinity && displayDetails.stockColor === 'green' && (
//                 <Text fontSize="sm" color="gray.500" w="full">Maximum order quantity: {displayDetails.maxQty}.</Text>
//             )}
//           </VStack>

//           {/* --- FULL DETAILS SECTION --- */}
//           <Box w="full" pt={6}>
//             <Divider />
//             <Box mt={6} >
//               <Heading size="md" mb={4}>Product Details</Heading>
//               <VStack align="stretch" spacing={3} fontSize="sm" color="gray.700" w="full" p={5} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
//                 {product.sku && <HStack justifyContent="space-between"><Text color="gray.500">SKU:</Text> <Text fontWeight="medium">{product.sku}</Text></HStack>}
//                 {product.weight > 0 && <HStack justifyContent="space-between"><Text color="gray.500">Weight:</Text> <Text fontWeight="medium">{product.weight} {product.weightUnit || ''}</Text></HStack>}
//                 {product.dimensions && <HStack justifyContent="space-between"><Text color="gray.500">Dimensions (LxWxH):</Text> <Text fontWeight="medium">{typeof product.dimensions === 'object' ? `${product.dimensions.length || '?'} x ${product.dimensions.width || '?'} x ${product.dimensions.height || '?'} ${product.dimensions.unit || ''}` : product.dimensions}</Text></HStack>}
//                 {displayDetails.minQty > 1 && <HStack justifyContent="space-between"><Text color="gray.500">Min. Order Qty:</Text> <Text fontWeight="medium">{displayDetails.minQty}</Text></HStack>}
//                 {product.tags?.length > 0 && (
//                   <HStack align="start" justifyContent="space-between"><Text color="gray.500" mt="5px">Tags:</Text>
//                     <Flex flexWrap="wrap" justifyContent="flex-end" gap={2}>
//                       {product.tags.map(tag => <Tag key={tag} size="sm" variant="subtle" colorScheme="blue">{tag}</Tag>)}
//                     </Flex>
//                   </HStack>
//                 )}
//                 <HStack justifyContent="space-between"><Text color="gray.500">Taxable:</Text> <Text fontWeight="medium">{displayDetails.taxRatePercent > 0 ? `Yes (${displayDetails.taxRatePercent}%)` : 'No'}</Text></HStack>
//                 <HStack justifyContent="space-between"><Text color="gray.500">Allow Backorders:</Text> <Text fontWeight="medium">{product.allowBackorders ? 'Yes' : 'No'}</Text></HStack>
//                 <HStack justifyContent="space-between"><Text color="gray.500">Hide if OOS:</Text> <Text fontWeight="medium">{product.hideWhenOutOfStock ? 'Yes' : 'No'}</Text></HStack>

//                 {/* Custom Fields */}
//                 {product.customFields && Object.keys(product.customFields).length > 0 && <Divider pt={2}/>}
//                 {product.customFields && Object.entries(product.customFields).map(([key, value]) => (
//                   value && <HStack justifyContent="space-between" key={key}><Text color="gray.500">{key}:</Text> <Text fontWeight="medium" textAlign="right">{String(value)}</Text></HStack>
//                 ))}
//               </VStack>
//             </Box>

//             {/* Bulk Discounts Section */}
//             {product.bulkDiscounts && product.bulkDiscounts.length > 0 && currentUser && (
//               <Box w="full" pt={6}>
//                 <Divider />
//                 <Box mt={6}>
//                   <Heading size="md" mb={4}>Volume Pricing (per unit, excl. tax)</Heading>
//                   <TableContainer borderWidth="1px" borderColor="gray.200" borderRadius="lg">
//                     <Table variant='simple' size='sm'>
//                       <Thead bg="gray.50">
//                         <Tr>
//                           <Th>Quantity</Th>
//                           <Th isNumeric>Price per Unit</Th>
//                         </Tr>
//                       </Thead>
//                       <Tbody>
//                         {/* Add base price tier if applicable */}
//                         {product.bulkDiscounts.length > 0 && product.bulkDiscounts[0].startQty > 1 && (
//                             <Tr>
//                                 <Td>1 - {product.bulkDiscounts[0].startQty - 1}</Td>
//                                 <Td isNumeric>{formatCurrency(product.price)}</Td>
//                             </Tr>
//                         )}
//                         {/* Map through sorted bulk discounts */}
//                         {product.bulkDiscounts.sort((a, b) => a.startQty - b.startQty).map((discount, index) => (
//                           <Tr key={index}>
//                             <Td>{discount.startQty}{discount.endQty ? ` - ${discount.endQty}` : '+'}</Td>
//                             <Td isNumeric>{formatCurrency(discount.pricePerUnit)}</Td>
//                           </Tr>
//                         ))}
//                       </Tbody>
//                     </Table>
//                   </TableContainer>
//                 </Box>
//               </Box>
//             )}
//           </Box>
//         </VStack>
//       </SimpleGrid>
//     </Container>
//   );
// };

// export default ProductDetailPage;



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
  AlertIcon
} from '@chakra-ui/react';
import { FiPlayCircle, FiShoppingCart, FiCheckCircle, FiXCircle, FiClock, FiLock } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getProxiedUrl } from '../config';
import SpinnerComponent from '../components/Spinner';

// Helper to format currency
const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

const ProductDetailPage = () => {
  // --- STATE MANAGEMENT ---
  const { productId } = useParams();
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // <--- 1. Get location
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeMedia, setActiveMedia] = useState(null);

  // --- DATA FETCHING & INITIAL STATE ---
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
          if (productData.minOrderQty > 1) {
            setQuantity(productData.minOrderQty);
          } else {
            setQuantity(1);
          }
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
    if (productId) {
      fetchProduct();
    } else {
       setError('Product ID is missing.');
       setLoading(false);
    }
  }, [productId]);

  // --- VARIANT SELECTION LOGIC ---
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

  // --- MEDIA GALLERY LOGIC ---
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
    if (!currentUser) {
        // Redirect to login but remember to come back here
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

  // --- DERIVED STATE & CALCULATIONS ---
  const displayDetails = useMemo(() => {
    if (!product) return {};

    const isVariantSelected = product.hasVariants && selectedVariant && selectedVariant !== 'unavailable';
    const allowBackorder = product.allowBackorders === true;
    const taxRatePercent = product.taxRate > 0 ? product.taxRate : 0;
    const taxRateDecimal = taxRatePercent / 100;

    // Stock Logic
    const variantInStock = isVariantSelected ? selectedVariant.inStock : undefined;
    const inStock = variantInStock !== undefined ? variantInStock : (product.inStock === true);
    const availableQty = isVariantSelected ? (selectedVariant.quantity || 0) : (product.availableQuantity || 0);

    let stockStatus, stockColor, stockIcon;
    if (inStock) {
      stockStatus = `In Stock`;
      stockColor = 'green';
      stockIcon = FiCheckCircle;
    } else if (allowBackorder) {
      stockStatus = 'Available on Backorder';
      stockColor = 'blue';
      stockIcon = FiClock;
    } else {
      stockStatus = 'Out of Stock';
      stockColor = 'red';
      stockIcon = FiXCircle;
    }

    // Price Logic
    const basePrice = product.price > 0 ? product.price : 0;
    const discountedPriceValue = product.discountedPrice > 0 && product.discountedPrice < basePrice ? product.discountedPrice : null;
    const priceBeforeVariant = discountedPriceValue ?? basePrice;
    const priceModifier = isVariantSelected ? selectedVariant.priceModifier || 0 : 0;
    const effectivePricePreTax = priceBeforeVariant + priceModifier;
    const taxAmount = effectivePricePreTax * taxRateDecimal;
    const finalPriceWithTax = effectivePricePreTax + taxAmount;

    // Strikethrough Logic
    const originalPriceWithTax = basePrice * (1 + taxRateDecimal);
    const showStrikeThrough = discountedPriceValue !== null || priceModifier !== 0;
    const discountAmount = discountedPriceValue ? basePrice - discountedPriceValue : 0;
    const discountPercent = discountAmount > 0 && basePrice > 0 ? Math.round((discountAmount / basePrice) * 100) : 0;

    const isAddToCartDisabled = (product.hasVariants && (!isVariantSelected || (!inStock && !allowBackorder))) || (!product.hasVariants && !inStock && !allowBackorder);

    const minQty = product.minOrderQty > 0 ? product.minOrderQty : 1;
    const maxQty = allowBackorder ? undefined : (availableQty < minQty ? minQty : availableQty);

    return {
      basePrice,
      discountedPriceValue,
      priceModifier,
      effectivePricePreTax,
      finalPriceWithTax,
      taxAmount,
      taxRatePercent,
      originalPriceWithTax,
      showStrikeThrough,
      discountPercent,
      stockStatus, stockColor, stockIcon,
      isAddToCartDisabled,
      minQty, maxQty, availableQty
    };
  }, [product, selectedVariant]);

  useEffect(() => {
      if (displayDetails.minQty && quantity < displayDetails.minQty) {
          setQuantity(displayDetails.minQty);
      }
  }, [displayDetails.minQty, quantity]);


  // --- RENDERING ---
  if (loading) return <SpinnerComponent />;
  if (error) return <Center h="80vh" flexDirection="column"><Heading size="md" color="red.500">Error</Heading><Text mt={2}>{error}</Text></Center>;
  if (!product) return <Center h="80vh"><Text>Product data could not be loaded.</Text></Center>;

  return (
    <Container maxW="container.xl" py={{ base: 6, md: 12 }}>
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 8, lg: 16 }}>

        {/* --- MEDIA GALLERY COLUMN --- */}
        <VStack spacing={4} align="stretch" position={{ base: 'relative', lg: 'sticky' }} top={{ lg: '80px' }} h="max-content">
          <AspectRatio ratio={1} w="100%">
            <Box bg="gray.100" borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflow="hidden">
              {!activeMedia ? (
                 <Center h="100%" bg="gray.200"><Text color="gray.500">No Image Available</Text></Center>
              ) : activeMedia.type === 'video' ? (
                <Box as="video" src={getProxiedUrl(activeMedia.url)} controls autoPlay muted loop playsInline width="100%" height="100%" objectFit="contain" />
              ) : (
                <Image src={getProxiedUrl(activeMedia.url)} alt={`${product.title} - view`} objectFit="contain" w="100%" h="100%" fallbackSrc="https://via.placeholder.com/600?text=Image+Not+Found" />
              )}
            </Box>
          </AspectRatio>
          {displayMedia.length > 1 && (
            <HStack spacing={3} overflowX="auto" py={2} css={{ '&::-webkit-scrollbar': { height: '8px' }, '&::-webkit-scrollbar-track': { background: '#f1f1f1' }, '&::-webkit-scrollbar-thumb': { background: '#cccccc', borderRadius: '4px' }, '&::-webkit-scrollbar-thumb:hover': { background: '#aaaaaa' } }}>
              {displayMedia.map((mediaItem) => (
                <Box key={mediaItem.url} as="button" w="80px" h="80px" minW="80px" borderWidth="2px" borderRadius="md" overflow="hidden" position="relative" bg="gray.100" borderColor={activeMedia?.url === mediaItem.url ? 'teal.500' : 'transparent'} onClick={() => setActiveMedia(mediaItem)} _focus={{ outline: 'none', shadow: 'outline' }}>
                  {mediaItem.type === 'video' ? (
                    <Flex align="center" justify="center" w="100%" h="100%" bg="gray.300" color="gray.600">
                      <Icon as={FiPlayCircle} boxSize={8} />
                    </Flex>
                  ) : (
                    <Image src={getProxiedUrl(mediaItem.url)} alt={`${product.title} - thumbnail`} objectFit="cover" w="100%" h="100%" fallbackSrc="https://via.placeholder.com/80?text=!" />
                  )}
                </Box>
              ))}
            </HStack>
          )}
        </VStack>

        {/* --- PRODUCT INFO COLUMN --- */}
        <VStack align="flex-start" spacing={5}>
          <Heading as="h1" size="xl" fontWeight="800" color="gray.800">{product.title}</Heading>

          <VStack align="stretch" w="full" spacing={5}>
            {/* --- ENHANCED PRICE DISPLAY --- */}
            <Box p={4} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                {currentUser ? (
                    // LOGGED IN VIEW
                    <>
                        <HStack align="baseline" spacing={3} wrap="wrap">
                            <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color="teal.600">
                              {formatCurrency(displayDetails.finalPriceWithTax)}
                            </Text>
                            {displayDetails.showStrikeThrough && (
                               <Text as="s" color="gray.400" fontSize="xl" fontWeight="normal">
                                 {formatCurrency(displayDetails.originalPriceWithTax)}
                               </Text>
                             )}
                             {displayDetails.discountPercent > 0 && (
                                <Badge colorScheme='green' variant="subtle" fontSize="sm" px={2} py={0.5} borderRadius="md">
                                    {displayDetails.discountPercent}% OFF
                                </Badge>
                             )}
                        </HStack>
                       <Text fontSize="sm" color="gray.600" mt={1}>
                         (Price before tax: {formatCurrency(displayDetails.effectivePricePreTax)} + {formatCurrency(displayDetails.taxAmount)} tax ({displayDetails.taxRatePercent}%))
                         {product.priceUnit && ` ${product.priceUnit}`}
                       </Text>
                   </>
                ) : (
                    // GUEST VIEW
                    <HStack spacing={3}>
                        <Icon as={FiLock} color="gray.500" boxSize={6} />
                        <VStack align="start" spacing={0}>
                            <Text fontWeight="bold" color="gray.600">Price hidden</Text>
                            <Text fontSize="sm" color="gray.500">Please log in to view pricing.</Text>
                        </VStack>
                    </HStack>
                )}
            </Box>

            {/* Stock Status */}
            <Flex align="center">
                <Tag size="md" variant="subtle" colorScheme={displayDetails.stockColor} mr={3}>
                    <Icon as={displayDetails.stockIcon} mr={2} />
                    {displayDetails.stockStatus}
                </Tag>
                {displayDetails.stockColor === 'green' && <Text fontSize="sm" color="gray.600">{displayDetails.availableQty} units available</Text>}
            </Flex>

            {/* Description */}
            {product.description && <Text color="gray.700" fontSize="md" lineHeight="tall">{product.description}</Text>}
          </VStack>

          {/* Variants Selection */}
          {product.hasVariants && product.variantOptions && (
            <VStack align="flex-start" w="full" spacing={4} pt={4}>
              {Object.entries(product.variantOptions).map(([optionName, values]) => (
                values && values.length > 0 && (
                    <Box key={optionName} w="full">
                      <Text fontWeight="semibold" mb={2} fontSize="md" color="gray.700">{optionName}</Text>
                      <ButtonGroup flexWrap="wrap" gap={2} isAttached={false} variant="outline">
                        {values.map(value => (
                          <Button key={value} onClick={() => handleOptionSelect(optionName, value)} isActive={selectedOptions[optionName] === value} _active={{ bg: 'teal.500', color: 'white', borderColor: 'teal.500' }} px={4} size="sm">
                            {value}
                          </Button>
                        ))}
                      </ButtonGroup>
                    </Box>
                )
              ))}
              {selectedVariant === 'unavailable' && <Text color="red.500" mt={2}>This combination is not available.</Text>}
            </VStack>
          )}

          {/* Add to Cart Section */}
          <VStack w="full" spacing={4} pt={6}>
            {currentUser ? (
                // LOGGED IN USER
                <HStack w="full">
                  <NumberInput size="lg" w="120px" value={quantity} min={displayDetails.minQty} max={displayDetails.maxQty} onChange={(valStr, valNum) => setQuantity(isNaN(valNum) ? displayDetails.minQty : valNum)} isDisabled={displayDetails.isAddToCartDisabled || !displayDetails.maxQty || displayDetails.maxQty < displayDetails.minQty} allowMouseWheel>
                    <NumberInputField />
                    <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                  </NumberInput>
                  <Button colorScheme="teal" size="lg" onClick={handleAddToCart} isDisabled={displayDetails.isAddToCartDisabled} flex="1" leftIcon={<FiShoppingCart />} _hover={!displayDetails.isAddToCartDisabled ? { transform: 'translateY(-2px)', boxShadow: 'lg' } : {}} transition="all 0.2s">
                    Add to Cart
                  </Button>
                </HStack>
            ) : (
                // GUEST USER
                <Box w="full">
                     <Alert status="info" borderRadius="md" mb={4}>
                          <AlertIcon />
                          You must be logged in to add items to your cart.
                      </Alert>
                      <Button colorScheme="teal" size="lg" w="full" onClick={() => navigate('/login', { state: { from: location } })}>
                          Login to Buy
                      </Button>
                </Box>
            )}

            {displayDetails.minQty > 1 && <Text fontSize="sm" color="gray.500" w="full">Minimum order quantity: {displayDetails.minQty}.</Text>}
             {/* Show max quantity if relevant */}
            {!product.allowBackorders && displayDetails.availableQty > 0 && displayDetails.availableQty < Infinity && displayDetails.stockColor === 'green' && (
                <Text fontSize="sm" color="gray.500" w="full">Maximum order quantity: {displayDetails.maxQty}.</Text>
            )}
          </VStack>

          {/* --- FULL DETAILS SECTION --- */}
          <Box w="full" pt={6}>
            <Divider />
            <Box mt={6} >
              <Heading size="md" mb={4}>Product Details</Heading>
              <VStack align="stretch" spacing={3} fontSize="sm" color="gray.700" w="full" p={5} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
                {product.sku && <HStack justifyContent="space-between"><Text color="gray.500">SKU:</Text> <Text fontWeight="medium">{product.sku}</Text></HStack>}
                {product.weight > 0 && <HStack justifyContent="space-between"><Text color="gray.500">Weight:</Text> <Text fontWeight="medium">{product.weight} {product.weightUnit || ''}</Text></HStack>}
                {product.dimensions && <HStack justifyContent="space-between"><Text color="gray.500">Dimensions (LxWxH):</Text> <Text fontWeight="medium">{typeof product.dimensions === 'object' ? `${product.dimensions.length || '?'} x ${product.dimensions.width || '?'} x ${product.dimensions.height || '?'} ${product.dimensions.unit || ''}` : product.dimensions}</Text></HStack>}
                {displayDetails.minQty > 1 && <HStack justifyContent="space-between"><Text color="gray.500">Min. Order Qty:</Text> <Text fontWeight="medium">{displayDetails.minQty}</Text></HStack>}
                {product.tags?.length > 0 && (
                  <HStack align="start" justifyContent="space-between"><Text color="gray.500" mt="5px">Tags:</Text>
                    <Flex flexWrap="wrap" justifyContent="flex-end" gap={2}>
                      {product.tags.map(tag => <Tag key={tag} size="sm" variant="subtle" colorScheme="blue">{tag}</Tag>)}
                    </Flex>
                  </HStack>
                )}
                <HStack justifyContent="space-between"><Text color="gray.500">Taxable:</Text> <Text fontWeight="medium">{displayDetails.taxRatePercent > 0 ? `Yes (${displayDetails.taxRatePercent}%)` : 'No'}</Text></HStack>
                <HStack justifyContent="space-between"><Text color="gray.500">Allow Backorders:</Text> <Text fontWeight="medium">{product.allowBackorders ? 'Yes' : 'No'}</Text></HStack>
                <HStack justifyContent="space-between"><Text color="gray.500">Hide if OOS:</Text> <Text fontWeight="medium">{product.hideWhenOutOfStock ? 'Yes' : 'No'}</Text></HStack>

                {/* Custom Fields */}
                {product.customFields && Object.keys(product.customFields).length > 0 && <Divider pt={2}/>}
                {product.customFields && Object.entries(product.customFields).map(([key, value]) => (
                  value && <HStack justifyContent="space-between" key={key}><Text color="gray.500">{key}:</Text> <Text fontWeight="medium" textAlign="right">{String(value)}</Text></HStack>
                ))}
              </VStack>
            </Box>

            {/* Bulk Discounts Section */}
            {product.bulkDiscounts && product.bulkDiscounts.length > 0 && currentUser && (
              <Box w="full" pt={6}>
                <Divider />
                <Box mt={6}>
                  <Heading size="md" mb={4}>Volume Pricing (per unit, excl. tax)</Heading>
                  <TableContainer borderWidth="1px" borderColor="gray.200" borderRadius="lg">
                    <Table variant='simple' size='sm'>
                      <Thead bg="gray.50">
                        <Tr>
                          <Th>Quantity</Th>
                          <Th isNumeric>Price per Unit</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {/* Add base price tier if applicable */}
                        {product.bulkDiscounts.length > 0 && product.bulkDiscounts[0].startQty > 1 && (
                            <Tr>
                                <Td>1 - {product.bulkDiscounts[0].startQty - 1}</Td>
                                <Td isNumeric>{formatCurrency(product.price)}</Td>
                            </Tr>
                        )}
                        {/* Map through sorted bulk discounts */}
                        {product.bulkDiscounts.sort((a, b) => a.startQty - b.startQty).map((discount, index) => (
                          <Tr key={index}>
                            <Td>{discount.startQty}{discount.endQty ? ` - ${discount.endQty}` : '+'}</Td>
                            <Td isNumeric>{formatCurrency(discount.pricePerUnit)}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>
            )}
          </Box>
        </VStack>
      </SimpleGrid>
    </Container>
  );
};

export default ProductDetailPage;