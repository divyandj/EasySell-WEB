import React from 'react';
import {
    Box,
    Container,
    VStack,
    HStack,
    Heading,
    Text,
    Avatar,
    Badge,
    SimpleGrid,
    Button,
    Icon,
    useColorModeValue,
    Divider,
    Flex,
    FormControl,
    FormLabel,
    Input,
    FormErrorMessage,
    useToast
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiPhone, FiFileText, FiLogOut, FiCheckCircle, FiClock, FiAlertCircle, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const MotionBox = motion(Box);

const InfoItem = ({ icon, label, value }) => {
    const bg = useColorModeValue('gray.50', 'whiteAlpha.50');
    const hoverBg = useColorModeValue('brand.50', 'whiteAlpha.100');
    const iconBg = useColorModeValue('white', 'whiteAlpha.200');
    const textColor = useColorModeValue('gray.800', 'white');

    return (
        <HStack align="start" spacing={4} p={4} rounded="xl" bg={bg} _hover={{ bg: hoverBg }} transition="all 0.2s">
            <Flex align="center" justify="center" boxSize={10} rounded="lg" bg={iconBg} shadow="sm" color="brand.500">
                <Icon as={icon} boxSize={5} />
            </Flex>
            <VStack align="start" spacing={0}>
                <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wide">{label}</Text>
                <Text fontSize="md" fontWeight="medium" color={textColor}>{value || 'Not provided'}</Text>
            </VStack>
        </HStack>
    );
};

const ProfilePage = () => {
    const { currentUser, userData, signOut, updateUserProfile, storeConfig } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const isPublicStore = storeConfig?.storeMode === 'public';

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: userData?.displayName || currentUser?.displayName || '',
        phone: userData?.phoneNumber || '',
        gstPan: userData?.gstPan || ''
    });
    const [errors, setErrors] = useState({});

    // Theme Colors
    const bgGradient = useColorModeValue('linear(to-br, brand.50, purple.50)', 'linear(to-br, gray.900, brand.900)');
    const cardBg = useColorModeValue('white', 'whiteAlpha.100');
    const cardBorder = useColorModeValue('gray.100', 'whiteAlpha.200');
    const textColor = useColorModeValue('gray.800', 'white');
    const mutedColor = useColorModeValue('gray.500', 'gray.400');
    const sectionTitleColor = useColorModeValue('brand.600', 'brand.300');


    // Validation
    const validate = () => {
        let tempErrors = {};
        if (!formData.name.trim()) tempErrors.name = "Full Name is required";

        const phoneRegex = /^[0-9]{10}$/;
        if (!formData.phone.match(phoneRegex)) tempErrors.phone = "Phone must be exactly 10 digits";

        const gstPanBox = formData.gstPan.toUpperCase();
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

        if (!gstPanBox) {
            if (!isPublicStore) {
                tempErrors.gstPan = "GSTIN or PAN is required";
            }
        } else if (!gstRegex.test(gstPanBox) && !panRegex.test(gstPanBox)) {
            tempErrors.gstPan = "Invalid GSTIN format (15 chars) or PAN format (10 chars)";
        }

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleEditToggle = () => {
        if (isEditing) {
            // Cancel -> Reset
            setFormData({
                name: userData?.displayName || currentUser?.displayName || '',
                phone: userData?.phoneNumber || '',
                gstPan: userData?.gstPan || ''
            });
            setErrors({});
            setIsEditing(false);
        } else {
            // Enable Edit
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

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    if (!currentUser) return null;

    // Status Badge Logic
    const getStatusBadge = (status) => {
        if (isPublicStore) {
            return <Badge colorScheme="blue" fontSize="0.9em" px={3} py={1} rounded="full"><HStack><Icon as={FiUser} /> <Text>Shopper</Text></HStack></Badge>;
        }

        switch (status) {
            case 'approved': return <Badge colorScheme="green" fontSize="0.9em" px={3} py={1} rounded="full"><HStack><Icon as={FiCheckCircle} /> <Text>Verified Account</Text></HStack></Badge>;
            case 'pending': return <Badge colorScheme="orange" fontSize="0.9em" px={3} py={1} rounded="full"><HStack><Icon as={FiClock} /> <Text>Awaiting Approval</Text></HStack></Badge>;
            case 'rejected': return <Badge colorScheme="red" fontSize="0.9em" px={3} py={1} rounded="full"><HStack><Icon as={FiAlertCircle} /> <Text>Account Rejected</Text></HStack></Badge>;
            default: return <Badge colorScheme="gray" fontSize="0.9em" px={3} py={1} rounded="full">Guest</Badge>;
        }
    };



    return (
        <Box minH="90vh" bgGradient={bgGradient} py={10}>
            <Container maxW="container.lg">
                <MotionBox
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Flex direction={{ base: 'column', md: 'row' }} gap={8}>

                        {/* Left Column: Identify Card */}
                        <Box flex="1" maxW={{ md: "350px" }}>
                            <VStack
                                bg={cardBg}
                                p={8}
                                borderRadius="3xl"
                                borderWidth="1px"
                                borderColor={cardBorder}
                                shadow="xl"
                                spacing={6}
                                textAlign="center"
                                position="relative"
                                overflow="hidden"
                            >
                                {/* Decorative BG for Card */}
                                <Box position="absolute" top={0} left={0} w="full" h="120px" bgGradient="linear(to-r, brand.400, accent.400)" opacity={0.8} />

                                <Box position="relative" mt={10}>
                                    <Avatar
                                        size="2xl"
                                        src={currentUser.photoURL}
                                        name={currentUser.displayName || currentUser.email}
                                        borderWidth="4px"
                                        borderColor={cardBg}
                                        shadow="2xl"
                                    />
                                    {userData?.status === 'approved' && (
                                        <Box position="absolute" bottom={2} right={2} bg="green.400" boxSize={6} rounded="full" borderWidth="3px" borderColor={cardBg} />
                                    )}
                                </Box>

                                <VStack spacing={1}>
                                    <Heading size="lg" color={textColor}>{currentUser.displayName || 'No Name'}</Heading>
                                    <Text color={mutedColor} fontSize="sm">{currentUser.email}</Text>
                                </VStack>

                                {getStatusBadge(userData?.status)}

                                <Divider />

                                <VStack w="full" spacing={1}>
                                    <Text fontSize="xs" color="gray.400">MEMBER SINCE</Text>
                                    <Text fontWeight="bold" color={textColor}>
                                        {currentUser.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
                                    </Text>
                                </VStack>

                                <Button
                                    w="full"
                                    variant={isEditing ? "ghost" : "solid"}
                                    colorScheme={isEditing ? "gray" : "brand"}
                                    leftIcon={<Icon as={isEditing ? FiX : FiEdit2} />}
                                    onClick={handleEditToggle}
                                    borderRadius="xl"
                                    mb={2}
                                >
                                    {isEditing ? "Cancel Editing" : "Edit Profile"}
                                </Button>

                                {isEditing && (
                                    <Button
                                        w="full"
                                        colorScheme="green"
                                        leftIcon={<Icon as={FiSave} />}
                                        onClick={handleSave}
                                        isLoading={isSubmitting}
                                        loadingText="Saving..."
                                        borderRadius="xl"
                                        shadow="md"
                                        mb={4}
                                    >
                                        Save Changes
                                    </Button>
                                )}

                                <Button
                                    w="full"
                                    variant="outline"
                                    colorScheme="red"
                                    leftIcon={<Icon as={FiLogOut} />}
                                    onClick={handleLogout}
                                    borderRadius="xl"
                                    _hover={{ bg: 'red.50', borderColor: 'red.500' }}
                                >
                                    Logout
                                </Button>

                            </VStack>
                        </Box>

                        {/* Right Column: Details */}
                        <Box flex="2">
                            <VStack spacing={6} align="stretch">

                                {/* Personal Info */}
                                <Box bg={cardBg} p={8} borderRadius="3xl" borderWidth="1px" borderColor={cardBorder} shadow="lg">
                                    <Heading size="md" mb={6} color={sectionTitleColor}>Personal Information</Heading>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                        {isEditing ? (
                                            <>
                                                <FormControl isInvalid={errors.name}>
                                                    <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.400">Full Name</FormLabel>
                                                    <Input
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        borderRadius="xl"
                                                        borderColor={cardBorder}
                                                        _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
                                                    />
                                                    <FormErrorMessage>{errors.name}</FormErrorMessage>
                                                </FormControl>
                                                <FormControl>
                                                    <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.400">Email Address (Read Only)</FormLabel>
                                                    <Input value={userData?.email || currentUser.email} isReadOnly filled />
                                                </FormControl>
                                                <FormControl isInvalid={errors.phone}>
                                                    <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.400">Phone Number</FormLabel>
                                                    <Input
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                        borderRadius="xl"
                                                        type="tel"
                                                    />
                                                    <FormErrorMessage>{errors.phone}</FormErrorMessage>
                                                </FormControl>
                                            </>
                                        ) : (
                                            <>
                                                <InfoItem icon={FiUser} label="Full Name" value={userData?.displayName || currentUser.displayName} />
                                                <InfoItem icon={FiMail} label="Email Address" value={userData?.email || currentUser.email} />
                                                <InfoItem icon={FiPhone} label="Phone Number" value={userData?.phoneNumber} />
                                            </>
                                        )}
                                    </SimpleGrid>
                                </Box>

                                {/* Business Info */}
                                <Box bg={cardBg} p={8} borderRadius="3xl" borderWidth="1px" borderColor={cardBorder} shadow="lg">
                                    <Heading size="md" mb={6} color={sectionTitleColor}>Business Details</Heading>
                                    <SimpleGrid columns={1} spacing={4}>
                                        {isEditing ? (
                                            <FormControl isInvalid={errors.gstPan}>
                                                <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.400">
                                                    {isPublicStore ? "GSTIN / PAN Number (Optional)" : "GSTIN / PAN Number"}
                                                </FormLabel>
                                                <Input
                                                    value={formData.gstPan}
                                                    onChange={(e) => setFormData({ ...formData, gstPan: e.target.value.toUpperCase() })}
                                                    borderRadius="xl"
                                                    placeholder="Enter GSTIN or PAN"
                                                />
                                                <FormErrorMessage>{errors.gstPan}</FormErrorMessage>
                                            </FormControl>
                                        ) : (
                                            <InfoItem icon={FiFileText} label="GSTIN / PAN Number" value={userData?.gstPan} />
                                        )}


                                    </SimpleGrid>
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
// Re-compile trigger
