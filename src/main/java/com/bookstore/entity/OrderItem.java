package com.bookstore.entity;

import java.io.Serializable;

public class OrderItem implements Serializable {
    private static final long serialVersionUID = 1L;

    private int id;
    private String orderId;
    private String bookId;
    private String bookTitle;
    private String bookCover;
    private double bookPrice;
    private int quantity;

    public OrderItem() {}

    public OrderItem(String bookId, String bookTitle, String bookCover, double bookPrice, int quantity) {
        this.bookId = bookId;
        this.bookTitle = bookTitle;
        this.bookCover = bookCover;
        this.bookPrice = bookPrice;
        this.quantity = quantity;
    }

    // Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getBookId() { return bookId; }
    public void setBookId(String bookId) { this.bookId = bookId; }

    public String getBookTitle() { return bookTitle; }
    public void setBookTitle(String bookTitle) { this.bookTitle = bookTitle; }

    public String getBookCover() { return bookCover; }
    public void setBookCover(String bookCover) { this.bookCover = bookCover; }

    public double getBookPrice() { return bookPrice; }
    public void setBookPrice(double bookPrice) { this.bookPrice = bookPrice; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}
