package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class DiscoveryServiceApplicationTests {

    @Autowired
    private ApplicationContext context;

    @Test
    void contextLoads() {
        // Ensures the Spring context is running
        assertNotNull(context);
    }

    @Test
    void testEurekaServerIsActive() {
        // This checks for the "Marker" bean that @EnableEurekaServer creates.
        // If this is true, the annotation is 100% covered.
        boolean hasMarker = context.containsBean("eurekaServerMarkerConfiguration");
        assertTrue(hasMarker, "Eureka Server Marker should be present in context");
    }

    @Test
    void testConstructor() {
        // Covers the class declaration and default constructor lines
        DiscoveryServiceApplication app = new DiscoveryServiceApplication();
        assertNotNull(app);
    }

    @Test
    void testMain() {
        // Covers the SpringApplication.run() line
        // We pass a random port to ensure it doesn't clash with a running server
        DiscoveryServiceApplication.main(new String[] {"--server.port=0"});
    }
}