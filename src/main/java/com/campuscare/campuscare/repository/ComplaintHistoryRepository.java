package com.campuscare.campuscare.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.campuscare.campuscare.entity.ComplaintHistory;

public interface ComplaintHistoryRepository
        extends JpaRepository<ComplaintHistory, Long> {

    List<ComplaintHistory> findByComplaintIdOrderByChangedAtDesc(
            Long complaintId);
}