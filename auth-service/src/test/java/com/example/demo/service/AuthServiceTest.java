package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository repo;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @Spy
    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @InjectMocks
    private AuthService authService;

    // ================================
    // ✅ GET ALL USERS
    // ================================

    @Test
    void testGetAllUsers() {
        User u1 = new User();
        u1.setEmail("a@gmail.com");
        User u2 = new User();
        u2.setEmail("b@gmail.com");

        when(repo.findAll()).thenReturn(Arrays.asList(u1, u2));

        List<User> result = authService.getAllUsers();
        assertEquals(2, result.size());
    }

    // ================================
    // ✅ REGISTRATION BRANCHES
    // ================================

    @Test
    void testRegister_Success() {
        User user = new User();
        user.setName("Arya");
        user.setEmail("arya@gmail.com");
        user.setPassword("password123");

        when(repo.findByEmail(anyString())).thenReturn(Optional.empty());
        when(repo.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        User result = authService.register(user);

        assertNotNull(result);
        assertEquals("USER", result.getRole());
        assertTrue(encoder.matches("password123", result.getPassword()));
        verify(repo).save(any(User.class));
    }

    @Test
    void testRegister_WithExplicitRole() {
        User user = new User();
        user.setName("Admin");
        user.setEmail("admin@gmail.com");
        user.setPassword("password123");
        user.setRole("ADMIN");

        when(repo.findByEmail(anyString())).thenReturn(Optional.empty());
        when(repo.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        User result = authService.register(user);

        assertEquals("ADMIN", result.getRole());
    }

    @Test
    void testRegister_EmptyName_ThrowsException() {
        User user = new User();
        user.setName("");
        user.setEmail("test@gmail.com");

        assertThrows(RuntimeException.class, () -> authService.register(user));
    }

    @Test
    void testRegister_NullName_ThrowsException() {
        User user = new User();
        user.setName(null);
        user.setEmail("test@gmail.com");

        assertThrows(RuntimeException.class, () -> authService.register(user));
    }

    @Test
    void testRegister_DuplicateEmail_ThrowsException() {
        User user = new User();
        user.setName("Arya");
        user.setEmail("exists@gmail.com");

        when(repo.findByEmail("exists@gmail.com")).thenReturn(Optional.of(new User()));

        assertThrows(RuntimeException.class, () -> authService.register(user));
    }

    @Test
    void testRegister_InvalidDomain_ThrowsException() {
        User user = new User();
        user.setName("Arya");
        user.setEmail("arya@outlook.com"); // Not @gmail.com

        when(repo.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> authService.register(user));
    }

    @Test
    void testRegister_ShortPassword_ThrowsException() {
        User user = new User();
        user.setName("Arya");
        user.setEmail("arya@gmail.com");
        user.setPassword("short"); // less than 8 chars

        when(repo.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> authService.register(user));
    }

    // ================================
    // ✅ LOGIN BRANCHES
    // ================================

    @Test
    void testLogin_Success() {
        User user = new User();
        user.setEmail("test@gmail.com");
        user.setPassword("encoded_pass");
        user.setRole("ADMIN");

        when(repo.findByEmail("test@gmail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("raw_pass", "encoded_pass")).thenReturn(true);
        when(jwtUtil.generateToken("test@gmail.com", "ADMIN")).thenReturn("mock-token");

        String token = authService.login("test@gmail.com", "raw_pass");
        assertEquals("mock-token", token);
    }

    @Test
    void testLogin_UserNotFound_ThrowsException() {
        when(repo.findByEmail(anyString())).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> authService.login("no@test.com", "pass"));
    }

    @Test
    void testLogin_InvalidPassword_ThrowsException() {
        User user = new User();
        user.setEmail("test@gmail.com");
        user.setPassword("encoded_pass");
        user.setRole("USER");

        when(repo.findByEmail("test@gmail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong_pass", "encoded_pass")).thenReturn(false);

        assertThrows(RuntimeException.class, () -> authService.login("test@gmail.com", "wrong_pass"));
    }

    // ================================
    // ✅ GET USER BY EMAIL
    // ================================

    @Test
    void testGetUserByEmail_Success() {
        User user = new User();
        user.setEmail("found@gmail.com");
        when(repo.findByEmail("found@gmail.com")).thenReturn(Optional.of(user));

        User result = authService.getUserByEmail("found@gmail.com");
        assertEquals("found@gmail.com", result.getEmail());
    }

    @Test
    void testGetUserByEmail_NotFound_ThrowsException() {
        when(repo.findByEmail(anyString())).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> authService.getUserByEmail("missing@gmail.com"));
    }

    // ================================
    // ✅ OTP & PASSWORD RESET BRANCHES
    // ================================

    @Test
    void testGenerateOtp_Success() {
        User user = new User();
        user.setEmail("otp@gmail.com");
        when(repo.findByEmail("otp@gmail.com")).thenReturn(Optional.of(user));

        authService.generateOtp("otp@gmail.com");

        assertNotNull(user.getOtp());
        verify(rabbitTemplate).convertAndSend(eq("otpExchange"), eq("otpRoutingKey"), anyString());
        verify(repo).save(user);
    }

    @Test
    void testGenerateOtp_UserNotFound_ThrowsException() {
        when(repo.findByEmail(anyString())).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> authService.generateOtp("nobody@gmail.com"));
    }

    @Test
    void testValidateOtp_Success() {
        User user = new User();
        user.setOtp("123456");
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5)); // Not yet expired

        when(repo.findByEmail("test@gmail.com")).thenReturn(Optional.of(user));

        boolean result = authService.validateOtp("test@gmail.com", "123456");
        assertTrue(result);
    }

    @Test
    void testValidateOtp_Expired_ThrowsException() {
        User user = new User();
        user.setOtp("123456");
        user.setOtpExpiry(LocalDateTime.now().minusMinutes(1)); // Expired

        when(repo.findByEmail("test@gmail.com")).thenReturn(Optional.of(user));

        assertThrows(RuntimeException.class, () -> authService.validateOtp("test@gmail.com", "123456"));
    }

    @Test
    void testValidateOtp_Mismatch_ReturnsFalse() {
        User user = new User();
        user.setOtp("123456");

        when(repo.findByEmail("test@gmail.com")).thenReturn(Optional.of(user));

        boolean result = authService.validateOtp("test@gmail.com", "000000");
        assertFalse(result);
    }

    @Test
    void testValidateOtp_NullOtp_ReturnsFalse() {
        User user = new User();
        user.setOtp(null); // No OTP set

        when(repo.findByEmail("test@gmail.com")).thenReturn(Optional.of(user));

        boolean result = authService.validateOtp("test@gmail.com", "123456");
        assertFalse(result);
    }

    @Test
    void testValidateOtp_UserNotFound_ThrowsException() {
        when(repo.findByEmail(anyString())).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> authService.validateOtp("nobody@gmail.com", "000000"));
    }

    @Test
    void testUpdatePassword_Success() {
        User user = new User();
        user.setEmail("reset@gmail.com");

        when(repo.findByEmail("reset@gmail.com")).thenReturn(Optional.of(user));

        authService.updatePassword("reset@gmail.com", "new_secure_password");

        assertNull(user.getOtp());
        assertNull(user.getOtpExpiry());
        verify(repo).save(user);
    }

    @Test
    void testUpdatePassword_ShortPassword_ThrowsException() {
        when(repo.findByEmail(anyString())).thenReturn(Optional.of(new User()));
        assertThrows(RuntimeException.class, () -> authService.updatePassword("test@test.com", "123"));
    }

    @Test
    void testUpdatePassword_NullPassword_ThrowsException() {
        when(repo.findByEmail(anyString())).thenReturn(Optional.of(new User()));
        assertThrows(RuntimeException.class, () -> authService.updatePassword("test@test.com", null));
    }

    @Test
    void testUpdatePassword_UserNotFound_ThrowsException() {
        when(repo.findByEmail(anyString())).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> authService.updatePassword("nobody@gmail.com", "longpassword"));
    }
}