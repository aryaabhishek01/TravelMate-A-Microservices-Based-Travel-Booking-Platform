package com.example.demo.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class AppConfigTest {

    @Autowired
    private ApplicationContext context;

    @Autowired
    private AppConfig appConfig;

    @Test
    void testLoadBalancedRestTemplateBeanExists() {
        // There are now 2 RestTemplate beans — look up by name, not by type,
        // to avoid NoUniqueBeanDefinitionException
        RestTemplate restTemplate = (RestTemplate) context.getBean("restTemplate");
        assertNotNull(restTemplate, "Eureka load-balanced RestTemplate bean should exist");
    }

    @Test
    void testPlainRestTemplateBeanExists() {
        RestTemplate plain = (RestTemplate) context.getBean("plainRestTemplate");
        assertNotNull(plain, "Plain (non-load-balanced) RestTemplate bean should exist");
    }

    @Test
    void testRestTemplateMethod_ReturnsInstance() {
        RestTemplate template = appConfig.restTemplate();
        assertNotNull(template);
        assertTrue(template instanceof RestTemplate);
    }

    @Test
    void testPlainRestTemplateMethod_ReturnsInstance() {
        RestTemplate template = appConfig.plainRestTemplate();
        assertNotNull(template);
        assertTrue(template instanceof RestTemplate);
    }
}