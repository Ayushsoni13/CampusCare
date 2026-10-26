package com.campuscare.campuscare.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.campuscare.campuscare.entity.Complaint;
import com.campuscare.campuscare.entity.ComplaintHistory;

import com.campuscare.campuscare.repository.ComplaintRepository;
import com.campuscare.campuscare.repository.ComplaintHistoryRepository;
import com.campuscare.campuscare.repository.StudentRepository;
import com.campuscare.campuscare.repository.MaintenanceStaffRepository;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintRepository complaintRepository;
    private final ComplaintHistoryRepository historyRepository;
    private final StudentRepository studentRepository;
    private final MaintenanceStaffRepository staffRepository;

    public ComplaintController(
            ComplaintRepository complaintRepository,
            ComplaintHistoryRepository historyRepository,
            StudentRepository studentRepository,
            MaintenanceStaffRepository staffRepository) {

        this.complaintRepository = complaintRepository;
        this.historyRepository = historyRepository;
        this.studentRepository = studentRepository;
        this.staffRepository = staffRepository;
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody Complaint complaint) {

        if (complaint.getStudentId() == null
                || !studentRepository.existsById(
                        complaint.getStudentId())) {

            return ResponseEntity.badRequest()
                    .body("A valid studentId is required.");
        }

        complaint.setId(null);
        complaint.setAssignedStaffId(null);
        complaint.setStatus("SUBMITTED");

        Complaint saved = complaintRepository.save(complaint);

        saveHistory(
                saved.getId(),
                null,
                "SUBMITTED",
                "Complaint submitted");

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(saved);
    }

    @GetMapping
    public List<Complaint> getAll() {
        return complaintRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Complaint> getById(
            @PathVariable Long id) {

        return complaintRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Complaint updated) {

        Complaint existing =
                complaintRepository.findById(id).orElse(null);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        if (updated.getStudentId() != null
                && !studentRepository.existsById(
                        updated.getStudentId())) {

            return ResponseEntity.badRequest()
                    .body("The supplied studentId does not exist.");
        }

        if (updated.getStudentId() != null) {
            existing.setStudentId(updated.getStudentId());
        }

        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setCategory(updated.getCategory());
        existing.setLocation(updated.getLocation());

        if (updated.getPriority() != null) {
            existing.setPriority(updated.getPriority());
        }

        return ResponseEntity.ok(
                complaintRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        if (!complaintRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        List<ComplaintHistory> history =
                historyRepository
                        .findByComplaintIdOrderByChangedAtDesc(id);

        historyRepository.deleteAll(history);
        complaintRepository.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    public List<Complaint> getByStatus(
            @PathVariable String status) {

        return complaintRepository
                .findByStatusIgnoreCase(status);
    }

    @GetMapping("/category/{category}")
    public List<Complaint> getByCategory(
            @PathVariable String category) {

        return complaintRepository
                .findByCategoryIgnoreCase(category);
    }

    @PutMapping("/{id}/assign/{staffId}")
    public ResponseEntity<?> assignStaff(
            @PathVariable Long id,
            @PathVariable Long staffId) {

        Complaint complaint =
                complaintRepository.findById(id).orElse(null);

        if (complaint == null) {
            return ResponseEntity.notFound().build();
        }

        if (!staffRepository.existsById(staffId)) {
            return ResponseEntity.badRequest()
                    .body("The supplied staffId does not exist.");
        }

        complaint.setAssignedStaffId(staffId);

        if ("SUBMITTED".equalsIgnoreCase(complaint.getStatus())) {
            String oldStatus = complaint.getStatus();
            complaint.setStatus("ASSIGNED");

            saveHistory(
                    id,
                    oldStatus,
                    "ASSIGNED",
                    "Staff assigned");
        }

        return ResponseEntity.ok(
                complaintRepository.save(complaint));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String remarks) {

        Complaint complaint =
                complaintRepository.findById(id).orElse(null);

        if (complaint == null) {
            return ResponseEntity.notFound().build();
        }

        String newStatus = status.trim().toUpperCase();

        if (!List.of(
                "SUBMITTED",
                "ASSIGNED",
                "IN_PROGRESS",
                "RESOLVED",
                "CLOSED").contains(newStatus)) {

            return ResponseEntity.badRequest().body(
                    "Invalid status. Use SUBMITTED, ASSIGNED, "
                    + "IN_PROGRESS, RESOLVED or CLOSED.");
        }

        String oldStatus = complaint.getStatus();
        complaint.setStatus(newStatus);

        Complaint saved = complaintRepository.save(complaint);

        if (oldStatus == null
                || !oldStatus.equalsIgnoreCase(newStatus)) {

            saveHistory(
                    saved.getId(),
                    oldStatus,
                    newStatus,
                    remarks);
        }

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<?> getHistory(
            @PathVariable Long id) {

        if (!complaintRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(
                historyRepository
                        .findByComplaintIdOrderByChangedAtDesc(id));
    }

    private void saveHistory(
            Long complaintId,
            String oldStatus,
            String newStatus,
            String remarks) {

        ComplaintHistory history = new ComplaintHistory();

        history.setComplaintId(complaintId);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setRemarks(remarks);

        historyRepository.save(history);
    }
}