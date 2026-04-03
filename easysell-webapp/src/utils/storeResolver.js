export const resolveStoreContext = () => {
  const host = window.location.hostname;
  const parts = host.split('.');

  // Local development fallback: handle.localhost
  // Example: my-store.localhost -> parts = ['my-store', 'localhost']
  if (host.includes('localhost') && parts.length >= 2 && parts[0] !== 'www') {
    return { type: 'subdomain', handle: parts[0] };
  }

  // Production subdomain parsing: handle.store.bydj.dev
  // store.bydj.dev root length is 3 parts. 
  // Any customer storefront domain will strictly have 4 parts, e.g ['divyan', 'store', 'bydj', 'dev']
  const rootDomain = parts.slice(-3).join('.'); // Select the final 3 clusters
  if (rootDomain === 'store.bydj.dev' && parts.length >= 4 && parts[0] !== 'www') {
    return { type: 'subdomain', handle: parts[0] };
  }

  // Custom Top Level Domains
  // Anything external that doesn't terminate identically as the recognized network domain
  if (!host.includes('localhost') && rootDomain !== 'store.bydj.dev') {
    // Allows completely arbitrary URLs securely via Firestore DB customDomain lookup matching
    return { type: 'customDomain', domain: host };
  }

  // Safety net returning main unkeyed platform index
  return { type: 'main' };
};
