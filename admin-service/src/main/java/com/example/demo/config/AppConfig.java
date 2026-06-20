package com.example.demo.config;

import org.springframework.context.annotation.Configuration;

/**
 * AppConfig — RestTemplate removed; all inter-service calls now use
 * OpenFeign clients (AuthClient, BookingClient, TripClient).
 */
@Configuration
public class AppConfig {
    // No beans needed — Feign handles service-to-service communication
}