package com.attendance.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Column(unique = true, nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String linkedinProfileUrl;
    private String branch;
    private String section;
    private Double marks;
    private String subject;

    public User() {
    }

    public User(String username, String passwordHash, String email, Role role, String linkedinProfileUrl) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.email = email;
        this.role = role;
        this.linkedinProfileUrl = linkedinProfileUrl;
    }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }
    public Double getMarks() { return marks; }
    public void setMarks(Double marks) { this.marks = marks; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getLinkedinProfileUrl() {
        return linkedinProfileUrl;
    }

    public void setLinkedinProfileUrl(String linkedinProfileUrl) {
        this.linkedinProfileUrl = linkedinProfileUrl;
    }
}
