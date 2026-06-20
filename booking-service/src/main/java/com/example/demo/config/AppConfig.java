package com.example.demo.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    // Used for Eureka-resolved calls (e.g. TRIP-SERVICE)
    @Bean
    @LoadBalanced
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    // Used for direct Docker hostname calls (e.g. notification-service:8084)
    // Must NOT be @LoadBalanced — the load balancer intercepts all calls and
    // tries to resolve them via Eureka, which breaks plain hostname URLs.
    @Bean
    @Qualifier("plainRestTemplate")
    public RestTemplate plainRestTemplate() {
        return new RestTemplate();
    }
}