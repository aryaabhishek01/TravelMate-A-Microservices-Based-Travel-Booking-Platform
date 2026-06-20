package com.example.demo.repository;

import com.example.demo.entity.Booking;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {
	List<Booking> findByUserEmail(String userEmail);
}
