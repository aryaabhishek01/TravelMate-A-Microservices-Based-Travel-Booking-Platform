package com.example.demo.service;

import com.razorpay.*;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentService {

    @Value("${razorpay.key}")
    private String key;

    @Value("${razorpay.secret}")
    private String secret;

    /**
     * Creates a Razorpay order and returns it as a Map so the controller
     * can serialize it as proper JSON (not a raw string).
     */
    public Map<String, Object> createOrder(double amount) throws Exception {

        RazorpayClient client = new RazorpayClient(key, secret);

        JSONObject options = new JSONObject();
        options.put("amount", (long)(amount * 100)); // paise
        options.put("currency", "INR");
        options.put("receipt", "tm_txn_" + System.currentTimeMillis());

        Order order = client.orders.create(options);

        // Parse the Razorpay Order object into a plain Map so Jackson can
        // serialize it as JSON (the original .toString() was never JSON-ready)
        Map<String, Object> result = new HashMap<>();
        result.put("id", order.get("id").toString());
        result.put("amount", order.get("amount"));
        result.put("currency", order.get("currency").toString());
        result.put("receipt", order.get("receipt").toString());
        result.put("status", order.get("status").toString());

        return result;
    }

    public boolean verifyPayment(String orderId, String paymentId, String signature) {
        try {
            String generatedSignature =
                    com.razorpay.Utils.getHash(orderId + "|" + paymentId, secret);
            return generatedSignature.equals(signature);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}