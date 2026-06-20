package com.example.demo.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        // Use a 256-bit key (32 chars) for HS256
        ReflectionTestUtils.setField(jwtUtil, "secret", "mysecretkeymysecretkeymysecretkeymysecretkey");
    }

    @Test
    void testValidateToken_Invalid_ThrowsException() {
        // Passing a dummy string should trigger Jwts parser exception
        assertThrows(Exception.class, () -> jwtUtil.validateToken("invalid.token.here"));
    }
}