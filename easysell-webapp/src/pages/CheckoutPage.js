// // import React, { useState } from 'react';
// // import {
// //   Container, Heading, VStack, FormControl, FormLabel, Input, Button,
// //   Box, Text, useToast, SimpleGrid, Divider, Alert, AlertIcon,
// //   AlertTitle, AlertDescription, Spinner, Center, HStack
// // } from '@chakra-ui/react';
// // import { useAuth } from '../context/AuthContext';
// // import { useCart } from '../context/CartContext';
// // import { useNavigate } from 'react-router-dom';
// // import { collection, Timestamp, runTransaction, doc, getDoc, updateDoc } from 'firebase/firestore'; // Removed addDoc as we use doc(collection(...)) now
// // import { db } from '../firebase';
// // import SpinnerComponent from '../components/Spinner';

// // // Helper to format currency
// // const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

// // const CheckoutPage = () => {
// //   const { currentUser } = useAuth();
// //   // Get detailed totals and items (including priceDetails) from context
// //   const { cartItems, cartSubtotal, cartTotalTax, cartGrandTotal, clearCart, itemCount, loadingProductData } = useCart();
// //   const navigate = useNavigate();
// //   const toast = useToast();

// //   const [shippingInfo, setShippingInfo] = useState({
// //     name: '', address: '', city: '', pincode: '', phone: '',
// //   });
// //   const [isSubmitting, setIsSubmitting] = useState(false);
// //   const [error, setError] = useState(null); // State for transaction errors

// //   // Handles changes in the shipping form inputs
// //   const handleInputChange = (e) => {
// //     const { name, value } = e.target;
// //     setShippingInfo(prev => ({ ...prev, [name]: value }));
// //   };

// //   // Handles the order placement process
// //   const handlePlaceOrder = async (e) => {
// //     e.preventDefault(); // Prevent default form submission
// //     setError(null); // Clear previous errors

// //     // --- Validations ---
// //     // Check if user is logged in
// //     if (!currentUser) {
// //       toast({ title: "You must be logged in.", status: "error", duration: 3000, isClosable: true });
// //       return;
// //     }
// //     // Check if cart is valid (not empty and has necessary data on first item)
// //     if (cartItems.length === 0 || !cartItems[0]?.productData?.catalogueId || !cartItems[0]?.productData?.sellerId) {
// //       toast({ title: "Cannot place order.", description: "Your cart is empty or missing necessary product information (Catalogue/Seller ID). Please try adding items again.", status: "warning", duration: 5000, isClosable: true });
// //       setError("Cannot place order. Cart is invalid or missing data."); // Set error state as well
// //       return;
// //     }

// //     setIsSubmitting(true); // Indicate processing started

// //     // --- Get catalogueId and sellerId (assuming all items are from the same catalogue/seller) ---
// //     const catalogueId = cartItems[0].productData.catalogueId;
// //     const sellerId = cartItems[0].productData.sellerId; // Get sellerId from cart item data

// //     // Double check they were retrieved correctly before proceeding
// //     if (!catalogueId || !sellerId) {
// //         setError("Cannot place order: Critical Catalogue or Seller ID is missing.");
// //         setIsSubmitting(false);
// //         toast({ title: "Error", description: "Catalogue or Seller ID missing.", status: "error", duration: 5000, isClosable: true });
// //         return;
// //     }
// //     console.log(`Placing order under catalogue ID: ${catalogueId}, Seller ID: ${sellerId}`);

// //     // --- Prepare detailed order data object to be saved ---
// //     const orderData = {
// //       userId: currentUser.uid, // Buyer's Firebase Auth User ID
// //       catalogueId: catalogueId, // Catalogue ID from the cart item
// //       sellerId: sellerId,     // Seller ID from the cart item
// //       items: cartItems.map(item => ({ // Map cart items to order items structure
// //         productId: item.productId,
// //         title: item.title,
// //         quantity: item.quantity,
// //         imageUrl: item.imageUrl, // Original URL (proxy applied on display)
// //         variant: item.variant ? { // Store selected variant details if applicable
// //           options: item.variant.options,
// //           skuOverride: item.variant.skuOverride,
// //           imageUrl: item.variant.imageUrl, // Original variant URL (proxy applied on display)
// //         } : null,
// //         // Store the detailed price breakdown calculated by CartContext
// //         priceDetails: {
// //            baseUnitPrice: item.priceDetails.baseUnitPrice,
// //            discountAmountUnit: item.priceDetails.discountAmountUnit,
// //            bulkDiscountAmountUnit: item.priceDetails.bulkDiscountAmountUnit,
// //            variantModifierUnit: item.priceDetails.variantModifierUnit,
// //            effectiveUnitPricePreTax: item.priceDetails.effectiveUnitPricePreTax,
// //            taxAmountUnit: item.priceDetails.taxAmountUnit,
// //            finalUnitPriceWithTax: item.priceDetails.finalUnitPriceWithTax,
// //            lineItemSubtotal: item.priceDetails.lineItemSubtotal,
// //            lineItemTax: item.priceDetails.lineItemTax,
// //            lineItemTotal: item.priceDetails.lineItemTotal,
// //         },
// //         // Store product specific data used in calculation for reference in order history
// //         productSnapshot: {
// //             priceUnit: item.productData.priceUnit,
// //             taxRate: item.productData.taxRate,
// //         }
// //       })),
// //       // Store calculated totals directly on the order document
// //       orderSubtotal: cartSubtotal, // Sum of all item lineItemSubtotal
// //       orderTax: cartTotalTax,       // Sum of all item lineItemTax
// //       totalAmount: cartGrandTotal,  // Grand Total (orderSubtotal + orderTax)
// //       shippingAddress: shippingInfo, // User-provided shipping details
// //       orderDate: Timestamp.fromDate(new Date()), // Server timestamp for order placement time
// //       status: "Placed", // Initial order status
// //     };

// //     try {
// //       // --- Use Firestore Transaction for Atomic Operation (Stock Update + Order Create) ---
// //       const newOrderId = await runTransaction(db, async (transaction) => {
// //         console.log("Starting stock update transaction...");
// //         const productUpdates = []; // Array to hold Firestore update operations

// //         // 1. Read current stock and validate for all items within the transaction
// //         for (const item of cartItems) {
// //             const productRef = doc(db, 'products', item.productId); // Reference to the product document
// //             const productSnap = await transaction.get(productRef); // Read product data within transaction
// //             if (!productSnap.exists()) {
// //                 // If product doesn't exist, fail the transaction
// //                 throw new Error(`Product "${item.title}" (ID: ${item.productId}) not found.`);
// //             }

// //             const productData = productSnap.data();
// //             const allowBackorder = productData.allowBackorders === true; // Check if backorders are allowed

// //             // Handle stock update based on whether it's a variant or simple product
// //             if (item.variant) {
// //                 // --- Variant Stock Update Logic ---
// //                 const variantIndex = productData.variants?.findIndex(v =>
// //                     // Compare variant options reliably
// //                     JSON.stringify(v.options) === JSON.stringify(item.variant.options)
// //                 );

// //                 // If the specific variant isn't found in the product data, fail transaction
// //                 if (variantIndex === undefined || variantIndex === -1) {
// //                     throw new Error(`Selected variant for "${item.title}" could not be found in product data.`);
// //                 }

// //                 const currentVariant = productData.variants[variantIndex];
// //                 // Use variant's stock status, fallback to product's if variant status is undefined
// //                 const currentInStock = currentVariant.inStock !== undefined ? currentVariant.inStock : productData.inStock;
// //                 const currentQuantity = currentVariant.quantity || 0; // Default to 0 if quantity field is missing

// //                 // Check stock availability (unless backorders are allowed)
// //                 if (!currentInStock && !allowBackorder) {
// //                     throw new Error(`Variant ${Object.values(item.variant.options).join('/')} for "${item.title}" is out of stock.`);
// //                 }
// //                 if (!allowBackorder && currentQuantity < item.quantity) {
// //                     throw new Error(`Not enough stock for variant ${Object.values(item.variant.options).join('/')} of "${item.title}". Available: ${currentQuantity}, Requested: ${item.quantity}`);
// //                 }

// //                 // Prepare the update for the variants array
// //                 const updatedVariants = [...productData.variants]; // Create a mutable copy
// //                 const newQuantity = currentQuantity - item.quantity; // Calculate new quantity
// //                 // Update the specific variant in the copied array
// //                 updatedVariants[variantIndex] = {
// //                     ...currentVariant,
// //                     quantity: newQuantity,
// //                     // Update inStock status based on new quantity, unless backorders allowed
// //                     inStock: allowBackorder ? currentVariant.inStock : newQuantity > 0,
// //                 };
// //                 // Add the update operation to the list (updates the entire variants array)
// //                 productUpdates.push({ ref: productRef, data: { variants: updatedVariants } });

// //             } else {
// //                 // --- Simple Product Stock Update Logic ---
// //                 const currentInStock = productData.inStock;
// //                 const currentQuantity = productData.availableQuantity || 0; // Default to 0

// //                 // Check stock availability (unless backorders are allowed)
// //                 if (!currentInStock && !allowBackorder) {
// //                     throw new Error(`Product "${item.title}" is out of stock.`);
// //                 }
// //                 if (!allowBackorder && currentQuantity < item.quantity) {
// //                     throw new Error(`Not enough stock for "${item.title}". Available: ${currentQuantity}, Requested: ${item.quantity}`);
// //                 }

// //                 const newQuantity = currentQuantity - item.quantity; // Calculate new quantity
// //                 // Add the update operation to the list (updates specific fields)
// //                 productUpdates.push({ ref: productRef, data: {
// //                     availableQuantity: newQuantity,
// //                     // Update inStock status based on new quantity, unless backorders allowed
// //                     inStock: allowBackorder ? productData.inStock : newQuantity > 0,
// //                 }});
// //             }
// //         } // End loop through cart items

// //         // 2. Perform all collected stock updates within the transaction
// //         console.log(`Applying ${productUpdates.length} stock updates...`);
// //         productUpdates.forEach(update => {
// //           transaction.update(update.ref, update.data);
// //         });

// //         // --- 3. Create the order document IN THE CATALOGUE'S SUBCOLLECTION ---
// //         console.log(`Creating order document in catalogues/${catalogueId}/orders...`);
// //         // Generate a new document reference within the specific subcollection
// //         const newOrderRef = doc(collection(db, 'catalogues', catalogueId, 'orders'));
// //         // Set the data for the new order document within the transaction
// //         transaction.set(newOrderRef, orderData); // Use the prepared orderData

// //         return newOrderRef.id; // Return the generated order ID
// //       }); // --- End Firestore Transaction ---

// //       // --- Transaction Successful ---
// //       console.log(`Transaction completed successfully. Order ID: ${newOrderId}`);
// //       toast({
// //         title: "Order placed successfully!",
// //         description: `Thank you for your purchase. Your Order ID is ${newOrderId}`,
// //         status: "success",
// //         duration: 6000, // Slightly longer duration to show ID
// //         isClosable: true,
// //         position: "top"
// //       });
// //       clearCart(); // Clear the cart from context and localStorage
// //       // Navigate to the specific order details page using the new route structure
// //       navigate(`/order-details/${catalogueId}/${newOrderId}`);

// //     } catch (error) {
// //       // --- Transaction Failed ---
// //       console.error("Transaction failed: ", error);
// //       // Set error state to display message to user
// //       setError(`Order placement failed: ${error.message}. Please check item availability or try again.`);
// //       // Show error toast
// //       toast({
// //         title: "Order Placement Failed",
// //         description: error.message || "Could not update stock or create order. Please try again.",
// //         status: "error",
// //         duration: 7000, // Longer duration for error messages
// //         isClosable: true,
// //         position: "top"
// //       });
// //     } finally {
// //       // Ensure submitting state is reset regardless of success or failure
// //       setIsSubmitting(false);
// //     }
// //   };

// //   // --- Render Logic ---

// //   // Show loading spinner if cart data is being loaded/calculated
// //   if (loadingProductData) {
// //       return <SpinnerComponent />;
// //   }

// //   // Show empty cart message if cart is empty after loading and not currently submitting
// //   if (cartItems.length === 0 && !isSubmitting) {
// //       return (
// //           <Container centerContent py={20}>
// //               <Heading size="md">Your cart is empty.</Heading>
// //               <Button mt={4} colorScheme="teal" onClick={() => navigate('/')}>
// //                   Continue Shopping
// //               </Button>
// //           </Container>
// //       );
// //   }

// //   // --- Main Checkout Page JSX ---
// //   return (
// //     <Container maxW="container.xl" py={10}>
// //       <Heading mb={6}>Checkout</Heading>

// //       {/* Display Transaction Error if any */}
// //       {error && (
// //         <Alert status="error" mb={6} borderRadius="md">
// //           <AlertIcon />
// //           <AlertTitle mr={2}>Order Error!</AlertTitle>
// //           <AlertDescription>{error}</AlertDescription>
// //         </Alert>
// //       )}

// //       <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
// //         {/* Shipping Information Form Column */}
// //         <Box>
// //           <Heading size="md" mb={4}>Shipping Information</Heading>
// //           <form onSubmit={handlePlaceOrder}>
// //             <VStack spacing={4}>
// //               <FormControl isRequired id="name">
// //                 <FormLabel>Full Name</FormLabel>
// //                 <Input name="name" onChange={handleInputChange} value={shippingInfo.name} placeholder="Enter your full name" />
// //               </FormControl>
// //               <FormControl isRequired id="phone">
// //                 <FormLabel>Phone Number</FormLabel>
// //                 <Input name="phone" type="tel" onChange={handleInputChange} value={shippingInfo.phone} placeholder="Enter your phone number" />
// //               </FormControl>
// //               <FormControl isRequired id="address">
// //                 <FormLabel>Address</FormLabel>
// //                 <Input name="address" placeholder="Street address, Apt number, etc." onChange={handleInputChange} value={shippingInfo.address} />
// //               </FormControl>
// //               <FormControl isRequired id="city">
// //                 <FormLabel>City</FormLabel>
// //                 <Input name="city" onChange={handleInputChange} value={shippingInfo.city} placeholder="Enter your city" />
// //               </FormControl>
// //               <FormControl isRequired id="pincode">
// //                 <FormLabel>Pincode</FormLabel>
// //                 <Input name="pincode" onChange={handleInputChange} value={shippingInfo.pincode} placeholder="Enter your pincode" />
// //               </FormControl>
// //               <Button
// //                 type="submit"
// //                 colorScheme="teal"
// //                 size="lg"
// //                 w="full"
// //                 mt={4}
// //                 isLoading={isSubmitting} // Show loading spinner on button when processing
// //                 // Disable button if submitting, cart is empty, or cart data is loading
// //                 disabled={isSubmitting || cartItems.length === 0 || loadingProductData}
// //               >
// //                 Place Order & Pay (Simulation)
// //               </Button>
// //             </VStack>
// //           </form>
// //         </Box>

// //         {/* Order Summary Column */}
// //         <Box>
// //           <Heading size="md" mb={4}>Order Summary</Heading>
// //           <VStack spacing={4} align="stretch" p={5} borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
// //             {/* List items briefly */}
// //             {cartItems.map(item => (
// //               <HStack key={item.cartId} justifyContent="space-between" fontSize="sm">
// //                 <Text noOfLines={1} title={item.title} flex={1} mr={2}> {/* Add title for long names, limit lines */}
// //                   {item.title} {item.variant ? `(${Object.values(item.variant.options).join('/')})` : ''} x {item.quantity}
// //                 </Text>
// //                 <Text fontWeight="medium" whiteSpace="nowrap">{formatCurrency(item.priceDetails.lineItemTotal)}</Text>
// //               </HStack>
// //             ))}
// //             <Divider pt={2} />
// //             {/* Show Totals */}
// //             <VStack spacing={2} align="stretch" pt={2}>
// //                  <HStack justifyContent="space-between">
// //                      <Text color="gray.600">Subtotal (excl. tax)</Text>
// //                      <Text fontWeight="medium">{formatCurrency(cartSubtotal)}</Text>
// //                  </HStack>
// //                  <HStack justifyContent="space-between">
// //                      <Text color="gray.600">Taxes</Text>
// //                      <Text fontWeight="medium">{formatCurrency(cartTotalTax)}</Text>
// //                  </HStack>
// //                  {/* Placeholder for Shipping Costs */}
// //                  {/* <HStack justifyContent="space-between">
// //                      <Text color="gray.600">Shipping</Text>
// //                      <Text fontWeight="medium">{formatCurrency(0)}</Text>
// //                  </HStack> */}
// //                  <Divider />
// //                  <HStack justifyContent="space-between" pt={1}>
// //                      <Text fontWeight="bold" fontSize="lg">Grand Total</Text>
// //                      <Text fontWeight="bold" fontSize="lg" color="teal.600">{formatCurrency(cartGrandTotal)}</Text>
// //                  </HStack>
// //             </VStack>
// //           </VStack>
// //         </Box>
// //       </SimpleGrid>
// //     </Container>
// //   );
// // };

// // export default CheckoutPage;

// import React, { useState } from "react";
// import {
//   Container,
//   Heading,
//   VStack,
//   FormControl,
//   FormLabel,
//   Input,
//   Button,
//   Box,
//   Text,
//   useToast,
//   SimpleGrid,
//   Divider,
//   Alert,
//   AlertIcon,
//   AlertTitle,
//   AlertDescription,
//   Spinner,
//   Center,
//   HStack,
//   Radio,
//   RadioGroup,
//   Stack,
//   Badge,
// } from "@chakra-ui/react";
// import { useAuth } from "../context/AuthContext";
// import { useCart } from "../context/CartContext";
// import { useNavigate } from "react-router-dom";
// import { collection, Timestamp, runTransaction, doc } from "firebase/firestore";
// import { db } from "../firebase";
// import SpinnerComponent from "../components/Spinner";

// // Helper to format currency
// const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

// const CheckoutPage = () => {
//   const { currentUser } = useAuth();
//   // Get detailed totals and items from context (these are always calculated WITH tax by default)
//   const {
//     cartItems,
//     cartSubtotal,
//     cartTotalTax,
//     cartGrandTotal,
//     clearCart,
//     itemCount,
//     loadingProductData,
//   } = useCart();
//   const navigate = useNavigate();
//   const toast = useToast();

//   const [shippingInfo, setShippingInfo] = useState({
//     name: "",
//     address: "",
//     city: "",
//     pincode: "",
//     phone: "",
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState(null);

//   // --- NEW STATE: Billing Mode ---
//   // Default to 'withBill' (Tax included)
//   const [billingMode, setBillingMode] = useState("withBill");

//   // --- Dynamic Calculation Logic ---
//   // If 'withoutBill', Tax is 0 and Grand Total equals Subtotal.
//   const displayTax = billingMode === "withBill" ? cartTotalTax : 0;
//   const displayGrandTotal =
//     billingMode === "withBill" ? cartGrandTotal : cartSubtotal;

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setShippingInfo((prev) => ({ ...prev, [name]: value }));
//   };

//   const handlePlaceOrder = async (e) => {
//     e.preventDefault();
//     setError(null);

//     // --- Validations ---
//     if (!currentUser) {
//       toast({
//         title: "You must be logged in.",
//         status: "error",
//         duration: 3000,
//         isClosable: true,
//       });
//       return;
//     }

//     if (
//       cartItems.length === 0 ||
//       !cartItems[0]?.productData?.catalogueId ||
//       !cartItems[0]?.productData?.sellerId
//     ) {
//       toast({
//         title: "Invalid Cart",
//         description: "Cart is empty or missing catalogue data.",
//         status: "warning",
//         duration: 3000,
//         isClosable: true,
//       });
//       return;
//     }

//     setIsSubmitting(true);

//     const catalogueId = cartItems[0].productData.catalogueId;
//     const sellerId = cartItems[0].productData.sellerId;

//     if (!catalogueId || !sellerId) {
//       setError("Critical Error: Catalogue or Seller ID is missing.");
//       setIsSubmitting(false);
//       return;
//     }

//     // --- Prepare Order Data ---
//     const orderData = {
//       userId: currentUser.uid,
//       catalogueId: catalogueId,
//       sellerId: sellerId,
//       billingType: billingMode, // Save the user's choice ('withBill' or 'withoutBill')

//       // Store Items with Modified Prices based on Billing Mode
//       items: cartItems.map((item) => {
//         const details = item.priceDetails;

//         // If without bill, we need to strip the tax components from the saved data
//         // so the order history makes sense later.
//         const adjustedDetails =
//           billingMode === "withBill"
//             ? details
//             : {
//                 ...details,
//                 taxAmountUnit: 0,
//                 finalUnitPriceWithTax: details.effectiveUnitPricePreTax, // Unit price becomes pre-tax price
//                 lineItemTax: 0,
//                 lineItemTotal: details.lineItemSubtotal, // Total becomes subtotal
//               };

//         return {
//           productId: item.productId,
//           title: item.title,
//           quantity: item.quantity,
//           imageUrl: item.imageUrl,
//           variant: item.variant
//             ? {
//                 options: item.variant.options,
//                 skuOverride: item.variant.skuOverride,
//                 imageUrl: item.variant.imageUrl,
//               }
//             : null,
//           // Save the adjusted prices
//           priceDetails: {
//             baseUnitPrice: adjustedDetails.baseUnitPrice,
//             discountAmountUnit: adjustedDetails.discountAmountUnit,
//             bulkDiscountAmountUnit: adjustedDetails.bulkDiscountAmountUnit,
//             variantModifierUnit: adjustedDetails.variantModifierUnit,
//             effectiveUnitPricePreTax: adjustedDetails.effectiveUnitPricePreTax,
//             taxAmountUnit: adjustedDetails.taxAmountUnit,
//             finalUnitPriceWithTax: adjustedDetails.finalUnitPriceWithTax,
//             lineItemSubtotal: adjustedDetails.lineItemSubtotal,
//             lineItemTax: adjustedDetails.lineItemTax,
//             lineItemTotal: adjustedDetails.lineItemTotal,
//           },
//           productSnapshot: {
//             priceUnit: item.productData.priceUnit,
//             taxRate: billingMode === "withBill" ? item.productData.taxRate : 0, // Set tax rate to 0 in snapshot if no bill
//           },
//         };
//       }),

//       // Store calculated totals
//       orderSubtotal: cartSubtotal, // Always the same base value
//       orderTax: displayTax, // 0 if without bill
//       totalAmount: displayGrandTotal, // Adjusted grand total
//       shippingAddress: shippingInfo,
//       orderDate: Timestamp.fromDate(new Date()),
//       status: "Placed",
//     };

//     try {
//       // --- Firestore Transaction ---
//       const newOrderId = await runTransaction(db, async (transaction) => {
//         const productUpdates = [];

//         // 1. Stock Validation (Unchanged)
//         for (const item of cartItems) {
//           const productRef = doc(db, "products", item.productId);
//           const productSnap = await transaction.get(productRef);
//           if (!productSnap.exists())
//             throw new Error(`Product "${item.title}" not found.`);

//           const productData = productSnap.data();
//           const allowBackorder = productData.allowBackorders === true;

//           if (item.variant) {
//             const variantIndex = productData.variants?.findIndex(
//               (v) =>
//                 JSON.stringify(v.options) ===
//                 JSON.stringify(item.variant.options)
//             );
//             if (variantIndex === -1 || variantIndex === undefined)
//               throw new Error(`Variant not found for "${item.title}".`);

//             const currentVariant = productData.variants[variantIndex];
//             const currentInStock =
//               currentVariant.inStock !== undefined
//                 ? currentVariant.inStock
//                 : productData.inStock;
//             const currentQuantity = currentVariant.quantity || 0;

//             if (!currentInStock && !allowBackorder)
//               throw new Error(`Variant for "${item.title}" is out of stock.`);
//             if (!allowBackorder && currentQuantity < item.quantity)
//               throw new Error(`Insufficient stock for "${item.title}".`);

//             const updatedVariants = [...productData.variants];
//             const newQuantity = currentQuantity - item.quantity;
//             updatedVariants[variantIndex] = {
//               ...currentVariant,
//               quantity: newQuantity,
//               inStock: allowBackorder
//                 ? currentVariant.inStock
//                 : newQuantity > 0,
//             };
//             productUpdates.push({
//               ref: productRef,
//               data: { variants: updatedVariants },
//             });
//           } else {
//             const currentInStock = productData.inStock;
//             const currentQuantity = productData.availableQuantity || 0;

//             if (!currentInStock && !allowBackorder)
//               throw new Error(`Product "${item.title}" is out of stock.`);
//             if (!allowBackorder && currentQuantity < item.quantity)
//               throw new Error(`Insufficient stock for "${item.title}".`);

//             const newQuantity = currentQuantity - item.quantity;
//             productUpdates.push({
//               ref: productRef,
//               data: {
//                 availableQuantity: newQuantity,
//                 inStock: allowBackorder ? productData.inStock : newQuantity > 0,
//               },
//             });
//           }
//         }

//         // 2. Apply Stock Updates
//         productUpdates.forEach((update) =>
//           transaction.update(update.ref, update.data)
//         );

//         // 3. Create Order
//         const newOrderRef = doc(
//           collection(db, "catalogues", catalogueId, "orders")
//         );
//         transaction.set(newOrderRef, orderData);

//         return newOrderRef.id;
//       });

//       // --- Success ---
//       toast({
//         title: "Order placed successfully!",
//         description: `Order ID: ${newOrderId}`,
//         status: "success",
//         duration: 5000,
//         isClosable: true,
//         position: "top",
//       });
//       clearCart();
//       navigate(`/order-details/${catalogueId}/${newOrderId}`);
//     } catch (error) {
//       console.error("Transaction failed: ", error);
//       setError(`Order failed: ${error.message}`);
//       toast({
//         title: "Error",
//         description: error.message,
//         status: "error",
//         position: "top",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (loadingProductData) return <SpinnerComponent />;
//   if (cartItems.length === 0 && !isSubmitting) {
//     return (
//       <Container centerContent py={20}>
//         <Heading size="md">Your cart is empty.</Heading>
//         <Button mt={4} colorScheme="teal" onClick={() => navigate("/")}>
//           Continue Shopping
//         </Button>
//       </Container>
//     );
//   }

//   return (
//     <Container maxW="container.xl" py={10}>
//       <Heading mb={6}>Checkout</Heading>

//       {error && (
//         <Alert status="error" mb={6} borderRadius="md">
//           <AlertIcon />
//           <AlertTitle mr={2}>Order Error!</AlertTitle>
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       )}

//       <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
//         {/* --- LEFT COLUMN: Billing Options & Shipping --- */}
//         <Box>
//           {/* --- NEW: Billing Type Selection --- */}
//           <Box
//             mb={8}
//             p={5}
//             borderWidth="1px"
//             borderRadius="lg"
//             borderColor="blue.200"
//             bg="blue.50"
//             shadow="sm"
//           >
//             <Heading size="sm" mb={4} color="blue.800">
//               1. Choose Billing Type
//             </Heading>
//             <RadioGroup onChange={setBillingMode} value={billingMode}>
//               <Stack direction={{ base: "column", sm: "row" }} spacing={5}>
//                 <Radio value="withBill" colorScheme="blue" size="lg" bg="white">
//                   <Box>
//                     <Text fontWeight="bold">With Bill</Text>
//                     <Text fontSize="xs" color="gray.600">
//                       Includes Taxes
//                     </Text>
//                   </Box>
//                 </Radio>
//                 <Radio
//                   value="withoutBill"
//                   colorScheme="blue"
//                   size="lg"
//                   bg="white"
//                 >
//                   <Box>
//                     <Text fontWeight="bold">Without Bill</Text>
//                     <Text fontSize="xs" color="gray.600">
//                       Tax Excluded
//                     </Text>
//                   </Box>
//                 </Radio>
//               </Stack>
//             </RadioGroup>
//           </Box>

//           <Heading size="md" mb={4}>
//             2. Shipping Information
//           </Heading>
//           <form onSubmit={handlePlaceOrder}>
//             <VStack spacing={4}>
//               <FormControl isRequired id="name">
//                 <FormLabel>Full Name</FormLabel>
//                 <Input
//                   name="name"
//                   bg="white"
//                   onChange={handleInputChange}
//                   value={shippingInfo.name}
//                 />
//               </FormControl>
//               <FormControl isRequired id="phone">
//                 <FormLabel>Phone Number</FormLabel>
//                 <Input
//                   name="phone"
//                   type="tel"
//                   bg="white"
//                   onChange={handleInputChange}
//                   value={shippingInfo.phone}
//                 />
//               </FormControl>
//               <FormControl isRequired id="address">
//                 <FormLabel>Address</FormLabel>
//                 <Input
//                   name="address"
//                   bg="white"
//                   onChange={handleInputChange}
//                   value={shippingInfo.address}
//                 />
//               </FormControl>
//               <HStack w="full">
//                 <FormControl isRequired id="city">
//                   <FormLabel>City</FormLabel>
//                   <Input
//                     name="city"
//                     bg="white"
//                     onChange={handleInputChange}
//                     value={shippingInfo.city}
//                   />
//                 </FormControl>
//                 <FormControl isRequired id="pincode">
//                   <FormLabel>Pincode</FormLabel>
//                   <Input
//                     name="pincode"
//                     bg="white"
//                     onChange={handleInputChange}
//                     value={shippingInfo.pincode}
//                   />
//                 </FormControl>
//               </HStack>

//               {/* Submit Button placed inside form for accessibility/Enter key support */}
//               <Button
//                 type="submit"
//                 colorScheme="teal"
//                 size="lg"
//                 w="full"
//                 mt={6}
//                 isLoading={isSubmitting}
//                 loadingText="Processing Order"
//                 disabled={
//                   isSubmitting || cartItems.length === 0 || loadingProductData
//                 }
//               >
//                 Place Order - {formatCurrency(displayGrandTotal)}
//               </Button>
//             </VStack>
//           </form>
//         </Box>

//         {/* --- RIGHT COLUMN: Order Summary --- */}
//         <Box>
//           <Heading size="md" mb={4}>
//             Order Summary
//           </Heading>
//           <VStack
//             spacing={4}
//             align="stretch"
//             p={6}
//             borderWidth="1px"
//             borderColor="gray.200"
//             borderRadius="lg"
//             bg="gray.50"
//             shadow="sm"
//           >
//             {/* List items */}
//             <VStack spacing={3} align="stretch" divider={<Divider />}>
//               {cartItems.map((item) => {
//                 // Determine line total to display based on billing mode
//                 const lineTotal =
//                   billingMode === "withBill"
//                     ? item.priceDetails.lineItemTotal
//                     : item.priceDetails.lineItemSubtotal;

//                 return (
//                   <HStack
//                     key={item.cartId}
//                     justifyContent="space-between"
//                     fontSize="sm"
//                     align="start"
//                   >
//                     <Box flex={1}>
//                       <Text fontWeight="semibold" noOfLines={2}>
//                         {item.title}
//                       </Text>
//                       <Text fontSize="xs" color="gray.500">
//                         {item.variant
//                           ? `${Object.values(item.variant.options).join("/")}`
//                           : ""}
//                         {item.variant ? " • " : ""}
//                         Qty: {item.quantity}
//                       </Text>
//                     </Box>
//                     <Text fontWeight="bold" whiteSpace="nowrap">
//                       {formatCurrency(lineTotal)}
//                     </Text>
//                   </HStack>
//                 );
//               })}
//             </VStack>

//             <Divider borderColor="gray.300" />

//             {/* Show Totals (Dynamic based on billing mode) */}
//             <VStack spacing={2} align="stretch">
//               <HStack justifyContent="space-between">
//                 <Text color="gray.600">Subtotal (excl. tax)</Text>
//                 <Text fontWeight="medium">{formatCurrency(cartSubtotal)}</Text>
//               </HStack>

//               <HStack justifyContent="space-between">
//                 <Text
//                   color={billingMode === "withBill" ? "gray.600" : "gray.400"}
//                 >
//                   Taxes{" "}
//                   {billingMode === "withoutBill" && (
//                     <Badge ml={2}>Excluded</Badge>
//                   )}
//                 </Text>
//                 <Text
//                   fontWeight="medium"
//                   color={billingMode === "withBill" ? "black" : "gray.400"}
//                   textDecoration={
//                     billingMode === "withoutBill" ? "line-through" : "none"
//                   }
//                 >
//                   {formatCurrency(cartTotalTax)}
//                 </Text>
//               </HStack>

//               <Divider borderColor="gray.300" />

//               <HStack justifyContent="space-between" pt={1}>
//                 <Text fontWeight="bold" fontSize="xl">
//                   Grand Total
//                 </Text>
//                 <Text fontWeight="bold" fontSize="xl" color="teal.600">
//                   {formatCurrency(displayGrandTotal)}
//                 </Text>
//               </HStack>
//             </VStack>
//           </VStack>
//         </Box>
//       </SimpleGrid>
//     </Container>
//   );
// };

// export default CheckoutPage;




import React, { useState, useEffect } from 'react';
import {
  Container, Heading, VStack, FormControl, FormLabel, Input, Button,
  Box, Text, useToast, SimpleGrid, Divider, Alert, AlertIcon,
  AlertTitle, AlertDescription, Spinner, Center, HStack, Radio, RadioGroup, Stack, Badge
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { collection, Timestamp, runTransaction, doc } from 'firebase/firestore';
import { db } from '../firebase';
import SpinnerComponent from '../components/Spinner';

const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

const CheckoutPage = () => {
  const { currentUser } = useAuth();
  const { cartItems, cartSubtotal, cartTotalTax, cartGrandTotal, clearCart, itemCount, loadingProductData } = useCart();
  const navigate = useNavigate();
  const toast = useToast();

  const [shippingInfo, setShippingInfo] = useState({
    name: '', address: '', city: '', pincode: '', phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [billingMode, setBillingMode] = useState('withBill');

  // --- RESTORE SHIPPING INFO ON LOAD ---
  useEffect(() => {
    if (currentUser) {
        try {
            const savedInfo = localStorage.getItem(`shipping_${currentUser.uid}`);
            if (savedInfo) {
                setShippingInfo(JSON.parse(savedInfo));
            }
        } catch (e) { console.error("Error loading saved shipping info", e); }
    }
  }, [currentUser]);

  // Derived values
  const displayTax = billingMode === 'withBill' ? cartTotalTax : 0;
  const displayGrandTotal = billingMode === 'withBill' ? cartGrandTotal : cartSubtotal;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newInfo = { ...shippingInfo, [name]: value };
    setShippingInfo(newInfo);
    // --- SAVE SHIPPING INFO ON CHANGE ---
    if (currentUser) {
        localStorage.setItem(`shipping_${currentUser.uid}`, JSON.stringify(newInfo));
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      toast({ title: "You must be logged in.", status: "error", duration: 3000, isClosable: true });
      return;
    }
    
    if (cartItems.length === 0 || !cartItems[0]?.productData?.catalogueId || !cartItems[0]?.productData?.sellerId) {
      toast({ title: "Invalid Cart", description: "Cart is empty or missing catalogue data.", status: "warning", duration: 3000, isClosable: true });
      return;
    }

    setIsSubmitting(true);

    const catalogueId = cartItems[0].productData.catalogueId;
    const sellerId = cartItems[0].productData.sellerId;

    if (!catalogueId || !sellerId) {
        setError("Critical Error: Catalogue or Seller ID is missing.");
        setIsSubmitting(false);
        return;
    }

    const orderData = {
      userId: currentUser.uid,
      catalogueId: catalogueId,
      sellerId: sellerId,
      billingType: billingMode,
      items: cartItems.map(item => {
        const details = item.priceDetails;
        const adjustedDetails = billingMode === 'withBill' ? details : {
            ...details,
            taxAmountUnit: 0,
            finalUnitPriceWithTax: details.effectiveUnitPricePreTax,
            lineItemTax: 0,
            lineItemTotal: details.lineItemSubtotal
        };

        return {
            productId: item.productId,
            title: item.title,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
            variant: item.variant ? {
              options: item.variant.options,
              skuOverride: item.variant.skuOverride,
              imageUrl: item.variant.imageUrl,
            } : null,
            priceDetails: {
                baseUnitPrice: adjustedDetails.baseUnitPrice,
                discountAmountUnit: adjustedDetails.discountAmountUnit,
                bulkDiscountAmountUnit: adjustedDetails.bulkDiscountAmountUnit,
                variantModifierUnit: adjustedDetails.variantModifierUnit,
                effectiveUnitPricePreTax: adjustedDetails.effectiveUnitPricePreTax,
                taxAmountUnit: adjustedDetails.taxAmountUnit,
                finalUnitPriceWithTax: adjustedDetails.finalUnitPriceWithTax,
                lineItemSubtotal: adjustedDetails.lineItemSubtotal,
                lineItemTax: adjustedDetails.lineItemTax,
                lineItemTotal: adjustedDetails.lineItemTotal,
            },
            productSnapshot: {
                priceUnit: item.productData.priceUnit,
                taxRate: billingMode === 'withBill' ? item.productData.taxRate : 0,
            }
        };
      }),
      orderSubtotal: cartSubtotal,
      orderTax: displayTax,
      totalAmount: displayGrandTotal,
      shippingAddress: shippingInfo,
      orderDate: Timestamp.fromDate(new Date()),
      status: "Placed",
    };

    try {
      const newOrderId = await runTransaction(db, async (transaction) => {
        const productUpdates = [];

        for (const item of cartItems) {
            const productRef = doc(db, 'products', item.productId);
            const productSnap = await transaction.get(productRef);
            if (!productSnap.exists()) throw new Error(`Product "${item.title}" not found.`);

            const productData = productSnap.data();
            const allowBackorder = productData.allowBackorders === true;

            if (item.variant) {
                const variantIndex = productData.variants?.findIndex(v => JSON.stringify(v.options) === JSON.stringify(item.variant.options));
                if (variantIndex === -1 || variantIndex === undefined) throw new Error(`Variant not found for "${item.title}".`);
                
                const currentVariant = productData.variants[variantIndex];
                const currentInStock = currentVariant.inStock !== undefined ? currentVariant.inStock : productData.inStock;
                const currentQuantity = currentVariant.quantity || 0;

                if (!currentInStock && !allowBackorder) throw new Error(`Variant for "${item.title}" is out of stock.`);
                if (!allowBackorder && currentQuantity < item.quantity) throw new Error(`Insufficient stock for "${item.title}".`);

                const updatedVariants = [...productData.variants];
                const newQuantity = currentQuantity - item.quantity;
                updatedVariants[variantIndex] = { ...currentVariant, quantity: newQuantity, inStock: allowBackorder ? currentVariant.inStock : newQuantity > 0 };
                productUpdates.push({ ref: productRef, data: { variants: updatedVariants } });

            } else {
                const currentInStock = productData.inStock;
                const currentQuantity = productData.availableQuantity || 0;

                if (!currentInStock && !allowBackorder) throw new Error(`Product "${item.title}" is out of stock.`);
                if (!allowBackorder && currentQuantity < item.quantity) throw new Error(`Insufficient stock for "${item.title}".`);

                const newQuantity = currentQuantity - item.quantity;
                productUpdates.push({ ref: productRef, data: { availableQuantity: newQuantity, inStock: allowBackorder ? productData.inStock : newQuantity > 0 }});
            }
        }

        productUpdates.forEach(update => transaction.update(update.ref, update.data));
        const newOrderRef = doc(collection(db, 'catalogues', catalogueId, 'orders'));
        transaction.set(newOrderRef, orderData);
        return newOrderRef.id;
      });

      toast({
        title: "Order placed successfully!",
        description: `Order ID: ${newOrderId}`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
      clearCart(); // This clears the cart state AND specific user storage
      navigate(`/order-details/${catalogueId}/${newOrderId}`);

    } catch (error) {
      console.error("Transaction failed: ", error);
      setError(`Order failed: ${error.message}`);
      toast({ title: "Error", description: error.message, status: "error", position: "top" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingProductData) return <SpinnerComponent />;
  if (cartItems.length === 0 && !isSubmitting) {
      return (
          <Container centerContent py={20}>
              <Heading size="md">Your cart is empty.</Heading>
              <Button mt={4} colorScheme="teal" onClick={() => navigate('/')}>Continue Shopping</Button>
          </Container>
      );
  }

  return (
    <Container maxW="container.xl" py={10}>
      <Heading mb={6}>Checkout</Heading>

      {error && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon />
          <AlertTitle mr={2}>Order Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
        <Box>
          <Box mb={8} p={5} borderWidth="1px" borderRadius="lg" borderColor="blue.200" bg="blue.50" shadow="sm">
            <Heading size="sm" mb={4} color="blue.800">1. Choose Billing Type</Heading>
            <RadioGroup onChange={setBillingMode} value={billingMode}>
                <Stack direction={{ base: 'column', sm: 'row' }} spacing={5}>
                    <Radio value='withBill' colorScheme='blue' size="lg" bg="white"><Box><Text fontWeight="bold">With Bill</Text><Text fontSize="xs" color="gray.600">Includes Taxes</Text></Box></Radio>
                    <Radio value='withoutBill' colorScheme='blue' size="lg" bg="white"><Box><Text fontWeight="bold">Without Bill</Text><Text fontSize="xs" color="gray.600">Tax Excluded</Text></Box></Radio>
                </Stack>
            </RadioGroup>
          </Box>

          <Heading size="md" mb={4}>2. Shipping Information</Heading>
          <form onSubmit={handlePlaceOrder}>
            <VStack spacing={4}>
              <FormControl isRequired id="name"><FormLabel>Full Name</FormLabel><Input name="name" bg="white" onChange={handleInputChange} value={shippingInfo.name} /></FormControl>
              <FormControl isRequired id="phone"><FormLabel>Phone Number</FormLabel><Input name="phone" type="tel" bg="white" onChange={handleInputChange} value={shippingInfo.phone} /></FormControl>
              <FormControl isRequired id="address"><FormLabel>Address</FormLabel><Input name="address" bg="white" onChange={handleInputChange} value={shippingInfo.address} /></FormControl>
              <HStack w="full">
                <FormControl isRequired id="city"><FormLabel>City</FormLabel><Input name="city" bg="white" onChange={handleInputChange} value={shippingInfo.city} /></FormControl>
                <FormControl isRequired id="pincode"><FormLabel>Pincode</FormLabel><Input name="pincode" bg="white" onChange={handleInputChange} value={shippingInfo.pincode} /></FormControl>
              </HStack>
              <Button type="submit" colorScheme="teal" size="lg" w="full" mt={6} isLoading={isSubmitting} loadingText="Processing Order" disabled={isSubmitting || cartItems.length === 0 || loadingProductData}>
                Place Order - {formatCurrency(displayGrandTotal)}
              </Button>
            </VStack>
          </form>
        </Box>

        <Box>
          <Heading size="md" mb={4}>Order Summary</Heading>
          <VStack spacing={4} align="stretch" p={6} borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="gray.50" shadow="sm">
            <VStack spacing={3} align="stretch" divider={<Divider />}>
                {cartItems.map(item => {
                    const lineTotal = billingMode === 'withBill' ? item.priceDetails.lineItemTotal : item.priceDetails.lineItemSubtotal;
                    return (
                        <HStack key={item.cartId} justifyContent="space-between" fontSize="sm" align="start">
                            <Box flex={1}>
                                <Text fontWeight="semibold" noOfLines={2}>{item.title}</Text>
                                <Text fontSize="xs" color="gray.500">{item.variant ? `${Object.values(item.variant.options).join('/')}` : ''} {item.variant ? ' • ' : ''} Qty: {item.quantity}</Text>
                            </Box>
                            <Text fontWeight="bold" whiteSpace="nowrap">{formatCurrency(lineTotal)}</Text>
                        </HStack>
                    );
                })}
            </VStack>
            <Divider borderColor="gray.300" />
            <VStack spacing={2} align="stretch">
                 <HStack justifyContent="space-between"><Text color="gray.600">Subtotal (excl. tax)</Text><Text fontWeight="medium">{formatCurrency(cartSubtotal)}</Text></HStack>
                 <HStack justifyContent="space-between">
                     <Text color={billingMode === 'withBill' ? "gray.600" : "gray.400"}>Taxes {billingMode === 'withoutBill' && <Badge ml={2}>Excluded</Badge>}</Text>
                     <Text fontWeight="medium" color={billingMode === 'withBill' ? "black" : "gray.400"} textDecoration={billingMode === 'withoutBill' ? 'line-through' : 'none'}>{formatCurrency(cartTotalTax)}</Text>
                 </HStack>
                 <Divider borderColor="gray.300" />
                 <HStack justifyContent="space-between" pt={1}><Text fontWeight="bold" fontSize="xl">Grand Total</Text><Text fontWeight="bold" fontSize="xl" color="teal.600">{formatCurrency(displayGrandTotal)}</Text></HStack>
            </VStack>
          </VStack>
        </Box>
      </SimpleGrid>
    </Container>
  );
};

export default CheckoutPage;