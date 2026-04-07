const { getAdmin, getDb } = require('../utils/firebaseAdmin');
const { buildError } = require('../constants/paymentErrors');

const admin = getAdmin();
const db = getDb();

async function auth(req, _res, next) {
  try {
    const header = String(req.headers.authorization || '');
    if (!header.startsWith('Bearer ')) {
      throw buildError('UNAUTHORIZED');
    }

    const token = header.slice(7).trim();
    const decoded = await admin.auth().verifyIdToken(token);

    const userRef = db.collection('users').doc(decoded.uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? (userSnap.data() || {}) : {};

    req.auth = {
      uid: decoded.uid,
      email: decoded.email || null,
      role: decoded.role || decoded.userType || userData.userType || null,
      userType: userData.userType || decoded.userType || null,
      claims: decoded,
      profile: userData,
    };

    next();
  } catch (error) {
    next(error.httpStatus ? error : buildError('UNAUTHORIZED'));
  }
}

module.exports = auth;
