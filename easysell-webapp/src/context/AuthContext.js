import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { Box, Spinner, Center } from '@chakra-ui/react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null); // State to hold user data from Firestore
  const [loading, setLoading] = useState(true);

  // Function to create or update user profile in Firestore
  const createUserProfileDocument = async (userAuth, additionalData = {}) => {
    if (!userAuth) return;

    const userRef = doc(db, 'users', userAuth.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      // User is new, create the document
      const { displayName, email, photoURL } = userAuth;
      const createdAt = serverTimestamp(); // Use server timestamp for creation date
      const userType = "buyer"; // Set user type

      try {
        await setDoc(userRef, {
          displayName,
          email,
          photoURL,
          createdAt,
          userType,
          ...additionalData, // Merge any additional data if needed
        });
        console.log("New user profile created in Firestore.");
        // Fetch the newly created data to update context state
        const newUserSnap = await getDoc(userRef);
        setUserData(newUserSnap.data());
      } catch (error) {
        console.error("Error creating user profile:", error);
      }
    } else {
       // User exists, fetch their data
       console.log("Existing user found, fetching profile.");
       setUserData(userSnapshot.data());
    }
  };

  // Google Sign-In Function
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // No need to manually call createUserProfileDocument here,
      // the onAuthStateChanged listener below will handle it.
      console.log("Google Sign-In successful:", result.user.uid);
      return result.user; // Return user object on success
    } catch (error) {
      console.error("Google Sign-In Error:", error.code, error.message);
      // Handle specific errors if needed (e.g., popup closed)
      return null; // Indicate failure
    }
  };

  // Sign Out Function
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserData(null); // Clear user data on sign out
    } catch (error) {
      console.error("Sign Out Error:", error);
    }
  };

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
      if (userAuth) {
        // User is signed in
        setCurrentUser(userAuth);
        // Create/fetch user profile from Firestore
        await createUserProfileDocument(userAuth);
      } else {
        // User is signed out
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []); // Empty dependency array ensures this runs only once on mount

  const value = {
    currentUser,
    userData, // Expose Firestore user data
    signInWithGoogle,
    signOut, // Expose sign out function
  };

  if (loading) {
    return (
      <Center height="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};