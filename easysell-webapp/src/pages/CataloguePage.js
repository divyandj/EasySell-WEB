// // import React, { useState, useEffect } from 'react';
// // import { useParams } from 'react-router-dom';
// // import { db } from '../firebase';
// // import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
// // import {
// //   Box,
// //   Heading,
// //   SimpleGrid,
// //   Container,
// //   Text,
// //   Center,
// //   Alert,
// //   AlertIcon,
// //   AlertTitle,
// //   AlertDescription,
// // } from '@chakra-ui/react';
// // import ProductCard from '../components/ProductCard';
// // import SpinnerComponent from '../components/Spinner';

// // // Define the key for local storage and the maximum history size
// // const RECENTLY_VISITED_KEY = 'recentlyVisitedCatalogues';
// // const MAX_HISTORY_SIZE = 5;

// // // Helper function to manage recently visited catalogues in local storage
// // const addCatalogueToHistory = (id, name) => {
// //   if (!id || !name) return; // Don't save if data is missing

// //   try {
// //     // 1. Get current history (or initialize an empty array)
// //     const storedHistory = localStorage.getItem(RECENTLY_VISITED_KEY);
// //     let history = storedHistory ? JSON.parse(storedHistory) : [];

// //     // 2. Remove existing entry for this catalogue ID (if any)
// //     history = history.filter(item => item.id !== id);

// //     // 3. Add the new entry to the beginning of the array
// //     history.unshift({ id, name, visitedAt: new Date().toISOString() });

// //     // 4. Limit the history size
// //     history = history.slice(0, MAX_HISTORY_SIZE);

// //     // 5. Save back to local storage
// //     localStorage.setItem(RECENTLY_VISITED_KEY, JSON.stringify(history));

// //   } catch (error) {
// //     console.error("Failed to update recently visited catalogues:", error);
// //     // Handle potential errors like full local storage or invalid JSON
// //   }
// // };

// // const CataloguePage = () => {
// //   const { catalogueId } = useParams();
// //   const [products, setProducts] = useState([]);
// //   const [catalogueName, setCatalogueName] = useState('');
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);

// //   useEffect(() => {
// //     const fetchCatalogueData = async () => {
// //       setLoading(true);
// //       setError(null);
// //       try {
// //         // Fetch catalogue name
// //         const catalogueRef = doc(db, 'catalogues', catalogueId);
// //         const catalogueSnap = await getDoc(catalogueRef);

// //         if (!catalogueSnap.exists()) {
// //           throw new Error('Catalogue not found.');
// //         }
// //         const fetchedName = catalogueSnap.data().name;
// //         setCatalogueName(fetchedName);

// //         // Fetch products for the catalogue WHERE visibleInCatalogue is true
// //         const productsQuery = query(
// //           collection(db, 'products'),
// //           where('catalogueId', '==', catalogueId),
// //           where('visibleInCatalogue', '==', true) // Filter added here
// //         );

// //         const querySnapshot = await getDocs(productsQuery);
// //         const productsList = querySnapshot.docs.map(doc => ({
// //           id: doc.id,
// //           ...doc.data(),
// //         }));
// //         setProducts(productsList);

// //         // Add to history AFTER successful fetch
// //         addCatalogueToHistory(catalogueId, fetchedName);

// //       } catch (err) {
// //         setError(err.message || "Failed to load catalogue data.");
// //         console.error("Error fetching catalogue data:", err);
// //         // Firebase might log an error in the console if an index is needed.
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     if (catalogueId) {
// //       fetchCatalogueData();
// //     } else {
// //       setError("No catalogue ID provided.");
// //       setLoading(false);
// //     }
// //   }, [catalogueId]);

// //   if (loading) {
// //     return <SpinnerComponent />;
// //   }

// //   if (error) {
// //     return (
// //       <Container maxW="container.xl" py={8}>
// //         <Alert status="error">
// //           <AlertIcon />
// //           <AlertTitle mr={2}>Error Loading Catalogue!</AlertTitle>
// //           <AlertDescription>{error}</AlertDescription>
// //         </Alert>
// //       </Container>
// //     );
// //   }

// //   return (
// //     <Container maxW="container.xl" py={8}>
// //       <Heading as="h1" size="xl" mb={6} textAlign="center">
// //         {catalogueName}
// //       </Heading>
// //       {products.length === 0 ? (
// //         <Center h="40vh">
// //           <Text fontSize="lg" color="gray.500">No visible products found in this catalogue.</Text>
// //         </Center>
// //       ) : (
// //         <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
// //           {products.map(product => (
// //             <ProductCard key={product.id} product={product} />
// //           ))}
// //         </SimpleGrid>
// //       )}
// //     </Container>
// //   );
// // };

// // export default CataloguePage;


// import React, { useState, useEffect } from 'react';
// import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
// import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
// import { db } from '../firebase';
// import {
//   Container,
//   Heading,
//   SimpleGrid,
//   Box,
//   Image,
//   Text,
//   Button,
//   VStack,
//   HStack,
//   Badge,
//   Input,
//   Select,
//   useToast,
//   Flex,
//   Icon
// } from '@chakra-ui/react';
// import { FiShoppingCart, FiLock } from 'react-icons/fi';
// import { useCart } from '../context/CartContext';
// import { useAuth } from '../context/AuthContext'; // Import Auth Context
// import { getProxiedUrl } from '../config';
// import SpinnerComponent from '../components/Spinner';

// const CataloguePage = () => {
//   const { catalogueId } = useParams();
//   const { addToCart } = useCart();
//   const { currentUser } = useAuth(); // Get current user status
//   const navigate = useNavigate();
//   const toast = useToast();

//   const [catalogue, setCatalogue] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [categoryFilter, setCategoryFilter] = useState('All');

//   // Fetch Data
//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         // 1. Fetch Catalogue Details
//         const catalogueRef = doc(db, 'catalogues', catalogueId);
//         const catalogueSnap = await getDoc(catalogueRef);

//         if (catalogueSnap.exists()) {
//           setCatalogue({ id: catalogueSnap.id, ...catalogueSnap.data() });
//         } else {
//           toast({ title: "Catalogue not found", status: "error" });
//           setLoading(false);
//           return;
//         }

//         // 2. Fetch Products for this Catalogue
//         // Note: In a real app, you might want to index products by catalogueId
//         // For now, fetching all products and filtering (or using a where query if setup)
//         // Assuming products have a 'catalogueId' field as per previous context
//         const productsRef = collection(db, 'products');
//         const productsSnap = await getDocs(productsRef);
        
//         const fetchedProducts = productsSnap.docs
//           .map(doc => ({ id: doc.id, ...doc.data() }))
//           .filter(p => p.catalogueId === catalogueId);

//         setProducts(fetchedProducts);

//       } catch (error) {
//         console.error("Error fetching catalogue:", error);
//         toast({ title: "Error loading data", status: "error" });
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [catalogueId, toast]);

//   // Handle Add to Cart
//   const handleAddToCart = (e, product) => {
//     e.preventDefault(); // Prevent navigation to product detail
//     addToCart(product, 1);
//     toast({
//       title: "Added to Cart",
//       description: `${product.title} added.`,
//       status: "success",
//       duration: 2000,
//       isClosable: true,
//     });
//   };

//   // Filter Logic
//   const filteredProducts = products.filter(product => {
//     const matchesSearch = product.title?.toLowerCase().includes(searchQuery.toLowerCase());
//     const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
//     return matchesSearch && matchesCategory;
//   });

//   // Get unique categories
//   const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

//   if (loading) return <SpinnerComponent />;

//   if (!catalogue) return <Container py={20}><Heading>Catalogue Not Found</Heading></Container>;

//   return (
//     <Container maxW="container.xl" py={10}>
//       {/* Header */}
//       <VStack spacing={4} mb={8} align="center" textAlign="center">
//         <Heading size="2xl">{catalogue.name}</Heading>
//         {catalogue.description && <Text color="gray.600">{catalogue.description}</Text>}
//       </VStack>

//       {/* Filters */}
//       <Flex mb={8} gap={4} direction={{ base: 'column', md: 'row' }}>
//         <Input 
//           placeholder="Search products..." 
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//         />
//         <Select 
//           w={{ base: 'full', md: '200px' }} 
//           value={categoryFilter}
//           onChange={(e) => setCategoryFilter(e.target.value)}
//         >
//           {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
//         </Select>
//       </Flex>

//       {/* Product Grid */}
//       <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
//         {filteredProducts.map(product => {
//              // Basic price logic for display
//              const displayPrice = product.discountedPrice > 0 ? product.discountedPrice : product.price;
             
//              return (
//               <Box 
//                 key={product.id} 
//                 borderWidth="1px" 
//                 borderRadius="lg" 
//                 overflow="hidden" 
//                 _hover={{ shadow: 'md' }}
//                 transition="all 0.2s"
//                 as={RouterLink}
//                 to={`/product/${product.id}`} // Link to detail page
//                 position="relative"
//               >
//                 {/* Image */}
//                 <Image 
//                   src={getProxiedUrl(product.media?.[0]?.url)} 
//                   alt={product.title}
//                   h="200px" 
//                   w="full" 
//                   objectFit="cover" 
//                   fallbackSrc="https://via.placeholder.com/300"
//                 />

//                 <Box p={4}>
//                   {/* Category Badge */}
//                   <Badge borderRadius="full" px="2" colorScheme="teal" mb={2}>
//                     {product.category || 'General'}
//                   </Badge>

//                   {/* Title */}
//                   <Heading size="md" mb={2} noOfLines={2}>
//                     {product.title}
//                   </Heading>

//                   {/* --- PRICE & ACTION LOGIC --- */}
//                   <HStack justify="space-between" align="center" mt={4}>
//                     {currentUser ? (
//                         // LOGGED IN: Show Price
//                         <Box>
//                             {product.discountedPrice > 0 && (
//                                 <Text fontSize="sm" textDecoration="line-through" color="gray.500">
//                                     ₹{product.price}
//                                 </Text>
//                             )}
//                             <Text fontWeight="bold" fontSize="xl" color="teal.600">
//                                 ₹{displayPrice}
//                             </Text>
//                         </Box>
//                     ) : (
//                         // GUEST: Show 'Login to View'
//                         <HStack color="gray.500" fontSize="sm">
//                             <Icon as={FiLock} />
//                             <Text fontStyle="italic">Login to view price</Text>
//                         </HStack>
//                     )}
//                   </HStack>

//                   <Box mt={4}>
//                     {currentUser ? (
//                         <Button 
//                             w="full" 
//                             colorScheme="teal" 
//                             leftIcon={<FiShoppingCart />}
//                             onClick={(e) => handleAddToCart(e, product)}
//                             isDisabled={!product.inStock} // Assuming 'inStock' field exists
//                         >
//                             {product.inStock === false ? 'Out of Stock' : 'Add to Cart'}
//                         </Button>
//                     ) : (
//                         <Button 
//                             w="full" 
//                             variant="outline" 
//                             colorScheme="teal" 
//                             onClick={(e) => {
//                                 e.preventDefault();
//                                 navigate('/login');
//                             }}
//                         >
//                             Login to Buy
//                         </Button>
//                     )}
//                   </Box>
//                 </Box>
//               </Box>
//              );
//         })}
//       </SimpleGrid>
      
//       {filteredProducts.length === 0 && (
//           <Text textAlign="center" color="gray.500" py={10}>No products found matching your criteria.</Text>
//       )}
//     </Container>
//   );
// };

// export default CataloguePage;

import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Container,
  Heading,
  SimpleGrid,
  Box,
  Image,
  Text,
  Button,
  VStack,
  HStack,
  Badge,
  Input,
  Select,
  useToast,
  Flex,
  Icon
} from '@chakra-ui/react';
import { FiShoppingCart, FiLock, FiEye } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getProxiedUrl } from '../config';
import SpinnerComponent from '../components/Spinner';

// Helper to format currency
const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

const CataloguePage = () => {
  const { catalogueId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [catalogue, setCatalogue] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const catalogueRef = doc(db, 'catalogues', catalogueId);
        const catalogueSnap = await getDoc(catalogueRef);

        if (catalogueSnap.exists()) {
          setCatalogue({ id: catalogueSnap.id, ...catalogueSnap.data() });
        } else {
          toast({ title: "Catalogue not found", status: "error" });
          setLoading(false);
          return;
        }

        const productsRef = collection(db, 'products');
        const productsSnap = await getDocs(productsRef);
        
        const fetchedProducts = productsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p => p.catalogueId === catalogueId);

        setProducts(fetchedProducts);

      } catch (error) {
        console.error("Error fetching catalogue:", error);
        toast({ title: "Error loading data", status: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [catalogueId, toast]);


  // --- FILTER LOGIC ---
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  if (loading) return <SpinnerComponent />;
  if (!catalogue) return <Container py={20}><Heading>Catalogue Not Found</Heading></Container>;

  return (
    <Container maxW="container.xl" py={10}>
      {/* --- HEADER --- */}
      <VStack spacing={4} mb={8} align="center" textAlign="center">
        <Heading size="2xl">{catalogue.name}</Heading>
        {catalogue.description && <Text color="gray.600">{catalogue.description}</Text>}
      </VStack>

      {/* --- FILTERS --- */}
      <Flex mb={8} gap={4} direction={{ base: 'column', md: 'row' }}>
        <Input 
          placeholder="Search products..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select 
          w={{ base: 'full', md: '200px' }} 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </Select>
      </Flex>

      {/* --- PRODUCT GRID --- */}
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
        {filteredProducts.map(product => {
             const displayPrice = product.discountedPrice > 0 ? product.discountedPrice : product.price;
             
             return (
              <Box 
                key={product.id} 
                borderWidth="1px" 
                borderRadius="lg" 
                overflow="hidden" 
                _hover={{ shadow: 'md' }}
                transition="all 0.2s"
                as={RouterLink}
                to={`/product/${product.id}`} // Clicking card goes to details
                position="relative"
              >
                <Image 
                  src={getProxiedUrl(product.media?.[0]?.url)} 
                  alt={product.title}
                  h="200px" 
                  w="full" 
                  objectFit="cover" 
                  fallbackSrc="https://via.placeholder.com/300"
                />

                <Box p={4}>
                  <Badge borderRadius="full" px="2" colorScheme="teal" mb={2}>
                    {product.category || 'General'}
                  </Badge>

                  <Heading size="md" mb={2} noOfLines={2}>
                    {product.title}
                  </Heading>

                  {/* PRICE LOGIC */}
                  <HStack justify="space-between" align="center" mt={4}>
                    {currentUser ? (
                        <Box>
                            {product.discountedPrice > 0 && (
                                <Text fontSize="sm" textDecoration="line-through" color="gray.500">
                                    {formatCurrency(product.price)}
                                </Text>
                            )}
                            <Text fontWeight="bold" fontSize="xl" color="teal.600">
                                {formatCurrency(displayPrice)}
                            </Text>
                        </Box>
                    ) : (
                        <HStack color="gray.500" fontSize="sm">
                            <Icon as={FiLock} />
                            <Text fontStyle="italic">Login to view price</Text>
                        </HStack>
                    )}
                  </HStack>

                  <Box mt={4}>
                    {currentUser ? (
                        <Button 
                            w="full" 
                            colorScheme="teal" 
                            // If user is logged in, Button goes to Product Details
                            onClick={(e) => {
                                e.preventDefault();
                                navigate(`/product/${product.id}`);
                            }}
                            isDisabled={product.inStock === false && !product.allowBackorders}
                        >
                            {(product.inStock === false && !product.allowBackorders) 
                                ? 'Out of Stock' 
                                : (product.hasVariants ? 'Select Options' : 'View Details')}
                        </Button>
                    ) : (
                        <Button 
                            w="full" 
                            variant="outline" 
                            colorScheme="teal" 
                            onClick={(e) => {
                                e.preventDefault();
                                navigate('/login');
                            }}
                        >
                            Login to Buy
                        </Button>
                    )}
                  </Box>
                </Box>
              </Box>
             );
        })}
      </SimpleGrid>
      
      {filteredProducts.length === 0 && (
          <Text textAlign="center" color="gray.500" py={10}>No products found.</Text>
      )}
    </Container>
  );
};

export default CataloguePage;