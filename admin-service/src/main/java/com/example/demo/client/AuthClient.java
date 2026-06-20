package com.example.demo.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

/**
 * Feign client for AUTH-SERVICE.
 * Calls /auth/users which is a public endpoint (no JWT needed from the gateway
 * because all /auth/** paths are whitelisted in JwtAuthFilter).
 */
@FeignClient(name = "AUTH-SERVICE")
public interface AuthClient {

    @GetMapping("/auth/users")
    List<Object> getAllUsers();
}
