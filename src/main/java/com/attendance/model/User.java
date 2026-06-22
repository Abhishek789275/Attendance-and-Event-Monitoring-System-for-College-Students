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
    private String year;
    private String usn;
    private String phoneNumber;
    private Double marks;
    private String subject;
    private Boolean isHod = false;

    @Column(name = "theme_preference", columnDefinition = "varchar(20) default 'dark'")
    private String themePreference = "dark";

    private Double overallGpa;

    @ManyToMany(mappedBy = "users", fetch = FetchType.LAZY)
    private java.util.Set<Subject> subjects = new java.util.HashSet<>();

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
    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }
    public String getUsn() { return usn; }
    public void setUsn(String usn) { this.usn = usn; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public Double getMarks() { return marks; }
    public void setMarks(Double marks) { this.marks = marks; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public Boolean getIsHod() { return isHod != null && isHod; }
    public void setIsHod(Boolean isHod) { this.isHod = isHod; }

    public String getThemePreference() { return themePreference; }
    public void setThemePreference(String themePreference) { this.themePreference = themePreference; }

    public Double getOverallGpa() { return overallGpa; }
    public void setOverallGpa(Double overallGpa) { this.overallGpa = overallGpa; }

    public java.util.Set<Subject> getSubjects() { return subjects; }
    public void setSubjects(java.util.Set<Subject> subjects) { this.subjects = subjects; }

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
