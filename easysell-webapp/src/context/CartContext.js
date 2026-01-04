// import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
// import { doc, getDoc } from 'firebase/firestore';
// import { db } from '../firebase';

// // Create the context
// const CartContext = createContext();

// // Hook to use the cart context
// export const useCart = () => useContext(CartContext);

// // --- Helper Function: Get Effective Price Per Unit (Pre-Tax) ---
// // Calculates price after base/discount and bulk discount, BEFORE variant modifier.
// const getEffectivePricePerUnit = (baseOrDiscountedPrice, bulkDiscounts, quantity) => {
//   // Ensure inputs are numbers, default to 0 if not
//   const priceInput = Number(baseOrDiscountedPrice) || 0;
//   const qtyInput = Number(quantity) || 0;

//   let effectivePrice = priceInput; // Start with the initial price

//   // Ensure bulkDiscounts is a valid array
//   if (Array.isArray(bulkDiscounts) && bulkDiscounts.length > 0) {
//     // Sort discounts by start quantity descending to find the best applicable tier
//     const sortedDiscounts = [...bulkDiscounts]
//         .filter(d => typeof d.startQty === 'number' && typeof d.pricePerUnit === 'number') // Filter invalid entries
//         .sort((a, b) => b.startQty - a.startQty);

//     for (const discount of sortedDiscounts) {
//       // Check if quantity meets the start requirement
//       if (qtyInput >= discount.startQty) {
//         // Check if there's an end quantity and if the current quantity is within its range
//         if (discount.endQty && qtyInput > discount.endQty) {
//           // If quantity exceeds the range, this tier doesn't apply, continue
//           continue;
//         }
//         // Quantity is within this tier (or it's the highest tier with no endQty)
//         effectivePrice = Number(discount.pricePerUnit) || 0; // Use the tier's price, ensure it's a number
//         // console.log(`Applied bulk discount: Qty ${qtyInput}, Tier ${discount.startQty}+, Price ${effectivePrice}`);
//         break; // Found the best matching tier, stop searching
//       }
//     }
//   }
//   // If no bulk discount applied, effectivePrice remains priceInput
//   return effectivePrice;
// };

// // --- Helper Function: Calculate Detailed Price Info for an Item ---
// const calculateItemPriceDetails = (item) => {
//   // Check for essential data, provide zeroed object if missing
//   if (!item || !item.productData || typeof item.quantity !== 'number') {
//       console.error("calculateItemPriceDetails missing essential item data:", item);
//       return {
//           baseUnitPrice: 0, discountAmountUnit: 0, bulkDiscountAmountUnit: 0,
//           variantModifierUnit: 0, effectiveUnitPricePreTax: 0, taxAmountUnit: 0,
//           finalUnitPriceWithTax: 0, lineItemSubtotal: 0, lineItemTax: 0, lineItemTotal: 0,
//       };
//   }

//   const { productData, quantity, variant } = item;
//   // Ensure numeric values, default to 0
//   const taxRateDecimal = (Number(productData.taxRate) || 0) / 100;
//   const baseUnitPrice = Number(productData.price) || 0;

//   // 1. Determine Base or Discounted Price
//   const discountedUnitPriceValue = (Number(productData.discountedPrice) > 0 && Number(productData.discountedPrice) < baseUnitPrice)
//     ? Number(productData.discountedPrice)
//     : null; // Use null to clearly indicate no active discount
//   const priceBeforeBulk = discountedUnitPriceValue ?? baseUnitPrice; // Use discounted if available, else base
//   const discountAmountUnit = discountedUnitPriceValue ? baseUnitPrice - discountedUnitPriceValue : 0;

//   // 2. Apply Bulk Discount (based on priceBeforeBulk)
//   const effectiveUnitPriceAfterBulk = getEffectivePricePerUnit(priceBeforeBulk, productData.bulkDiscounts, quantity);
//   const bulkDiscountAmountUnit = priceBeforeBulk - effectiveUnitPriceAfterBulk; // Amount saved due to bulk

//   // 3. Apply Variant Modifier
//   const variantModifierUnit = variant ? (Number(variant.priceModifier) || 0) : 0;
//   const effectiveUnitPricePreTax = effectiveUnitPriceAfterBulk + variantModifierUnit; // Final unit price before tax

//   // 4. Calculate Tax
//   const taxAmountUnit = effectiveUnitPricePreTax * taxRateDecimal;
//   const finalUnitPriceWithTax = effectiveUnitPricePreTax + taxAmountUnit; // Final unit price including tax

//   // 5. Calculate Line Item Totals
//   const lineItemSubtotal = effectiveUnitPricePreTax * quantity; // Total before tax for the line
//   const lineItemTax = taxAmountUnit * quantity; // Total tax for the line
//   const lineItemTotal = finalUnitPriceWithTax * quantity; // Grand total for the line

//   // Log calculation steps for debugging
//   // console.log(`Calc Details (${item.title} x${quantity}): Base=${baseUnitPrice}, Disc=${discountAmountUnit}, Bulk=${bulkDiscountAmountUnit}, VarMod=${variantModifierUnit} -> PreTax=${effectiveUnitPricePreTax}, Tax=${taxAmountUnit} -> FinalUnit=${finalUnitPriceWithTax}, LineTotal=${lineItemTotal}`);

//   return {
//     baseUnitPrice, discountAmountUnit, bulkDiscountAmountUnit, variantModifierUnit,
//     effectiveUnitPricePreTax, taxAmountUnit, finalUnitPriceWithTax,
//     lineItemSubtotal, lineItemTax, lineItemTotal,
//   };
// };


// // --- Cart Provider Component ---
// export const CartProvider = ({ children }) => {
//   // State for cart items, loaded from localStorage
//   const [cartItems, setCartItems] = useState(() => {
//     try {
//       const localData = localStorage.getItem('cart');
//       const parsedData = localData ? JSON.parse(localData) : [];
//       // Ensure loaded data is an array before returning
//       return Array.isArray(parsedData) ? parsedData : [];
//     } catch (error) {
//         console.error("Error loading cart from localStorage:", error);
//         return []; // Return empty array on error
//     }
//   });

//   // State to indicate if product data (like sellerId) is being fetched
//   const [loadingProductData, setLoadingProductData] = useState(false);
//   // State to cache seller IDs per catalogue ID to reduce Firestore reads
//   const [catalogueSellerCache, setCatalogueSellerCache] = useState({});

//   // Memoized calculation: Adds detailed price info to each cart item
//   const cartWithPriceDetails = useMemo(() => {
//     //   console.log("Recalculating cart price details...");
//       return cartItems.map(item => ({
//           ...item,
//           priceDetails: calculateItemPriceDetails(item), // Calculate price details for each item
//       }));
//   }, [cartItems]); // Recalculate only when core cartItems change

//   // Memoized calculation: Calculates totals based on the detailed cart items
//   const cartTotals = useMemo(() => {
//     //   console.log("Recalculating cart totals...");
//       let subtotal = 0;
//       let totalTax = 0;
//       let grandTotal = 0;
//       let totalItems = 0;

//       // Sum up totals from each item's calculated priceDetails
//       cartWithPriceDetails.forEach(item => {
//           subtotal += item.priceDetails.lineItemSubtotal;
//           totalTax += item.priceDetails.lineItemTax;
//           grandTotal += item.priceDetails.lineItemTotal;
//           totalItems += item.quantity;
//       });

//       return { subtotal, totalTax, grandTotal, itemCount: totalItems };
//   }, [cartWithPriceDetails]); // Recalculate only when detailed items change


//   // Effect to save core cart items (without calculated details) to localStorage
//   useEffect(() => {
//     try {
//         // Only store the core data needed to reconstruct the cart
//         const itemsToStore = cartItems.map(({ priceDetails, ...rest }) => rest);
//         localStorage.setItem('cart', JSON.stringify(itemsToStore));
//     } catch (error) {
//         console.error("Error saving cart to localStorage:", error);
//     }
//   }, [cartItems]); // Run whenever cartItems state changes


//   // --- Function to Add Items to Cart ---
//   const addToCart = async (product, quantity, selectedVariant = null) => {
//     // Ensure quantity is a positive number, default to 1
//     const validQuantity = Math.max(1, Number(quantity) || 1);

//     setLoadingProductData(true); // Indicate loading state
//     let fetchedSellerId = null; // Variable to hold seller ID if fetched

//     try {
//       // Prioritize using the passed product object
//       let productData = product;

//       // --- Crucial Data Check (Includes catalogueId) ---
//       // If essential data is missing, fetch the full product document from Firestore.
//       if (typeof productData.price !== 'number' || typeof productData.taxRate !== 'number' || !productData.catalogueId) {
//          console.warn(`addToCart received incomplete product data for ${product.id}, fetching fresh data...`);
//          const productRef = doc(db, 'products', product.id);
//          const productSnap = await getDoc(productRef);
//          if (productSnap.exists()) {
//              productData = { id: productSnap.id, ...productSnap.data() };
//              // Re-validate fetched data
//              if (typeof productData.price !== 'number' || typeof productData.taxRate !== 'number' || !productData.catalogueId) {
//                  throw new Error(`Fetched product data for ${product.id} is still missing essential fields (price, taxRate, catalogueId).`);
//              }
//          } else {
//              throw new Error(`Product data not found in Firestore for ID: ${product.id}`);
//          }
//       }

//       // --- Fetch Seller ID if not cached ---
//       const currentCatalogueId = productData.catalogueId;
//       if (currentCatalogueId && !catalogueSellerCache[currentCatalogueId]) {
//           console.log(`Seller ID for catalogue ${currentCatalogueId} not cached, fetching...`);
//           const catalogueRef = doc(db, 'catalogues', currentCatalogueId);
//           const catalogueSnap = await getDoc(catalogueRef);
//           if (catalogueSnap.exists()) {
//               // Assume seller's ID is stored in the 'userId' field of the catalogue document
//               fetchedSellerId = catalogueSnap.data()?.userId;
//               if (fetchedSellerId) {
//                   // Update cache state immutably
//                   setCatalogueSellerCache(prevCache => ({
//                       ...prevCache,
//                       [currentCatalogueId]: fetchedSellerId
//                   }));
//                   console.log(`Cached seller ID ${fetchedSellerId} for catalogue ${currentCatalogueId}`);
//               } else {
//                   console.warn(`Catalogue ${currentCatalogueId} exists but has no 'userId' (sellerId) field.`);
//               }
//           } else {
//               console.warn(`Catalogue document ${currentCatalogueId} not found when fetching sellerId.`);
//               // Proceeding without sellerId if catalogue doc not found
//               fetchedSellerId = null; // Ensure it's null if not found
//           }
//       } else if (currentCatalogueId) {
//           fetchedSellerId = catalogueSellerCache[currentCatalogueId]; // Use cached value if available
//       }
//       // --- End Fetch Seller ID ---

//       // Update cart items state
//       setCartItems(prevItems => {
//         // Ensure prevItems is an array before processing
//         const currentItems = Array.isArray(prevItems) ? prevItems : [];

//         // Create a unique ID for the cart item based on product and variant
//         const cartId = selectedVariant
//           ? `${productData.id}-${Object.values(selectedVariant.options).sort().join('-')}` // Sort options for consistency
//           : productData.id;

//         const existingItemIndex = currentItems.findIndex(item => item.cartId === cartId);

//         // --- Data to store on the cart item (includes sellerId) ---
//         const essentialProductData = {
//             price: productData.price,
//             discountedPrice: productData.discountedPrice,
//             bulkDiscounts: productData.bulkDiscounts || null,
//             taxRate: productData.taxRate || 0,
//             priceUnit: productData.priceUnit || null,
//             minOrderQty: productData.minOrderQty || 1,
//             catalogueId: currentCatalogueId, // Use the verified/fetched catalogueId
//             sellerId: fetchedSellerId || catalogueSellerCache[currentCatalogueId] || null // Use fetched or cached sellerId, default null
//         };

//         if (existingItemIndex > -1) {
//           // Update quantity for existing item
//           const updatedItems = [...currentItems];
//           const currentItem = updatedItems[existingItemIndex];
//           updatedItems[existingItemIndex] = {
//             ...currentItem,
//             quantity: currentItem.quantity + validQuantity,
//             productData: essentialProductData, // Ensure productData is up-to-date
//           };
//           console.log(`Updated quantity for ${cartId} to ${updatedItems[existingItemIndex].quantity}`);
//           return updatedItems;
//         } else {
//           // Add new item
//           const newItem = {
//             cartId,
//             productId: productData.id,
//             title: productData.title,
//             quantity: validQuantity,
//             productData: essentialProductData, // Store essential data including sellerId
//             // Get first image URL (prefer variant if available)
//             imageUrl: selectedVariant?.imageUrl || productData.media?.find(m => m.type === 'image')?.url || null,
//             variant: selectedVariant ? { // Store only necessary variant info
//                 options: selectedVariant.options,
//                 priceModifier: selectedVariant.priceModifier,
//                 skuOverride: selectedVariant.skuOverride,
//                 imageUrl: selectedVariant.imageUrl, // Also store variant image URL
//             } : null,
//           };
//           console.log(`Added new item ${cartId}`);
//           return [...currentItems, newItem];
//         }
//       });
//     } catch (error) {
//         console.error("Error adding item to cart:", error);
//         // User feedback needed here (e.g., via toast) if add fails
//     } finally {
//         setLoadingProductData(false); // Stop loading indicator
//     }
//   };


//   // --- Function to Remove Items from Cart ---
//   const removeFromCart = (cartId) => {
//     setCartItems(prevItems => Array.isArray(prevItems) ? prevItems.filter(item => item.cartId !== cartId) : []);
//   };


//   // --- Function to Update Item Quantity in Cart ---
//   const updateQuantity = (cartId, quantity) => {
//       // Ensure quantity is a valid number
//       const newQuantityRaw = Number(quantity);
//       if (isNaN(newQuantityRaw)) return; // Do nothing if input is not a number

//       setCartItems(prevItems => {
//           // Ensure prevItems is an array
//           const currentItems = Array.isArray(prevItems) ? prevItems : [];
//           const itemIndex = currentItems.findIndex(item => item.cartId === cartId);
//           if (itemIndex === -1) return currentItems; // Item not found

//           const currentItem = currentItems[itemIndex];
//           const minQty = currentItem.productData?.minOrderQty || 1;

//           // Clamp quantity between minQty and handle removal
//           let newQuantity = Math.max(minQty, newQuantityRaw);

//           // Allow removal only if final quantity is 0 AND minQty is 0 or 1
//           if (newQuantityRaw <= 0 && minQty <= 1) {
//               console.log(`Removing item ${cartId} due to quantity <= 0`);
//               return currentItems.filter(item => item.cartId !== cartId);
//           }

//           // If quantity didn't change after clamping, do nothing
//           if (currentItem.quantity === newQuantity) return currentItems;

//           // Update quantity
//           console.log(`Updating quantity for ${cartId} from ${currentItem.quantity} to ${newQuantity}`);
//           const updatedItems = [...currentItems];
//           updatedItems[itemIndex] = { ...currentItem, quantity: newQuantity };
//           return updatedItems;
//       });
//   };


//   // --- Function to Clear the Entire Cart ---
//   const clearCart = () => {
//     setCartItems([]);
//     localStorage.removeItem('cart'); // Also clear local storage on explicit clear
//   };

//   // --- Value provided by the context ---
//   const value = {
//     cartItems: cartWithPriceDetails, // Items array with calculated priceDetails included
//     cartSubtotal: cartTotals.subtotal, // Total before tax
//     cartTotalTax: cartTotals.totalTax, // Total tax amount
//     cartGrandTotal: cartTotals.grandTotal, // Final total including tax
//     itemCount: cartTotals.itemCount, // Total number of individual items
//     addToCart, // Function to add items
//     removeFromCart, // Function to remove items
//     updateQuantity, // Function to update item quantity
//     clearCart, // Function to clear the cart
//     loadingProductData, // Boolean indicating if product data fetch is in progress
//   };

//   // Provide the value to child components
//   return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
// };



import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
// Import AuthContext to know WHO is logged in
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// --- Helper Functions (Unchanged) ---
const getEffectivePricePerUnit = (baseOrDiscountedPrice, bulkDiscounts, quantity) => {
  const priceInput = Number(baseOrDiscountedPrice) || 0;
  const qtyInput = Number(quantity) || 0;
  let effectivePrice = priceInput;
  if (Array.isArray(bulkDiscounts) && bulkDiscounts.length > 0) {
    const sortedDiscounts = [...bulkDiscounts]
      .filter(d => typeof d.startQty === 'number' && typeof d.pricePerUnit === 'number')
      .sort((a, b) => b.startQty - a.startQty);
    for (const discount of sortedDiscounts) {
      if (qtyInput >= discount.startQty) {
        if (discount.endQty && qtyInput > discount.endQty) continue;
        effectivePrice = Number(discount.pricePerUnit) || 0;
        break;
      }
    }
  }
  return effectivePrice;
};

const calculateItemPriceDetails = (item) => {
  if (!item || !item.productData || typeof item.quantity !== 'number') {
    return { baseUnitPrice: 0, discountAmountUnit: 0, bulkDiscountAmountUnit: 0, variantModifierUnit: 0, effectiveUnitPricePreTax: 0, taxAmountUnit: 0, finalUnitPriceWithTax: 0, lineItemSubtotal: 0, lineItemTax: 0, lineItemTotal: 0 };
  }
  const { productData, quantity, variant } = item;
  const taxRateDecimal = (Number(productData.taxRate) || 0) / 100;
  const baseUnitPrice = Number(productData.price) || 0;
  const discountedUnitPriceValue = (Number(productData.discountedPrice) > 0 && Number(productData.discountedPrice) < baseUnitPrice) ? Number(productData.discountedPrice) : null;
  const priceBeforeBulk = discountedUnitPriceValue ?? baseUnitPrice;
  const discountAmountUnit = discountedUnitPriceValue ? baseUnitPrice - discountedUnitPriceValue : 0;
  const effectiveUnitPriceAfterBulk = getEffectivePricePerUnit(priceBeforeBulk, productData.bulkDiscounts, quantity);
  const bulkDiscountAmountUnit = priceBeforeBulk - effectiveUnitPriceAfterBulk;
  const variantModifierUnit = variant ? (Number(variant.priceModifier) || 0) : 0;
  const effectiveUnitPricePreTax = effectiveUnitPriceAfterBulk + variantModifierUnit;
  const taxAmountUnit = effectiveUnitPricePreTax * taxRateDecimal;
  const finalUnitPriceWithTax = effectiveUnitPricePreTax + taxAmountUnit;
  const lineItemSubtotal = effectiveUnitPricePreTax * quantity;
  const lineItemTax = taxAmountUnit * quantity;
  const lineItemTotal = finalUnitPriceWithTax * quantity;
  return { baseUnitPrice, discountAmountUnit, bulkDiscountAmountUnit, variantModifierUnit, effectiveUnitPricePreTax, taxAmountUnit, finalUnitPriceWithTax, lineItemSubtotal, lineItemTax, lineItemTotal };
};


export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth(); // Access current user
  const [cartItems, setCartItems] = useState([]);
  const [loadingProductData, setLoadingProductData] = useState(false);
  const [catalogueSellerCache, setCatalogueSellerCache] = useState({});
  const [isInitialized, setIsInitialized] = useState(false); // Flag to prevent saving before loading

  // --- 1. LOAD CART ON LOGIN ---
  useEffect(() => {
    if (currentUser) {
      // User logged in: Load THEIR specific cart
      const userCartKey = `cart_${currentUser.uid}`;
      try {
        const localData = localStorage.getItem(userCartKey);
        const parsedData = localData ? JSON.parse(localData) : [];
        setCartItems(Array.isArray(parsedData) ? parsedData : []);
        console.log(`Restored cart for user ${currentUser.uid}`);
      } catch (error) {
        console.error("Error loading user cart:", error);
        setCartItems([]);
      } finally {
        setIsInitialized(true); // Mark as initialized after attempting load
      }
    } else {
      // User logged out
      setCartItems([]);
      setIsInitialized(true); // Also mark initialized for guest/logged-out state
    }
  }, [currentUser]);

  // --- 2. SAVE CART ON CHANGE ---
  useEffect(() => {
    // Only save if we have finished the initial load sequence
    if (!isInitialized) return;

    if (currentUser) {
      const userCartKey = `cart_${currentUser.uid}`;
      try {
        // Only store core data
        const itemsToStore = cartItems.map(({ priceDetails, ...rest }) => rest);
        localStorage.setItem(userCartKey, JSON.stringify(itemsToStore));
      } catch (error) {
        console.error("Error saving user cart:", error);
      }
    }
  }, [cartItems, currentUser, isInitialized]);


  // Memoized calculations
  const cartWithPriceDetails = useMemo(() => {
    return cartItems.map(item => ({
      ...item,
      priceDetails: calculateItemPriceDetails(item),
    }));
  }, [cartItems]);

  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    let grandTotal = 0;
    let totalItems = 0;

    cartWithPriceDetails.forEach(item => {
      subtotal += item.priceDetails.lineItemSubtotal;
      totalTax += item.priceDetails.lineItemTax;
      grandTotal += item.priceDetails.lineItemTotal;
      totalItems += item.quantity;
    });

    return { subtotal, totalTax, grandTotal, itemCount: totalItems };
  }, [cartWithPriceDetails]);


  const addToCart = async (product, quantity, selectedVariant = null) => {
    // If not logged in, we can't save to user-specific cart. 
    // But since routes are protected, this usually won't happen.
    if (!currentUser) return;

    const validQuantity = Math.max(1, Number(quantity) || 1);
    setLoadingProductData(true);
    let fetchedSellerId = null;

    try {
      let productData = product;
      if (typeof productData.price !== 'number' || typeof productData.taxRate !== 'number' || !productData.catalogueId) {
        const productRef = doc(db, 'products', product.id);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          productData = { id: productSnap.id, ...productSnap.data() };
        } else {
          throw new Error(`Product data not found: ${product.id}`);
        }
      }

      const currentCatalogueId = productData.catalogueId;
      if (currentCatalogueId && !catalogueSellerCache[currentCatalogueId]) {
        const catalogueRef = doc(db, 'catalogues', currentCatalogueId);
        const catalogueSnap = await getDoc(catalogueRef);
        if (catalogueSnap.exists()) {
          fetchedSellerId = catalogueSnap.data()?.userId;
          if (fetchedSellerId) {
            setCatalogueSellerCache(prev => ({ ...prev, [currentCatalogueId]: fetchedSellerId }));
          }
        }
      } else if (currentCatalogueId) {
        fetchedSellerId = catalogueSellerCache[currentCatalogueId];
      }

      setCartItems(prevItems => {
        const currentItems = Array.isArray(prevItems) ? prevItems : [];
        const cartId = selectedVariant
          ? `${productData.id}-${Object.values(selectedVariant.options).sort().join('-')}`
          : productData.id;

        const existingItemIndex = currentItems.findIndex(item => item.cartId === cartId);

        const essentialProductData = {
          price: productData.price,
          discountedPrice: productData.discountedPrice,
          bulkDiscounts: productData.bulkDiscounts || null,
          taxRate: productData.taxRate || 0,
          priceUnit: productData.priceUnit || null,
          minOrderQty: productData.minOrderQty || 1,
          catalogueId: currentCatalogueId,
          sellerId: fetchedSellerId || catalogueSellerCache[currentCatalogueId] || null
        };

        if (existingItemIndex > -1) {
          const updatedItems = [...currentItems];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + validQuantity,
            productData: essentialProductData,
          };
          return updatedItems;
        } else {
          const newItem = {
            cartId,
            productId: productData.id,
            title: productData.title,
            quantity: validQuantity,
            productData: essentialProductData,
            imageUrl: selectedVariant?.imageUrl || productData.media?.find(m => m.type === 'image')?.url || null,
            variant: selectedVariant ? {
              options: selectedVariant.options,
              priceModifier: selectedVariant.priceModifier,
              skuOverride: selectedVariant.skuOverride,
              imageUrl: selectedVariant.imageUrl,
            } : null,
          };
          return [...currentItems, newItem];
        }
      });
    } catch (error) {
      console.error("Error adding item to cart:", error);
    } finally {
      setLoadingProductData(false);
    }
  };

  const removeFromCart = (cartId) => {
    setCartItems(prevItems => Array.isArray(prevItems) ? prevItems.filter(item => item.cartId !== cartId) : []);
  };

  const updateQuantity = (cartId, quantity) => {
    const newQuantityRaw = Number(quantity);
    if (isNaN(newQuantityRaw)) return;

    setCartItems(prevItems => {
      const currentItems = Array.isArray(prevItems) ? prevItems : [];
      const itemIndex = currentItems.findIndex(item => item.cartId === cartId);
      if (itemIndex === -1) return currentItems;

      const currentItem = currentItems[itemIndex];
      const minQty = currentItem.productData?.minOrderQty || 1;
      let newQuantity = Math.max(minQty, newQuantityRaw);

      if (newQuantityRaw <= 0 && minQty <= 1) {
        return currentItems.filter(item => item.cartId !== cartId);
      }
      if (currentItem.quantity === newQuantity) return currentItems;

      const updatedItems = [...currentItems];
      updatedItems[itemIndex] = { ...currentItem, quantity: newQuantity };
      return updatedItems;
    });
  };

  // Clear Cart now explicitly wipes the user's specific storage
  const clearCart = () => {
    setCartItems([]);
    if (currentUser) {
      localStorage.removeItem(`cart_${currentUser.uid}`);
    }
  };

  const value = {
    cartItems: cartWithPriceDetails,
    cartSubtotal: cartTotals.subtotal,
    cartTotalTax: cartTotals.totalTax,
    cartGrandTotal: cartTotals.grandTotal,
    itemCount: cartTotals.itemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    loadingProductData,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};