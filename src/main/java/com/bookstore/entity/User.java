package com.bookstore.entity;

import java.io.Serializable;

public class User implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String username;
    private String password;
    private String role; // "user" | "admin"
    private String idCard;
    private String qq;
    private String phone;
    private String email;

    public User() {}

    public User(String id, String username, String password, String role, String idCard, String qq, String phone, String email) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.role = role;
        this.idCard = idCard;
        this.qq = qq;
        this.phone = phone;
        this.email = email;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getIdCard() { return idCard; }
    public void setIdCard(String idCard) { this.idCard = idCard; }

    public String getQq() { return qq; }
    public void setQq(String qq) { this.qq = qq; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}