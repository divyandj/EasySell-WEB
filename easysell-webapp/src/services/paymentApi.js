import axios from 'axios';
import { API_BASE_URL } from '../config';

async function authHeaders(currentUser) {
  if (!currentUser) {
    throw new Error('Please sign in to continue.');
  }
  const token = await currentUser.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function createPaymentOrder(currentUser, payload) {
  const headers = await authHeaders(currentUser);
  const { data } = await axios.post(`${API_BASE_URL}/api/payment/orders`, payload, { headers });
  return data?.data || null;
}

export async function checkPaymentReadiness(currentUser, payload) {
  const headers = await authHeaders(currentUser);
  const { data } = await axios.post(`${API_BASE_URL}/api/payment/readiness`, payload, { headers });
  return data?.data || null;
}

export async function getPaymentStatus(currentUser, paymentOrderId) {
  const headers = await authHeaders(currentUser);
  const { data } = await axios.get(`${API_BASE_URL}/api/payment/orders/${paymentOrderId}/status`, { headers });
  return data?.data || null;
}

export async function submitPaymentUtr(currentUser, paymentOrderId, utrNumber, paymentProofUrl = null) {
  const headers = await authHeaders(currentUser);
  const { data } = await axios.post(
    `${API_BASE_URL}/api/payment/orders/${paymentOrderId}/submit-utr`,
    { utrNumber, paymentProofUrl },
    { headers }
  );
  return data?.data || null;
}

export async function correctPaymentUtr(currentUser, paymentOrderId, utrNumber) {
  const headers = await authHeaders(currentUser);
  const { data } = await axios.post(
    `${API_BASE_URL}/api/payment/orders/${paymentOrderId}/correct-utr`,
    { utrNumber },
    { headers }
  );
  return data?.data || null;
}

export async function cancelPaymentOrder(currentUser, paymentOrderId) {
  const headers = await authHeaders(currentUser);
  const { data } = await axios.post(
    `${API_BASE_URL}/api/payment/orders/${paymentOrderId}/cancel`,
    {},
    { headers }
  );
  return data?.data || null;
}

export async function checkBucketHealth(currentUser, paymentOrderId) {
  const headers = await authHeaders(currentUser);
  const { data } = await axios.get(
    `${API_BASE_URL}/api/payment/orders/${paymentOrderId}/bucket-health`,
    { headers }
  );
  return data?.data || null;
}

export function getPaymentApiErrorDetails(error) {
  const code = String(error?.response?.data?.code || '').trim();
  const message = String(
    error?.response?.data?.message ||
    error?.message ||
    'Payment setup failed. Please try again.'
  ).trim();

  return {
    code: code || 'PAYMENT_SETUP_FAILED',
    message,
  };
}
