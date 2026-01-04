// import React, { useState, useEffect } from 'react';
// import { useParams, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
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
// import { useAuth } from '../context/AuthContext';
// import { getProxiedUrl } from '../config';
// import SpinnerComponent from '../components/Spinner';

// // Helper to format currency
// const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

// const CataloguePage = () => {
//   const { catalogueId } = useParams();
//   const { currentUser } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation(); // <--- 1. Get current location
//   const toast = useToast();

//   const [catalogue, setCatalogue] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [categoryFilter, setCategoryFilter] = useState('All');

//   // --- FETCH DATA ---
//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const catalogueRef = doc(db, 'catalogues', catalogueId);
//         const catalogueSnap = await getDoc(catalogueRef);

//         if (catalogueSnap.exists()) {
//           setCatalogue({ id: catalogueSnap.id, ...catalogueSnap.data() });
//         } else {
//           toast({ title: "Catalogue not found", status: "error" });
//           setLoading(false);
//           return;
//         }

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

//   // --- FILTER LOGIC ---
//   const filteredProducts = products.filter(product => {
//     const matchesSearch = product.title?.toLowerCase().includes(searchQuery.toLowerCase());
//     const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
//     return matchesSearch && matchesCategory;
//   });

//   const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

//   if (loading) return <SpinnerComponent />;
//   if (!catalogue) return <Container py={20}><Heading>Catalogue Not Found</Heading></Container>;

//   return (
//     <Container maxW="container.xl" py={10}>
//       {/* --- HEADER --- */}
//       <VStack spacing={4} mb={8} align="center" textAlign="center">
//         <Heading size="2xl">{catalogue.name}</Heading>
//         {catalogue.description && <Text color="gray.600">{catalogue.description}</Text>}
//       </VStack>

//       {/* --- FILTERS --- */}
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

//       {/* --- PRODUCT GRID --- */}
//       <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
//         {filteredProducts.map(product => {
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
//                 to={`/product/${product.id}`} // Clicking card goes to details
//                 position="relative"
//               >
//                 <Image
//                   src={getProxiedUrl(product.media?.[0]?.url)}
//                   alt={product.title}
//                   h="200px"
//                   w="full"
//                   objectFit="cover"
//                   fallbackSrc="https://via.placeholder.com/300"
//                 />

//                 <Box p={4}>
//                   <Badge borderRadius="full" px="2" colorScheme="teal" mb={2}>
//                     {product.category || 'General'}
//                   </Badge>

//                   <Heading size="md" mb={2} noOfLines={2}>
//                     {product.title}
//                   </Heading>

//                   {/* PRICE LOGIC */}
//                   <HStack justify="space-between" align="center" mt={4}>
//                     {currentUser ? (
//                         <Box>
//                             {product.discountedPrice > 0 && (
//                                 <Text fontSize="sm" textDecoration="line-through" color="gray.500">
//                                     {formatCurrency(product.price)}
//                                 </Text>
//                             )}
//                             <Text fontWeight="bold" fontSize="xl" color="teal.600">
//                                 {formatCurrency(displayPrice)}
//                             </Text>
//                         </Box>
//                     ) : (
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
//                             // If user is logged in, Button goes to Product Details
//                             onClick={(e) => {
//                                 e.preventDefault();
//                                 navigate(`/product/${product.id}`);
//                             }}
//                             isDisabled={product.inStock === false && !product.allowBackorders}
//                         >
//                             {(product.inStock === false && !product.allowBackorders)
//                                 ? 'Out of Stock'
//                                 : (product.hasVariants ? 'Select Options' : 'View Details')}
//                         </Button>
//                     ) : (
//                         <Button
//                             w="full"
//                             variant="outline"
//                             colorScheme="teal"
//                             onClick={(e) => {
//                                 e.preventDefault();
//                                 // <--- 2. Redirect to Login with state to return here
//                                 navigate('/login', { state: { from: location } });
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
//           <Text textAlign="center" color="gray.500" py={10}>No products found.</Text>
//       )}
//     </Container>
//   );
// };

// export default CataloguePage;

import React, { useState, useEffect } from "react";
import {
  useParams,
  Link as RouterLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
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
  Icon,
} from "@chakra-ui/react";
import { FiShoppingCart, FiLock } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import SpinnerComponent from "../components/Spinner";

// Helper to format currency
const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

const CataloguePage = () => {
  const { catalogueId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // <--- 1. Get current location
  const toast = useToast();

  const [catalogue, setCatalogue] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const catalogueRef = doc(db, "catalogues", catalogueId);
        const catalogueSnap = await getDoc(catalogueRef);

        if (catalogueSnap.exists()) {
          setCatalogue({ id: catalogueSnap.id, ...catalogueSnap.data() });
        } else {
          toast({ title: "Catalogue not found", status: "error" });
          setLoading(false);
          return;
        }

        const productsRef = collection(db, "products");
        const productsSnap = await getDocs(productsRef);

        const fetchedProducts = productsSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((p) => p.catalogueId === catalogueId);

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
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    "All",
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];

  if (loading) return <SpinnerComponent />;
  if (!catalogue)
    return (
      <Container py={20}>
        <Heading>Catalogue Not Found</Heading>
      </Container>
    );

  return (
    <Container maxW="container.xl" py={10}>
      {/* --- HEADER --- */}
      <VStack spacing={4} mb={8} align="center" textAlign="center">
        <Heading size="2xl">{catalogue.name}</Heading>
        {catalogue.description && (
          <Text color="gray.600">{catalogue.description}</Text>
        )}
      </VStack>

      {/* --- FILTERS --- */}
      <Flex mb={8} gap={4} direction={{ base: "column", md: "row" }}>
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select
          w={{ base: "full", md: "200px" }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>
      </Flex>

      {/* --- PRODUCT GRID --- */}
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
        {filteredProducts.map((product) => {
          const displayPrice =
            product.discountedPrice > 0
              ? product.discountedPrice
              : product.price;

          return (
            <Box
              key={product.id}
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              _hover={{ shadow: "md" }}
              transition="all 0.2s"
              as={RouterLink}
              to={`/product/${product.id}`} // Clicking card goes to details
              position="relative"
            >
              <Image
                src={product.media?.[0]?.url}
                alt={product.title}
                h="200px"
                w="full"
                objectFit="cover"
                fallbackSrc="https://via.placeholder.com/300"
              />

              <Box p={4}>
                <Badge borderRadius="full" px="2" colorScheme="teal" mb={2}>
                  {product.category || "General"}
                </Badge>

                <Heading size="md" mb={2} noOfLines={2}>
                  {product.title}
                </Heading>

                {/* PRICE LOGIC */}
                <HStack justify="space-between" align="center" mt={4}>
                  {currentUser ? (
                    <Box>
                      {product.discountedPrice > 0 && (
                        <Text
                          fontSize="sm"
                          textDecoration="line-through"
                          color="gray.500"
                        >
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
                      isDisabled={
                        product.inStock === false && !product.allowBackorders
                      }
                    >
                      {product.inStock === false && !product.allowBackorders
                        ? "Out of Stock"
                        : product.hasVariants
                        ? "Select Options"
                        : "View Details"}
                    </Button>
                  ) : (
                    <Button
                      w="full"
                      variant="outline"
                      colorScheme="teal"
                      onClick={(e) => {
                        e.preventDefault();
                        // <--- 2. Redirect to Login with state to return here
                        navigate("/login", { state: { from: location } });
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
        <Text textAlign="center" color="gray.500" py={10}>
          No products found.
        </Text>
      )}
    </Container>
  );
};

export default CataloguePage;