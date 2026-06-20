import API from "./api";

/**
 * Creates a Razorpay order.
 * Backend now returns a proper JSON object (Map<String,Object>),
 * so res.data.id and res.data.amount are directly accessible.
 */
export const createOrder = async (amount) => {
  const res = await API.post(`/booking/create-order?amount=${amount}`);
  return res.data; // { id, amount, currency, receipt, status }
};

export const verifyPayment = async ({ orderId, paymentId, signature }) => {
  await API.post(
    `/booking/verify?orderId=${orderId}&paymentId=${paymentId}&signature=${signature}`
  );
};