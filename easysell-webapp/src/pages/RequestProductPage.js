import React, { useState } from 'react';
import {
  Container, Heading, VStack, FormControl, FormLabel, Input, Button,
  Box, Text, useToast, Textarea, Image, useColorModeValue, Flex, Icon, Center, HStack
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { resolveStoreContext } from '../utils/storeResolver';
import { FiPackage, FiUpload, FiX, FiArrowLeft } from 'react-icons/fi';

const getSubdomain = () => {
  const context = resolveStoreContext();
  return (context.type === 'subdomain' || context.type === 'customDomain') ? context.handle || context.domain : null;
};

const RequestProductPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theme
  const pageBg = useColorModeValue('#F8F9FC', '#09090B');
  const cardBg = useColorModeValue('white', '#111116');
  const cardBorder = useColorModeValue('gray.100', 'whiteAlpha.100');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const inputBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const iconBg = useColorModeValue('brand.50', 'whiteAlpha.100');

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be under 5MB.", status: "error", duration: 3000 });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', 'easysell_unsigned');
    const res = await fetch('https://api.cloudinary.com/v1_1/dqplhh4y3/image/upload', { method: 'POST', body: data });
    const json = await res.json();
    if (json.secure_url) return json.secure_url;
    throw new Error(json.error?.message || 'Upload failed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName.trim()) {
      toast({ title: "Product name required", status: "warning", duration: 3000 });
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const storeHandle = getSubdomain();

      await addDoc(collection(db, 'product_requests'), {
        storeHandle: storeHandle || '',
        buyerUid: currentUser?.uid || '',
        buyerName: currentUser?.displayName || currentUser?.email || 'Anonymous',
        buyerEmail: currentUser?.email || '',
        productName: productName.trim(),
        productImage: imageUrl,
        description: description.trim(),
        quantity: quantity.trim() || '1',
        status: 'pending',
        createdAt: Timestamp.now()
      });

      // Fire-and-forget notification
      axios.post(`${API_BASE_URL}/api/notify-product-request`, {
        productName: productName.trim(),
        buyerName: currentUser?.displayName || currentUser?.email || 'A buyer',
        storeHandle: storeHandle || ''
      }).catch(err => console.error("Notification error:", err));

      toast({ title: "Request Submitted!", description: "The store owner will review your request.", status: "success", duration: 4000 });
      navigate(-1);
    } catch (error) {
      toast({ title: "Submission Failed", description: error.message, status: "error", duration: 4000 });
    }
    setIsSubmitting(false);
  };

  return (
    <Box bg={pageBg} minH="100vh" py={{ base: 6, md: 12 }}>
      <Container maxW="container.sm">
        {/* Back */}
        <Button variant="ghost" leftIcon={<FiArrowLeft />} mb={6} onClick={() => navigate(-1)} color={mutedColor} _hover={{ color: textColor }}>
          Back to Store
        </Button>

        <Box bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="20px" p={{ base: 6, md: 10 }} boxShadow="sm">
          {/* Header */}
          <VStack spacing={3} mb={8} textAlign="center">
            <Flex w={14} h={14} bg={iconBg} borderRadius="full" align="center" justify="center">
              <Icon as={FiPackage} w={7} h={7} color="brand.500" />
            </Flex>
            <Heading size="lg" color={textColor}>Request a Product</Heading>
            <Text color={mutedColor} fontSize="sm">Can't find what you're looking for? Let the store know!</Text>
          </VStack>

          <form onSubmit={handleSubmit}>
            <VStack spacing={5}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" color={mutedColor}>Product Name</FormLabel>
                <Input value={productName} onChange={(e) => setProductName(e.target.value)} bg={inputBg} borderColor={inputBorder} borderRadius="12px" h="48px" placeholder="e.g. Samsung Galaxy S24" />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" color={mutedColor}>Description / Specifications</FormLabel>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} bg={inputBg} borderColor={inputBorder} borderRadius="12px" placeholder="Color, size, model, or any other details..." rows={3} />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" color={mutedColor}>Quantity</FormLabel>
                <Input value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ''))} bg={inputBg} borderColor={inputBorder} borderRadius="12px" h="48px" placeholder="1" type="text" />
              </FormControl>

              {/* Image Upload */}
              <FormControl>
                <FormLabel fontSize="sm" color={mutedColor}>Reference Image (Optional)</FormLabel>
                {imagePreview ? (
                  <Box position="relative" borderRadius="12px" overflow="hidden" borderWidth="1px" borderColor={inputBorder}>
                    <Image src={imagePreview} alt="Preview" maxH="200px" w="full" objectFit="cover" />
                    <Button position="absolute" top={2} right={2} size="xs" colorScheme="red" borderRadius="full" onClick={removeImage}>
                      <FiX />
                    </Button>
                  </Box>
                ) : (
                  <Center borderWidth="2px" borderStyle="dashed" borderColor={inputBorder} borderRadius="12px" py={8} cursor="pointer" _hover={{ borderColor: 'brand.400' }} transition="all 0.2s" onClick={() => document.getElementById('req-img-upload').click()}>
                    <VStack spacing={2}>
                      <Icon as={FiUpload} w={6} h={6} color={mutedColor} />
                      <Text fontSize="sm" color={mutedColor}>Click to upload</Text>
                    </VStack>
                  </Center>
                )}
                <Input id="req-img-upload" type="file" accept="image/*" onChange={handleImageSelect} display="none" />
              </FormControl>

              <Button type="submit" colorScheme="brand" w="full" h="48px" borderRadius="12px" fontWeight="700" isLoading={isSubmitting} loadingText="Submitting...">
                Submit Request
              </Button>
            </VStack>
          </form>
        </Box>
      </Container>
    </Box>
  );
};

export default RequestProductPage;
