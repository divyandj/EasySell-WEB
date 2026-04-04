import React, { useState, useEffect } from 'react';
import {
  Container, Heading, VStack, Box, Text, useColorModeValue, Icon, Flex, Center,
  HStack, Badge, Skeleton, SimpleGrid, Button, Table, Thead, Tbody, Tr, Th, Td, useToast
} from '@chakra-ui/react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { resolveStoreContext } from '../utils/storeResolver';
import { FiStar, FiGift, FiArrowLeft, FiTrendingUp } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const getSubdomain = () => {
  const context = resolveStoreContext();
  return (context.type === 'subdomain' || context.type === 'customDomain') ? context.handle || context.domain : null;
};

const RewardsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser, storeConfig, buyerPoints, createCustomRewardClaim, cancelCustomRewardClaim, selectRedeemReward, fetchCustomRewardClaimStatusMap } = useAuth();
  const [rewardItems, setRewardItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingRewardId, setSubmittingRewardId] = useState(null);
  const [cancellingRewardId, setCancellingRewardId] = useState(null);
  const [claimStatusMap, setClaimStatusMap] = useState({});


  const pageBg = useColorModeValue('#F8F9FC', '#09090B');
  const cardBg = useColorModeValue('white', '#111116');
  const cardBorder = useColorModeValue('gray.100', 'whiteAlpha.100');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    const fetchRewards = async () => {
      const subdomain = getSubdomain();
      if (!subdomain) { setLoading(false); return; }

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('storeHandle', '==', subdomain.toLowerCase()));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const merchantDoc = snapshot.docs[0];


          // Fetch reward items
          const itemsRef = collection(db, 'users', merchantDoc.id, 'reward_items');
          const itemsSnap = await getDocs(itemsRef);
          const items = itemsSnap.docs
            .map(d => ({ id: d.id, sellerUid: merchantDoc.id, ...d.data() }))
            .filter(item => item.active !== false);
          setRewardItems(items);
        }
      } catch (err) {
        console.error("Error fetching rewards:", err);
      }
      setLoading(false);
    };
    fetchRewards();
  }, []);

  useEffect(() => {
    const loadClaimStatuses = async () => {
      if (!currentUser) {
        setClaimStatusMap({});
        return;
      }
      try {
        const map = await fetchCustomRewardClaimStatusMap();
        setClaimStatusMap(map || {});
      } catch (err) {
        console.error('Error fetching claim statuses:', err);
      }
    };
    loadClaimStatuses();
  }, [currentUser, fetchCustomRewardClaimStatusMap]);

  const points = buyerPoints?.points || 0;
  const totalEarned = buyerPoints?.totalEarned || 0;
  const transactions = buyerPoints?.transactions || [];
  const rewardsEnabled = storeConfig?.rewardsEnabled;
  const ppr = storeConfig?.rewardsPointsPerRupee || 1;

  const isDiscountType = (type) => type === 'percent_off' || type === 'flat_off';

  const handleRewardClaim = async (reward) => {
    if (!currentUser) {
      toast({ title: 'Please sign in first', status: 'warning', duration: 2500, isClosable: true });
      navigate('/login', { state: { from: { pathname: '/rewards' } } });
      return;
    }

    const pointsCost = Number(reward.pointsCost || 0);
    if (points < pointsCost) {
      toast({ title: `Need ${pointsCost - points} more points`, status: 'warning', duration: 2500, isClosable: true });
      return;
    }

    if (reward.type === 'custom') {
      setSubmittingRewardId(reward.id);
      try {
        await createCustomRewardClaim(reward);
        const map = await fetchCustomRewardClaimStatusMap();
        setClaimStatusMap(map || {});
        toast({
          title: 'Claim request submitted',
          description: 'Seller will review and approve this custom reward.',
          status: 'success',
          duration: 3500,
          isClosable: true,
        });
      } catch (err) {
        toast({ title: 'Claim failed', description: err.message, status: 'error', duration: 3500, isClosable: true });
      } finally {
        setSubmittingRewardId(null);
      }
      return;
    }

    if (!isDiscountType(reward.type)) {
      toast({ title: 'This reward can only be handled by seller review.', status: 'info', duration: 3000, isClosable: true });
      return;
    }

    selectRedeemReward(reward);
    toast({ title: 'Reward selected', description: 'You can redeem it in checkout.', status: 'success', duration: 2500, isClosable: true });
    navigate('/checkout', { state: { preselectedRewardId: reward.id } });
  };

  const handleCancelClaim = async (reward, claimInfo) => {
    if (!currentUser) {
      toast({ title: 'Please sign in first', status: 'warning', duration: 2500, isClosable: true });
      return;
    }
    if (!claimInfo?.docId) {
      toast({ title: 'Unable to cancel this request.', status: 'error', duration: 2500, isClosable: true });
      return;
    }

    setCancellingRewardId(reward.id);
    try {
      await cancelCustomRewardClaim(claimInfo.docId, reward.id);
      const map = await fetchCustomRewardClaimStatusMap();
      setClaimStatusMap(map || {});
      toast({
        title: 'Claim request cancelled',
        description: 'Points have been adjusted for this cancelled request.',
        status: 'success',
        duration: 3500,
        isClosable: true,
      });
    } catch (err) {
      toast({ title: 'Cancel failed', description: err.message, status: 'error', duration: 3500, isClosable: true });
    } finally {
      setCancellingRewardId(null);
    }
  };

  if (!rewardsEnabled) {
    return (
      <Box bg={pageBg} minH="100vh" py={{ base: 6, md: 12 }}>
        <Container maxW="container.sm">
          <Button variant="ghost" leftIcon={<FiArrowLeft />} mb={6} onClick={() => navigate(-1)} color={mutedColor}>Back</Button>
          <Center py={20}>
            <VStack>
              <Icon as={FiGift} w={12} h={12} color={mutedColor} opacity={0.4} />
              <Text color={mutedColor} fontSize="sm">Rewards program is not available for this store.</Text>
            </VStack>
          </Center>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={pageBg} minH="100vh" py={{ base: 6, md: 12 }}>
      <Container maxW="container.md">
        <Button variant="ghost" leftIcon={<FiArrowLeft />} mb={6} onClick={() => navigate(-1)} color={mutedColor} _hover={{ color: textColor }}>
          Back
        </Button>

        {/* Points Balance Header */}
        <Box bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" borderRadius="20px" p={{ base: 6, md: 10 }} mb={6} color="white" textAlign="center">
          <Icon as={FiStar} w={8} h={8} mb={3} />
          <Text fontSize="sm" opacity={0.8} textTransform="uppercase" letterSpacing="0.1em" fontWeight="700">Your Points</Text>
          <Heading size="2xl" mt={1}>{currentUser ? points.toLocaleString() : '—'}</Heading>
          {currentUser && (
            <HStack justify="center" mt={3} spacing={4}>
              <Badge bg="whiteAlpha.200" color="white" px={3} py={1} borderRadius="full" fontSize="xs">
                <Icon as={FiTrendingUp} mr={1} /> {totalEarned} earned all time
              </Badge>
            </HStack>
          )}
          {!currentUser && <Text mt={2} fontSize="sm" opacity={0.7}>Sign in to start earning points</Text>}
          <Text mt={3} fontSize="xs" opacity={0.6}>Earn {ppr} point{ppr !== 1 ? 's' : ''} per ₹1 spent</Text>
        </Box>

        {loading ? (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {[1, 2, 3].map(i => <Skeleton key={i} h="120px" borderRadius="16px" />)}
          </SimpleGrid>
        ) : (
          <>
            {/* Available Rewards */}
            {rewardItems.length > 0 && (
              <Box mb={8}>
                <Heading size="md" color={textColor} mb={4}>Available Rewards</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {rewardItems.map(item => {
                    const canAfford = points >= (item.pointsCost || 0);
                    const claimInfo = claimStatusMap[item.id];
                    const claimStatus = claimInfo?.status;
                    const isCustom = item.type === 'custom';
                    const customClaimLocked = isCustom && (claimStatus === 'pending' || claimStatus === 'approved');
                    const canCancelPending = isCustom && claimStatus === 'pending';
                    return (
                      <Box
                        key={item.id}
                        bg={cardBg}
                        borderWidth="1px"
                        borderColor={canAfford ? 'purple.200' : cardBorder}
                        borderRadius="16px"
                        p={5}
                        transition="all 0.2s"
                        _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                      >
                        <Flex justify="space-between" align="start" mb={2}>
                          <Text fontSize="2xl">🎁</Text>
                          <Badge colorScheme={canAfford ? 'purple' : 'gray'} borderRadius="full" px={3}>
                            {item.pointsCost} pts
                          </Badge>
                        </Flex>
                        <Text fontWeight="700" color={textColor} fontSize="md">{item.title}</Text>
                        {item.description && (
                          <Text fontSize="xs" color={mutedColor} mt={1}>{item.description}</Text>
                        )}
                        <Badge mt={2} colorScheme={
                          item.type === 'percent_off' ? 'green' :
                          item.type === 'flat_off' ? 'blue' :
                          item.type === 'free_shipping' ? 'orange' : 'purple'
                        } variant="subtle" fontSize="xs">
                          {item.type === 'percent_off' ? `${item.value}% Off` :
                           item.type === 'flat_off' ? `₹${item.value} Off` :
                           item.type === 'free_shipping' ? 'Free Shipping' : 'Custom Reward'}
                        </Badge>
                        {!canAfford && (
                          <Text fontSize="xs" color="orange.400" mt={2}>Need {(item.pointsCost || 0) - points} more points</Text>
                        )}
                        {isCustom && claimStatus && (
                          <Badge mt={2} colorScheme={
                            claimStatus === 'approved' ? 'green' :
                            claimStatus === 'fulfilled' ? 'blue' :
                            claimStatus === 'rejected' ? 'red' :
                            claimStatus === 'cancelled' ? 'gray' : 'orange'
                          } variant="subtle" fontSize="xs">
                            Status: {claimStatus}
                          </Badge>
                        )}
                        <Button
                          mt={3}
                          size="sm"
                          w="full"
                          colorScheme={item.type === 'custom' ? 'purple' : 'brand'}
                          variant={canAfford ? 'solid' : 'outline'}
                          isDisabled={!canAfford || customClaimLocked}
                          isLoading={submittingRewardId === item.id}
                          onClick={() => handleRewardClaim(item)}
                        >
                          {item.type === 'custom'
                            ? (customClaimLocked ? 'Claim In Progress' : 'Send Claim Request')
                            : 'Use in Checkout'}
                        </Button>
                        {canCancelPending && (
                          <Button
                            mt={2}
                            size="sm"
                            w="full"
                            variant="outline"
                            colorScheme="red"
                            isLoading={cancellingRewardId === item.id}
                            onClick={() => handleCancelClaim(item, claimInfo)}
                          >
                            Cancel Pending Request
                          </Button>
                        )}
                      </Box>
                    );
                  })}
                </SimpleGrid>
              </Box>
            )}

            {/* Transaction History */}
            {transactions.length > 0 && (
              <Box bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="16px" p={5}>
                <Heading size="sm" color={textColor} mb={4}>Points History</Heading>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Type</Th>
                      <Th isNumeric>Points</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {transactions.slice(-10).reverse().map((tx, i) => (
                      <Tr key={i}>
                        <Td fontSize="xs" color={mutedColor}>
                          {tx.date?.toDate ? tx.date.toDate().toLocaleDateString() : 'N/A'}
                        </Td>
                        <Td>
                          <Badge colorScheme={tx.type === 'earn' ? 'green' : 'red'} variant="subtle" fontSize="xs">
                            {tx.type === 'earn' ? 'Earned' : 'Redeemed'}
                          </Badge>
                        </Td>
                        <Td isNumeric fontWeight="600" color={tx.type === 'earn' ? 'green.500' : 'red.500'}>
                          {tx.type === 'earn' ? '+' : ''}{tx.amount}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}

            {rewardItems.length === 0 && transactions.length === 0 && (
              <Center py={10}>
                <VStack>
                  <Icon as={FiGift} w={10} h={10} color={mutedColor} opacity={0.4} />
                  <Text color={mutedColor} fontSize="sm">No rewards available yet. Keep shopping to earn points!</Text>
                </VStack>
              </Center>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default RewardsPage;
