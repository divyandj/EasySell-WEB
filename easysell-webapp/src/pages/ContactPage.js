import React, { useState, useEffect } from 'react';
import {
  Container, Heading, VStack, Box, Text, useColorModeValue, Icon, Flex, Center,
  HStack, Link, Skeleton, Button
} from '@chakra-ui/react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { resolveStoreContext } from '../utils/storeResolver';
import { FiMail, FiPhone, FiMessageCircle, FiMapPin, FiArrowLeft, FiExternalLink } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const getSubdomain = () => {
  const context = resolveStoreContext();
  return (context.type === 'subdomain' || context.type === 'customDomain') ? context.handle || context.domain : null;
};

const ContactPage = () => {
  const navigate = useNavigate();
  const [contactData, setContactData] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(true);

  const pageBg = useColorModeValue('#F8F9FC', '#09090B');
  const cardBg = useColorModeValue('white', '#111116');
  const cardBorder = useColorModeValue('gray.100', 'whiteAlpha.100');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const iconBg = useColorModeValue('brand.50', 'whiteAlpha.100');
  const itemHoverBg = useColorModeValue('gray.50', 'whiteAlpha.50');

  useEffect(() => {
    const fetchContact = async () => {
      const subdomain = getSubdomain();
      if (!subdomain) { setLoading(false); return; }

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('storeHandle', '==', subdomain.toLowerCase()));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setStoreName(data.businessName || subdomain);
          setContactData({
            email: data.contactEmail || '',
            phone: data.contactPhone || data.phone || '',
            whatsapp: data.contactWhatsapp || '',
            address: data.contactAddress || data.address || ''
          });
        }
      } catch (err) {
        console.error("Error fetching contact:", err);
      }
      setLoading(false);
    };
    fetchContact();
  }, []);

  const hasAnyContact = contactData && (contactData.email || contactData.phone || contactData.whatsapp || contactData.address);

  const ContactItem = ({ icon, label, value, href }) => (
    <HStack
      spacing={4} p={4} borderRadius="12px" _hover={{ bg: itemHoverBg }} transition="all 0.2s"
      as={href ? 'a' : 'div'} href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
      cursor={href ? 'pointer' : 'default'} w="full"
    >
      <Flex w={10} h={10} bg={iconBg} borderRadius="full" align="center" justify="center" flexShrink={0}>
        <Icon as={icon} w={5} h={5} color="brand.500" />
      </Flex>
      <Box flex={1}>
        <Text fontSize="xs" color={mutedColor} fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">{label}</Text>
        <Text fontSize="sm" color={textColor} fontWeight="500">{value}</Text>
      </Box>
      {href && <Icon as={FiExternalLink} w={4} h={4} color={mutedColor} />}
    </HStack>
  );

  return (
    <Box bg={pageBg} minH="100vh" py={{ base: 6, md: 12 }}>
      <Container maxW="container.sm">
        <Button variant="ghost" leftIcon={<FiArrowLeft />} mb={6} onClick={() => navigate(-1)} color={mutedColor} _hover={{ color: textColor }}>
          Back
        </Button>

        <Box bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="20px" p={{ base: 6, md: 10 }} boxShadow="sm">
          <VStack spacing={3} mb={8} textAlign="center">
            <Flex w={14} h={14} bg={iconBg} borderRadius="full" align="center" justify="center">
              <Icon as={FiMail} w={7} h={7} color="brand.500" />
            </Flex>
            <Heading size="lg" color={textColor}>Contact Us</Heading>
            {storeName && <Text color={mutedColor} fontSize="sm">Get in touch with {storeName}</Text>}
          </VStack>

          {loading ? (
            <VStack spacing={4}>
              <Skeleton h="60px" borderRadius="12px" w="full" />
              <Skeleton h="60px" borderRadius="12px" w="full" />
              <Skeleton h="60px" borderRadius="12px" w="full" />
            </VStack>
          ) : hasAnyContact ? (
            <VStack spacing={1} align="stretch">
              {contactData.email && (
                <ContactItem icon={FiMail} label="Email" value={contactData.email} href={`mailto:${contactData.email}`} />
              )}
              {contactData.phone && (
                <ContactItem icon={FiPhone} label="Phone" value={contactData.phone} href={`tel:${contactData.phone}`} />
              )}
              {contactData.whatsapp && (
                <ContactItem icon={FiMessageCircle} label="WhatsApp" value={contactData.whatsapp} href={`https://wa.me/${contactData.whatsapp.replace(/\D/g, '')}`} />
              )}
              {contactData.address && (
                <ContactItem icon={FiMapPin} label="Address" value={contactData.address} />
              )}
            </VStack>
          ) : (
            <Center py={10}>
              <VStack spacing={3}>
                <Icon as={FiMail} w={10} h={10} color={mutedColor} opacity={0.4} />
                <Text color={mutedColor} fontSize="sm">Contact information has not been configured yet.</Text>
              </VStack>
            </Center>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default ContactPage;
