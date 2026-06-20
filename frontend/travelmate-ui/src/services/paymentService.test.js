import { createOrder, verifyPayment } from "./paymentService";
import API from "./api";

jest.mock("./api", () => ({
  post: jest.fn()
}));

describe("paymentService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("createOrder should post to /booking/create-order with amount and return data", async () => {
    const mockData = { id: "order_123", amount: 5000 };
    API.post.mockResolvedValueOnce({ data: mockData });

    const result = await createOrder(5000);

    expect(API.post).toHaveBeenCalledWith("/booking/create-order?amount=5000");
    expect(result).toEqual(mockData);
  });

  test("verifyPayment should post to /booking/verify with correct params", async () => {
    API.post.mockResolvedValueOnce({});

    await verifyPayment({
      orderId: "order_123",
      paymentId: "pay_456",
      signature: "sig_789"
    });

    expect(API.post).toHaveBeenCalledWith(
      "/booking/verify?orderId=order_123&paymentId=pay_456&signature=sig_789"
    );
  });
});
