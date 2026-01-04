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
  Badge,
  Input,
  useToast,
  Flex,
  Icon,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Spinner,
} from "@chakra-ui/react";
import { FiSearch } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import ProductCard from '../components/ProductCard';

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
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

  // Theme Hooks
  const searchBg = useColorModeValue("white", "gray.800");
  const chipActiveBg = useColorModeValue("brand.600", "brand.500");
  const chipInactiveBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const chipInactiveColor = useColorModeValue("gray.600", "gray.400");
  const chipHoverBg = useColorModeValue("gray.200", "whiteAlpha.200");
  const pageBg = useColorModeValue("gray.50", "gray.900");

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

  if (loading) return (
    <Flex h="100vh" align="center" justify="center" bg={pageBg}>
      <Spinner size="xl" color="brand.500" thickness="4px" />
    </Flex>
  );

  if (!catalogue)
    return (
      <Container py={20}>
        <Heading>Catalogue Not Found</Heading>
      </Container>
    );

  return (
    <Box minH="100vh" pb={20} bg={pageBg}>
      {/* 1. PROFESSIONAL BANNER SECTION */}
      <Box
        bg="brand.600"
        backgroundImage={catalogue.imageUrl ? `url(${catalogue.imageUrl})` : undefined}
        backgroundSize="cover"
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
        pt={{ base: 24, md: 32 }}
        pb={{ base: 32, md: 40 }}
        px={{ base: 4, md: 8 }}
        textAlign="left"
        position="relative"
        overflow="hidden"
      >
        {/* Dark Overlay for Text Readability */}
        <Box
          position="absolute"
          top="0"
          left="0"
          w="full"
          h="full"
          bgGradient="linear(to-t, blackAlpha.800, blackAlpha.500)"
          opacity={0.9}
        />

        {/* Decorative Circles */}
        <Box position="absolute" top="-10%" right="-5%" w={{ base: "200px", md: "400px" }} h={{ base: "200px", md: "400px" }} bg="brand.500" rounded="full" filter="blur(80px)" opacity={0.3} mixBlendMode="overlay" />

        <Container maxW="container.xl" position="relative" zIndex="1">
          <VStack align="flex-start" spacing={{ base: 3, md: 4 }}>
            <Badge
              colorScheme="whiteAlpha"
              variant="solid"
              bg="whiteAlpha.200"
              color="white"
              backdropFilter="blur(10px)"
              px={4} py={1.5}
              rounded="full"
              fontSize={{ base: "xx-small", md: "xs" }}
              letterSpacing="widest"
              fontWeight="bold"
              boxShadow="sm"
            >
              CATALOGUE
            </Badge>
            <Heading
              fontSize={{ base: "3xl", md: "5xl", lg: "6xl" }}
              color="white"
              fontWeight="900"
              letterSpacing="tight"
              lineHeight="1.1"
              textShadow="0 4px 12px rgba(0,0,0,0.3)"
            >
              {catalogue.name}
            </Heading>
            {catalogue.description && (
              <Text
                color="whiteAlpha.900"
                fontSize={{ base: "md", md: "xl" }}
                maxW="3xl"
                fontWeight="medium"
                textShadow="0 2px 4px rgba(0,0,0,0.3)"
              >
                {catalogue.description}
              </Text>
            )}
          </VStack>
        </Container>
      </Box>

      {/* 2. OVERLAPPING SEARCH SECTION */}
      <Container maxW="container.xl" mt={{ base: "-40px", md: "-50px" }} position="relative" zIndex="2">
        <Box
          bg={searchBg}
          shadow="2xl"
          rounded="3xl"
          p={2}
          maxW="2xl"
          mx={{ base: 0, md: 0 }}
        >
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none" h="full">
              <FiSearch color="#cbd5e0" fontSize="1.2em" />
            </InputLeftElement>
            <Input
              placeholder="What are you looking for?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              border="none"
              _focus={{ boxShadow: "none" }}
              fontSize="lg"
              h="60px"
            />
          </InputGroup>
        </Box>
      </Container>


      {/* 3. APP-STORE STYLE CATEGORY SCROLL */}
      <Container maxW="container.xl" mt={10}>
        <Flex
          overflowX="auto"
          pb={4}
          css={{
            '&::-webkit-scrollbar': { display: 'none' },
            'msOverflowStyle': 'none',
            'scrollbarWidth': 'none',
          }}
          gap={3}
          align="center"
        >
          <Text fontWeight="bold" fontSize="sm" color="gray.400" mr={2} whiteSpace="nowrap" textTransform="uppercase" letterSpacing="widest">
            Filters:
          </Text>
          {categories.map((cat) => (
            <Button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              rounded="full"
              size="md"
              px={6}
              bg={categoryFilter === cat ? chipActiveBg : chipInactiveBg}
              color={categoryFilter === cat ? "white" : chipInactiveColor}
              _hover={{ bg: categoryFilter === cat ? chipActiveBg : chipHoverBg }}
              _active={{ transform: "scale(0.95)" }}
              shadow={categoryFilter === cat ? "lg" : "none"}
              transition="all 0.2s"
              whiteSpace="nowrap"
            >
              {cat}
            </Button>
          ))}
        </Flex>

        {/* 4. PRODUCT GRID */}
        <MotionSimpleGrid
          columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
          spacing={8}
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
          <VStack py={20} spacing={4}>
            <Icon as={FiSearch} w={12} h={12} color="gray.300" />
            <Text color="gray.500" fontSize="lg">No products found matching your search.</Text>
            <Button variant="link" colorScheme="brand" onClick={() => { setSearchQuery(''); setCategoryFilter('All'); }}>
              Clear Filters
            </Button>
          </VStack>
        )}
      </Container>
    </Box>
  );
};

export default CataloguePage;