package com.bookstore.entity;

import java.io.Serializable;

public class Book implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String title;
    private String author;
    private String category;
    private double price;
    private int stock;
    private String description;
    private String coverImage;
    private double rating;

    public Book() {}

    public Book(String id, String title, String author, String category, double price, int stock, String description, String coverImage, double rating) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.category = category;
        this.price = price;
        this.stock = stock;
        this.description = description;
        this.coverImage = coverImage;
        this.rating = rating;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCoverImage() { return coverImage; }
    public void setCoverImage(String coverImage) { this.coverImage = coverImage; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }
}