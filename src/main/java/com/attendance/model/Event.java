package com.attendance.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private LocalDateTime eventDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType type;

    private String linkedinLink;
    private String posterUrl;

    public Event() {
    }

    public Event(String title, String description, LocalDateTime eventDate, EventType type, String linkedinLink) {
        this.title = title;
        this.description = description;
        this.eventDate = eventDate;
        this.type = type;
        this.linkedinLink = linkedinLink;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public LocalDateTime getEventDate() {
        return eventDate;
    }
    
    public void setEventDate(LocalDateTime eventDate) {
        this.eventDate = eventDate;
    }
    
    public EventType getType() {
        return type;
    }
    
    public void setType(EventType type) {
        this.type = type;
    }
    
    public String getLinkedinLink() { return linkedinLink; }
    public void setLinkedinLink(String linkedinLink) { this.linkedinLink = linkedinLink; }
    public String getPosterUrl() { return posterUrl; }
    public void setPosterUrl(String posterUrl) { this.posterUrl = posterUrl; }
}
