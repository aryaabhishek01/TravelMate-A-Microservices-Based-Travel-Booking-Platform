package com.example.demo.filter;

import com.example.demo.util.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.impl.DefaultClaims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private GatewayFilterChain chain;

    @InjectMocks
    private JwtAuthFilter filter;

    @BeforeEach
    void setup() {
        // Default behavior: proceed with the chain
        when(chain.filter(any(ServerWebExchange.class))).thenReturn(Mono.empty());
    }

    @Test
    void testFilter_SkipAuthPath() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/auth/login").build());

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        verify(chain).filter(exchange);
        verifyNoInteractions(jwtUtil);
    }

    @Test
    void testFilter_MissingHeader_ReturnsUnauthorized() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/trips/all").build());

        filter.filter(exchange, chain).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void testFilter_ValidToken_UserPath() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/trips/all")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                        .build());

        Claims claims = new DefaultClaims(Map.of("sub", "user@test.com", "role", "USER"));
        when(jwtUtil.validateToken("valid-token")).thenReturn(claims);

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        assertEquals(null, exchange.getResponse().getStatusCode()); // Not set means it passed
    }

    @Test
    void testFilter_AdminPath_ForbiddenForUser() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/admin/add-package")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer user-token")
                        .build());

        Claims claims = new DefaultClaims(Map.of("sub", "user@test.com", "role", "USER"));
        when(jwtUtil.validateToken("user-token")).thenReturn(claims);

        filter.filter(exchange, chain).block();

        assertEquals(HttpStatus.FORBIDDEN, exchange.getResponse().getStatusCode());
    }

    @Test
    void testFilter_AdminPath_SuccessForAdmin() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/admin/add-package")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer admin-token")
                        .build());

        Claims claims = new DefaultClaims(Map.of("sub", "admin@test.com", "role", "ADMIN"));
        when(jwtUtil.validateToken("admin-token")).thenReturn(claims);

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();
    }

    @Test
    void testFilter_InvalidToken_ReturnsUnauthorized() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/trips/all")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer expired-token")
                        .build());

        when(jwtUtil.validateToken(anyString())).thenThrow(new RuntimeException("Expired"));

        filter.filter(exchange, chain).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }
}