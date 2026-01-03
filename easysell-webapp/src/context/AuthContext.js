// // import React, { createContext, useContext, useState, useEffect } from 'react';
// // import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
// // import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
// // import { auth, googleProvider, db } from '../firebase';
// // import { Box, Spinner, Center } from '@chakra-ui/react';

// // const AuthContext = createContext();

// // export const useAuth = () => useContext(AuthContext);

// // export const AuthProvider = ({ children }) => {
// //   const [currentUser, setCurrentUser] = useState(null);
// //   const [userData, setUserData] = useState(null); // State to hold user data from Firestore
// //   const [loading, setLoading] = useState(true);

// //   // Function to create or update user profile in Firestore
// //   const createUserProfileDocument = async (userAuth, additionalData = {}) => {
// //     if (!userAuth) return;

// //     const userRef = doc(db, 'users', userAuth.uid);
// //     const userSnapshot = await getDoc(userRef);

// //     if (!userSnapshot.exists()) {
// //       // User is new, create the document
// //       const { displayName, email, photoURL } = userAuth;
// //       const createdAt = serverTimestamp(); // Use server timestamp for creation date
// //       const userType = "buyer"; // Set user type

// //       try {
// //         await setDoc(userRef, {
// //           displayName,
// //           email,
// //           photoURL,
// //           createdAt,
// //           userType,
// //           ...additionalData, // Merge any additional data if needed
// //         });
// //         console.log("New user profile created in Firestore.");
// //         // Fetch the newly created data to update context state
// //         const newUserSnap = await getDoc(userRef);
// //         setUserData(newUserSnap.data());
// //       } catch (error) {
// //         console.error("Error creating user profile:", error);
// //       }
// //     } else {
// //        // User exists, fetch their data
// //        console.log("Existing user found, fetching profile.");
// //        setUserData(userSnapshot.data());
// //     }
// //   };

// //   // Google Sign-In Function
// //   const signInWithGoogle = async () => {
// //     try {
// //       const result = await signInWithPopup(auth, googleProvider);
// //       // No need to manually call createUserProfileDocument here,
// //       // the onAuthStateChanged listener below will handle it.
// //       console.log("Google Sign-In successful:", result.user.uid);
// //       return result.user; // Return user object on success
// //     } catch (error) {
// //       console.error("Google Sign-In Error:", error.code, error.message);
// //       // Handle specific errors if needed (e.g., popup closed)
// //       return null; // Indicate failure
// //     }
// //   };

// //   // Sign Out Function
// //   const signOut = async () => {
// //     try {
// //       await firebaseSignOut(auth);
// //       setCurrentUser(null);
// //       setUserData(null); // Clear user data on sign out
// //     } catch (error) {
// //       console.error("Sign Out Error:", error);
// //     }
// //   };

// //   useEffect(() => {
// //     // Listen for authentication state changes
// //     const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
// //       if (userAuth) {
// //         // User is signed in
// //         setCurrentUser(userAuth);
// //         // Create/fetch user profile from Firestore
// //         await createUserProfileDocument(userAuth);
// //       } else {
// //         // User is signed out
// //         setCurrentUser(null);
// //         setUserData(null);
// //       }
// //       setLoading(false);
// //     });

// //     // Cleanup subscription on unmount
// //     return unsubscribe;
// //   }, []); // Empty dependency array ensures this runs only once on mount

// //   const value = {
// //     currentUser,
// //     userData, // Expose Firestore user data
// //     signInWithGoogle,
// //     signOut, // Expose sign out function
// //   };

// //   if (loading) {
// //     return (
// //       <Center height="100vh">
// //         <Spinner size="xl" />
// //       </Center>
// //     );
// //   }

// //   return (
// //     <AuthContext.Provider value={value}>
// //       {children}
// //     </AuthContext.Provider>
// //   );
// // };



// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { 
//   onAuthStateChanged, 
//   signInWithPopup, 
//   signOut as firebaseSignOut,
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   deleteUser
// } from 'firebase/auth';
// import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
// import { auth, googleProvider, db } from '../firebase';
// import { Spinner, Center } from '@chakra-ui/react';

// const AuthContext = createContext();

// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider = ({ children }) => {
//   const [currentUser, setCurrentUser] = useState(null);
//   const [userData, setUserData] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // --- 1. REGISTER (New Users) ---
//   const registerWithEmail = async (email, password, details) => {
//     // 1. Create Auth Account
//     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;

//     // 2. Create Profile in Firestore with 'pending' status
//     const userRef = doc(db, 'users', user.uid);
//     await setDoc(userRef, {
//       uid: user.uid,
//       email: user.email,
//       displayName: details.name,
//       phoneNumber: details.phone,
//       gstPan: details.gstPan,
//       userType: 'buyer',
//       status: 'pending', // Vital for approval logic
//       createdAt: serverTimestamp(),
//     });

//     // 3. Sign out immediately so they can't access protected routes yet
//     await firebaseSignOut(auth);
//     return true;
//   };

//   // --- 2. LOGIN (Email/Password) ---
//   const loginWithEmail = async (email, password) => {
//     const userCredential = await signInWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;
    
//     // Check Firestore Profile
//     const userRef = doc(db, 'users', user.uid);
//     const userSnap = await getDoc(userRef);

//     if (!userSnap.exists()) {
//       await firebaseSignOut(auth);
//       throw new Error("User profile not found. Please register.");
//     }

//     const data = userSnap.data();
//     if (data.status === 'pending') {
//       await firebaseSignOut(auth);
//       throw new Error("Account is awaiting admin approval.");
//     }
//     if (data.status === 'rejected') {
//       await firebaseSignOut(auth);
//       throw new Error("Account has been rejected. Contact support.");
//     }

//     // If approved, state will update via onAuthStateChanged
//     return user;
//   };

//   // --- 3. LOGIN (Google - Restricted to Existing Users) ---
//   const signInWithGoogle = async () => {
//     try {
//       const result = await signInWithPopup(auth, googleProvider);
//       const user = result.user;

//       // Check if user exists in Firestore
//       const userRef = doc(db, 'users', user.uid);
//       const userSnap = await getDoc(userRef);

//       if (!userSnap.exists()) {
//         // CRITICAL: Block new users attempting to use Google Sign In without registration
//         // Delete the auth record to keep things clean (optional but recommended)
//         await deleteUser(user); 
//         throw new Error("Account not found. Please register as a new user first.");
//       }

//       const data = userSnap.data();
      
//       if (data.status === 'pending') {
//         await firebaseSignOut(auth);
//         throw new Error("Account is awaiting admin approval.");
//       }
//       if (data.status === 'rejected') {
//         await firebaseSignOut(auth);
//         throw new Error("Account has been rejected.");
//       }

//       return user;
//     } catch (error) {
//       console.error("Google Sign-In Error:", error.message);
//       throw error; // Re-throw to be caught in UI
//     }
//   };

//   // --- 4. SIGN OUT ---
//   const signOut = async () => {
//     try {
//       await firebaseSignOut(auth);
//       setCurrentUser(null);
//       setUserData(null);
//     } catch (error) {
//       console.error("Sign Out Error:", error);
//     }
//   };

//   // --- 5. AUTH LISTENER ---
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
//       if (userAuth) {
//         // Fetch user data whenever auth state is detected
//         try {
//           const userRef = doc(db, 'users', userAuth.uid);
//           const userSnap = await getDoc(userRef);
          
//           if (userSnap.exists()) {
//             const data = userSnap.data();
//             setUserData(data);
//             // If somehow a pending/rejected user is logged in (e.g. status changed while active), 
//             // we let ProtectedRoute handle the blocking, or sign them out here.
//             // For UX, we set currentUser so ProtectedRoute can see the status.
//             setCurrentUser(userAuth);
//           } else {
//             // Auth exists but no Firestore doc? Should treat as logged out or unverified.
//             setUserData(null);
//             setCurrentUser(userAuth);
//           }
//         } catch (err) {
//           console.error("Error fetching user profile:", err);
//           setUserData(null);
//         }
//       } else {
//         setCurrentUser(null);
//         setUserData(null);
//       }
//       setLoading(false);
//     });

//     return unsubscribe;
//   }, []);

//   const value = {
//     currentUser,
//     userData,
//     registerWithEmail,
//     loginWithEmail,
//     signInWithGoogle,
//     signOut,
//   };

//   if (loading) {
//     return (
//       <Center height="100vh">
//         <Spinner size="xl" color="teal.500" />
//       </Center>
//     );
//   }

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };


import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { Spinner, Center } from '@chakra-ui/react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null); // Stores Firestore profile data
  const [loading, setLoading] = useState(true);

  // --- 1. GOOGLE AUTH (Raw) ---
  // Just handles the popup. Logic for what to do next is in the UI.
  const googleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error("Google Auth Error:", error);
      throw error;
    }
  };

  // --- 2. CHECK PROFILE STATUS ---
  // Helper to check if a profile exists and get its data
  const getUserProfile = async (uid) => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  };

  // --- 3. SAVE NEW PROFILE ---
  const saveUserProfile = async (uid, details) => {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      uid: uid,
      email: details.email,
      displayName: details.name,
      photoURL: details.photoURL || '',
      phoneNumber: details.phone,
      gstPan: details.gstPan,
      userType: 'buyer',
      status: 'pending', // IMPORTANT: Starts as pending
      createdAt: serverTimestamp(),
    });

    // Fire and forget. We don't wait for the result.
    axios.post('http://localhost:3001/api/notify-signup', {
          userName: details.name,
          userEmail: details.email
    }).catch(err => console.error("Background notification error:", err));

    // Fetch and update local state immediately
    const newItem = await getDoc(userRef);
    setUserData(newItem.data());
  };

  // --- 4. SIGN OUT ---
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserData(null);
    } catch (error) {
      console.error("Sign Out Error:", error);
    }
  };

  // --- 5. AUTH LISTENER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
      if (userAuth) {
        setCurrentUser(userAuth);
        // Attempt to fetch profile
        const profile = await getUserProfile(userAuth.uid);
        setUserData(profile); // Will be null if new user
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    googleLogin,
    getUserProfile,
    saveUserProfile,
    signOut,
  };

  if (loading) {
    return (
      <Center height="100vh">
        <Spinner size="xl" color="teal.500" />
      </Center>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};