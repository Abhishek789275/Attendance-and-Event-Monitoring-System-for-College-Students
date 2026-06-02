package com.attendance.controller;

import com.attendance.dto.AuthRequest;
import com.attendance.model.Role;
import com.attendance.model.User;
import com.attendance.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostConstruct
    public void seedAdmin() {
        if (userRepository.findByEmail("admin@gmail.com").isEmpty()) {
            User admin = new User("admin", "admin@123", "admin@gmail.com", Role.ADMIN, null);
            userRepository.save(admin);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPasswordHash().equals(request.getPassword())) {
                return ResponseEntity.ok(user);
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User newUser) {
        if (userRepository.findByUsername(newUser.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }
        if (userRepository.findByEmail(newUser.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already registered");
        }
        if (newUser.getRole() == null) {
            newUser.setRole(Role.STUDENT);
        }
        User savedUser = userRepository.save(newUser);
        return ResponseEntity.ok(savedUser);
    }
}
