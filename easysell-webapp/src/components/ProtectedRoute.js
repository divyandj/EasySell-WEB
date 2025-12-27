// // // src/components/ProtectedRoute.js
// // import React from 'react';
// // import { Navigate, useLocation } from 'react-router-dom';
// // import { useAuth } from '../context/AuthContext';

// // const ProtectedRoute = ({ children }) => {
// //   const { currentUser } = useAuth();
// //   const location = useLocation();

// //   if (!currentUser) {
// //     // Redirect them to the /login page, but save the current location they were
// //     // trying to go to. This allows us to send them back after they log in.
// //     return <Navigate to="/login" state={{ from: location }} replace />;
// //   }

// //   return children;
// // };

// // export default ProtectedRoute;


// import React from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { Center, VStack, Heading, Text, Button, Icon, Box } from '@chakra-ui/react';
// import { FiClock, FiLock } from 'react-icons/fi';

// const ProtectedRoute = ({ children }) => {
//   const { currentUser, userData, signOut } = useAuth();
//   const location = useLocation();

//   // 1. Not Logged In -> Redirect to Login
//   if (!currentUser) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   // 2. Logged In but Profile Logic
//   // If userData is still loading (but auth is done), usually AuthContext handles this loading state globally.
//   // But if userData is null (e.g. new google login edge case), treat as restricted.
  
//   if (userData) {
//     // 3. Pending Approval -> Show Block Screen
//     if (userData.status === 'pending') {
//       return (
//         <Center h="80vh">
//           <VStack spacing={6} p={8} borderWidth={1} borderRadius="lg" shadow="lg" maxW="md" textAlign="center" bg="white">
//             <Icon as={FiClock} w={16} h={16} color="orange.400" />
//             <Heading size="lg">Awaiting Approval</Heading>
//             <Text color="gray.600">
//               Your account has been created but requires admin approval before you can access the catalogue and place orders.
//             </Text>
//             <Text fontSize="sm" color="gray.500">
//               Please check back later or contact support.
//             </Text>
//             <Button colorScheme="teal" variant="outline" onClick={() => signOut()}>
//               Sign Out
//             </Button>
//           </VStack>
//         </Center>
//       );
//     }

//     // 4. Rejected -> Show Block Screen
//     if (userData.status === 'rejected') {
//         return (
//           <Center h="80vh">
//             <VStack spacing={6} p={8} borderWidth={1} borderRadius="lg" shadow="lg" maxW="md" textAlign="center" bg="white">
//               <Icon as={FiLock} w={16} h={16} color="red.500" />
//               <Heading size="lg" color="red.500">Access Denied</Heading>
//               <Text color="gray.600">
//                 Your account registration was declined by the administrator.
//               </Text>
//               <Button colorScheme="red" variant="outline" onClick={() => signOut()}>
//                 Sign Out
//               </Button>
//             </VStack>
//           </Center>
//         );
//       }
//   }

//   // 5. Approved -> Allow Access
//   return children;
// };

// export default ProtectedRoute;



import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Center, VStack, Heading, Text, Button, Icon } from '@chakra-ui/react';
import { FiClock, FiLock } from 'react-icons/fi';

const ProtectedRoute = ({ children }) => {
  const { currentUser, userData, signOut } = useAuth();
  const location = useLocation();

  // 1. Check Authentication
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check Profile Status
  // If userData is null, it might be loading, or it might be a new user who hasn't finished reg form yet.
  // If they are on a protected route with no profile, we kick them back to login to finish the form.
  if (currentUser && !userData) {
     return <Navigate to="/login" replace />;
  }

  if (userData) {
    // Pending Approval
    if (userData.status === 'pending') {
      return (
        <Center h="80vh">
          <VStack spacing={6} p={8} borderWidth={1} borderRadius="lg" shadow="lg" maxW="md" textAlign="center" bg="white">
            <Icon as={FiClock} w={16} h={16} color="orange.400" />
            <Heading size="lg">Awaiting Approval</Heading>
            <Text color="gray.600">
              Your account is currently pending admin approval. You cannot access this page yet.
            </Text>
            <Button colorScheme="teal" variant="outline" onClick={() => signOut()}>
              Sign Out
            </Button>
          </VStack>
        </Center>
      );
    }

    // Rejected
    if (userData.status === 'rejected') {
        return (
          <Center h="80vh">
            <VStack spacing={6} p={8} borderWidth={1} borderRadius="lg" shadow="lg" maxW="md" textAlign="center" bg="white">
              <Icon as={FiLock} w={16} h={16} color="red.500" />
              <Heading size="lg" color="red.500">Access Denied</Heading>
              <Text color="gray.600">
                Your account has been rejected.
              </Text>
              <Button colorScheme="red" variant="outline" onClick={() => signOut()}>
                Sign Out
              </Button>
            </VStack>
          </Center>
        );
      }
  }

  // 3. Approved -> Allow Access
  return children;
};

export default ProtectedRoute;