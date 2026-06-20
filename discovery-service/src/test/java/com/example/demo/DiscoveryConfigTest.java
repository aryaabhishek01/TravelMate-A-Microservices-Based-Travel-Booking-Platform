package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

@SpringBootTest
class DiscoveryConfigTest {

    @Value("${server.port}")
    private int port;

    @Value("${eureka.client.register-with-eureka}")
    private boolean registerWithEureka;

    @Test
    void testEurekaConfigurationProperties() {
        assertEquals(8761, port, "Server port should be 8761");
        assertFalse(registerWithEureka, "Eureka Server should not register with itself");
    }
}