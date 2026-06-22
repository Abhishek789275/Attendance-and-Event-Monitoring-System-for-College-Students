package com.attendance.controller;

import com.attendance.model.Event;
import com.attendance.model.EventType;
import com.attendance.model.Attendance;
import com.attendance.repository.EventRepository;
import com.attendance.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    private static final String UPLOAD_DIR = "uploads/posters/";

    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents() {
        return ResponseEntity.ok(eventRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Long id) {
        Optional<Event> event = eventRepository.findById(id);
        return event.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Event> createEvent(@RequestBody Event event) {
        return ResponseEntity.ok(eventRepository.save(event));
    }

    @PostMapping("/with-poster")
    public ResponseEntity<?> createEventWithPoster(
            @RequestParam("title") String title,
            @RequestParam("type") String type,
            @RequestParam("eventDate") String eventDate,
            @RequestParam(value = "linkedinLink", required = false) String linkedinLink,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "poster", required = false) MultipartFile poster) throws IOException {

        Event event = new Event();
        event.setTitle(title);
        event.setType(EventType.valueOf(type));
        event.setEventDate(LocalDateTime.parse(eventDate));
        event.setLinkedinLink(linkedinLink);
        event.setDescription(description);

        if (poster != null && !poster.isEmpty()) {
            Files.createDirectories(Paths.get(UPLOAD_DIR));
            String filename = System.currentTimeMillis() + "_" + poster.getOriginalFilename();
            Path path = Paths.get(UPLOAD_DIR + filename);
            Files.write(path, poster.getBytes());
            event.setPosterUrl("/uploads/posters/" + filename);
        }

        return ResponseEntity.ok(eventRepository.save(event));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        if (!eventRepository.existsById(id)) return ResponseEntity.notFound().build();
        
        // Delete all associated attendance/registration records first
        List<Attendance> associatedRecords = attendanceRepository.findByEventId(id);
        attendanceRepository.deleteAll(associatedRecords);
        
        eventRepository.deleteById(id);
        return ResponseEntity.ok("Event deleted");
    }

    @PostMapping("/{id}/generate-qr")
    public ResponseEntity<?> generateQrCode(@PathVariable Long id) {
        Optional<Event> eventOpt = eventRepository.findById(id);
        if (eventOpt.isEmpty()) return ResponseEntity.notFound().build();

        // In a real application, we would sign this with a JWT secret.
        // For now, generating a random token with a 60-second validity.
        String token = java.util.UUID.randomUUID().toString() + "-" + id;
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(60);

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("eventId", id);
        response.put("token", token);
        response.put("expiresAt", expiresAt);
        response.put("message", "QR Token generated. Valid for 60 seconds.");

        return ResponseEntity.ok(response);
    }
}
