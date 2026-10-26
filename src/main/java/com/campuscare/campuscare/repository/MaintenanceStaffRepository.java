package com.campuscare.campuscare.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.campuscare.campuscare.entity.MaintenanceStaff;

public interface MaintenanceStaffRepository
        extends JpaRepository<MaintenanceStaff, Long> {
}