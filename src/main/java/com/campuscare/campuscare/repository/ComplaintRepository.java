package com.campuscare.campuscare.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.campuscare.campuscare.entity.Complaint;

public interface ComplaintRepository
        extends JpaRepository<Complaint, Long> {

    List<Complaint> findByStatusIgnoreCase(String status);

    List<Complaint> findByCategoryIgnoreCase(String category);

    long countByStatusIgnoreCase(String status);
}