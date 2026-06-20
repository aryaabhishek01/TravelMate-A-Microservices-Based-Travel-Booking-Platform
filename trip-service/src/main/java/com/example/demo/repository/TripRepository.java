package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo.entity.Package;

public interface TripRepository extends JpaRepository<Package, Long> {
}