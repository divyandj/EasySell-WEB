/**
 * Deploy Firestore rules and indexes using Firebase Admin SDK
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(
  __dirname,
  'easysell-hashu-firebase-adminsdk-fbsvc-bc4364e9c6.json'
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    projectId: 'easysell-hashu',
  });
}

async function deployRulesAndIndexes() {
  console.log('📤 Deploying Firestore rules and indexes...\n');

  const projectRoot = path.join(__dirname, '..');
  const rulesPath = path.join(projectRoot, 'firestore.rules');
  const indexesPath = path.join(projectRoot, 'firestore.indexes.json');

  try {
    // Read rules file
    if (!fs.existsSync(rulesPath)) {
      throw new Error(`Rules file not found: ${rulesPath}`);
    }
    const rulesContent = fs.readFileSync(rulesPath, 'utf-8');
    console.log(`✓ Read rules file (${rulesContent.length} bytes)`);

    // Read indexes file
    if (!fs.existsSync(indexesPath)) {
      throw new Error(`Indexes file not found: ${indexesPath}`);
    }
    const indexesContent = fs.readFileSync(indexesPath, 'utf-8');
    const indexes = JSON.parse(indexesContent);
    console.log(`✓ Read indexes file (${indexes.indexes.length} indexes)`);

    // Deploy rules
    console.log('\n🔐 Deploying security rules...');
    const firestoreAdmin = admin.firestore();
    
    // Note: Firebase Admin SDK doesn't have a direct method to deploy rules via Node.js
    // We need to use the REST API or gcloud CLI
    // Let's provide instructions for manual deployment instead
    
    console.log('\n⚠️  Firebase Admin SDK cannot directly deploy rules.');
    console.log('\n📋 Manual Deployment Instructions:');
    console.log('\n1. Login to Firebase Console:');
    console.log('   https://console.firebase.google.com/project/easysell-hashu/firestore');
    console.log('\n2. Go to Firestore → Rules');
    console.log('\n3. Copy-paste the contents of firestore.rules (attached below):');
    console.log('\n' + '='.repeat(60));
    console.log(rulesContent);
    console.log('='.repeat(60));
    
    console.log('\n4. Click "Publish"');
    
    console.log('\n5. For Indexes, go to Firestore → Indexes');
    console.log('\n6. Firestore will automatically create indexes as needed from queries');
    console.log('\n7. Alternatively, copy indexes from firestore.indexes.json');
    
    console.log('\n\n✅ Files ready for deployment:');
    console.log(`   - firestore.rules (${rulesContent.length} bytes)`);
    console.log(`   - firestore.indexes.json (${indexes.indexes.length} indexes)`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

deployRulesAndIndexes();
