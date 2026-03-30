import React, { useState, useEffect } from "react";
import {
  useParams,
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
  Text,
  Button,
  VStack,
  Input,
  useToast,
  Flex,
  Icon,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Skeleton,
  Badge,
  HStack,
  Center,
} from "@chakra-ui/react";
import { FiSearch, FiShoppingBag } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import ProductCard from '../components/ProductCard';

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const MotionSimpleGrid = motion(SimpleGrid);

const CataloguePage = () => {
  const { catalogueId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [catalogue, setCatalogue] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Theme
  const pageBg = useColorModeValue('#F8F9FC', '#09090B');
  const searchBg = useColorModeValue('white', '#111116');
  const searchBorder = useColorModeValue('gray.100', 'whiteAlpha.100');
  const chipActiveBg = useColorModeValue('brand.500', 'brand.400');
  const chipInactiveBg = useColorModeValue('white', 'whiteAlpha.100');
  const chipInactiveColor = useColorModeValue('gray.600', 'gray.400');
  const chipInactiveBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const chipHoverBg = useColorModeValue('gray.100', 'whiteAlpha.200');
  const textColor = useColorModeValue('gray.800', 'white');
  const descColor = useColorModeValue('gray.500', 'gray.400');
  const emptyIconBg = useColorModeValue('gray.100', 'whiteAlpha.100');

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
          toast({ title: "Catalogue not found", description: "The requested catalogue does not exist.", status: "error", duration: 5000, isClosable: true });
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
        toast({ title: "Error loading data", description: "Could not load catalogue data. Please try again.", status: "error", duration: 5000, isClosable: true });
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

  // Loading State
  if (loading) return (
    <Box bg={pageBg} minH="100vh">
      <Box bgGradient="linear(to-br, brand.600, brand.800)" py={16} px={6}>
        <Container maxW="container.xl">
          <Skeleton height="40px" w="250px" mb={3} />
          <Skeleton height="20px" w="400px" />
        </Container>
      </Box>
      <Container maxW="container.xl" mt={-6} position="relative" zIndex={2}>
        <Skeleton height="52px" borderRadius="16px" maxW="600px" mb={10} />
        <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={6}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} height="300px" borderRadius="16px" />
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );

  if (!catalogue)
    return (
      <Box bg={pageBg} minH="100vh">
        <Center py={32}>
          <VStack spacing={4}>
            <Heading color={textColor}>Catalogue Not Found</Heading>
          </VStack>
        </Center>
      </Box>
    );

  return (
    <Box minH="100vh" pb={20} bg={pageBg}>
      {/* ========== BANNER ========== */}
      <Box
        bgGradient="linear(to-br, brand.600, brand.800)"
        backgroundImage={catalogue.imageUrl ? `url(${catalogue.imageUrl})` : undefined}
        backgroundSize="cover"
        backgroundPosition="center"
        pt={{ base: 16, md: 20 }}
        pb={{ base: 24, md: 28 }}
        px={{ base: 4, md: 8 }}
        position="relative"
        overflow="hidden"
      >
        {/* Overlay */}
        <Box
          position="absolute"
          top="0"
          left="0"
          w="full"
          h="full"
          bg={catalogue.imageUrl ? "blackAlpha.700" : "transparent"}
        />

        {/* Decorative */}
        <Box position="absolute" top="-20%" right="-10%" w="400px" h="400px" bg="accent.500" filter="blur(160px)" opacity="0.1" borderRadius="full" />

        <Container maxW="container.xl" position="relative" zIndex={1}>
          <VStack align="flex-start" spacing={3}>
            <Badge
              bg="whiteAlpha.200"
              color="white"
              backdropFilter="blur(10px)"
              px={3}
              py={1.5}
              rounded="full"
              fontSize="xs"
              fontWeight="600"
              letterSpacing="0.08em"
              textTransform="uppercase"
            >
              Collection
            </Badge>
            <Heading
              fontSize={{ base: "2xl", md: "4xl" }}
              color="white"
              fontWeight="900"
              letterSpacing="-0.02em"
              lineHeight="1.1"
            >
              {catalogue.name}
            </Heading>
            {catalogue.description && (
              <Text
                color="whiteAlpha.800"
                fontSize={{ base: "sm", md: "md" }}
                maxW="600px"
                lineHeight="1.6"
              >
                {catalogue.description}
              </Text>
            )}
          </VStack>
        </Container>
      </Box>

      {/* ========== SEARCH BAR (Overlapping) ========== */}
      <Container maxW="container.xl" mt={{ base: "-30px", md: "-36px" }} position="relative" zIndex={2}>
        <Box
          bg={searchBg}
          borderWidth="1px"
          borderColor={searchBorder}
          shadow="card"
          rounded="16px"
          p={1.5}
          maxW="600px"
        >
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none" h="full">
              <FiSearch color="#9ca3af" fontSize="1.1em" />
            </InputLeftElement>
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              border="none"
              _focus={{ boxShadow: "none" }}
              fontSize="md"
              h="48px"
              fontWeight="400"
            />
          </InputGroup>
        </Box>
      </Container>

      {/* ========== CATEGORY CHIPS ========== */}
      <Container maxW="container.xl" mt={8}>
        <Flex
          overflowX="auto"
          pb={2}
          css={{
            '&::-webkit-scrollbar': { display: 'none' },
            'msOverflowStyle': 'none',
            'scrollbarWidth': 'none',
          }}
          gap={2}
          align="center"
        >
          {categories.map((cat) => (
            <Button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              rounded="full"
              size="sm"
              px={5}
              h="36px"
              bg={categoryFilter === cat ? chipActiveBg : chipInactiveBg}
              color={categoryFilter === cat ? "white" : chipInactiveColor}
              borderWidth={categoryFilter === cat ? "0" : "1px"}
              borderColor={chipInactiveBorder}
              _hover={{ bg: categoryFilter === cat ? chipActiveBg : chipHoverBg }}
              _active={{ transform: "scale(0.96)" }}
              boxShadow={categoryFilter === cat ? "0 4px 14px rgba(108,92,231,0.3)" : "none"}
              transition="all 0.2s"
              whiteSpace="nowrap"
              fontWeight={categoryFilter === cat ? "600" : "500"}
              fontSize="sm"
            >
              {cat}
            </Button>
          ))}
        </Flex>

        {/* ========== PRODUCT GRID ========== */}
        <MotionSimpleGrid
          columns={{ base: 2, md: 3, lg: 4 }}
          spacing={{ base: 4, md: 6 }}
          mt={8}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </MotionSimpleGrid>

        {filteredProducts.length === 0 && (
          <Center py={20}>
            <VStack spacing={4}>
              <Flex w={16} h={16} bg={emptyIconBg} borderRadius="full" align="center" justify="center">
                <Icon as={FiSearch} w={8} h={8} color="gray.400" />
              </Flex>
              <Text color={descColor} fontSize="md" fontWeight="500">No products found matching your search.</Text>
              <Button
                variant="link"
                color="brand.500"
                fontWeight="600"
                onClick={() => { setSearchQuery(''); setCategoryFilter('All'); }}
              >
                Clear Filters
              </Button>
            </VStack>
          </Center>
        )}
      </Container>
    </Box>
  );
};

export default CataloguePage;