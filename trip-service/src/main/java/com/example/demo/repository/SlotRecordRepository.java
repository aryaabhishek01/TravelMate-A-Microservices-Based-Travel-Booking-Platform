package com.example.demo.repository;

import com.example.demo.entity.SlotRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SlotRecordRepository extends JpaRepository<SlotRecord, Long> {
    Optional<SlotRecord> findByPackageIdAndYearMonth(Long packageId, String yearMonth);
}
