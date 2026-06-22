package com.attendance.controller;

import com.attendance.model.User;

import com.attendance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    @Autowired private UserRepository userRepository;


    @GetMapping("/faculty-workload/{facultyId}")
    public ResponseEntity<?> getFacultyWorkload(@PathVariable Long facultyId) {
        Optional<User> opt = userRepository.findById(facultyId);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        User faculty = opt.get();

        // Mock logic for workload analytics
        // In a real scenario, this would query the DB for events linked to the faculty's subjects.
        Map<String, Object> workload = new LinkedHashMap<>();
        workload.put("facultyName", faculty.getUsername());
        workload.put("department", faculty.getBranch());
        
        // Mocked metrics
        workload.put("classesConducted", 42);
        workload.put("attendanceSessionsCompleted", 40);
        workload.put("subjectsAssigned", 2);
        workload.put("weeklyTeachingHours", 18);
        workload.put("totalStudentStrength", 120);

        List<Map<String, Object>> monthlyWorkload = new ArrayList<>();
        monthlyWorkload.add(Map.of("month", "Jan", "hours", 60));
        monthlyWorkload.add(Map.of("month", "Feb", "hours", 72));
        monthlyWorkload.add(Map.of("month", "Mar", "hours", 68));
        monthlyWorkload.add(Map.of("month", "Apr", "hours", 45));

        workload.put("monthlyTrend", monthlyWorkload);

        return ResponseEntity.ok(workload);
    }
}
