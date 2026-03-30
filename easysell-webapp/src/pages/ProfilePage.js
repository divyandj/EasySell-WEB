import React, { useState } from 'react';
import {
    Box, Container, VStack, HStack, Heading, Text, Avatar, Badge,
    SimpleGrid, Button, Icon, useColorModeValue, Divider, Flex,
    FormControl, FormLabel, Input, FormErrorMessage, useToast
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiPhone, FiFileText, FiLogOut, FiCheckCircle, FiClock, FiAlertCircle, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const MotionBox = motion(Box);

const InfoItem = ({ icon, label, value }) => {
    const bg = useColorModeValue('gray.50', 'whiteAlpha.50');
    const iconBg = useColorModeValue('brand.50', 'whiteAlpha.100');
    const textColor = useColorModeValue('gray.800', 'white');

    return (
        <HStack align="center" spacing={3} p={3.5} rounded="12px" bg={bg}>
            <Flex align="center" justify="center" boxSize={9} rounded="10px" bg={iconBg} color="brand.500">
                <Icon as={icon} boxSize={4} />
            </Flex>
            <VStack align="start" spacing={0}>
                <Text fontSize="xs" fontWeight="600" color="gray.400" textTransform="uppercase" letterSpacing="0.06em">{label}</Text>
                <Text fontSize="sm" fontWeight="500" color={textColor}>{value || 'Not provided'}</Text>
            </VStack>
        </HStack>
    );
};

const ProfilePage = () => {
    const { currentUser, userData, signOut, updateUserProfile, storeConfig } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const isPublicStore = storeConfig?.storeMode === 'public';

    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: userData?.displayName || currentUser?.displayName || '',
        phone: userData?.phoneNumber || '',
        gstPan: userData?.gstPan || ''
    });
    const [errors, setErrors] = useState({});

    // Theme
    const pageBg = useColorModeValue('#F8F9FC', '#09090B');
    const cardBg = useColorModeValue('white', '#111116');
    const cardBorder = useColorModeValue('gray.100', 'whiteAlpha.100');
    const textColor = useColorModeValue('gray.800', 'white');
    const mutedColor = useColorModeValue('gray.500', 'gray.400');
    const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.200');

    const validate = () => {
        let tempErrors = {};
        if (!formData.name.trim()) tempErrors.name = "Full Name is required";
        const phoneRegex = /^[0-9]{10}$/;
        if (!formData.phone.match(phoneRegex)) tempErrors.phone = "Phone must be exactly 10 digits";
        const gstPanBox = formData.gstPan.toUpperCase();
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!gstPanBox) {
            if (!isPublicStore) tempErrors.gstPan = "GSTIN or PAN is required";
        } else if (!gstRegex.test(gstPanBox) && !panRegex.test(gstPanBox)) {
            tempErrors.gstPan = "Invalid GSTIN (15 chars) or PAN (10 chars)";
        }
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleEditToggle = () => {
        if (isEditing) {
            setFormData({
                name: userData?.displayName || currentUser?.displayName || '',
                phone: userData?.phoneNumber || '',
                gstPan: userData?.gstPan || ''
            });
            setErrors({});
            setIsEditing(false);
        } else {
            setFormData({
                name: userData?.displayName || currentUser?.displayName || '',
                phone: userData?.phoneNumber || '',
                gstPan: userData?.gstPan || ''
            });
            setIsEditing(true);
        }
    };

    const handleSave = async () => {
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            await updateUserProfile(currentUser.uid, {
                displayName: formData.name,
                phoneNumber: formData.phone,
                gstPan: formData.gstPan.toUpperCase()
            });
            toast({ title: "Profile Updated", status: "success", duration: 3000, isClosable: true });
            setIsEditing(false);
        } catch (error) {
            toast({ title: "Update Failed", description: error.message, status: "error", duration: 5000, isClosable: true });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => { await signOut(); navigate('/login'); };

    if (!currentUser) return null;

    const getStatusBadge = (status) => {
        if (isPublicStore) return <Badge colorScheme="blue" borderRadius="full" px={3} py={1} fontSize="xs"><HStack spacing={1}><Icon as={FiUser} boxSize={3} /><Text>Shopper</Text></HStack></Badge>;
        switch (status) {
            case 'approved': return <Badge colorScheme="green" borderRadius="full" px={3} py={1} fontSize="xs"><HStack spacing={1}><Icon as={FiCheckCircle} boxSize={3} /><Text>Verified</Text></HStack></Badge>;
            case 'pending': return <Badge colorScheme="orange" borderRadius="full" px={3} py={1} fontSize="xs"><HStack spacing={1}><Icon as={FiClock} boxSize={3} /><Text>Pending</Text></HStack></Badge>;
            case 'rejected': return <Badge colorScheme="red" borderRadius="full" px={3} py={1} fontSize="xs"><HStack spacing={1}><Icon as={FiAlertCircle} boxSize={3} /><Text>Rejected</Text></HStack></Badge>;
            default: return <Badge colorScheme="gray" borderRadius="full" px={3} py={1} fontSize="xs">Guest</Badge>;
        }
    };

    return (
        <Box minH="90vh" bg={pageBg} py={{ base: 6, md: 10 }}>
            <Container maxW="container.lg">
                <MotionBox initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <Flex direction={{ base: 'column', md: 'row' }} gap={6}>

                        {/* Left: Identity Card */}
                        <Box flex="1" maxW={{ md: "320px" }}>
                            <VStack
                                bg={cardBg}
                                p={6}
                                borderRadius="20px"
                                borderWidth="1px"
                                borderColor={cardBorder}
                                boxShadow="card"
                                spacing={5}
                                textAlign="center"
                                position="relative"
                                overflow="hidden"
                            >
                                {/* Header gradient */}
                                <Box position="absolute" top={0} left={0} w="full" h="80px" bgGradient="linear(to-r, brand.500, accent.500)" />

                                <Box position="relative" mt={8}>
                                    <Avatar
                                        size="xl"
                                        src={currentUser.photoURL}
                                        name={currentUser.displayName || currentUser.email}
                                        borderWidth="3px"
                                        borderColor={cardBg}
                                        boxShadow="lg"
                                    />
                                    {userData?.status === 'approved' && (
                                        <Box position="absolute" bottom={1} right={1} bg="green.400" boxSize={5} rounded="full" borderWidth="2px" borderColor={cardBg} />
                                    )}
                                </Box>

                                <VStack spacing={0}>
                                    <Heading size="md" color={textColor} fontWeight="800">{currentUser.displayName || 'User'}</Heading>
                                    <Text color={mutedColor} fontSize="xs">{currentUser.email}</Text>
                                </VStack>

                                {getStatusBadge(userData?.status)}

                                <Divider borderColor={cardBorder} />

                                <VStack spacing={0}>
                                    <Text fontSize="xs" color="gray.400" fontWeight="600" textTransform="uppercase" letterSpacing="0.06em">Member Since</Text>
                                    <Text fontWeight="600" fontSize="sm" color={textColor}>
                                        {currentUser.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : 'Recently'}
                                    </Text>
                                </VStack>

                                <VStack w="full" spacing={2}>
                                    <Button
                                        w="full"
                                        variant={isEditing ? "ghost" : "solid"}
                                        colorScheme={isEditing ? "gray" : "brand"}
                                        leftIcon={<Icon as={isEditing ? FiX : FiEdit2} />}
                                        onClick={handleEditToggle}
                                        borderRadius="12px"
                                        h="42px"
                                        fontSize="sm"
                                    >
                                        {isEditing ? "Cancel" : "Edit Profile"}
                                    </Button>

                                    {isEditing && (
                                        <Button
                                            w="full"
                                            colorScheme="green"
                                            leftIcon={<Icon as={FiSave} />}
                                            onClick={handleSave}
                                            isLoading={isSubmitting}
                                            loadingText="Saving..."
                                            borderRadius="12px"
                                            h="42px"
                                            fontSize="sm"
                                        >
                                            Save Changes
                                        </Button>
                                    )}

                                    <Button
                                        w="full"
                                        variant="ghost"
                                        color="red.400"
                                        leftIcon={<Icon as={FiLogOut} />}
                                        onClick={handleLogout}
                                        borderRadius="12px"
                                        h="42px"
                                        fontSize="sm"
                                        _hover={{ bg: 'red.50', color: 'red.600' }}
                                    >
                                        Logout
                                    </Button>
                                </VStack>
                            </VStack>
                        </Box>

                        {/* Right: Details */}
                        <Box flex="2">
                            <VStack spacing={4} align="stretch">
                                <Box bg={cardBg} p={6} borderRadius="16px" borderWidth="1px" borderColor={cardBorder} boxShadow="card">
                                    <Text fontSize="xs" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="0.1em" mb={4}>
                                        Personal Information
                                    </Text>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                                        {isEditing ? (
                                            <>
                                                <FormControl isInvalid={errors.name}>
                                                    <FormLabel fontSize="xs" fontWeight="600" color={mutedColor}>Full Name</FormLabel>
                                                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} borderRadius="12px" borderColor={inputBorder} h="42px" _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }} />
                                                    <FormErrorMessage fontSize="xs">{errors.name}</FormErrorMessage>
                                                </FormControl>
                                                <FormControl>
                                                    <FormLabel fontSize="xs" fontWeight="600" color={mutedColor}>Email (Read Only)</FormLabel>
                                                    <Input value={userData?.email || currentUser.email} isReadOnly borderRadius="12px" h="42px" opacity={0.6} />
                                                </FormControl>
                                                <FormControl isInvalid={errors.phone}>
                                                    <FormLabel fontSize="xs" fontWeight="600" color={mutedColor}>Phone Number</FormLabel>
                                                    <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} borderRadius="12px" type="tel" borderColor={inputBorder} h="42px" _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }} />
                                                    <FormErrorMessage fontSize="xs">{errors.phone}</FormErrorMessage>
                                                </FormControl>
                                            </>
                                        ) : (
                                            <>
                                                <InfoItem icon={FiUser} label="Full Name" value={userData?.displayName || currentUser.displayName} />
                                                <InfoItem icon={FiMail} label="Email" value={userData?.email || currentUser.email} />
                                                <InfoItem icon={FiPhone} label="Phone" value={userData?.phoneNumber} />
                                            </>
                                        )}
                                    </SimpleGrid>
                                </Box>

                                <Box bg={cardBg} p={6} borderRadius="16px" borderWidth="1px" borderColor={cardBorder} boxShadow="card">
                                    <Text fontSize="xs" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="0.1em" mb={4}>
                                        Business Details
                                    </Text>
                                    {isEditing ? (
                                        <FormControl isInvalid={errors.gstPan}>
                                            <FormLabel fontSize="xs" fontWeight="600" color={mutedColor}>
                                                {isPublicStore ? "GSTIN / PAN (Optional)" : "GSTIN / PAN Number"}
                                            </FormLabel>
                                            <Input value={formData.gstPan} onChange={(e) => setFormData({ ...formData, gstPan: e.target.value.toUpperCase() })} borderRadius="12px" placeholder="Enter GSTIN or PAN" borderColor={inputBorder} h="42px" _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }} />
                                            <FormErrorMessage fontSize="xs">{errors.gstPan}</FormErrorMessage>
                                        </FormControl>
                                    ) : (
                                        <InfoItem icon={FiFileText} label="GSTIN / PAN" value={userData?.gstPan} />
                                    )}
                                </Box>
                            </VStack>
                        </Box>

                    </Flex>
                </MotionBox>
            </Container>
        </Box>
    );
};

export default ProfilePage;
