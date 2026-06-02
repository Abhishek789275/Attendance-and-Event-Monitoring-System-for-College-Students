package com.attendance.controller;

import com.attendance.dto.AttendanceRequest;
import com.attendance.model.Attendance;
import com.attendance.model.Event;
import com.attendance.model.User;
import com.attendance.repository.AttendanceRepository;
import com.attendance.repository.EventRepository;
import com.attendance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*")
public class AttendanceController {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventRepository eventRepository;

    @PostMapping("/mark")
    public ResponseEntity<?> markAttendance(@RequestBody AttendanceRequest request) {
        Optional<User> userOpt = userRepository.findById(request.getUserId());
        Optional<Event> eventOpt = eventRepository.findById(request.getEventId());

        if (userOpt.isPresent() && eventOpt.isPresent()) {
            Attendance attendance = new Attendance();
            attendance.setUser(userOpt.get());
            attendance.setEvent(eventOpt.get());
            attendance.setStatus(request.getStatus());
            attendance.setTimestamp(request.getTimestamp() != null ? request.getTimestamp() : LocalDateTime.now());
            
            Attendance saved = attendanceRepository.save(attendance);
            return ResponseEntity.ok(saved);
        }
        
        return ResponseEntity.badRequest().body("User or Event not found");
    }

    @GetMapping("/student/{userId}")
    public ResponseEntity<List<Attendance>> getStudentAttendance(@PathVariable Long userId) {
        return ResponseEntity.ok(attendanceRepository.findByUserId(userId));
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<Attendance>> getEventAttendance(@PathVariable Long eventId) {
        return ResponseEntity.ok(attendanceRepository.findByEventId(eventId));
    }
}
