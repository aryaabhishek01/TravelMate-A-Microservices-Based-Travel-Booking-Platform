package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;
    private String role; 

    private String otp;
    private java.time.LocalDateTime otpExpiry;

    /** false = pending OTP verification, true = fully registered */
    @Column(columnDefinition = "boolean default true")
    private boolean activated = true;
}