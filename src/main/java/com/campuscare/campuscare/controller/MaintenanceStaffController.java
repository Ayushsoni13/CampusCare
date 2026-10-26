package com.campuscare.campuscare.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.campuscare.campuscare.entity.MaintenanceStaff;
import com.campuscare.campuscare.repository.MaintenanceStaffRepository;

@RestController
@RequestMapping("/api/staff")
public class MaintenanceStaffController {

    private final MaintenanceStaffRepository repository;

    public MaintenanceStaffController(
            MaintenanceStaffRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    public ResponseEntity<MaintenanceStaff> create(
            @RequestBody MaintenanceStaff staff) {

        staff.setId(null);

        MaintenanceStaff saved = repository.save(staff);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(saved);
    }

    @GetMapping
    public List<MaintenanceStaff> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceStaff> getById(
            @PathVariable Long id) {

        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaintenanceStaff> update(
            @PathVariable Long id,
            @RequestBody MaintenanceStaff staff) {

        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        staff.setId(id);

        return ResponseEntity.ok(repository.save(staff));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}