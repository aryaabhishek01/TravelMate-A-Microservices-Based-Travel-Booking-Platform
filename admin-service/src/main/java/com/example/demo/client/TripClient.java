package com.example.demo.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.example.demo.dto.PackageDTO;

@FeignClient(name = "TRIP-SERVICE")
public interface TripClient {

    @PostMapping("/trips/add")
    Object addPackage(@RequestBody PackageDTO dto);

    @GetMapping("/trips/all")
    List<Object> getAllPackages();

    @PutMapping("/trips/update/{id}")
    Object updatePackage(@PathVariable("id") Long id, @RequestBody PackageDTO dto);

    @DeleteMapping("/trips/delete/{id}")
    String deletePackage(@PathVariable("id") Long id);
}