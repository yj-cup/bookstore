package com.bookstore.dao;

import com.bookstore.entity.Book;
import com.bookstore.util.DBUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class BookDao {

    /**
     * 动态分页与过滤获取图书
     */
    public List<Book> queryBooks(String category, String keyword, String sortBy) {
        List<Book> list = new ArrayList<>();
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;

        try {
            conn = DBUtil.getConnection();
            StringBuilder sql = new StringBuilder("SELECT * FROM t_books WHERE 1=1 ");
            List<Object> params = new ArrayList<>();

            if (category != null && !"ALL".equalsIgnoreCase(category) && !category.trim().isEmpty()) {
                sql.append("AND category = ? ");
                params.add(category);
            }

            if (keyword != null && !keyword.trim().isEmpty()) {
                sql.append("AND (title LIKE ? OR author LIKE ? OR description LIKE ?) ");
                String likeKw = "%" + keyword.trim() + "%";
                params.add(likeKw);
                params.add(likeKw);
                params.add(likeKw);
            }

            if ("PRICE_LOW".equalsIgnoreCase(sortBy)) {
                sql.append("ORDER BY price ASC");
            } else if ("PRICE_HIGH".equalsIgnoreCase(sortBy)) {
                sql.append("ORDER BY price DESC");
            } else if ("RATING".equalsIgnoreCase(sortBy)) {
                sql.append("ORDER BY rating DESC");
            } else {
                sql.append("ORDER BY id ASC"); // 默认入库推荐顺序
            }

            stmt = conn.prepareStatement(sql.toString());
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }

            rs = stmt.executeQuery();
            while (rs.next()) {
                list.add(extractBook(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            DBUtil.close(rs, stmt, conn);
        }
        return list;
    }

    public Book findById(String id) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        try {
            conn = DBUtil.getConnection();
            stmt = conn.prepareStatement("SELECT * FROM t_books WHERE id = ?");
            stmt.setString(1, id);
            rs = stmt.executeQuery();
            if (rs.next()) {
                return extractBook(rs);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            DBUtil.close(rs, stmt, conn);
        }
        return null;
    }

    public boolean insert(Book book) {
        Connection conn = null;
        PreparedStatement stmt = null;
        try {
            conn = DBUtil.getConnection();
            String sql = "INSERT INTO t_books (id, title, author, category, price, stock, description, cover_image, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            stmt = conn.prepareStatement(sql);
            stmt.setString(1, book.getId());
            stmt.setString(2, book.getTitle());
            stmt.setString(3, book.getAuthor());
            stmt.setString(4, book.getCategory());
            stmt.setDouble(5, book.getPrice());
            stmt.setInt(6, book.getStock());
            stmt.setString(7, book.getDescription());
            stmt.setString(8, book.getCoverImage());
            stmt.setDouble(9, book.getRating());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        } finally {
            DBUtil.close(stmt, conn);
        }
    }

    public boolean update(Book book) {
        Connection conn = null;
        PreparedStatement stmt = null;
        try {
            conn = DBUtil.getConnection();
            String sql = "UPDATE t_books SET title=?, author=?, category=?, price=?, stock=?, description=?, cover_image=?, rating=? WHERE id=?";
            stmt = conn.prepareStatement(sql);
            stmt.setString(1, book.getTitle());
            stmt.setString(2, book.getAuthor());
            stmt.setString(3, book.getCategory());
            stmt.setDouble(4, book.getPrice());
            stmt.setInt(5, book.getStock());
            stmt.setString(6, book.getDescription());
            stmt.setString(7, book.getCoverImage());
            stmt.setDouble(8, book.getRating());
            stmt.setString(9, book.getId());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        } finally {
            DBUtil.close(stmt, conn);
        }
    }

    public boolean delete(String id) {
        Connection conn = null;
        PreparedStatement stmt = null;
        try {
            conn = DBUtil.getConnection();
            stmt = conn.prepareStatement("DELETE FROM t_books WHERE id = ?");
            stmt.setString(1, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        } finally {
            DBUtil.close(stmt, conn);
        }
    }

    private Book extractBook(ResultSet rs) throws SQLException {
        return new Book(
            rs.getString("id"),
            rs.getString("title"),
            rs.getString("author"),
            rs.getString("category"),
            rs.getDouble("price"),
            rs.getInt("stock"),
            rs.getString("description"),
            rs.getString("cover_image"),
            rs.getDouble("rating")
        );
    }
}