package com.campuscare.campuscare.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.campuscare.campuscare.entity.Student;

public interface StudentRepository
        extends JpaRepository<Student, Long> {
}