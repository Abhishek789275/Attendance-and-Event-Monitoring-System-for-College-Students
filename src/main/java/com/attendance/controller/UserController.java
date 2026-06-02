package com.attendance.controller;

import com.attendance.model.Role;
import com.attendance.model.User;
import com.attendance.repository.AttendanceRepository;
import com.attendance.repository.EventRepository;
import com.attendance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired private UserRepository userRepository;
    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private EventRepository eventRepository;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        return userRepository.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable String role,
            @RequestParam(required = false) String branch,
            @RequestParam(required = false) String section) {
        Role r = Role.valueOf(role.toUpperCase());
        if (branch != null && section != null)
            return ResponseEntity.ok(userRepository.findByRoleAndBranchAndSection(r, branch, section));
        return ResponseEntity.ok(userRepository.findByRole(r));
    }

    @GetMapping("/my-students")
    public ResponseEntity<List<User>> getMyStudents(@RequestParam String subject) {
        return ResponseEntity.ok(userRepository.findByRoleAndSubject(Role.STUDENT, subject));
    }

    @PostMapping
    public ResponseEntity<?> addUser(@RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent())
            return ResponseEntity.badRequest().body("Email already registered");
        if (userRepository.findByUsername(user.getUsername()).isPresent())
            return ResponseEntity.badRequest().body("Username already exists");
        if (user.getRole() == null) user.setRole(Role.STUDENT);
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User updated) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        User user = opt.get();
        if (updated.getUsername() != null) user.setUsername(updated.getUsername());
        if (updated.getEmail() != null) user.setEmail(updated.getEmail());
        if (updated.getBranch() != null) user.setBranch(updated.getBranch());
        if (updated.getSection() != null) user.setSection(updated.getSection());
        if (updated.getMarks() != null) user.setMarks(updated.getMarks());
        if (updated.getLinkedinProfileUrl() != null) user.setLinkedinProfileUrl(updated.getLinkedinProfileUrl());
        if (updated.getSubject() != null) user.setSubject(updated.getSubject());
        return ResponseEntity.ok(userRepository.save(user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) return ResponseEntity.notFound().build();
        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted");
    }

    @PatchMapping("/{id}/marks")
    public ResponseEntity<?> updateMarks(@PathVariable Long id, @RequestBody Map<String, Double> body) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        User user = opt.get();
        user.setMarks(body.get("marks"));
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PatchMapping("/{id}/password")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        User user = opt.get();
        String current = body.get("currentPassword");
        String newPass = body.get("newPassword");
        if (!user.getPasswordHash().equals(current))
            return ResponseEntity.badRequest().body("Current password is incorrect");
        user.setPasswordHash(newPass);
        userRepository.save(user);
        return ResponseEntity.ok("Password changed successfully");
    }

    @PatchMapping("/{id}/assign-subject")
    public ResponseEntity<?> assignSubject(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        User user = opt.get();
        user.setSubject(body.get("subject"));
        return ResponseEntity.ok(userRepository.save(user));
    }

    // Attendance report for a student
    @GetMapping("/{id}/report")
    public ResponseEntity<?> getStudentReport(@PathVariable Long id) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        User student = opt.get();
        var records = attendanceRepository.findByUserId(id);
        var events = eventRepository.findAll();
        int total = events.size();
        long present = records.stream().filter(a -> a.getStatus().name().equals("PRESENT")).count();
        long absent = total - present;
        double rate = total > 0 ? Math.round((present * 100.0) / total) : 0;

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("studentName", student.getUsername());
        report.put("email", student.getEmail());
        report.put("branch", student.getBranch());
        report.put("section", student.getSection());
        report.put("marks", student.getMarks());
        report.put("totalEvents", total);
        report.put("present", present);
        report.put("absent", absent);
        report.put("attendanceRate", rate + "%");
        report.put("records", records);
        return ResponseEntity.ok(report);
    }
}
