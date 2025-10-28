import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import {
  Box,
  Heading,
  SimpleGrid,
  Container,
  Text,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import ProductCard from '../components/ProductCard';
import SpinnerComponent from '../components/Spinner';

// Define the key for local storage and the maximum history size
const RECENTLY_VISITED_KEY = 'recentlyVisitedCatalogues';
const MAX_HISTORY_SIZE = 5;

// Helper function to manage recently visited catalogues in local storage
const addCatalogueToHistory = (id, name) => {
  if (!id || !name) return; // Don't save if data is missing

  try {
    // 1. Get current history (or initialize an empty array)
    const storedHistory = localStorage.getItem(RECENTLY_VISITED_KEY);
    let history = storedHistory ? JSON.parse(storedHistory) : [];

    // 2. Remove existing entry for this catalogue ID (if any)
    history = history.filter(item => item.id !== id);

    // 3. Add the new entry to the beginning of the array
    history.unshift({ id, name, visitedAt: new Date().toISOString() });

    // 4. Limit the history size
    history = history.slice(0, MAX_HISTORY_SIZE);

    // 5. Save back to local storage
    localStorage.setItem(RECENTLY_VISITED_KEY, JSON.stringify(history));

  } catch (error) {
    console.error("Failed to update recently visited catalogues:", error);
    // Handle potential errors like full local storage or invalid JSON
  }
};

const CataloguePage = () => {
  const { catalogueId } = useParams();
  const [products, setProducts] = useState([]);
  const [catalogueName, setCatalogueName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCatalogueData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch catalogue name
        const catalogueRef = doc(db, 'catalogues', catalogueId);
        const catalogueSnap = await getDoc(catalogueRef);

        if (!catalogueSnap.exists()) {
          throw new Error('Catalogue not found.');
        }
        const fetchedName = catalogueSnap.data().name;
        setCatalogueName(fetchedName);

        // Fetch products for the catalogue WHERE visibleInCatalogue is true
        const productsQuery = query(
          collection(db, 'products'),
          where('catalogueId', '==', catalogueId),
          where('visibleInCatalogue', '==', true) // Filter added here
        );

        const querySnapshot = await getDocs(productsQuery);
        const productsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsList);

        // Add to history AFTER successful fetch
        addCatalogueToHistory(catalogueId, fetchedName);

      } catch (err) {
        setError(err.message || "Failed to load catalogue data.");
        console.error("Error fetching catalogue data:", err);
        // Firebase might log an error in the console if an index is needed.
      } finally {
        setLoading(false);
      }
    };

    if (catalogueId) {
      fetchCatalogueData();
    } else {
      setError("No catalogue ID provided.");
      setLoading(false);
    }
  }, [catalogueId]);

  if (loading) {
    return <SpinnerComponent />;
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle mr={2}>Error Loading Catalogue!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading as="h1" size="xl" mb={6} textAlign="center">
        {catalogueName}
      </Heading>
      {products.length === 0 ? (
        <Center h="40vh">
          <Text fontSize="lg" color="gray.500">No visible products found in this catalogue.</Text>
        </Center>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
};

export default CataloguePage;