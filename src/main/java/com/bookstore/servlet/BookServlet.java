package com.bookstore.servlet;

import com.bookstore.dao.BookDao;
import com.bookstore.entity.Book;
import com.bookstore.util.AuthorizationUtil;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

public class BookServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private final BookDao bookDao;

    public BookServlet() {
        this(new BookDao());
    }

    BookServlet(BookDao bookDao) {
        this.bookDao = bookDao;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (isAjax(req)) {
            // JSON API: 返回图书列表
            String category = req.getParameter("category");
            String keyword = req.getParameter("keyword");
            String sortBy = req.getParameter("sortBy");
            List<Book> books = bookDao.queryBooks(category, keyword, sortBy);

            StringBuilder sb = new StringBuilder();
            sb.append("{\"success\":true,\"books\":[");
            for (int i = 0; i < books.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append(bookToJson(books.get(i)));
            }
            sb.append("]}");
            writeJson(resp, sb.toString());
        } else {
            // JSP 渲染
            String category = req.getParameter("category");
            String keyword = req.getParameter("keyword");
            String sortBy = req.getParameter("sortBy");
            List<Book> books = bookDao.queryBooks(category, keyword, sortBy);

            req.setAttribute("books", books);
            req.setAttribute("selectedCategory", category != null ? category : "ALL");
            req.setAttribute("searchQuery", keyword);
            req.setAttribute("sortBy", sortBy != null ? sortBy : "DEFAULT");
            req.getRequestDispatcher("/WEB-INF/jsp/books.jsp").forward(req, resp);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String action = req.getParameter("action");
        if (("addBook".equals(action) || "editBook".equals(action) || "deleteBook".equals(action))
                && !AuthorizationUtil.requireAdmin(req, resp)) {
            return;
        }
        if ("addBook".equals(action)) {
            handleAddBook(req, resp);
        } else if ("editBook".equals(action)) {
            handleEditBook(req, resp);
        } else if ("deleteBook".equals(action)) {
            handleDeleteBook(req, resp);
        } else {
            doGet(req, resp);
        }
    }

    private void handleAddBook(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String id = "b_" + (int)(Math.random() * 900000 + 100000);
        String title = req.getParameter("title");
        String author = req.getParameter("author");
        String category = req.getParameter("category");
        double price = parseDouble(req.getParameter("price"), -1);
        int stock = parseInt(req.getParameter("stock"), -1);
        String description = req.getParameter("description");
        String coverImage = req.getParameter("coverImage");
        double rating = parseDouble(req.getParameter("rating"), 4.5);

        if (!isValidBookInput(title, author, category, price, stock, rating)) {
            writeJson(resp, "{\"success\":false,\"message\":\"图书信息不合法\"}");
            return;
        }

        if (coverImage == null || coverImage.trim().isEmpty()) {
            coverImage = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600";
        }

        Book book = new Book(id, title, author, category, price, stock, description, coverImage, rating);
        if (bookDao.insert(book)) {
            writeJson(resp, "{\"success\":true,\"message\":\"图书录入成功\",\"book\":" + bookToJson(book) + "}");
        } else {
            writeJson(resp, "{\"success\":false,\"message\":\"录入失败，数据库写入错误\"}");
        }
    }

    private void handleEditBook(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String id = req.getParameter("id");
        String title = req.getParameter("title");
        String author = req.getParameter("author");
        String category = req.getParameter("category");
        double price = parseDouble(req.getParameter("price"), -1);
        int stock = parseInt(req.getParameter("stock"), -1);
        String description = req.getParameter("description");
        String coverImage = req.getParameter("coverImage");
        double rating = parseDouble(req.getParameter("rating"), 4.5);

        if (id == null || id.trim().isEmpty()
                || !isValidBookInput(title, author, category, price, stock, rating)) {
            writeJson(resp, "{\"success\":false,\"message\":\"图书信息不合法\"}");
            return;
        }

        Book book = new Book(id, title, author, category, price, stock, description, coverImage, rating);
        if (bookDao.update(book)) {
            writeJson(resp, "{\"success\":true,\"message\":\"图书更新成功\",\"book\":" + bookToJson(book) + "}");
        } else {
            writeJson(resp, "{\"success\":false,\"message\":\"更新失败\"}");
        }
    }

    private void handleDeleteBook(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String id = req.getParameter("id");
        if (bookDao.delete(id)) {
            writeJson(resp, "{\"success\":true,\"message\":\"图书已删除\"}");
        } else {
            writeJson(resp, "{\"success\":false,\"message\":\"删除失败\"}");
        }
    }

    // ====== JSON 辅助方法 ======

    private boolean isAjax(HttpServletRequest req) {
        String accept = req.getHeader("Accept");
        return accept != null && accept.contains("application/json");
    }

    private void writeJson(HttpServletResponse resp, String json) throws IOException {
        resp.setContentType("application/json;charset=UTF-8");
        resp.getWriter().write(json);
    }

    private double parseDouble(String s, double defaultVal) {
        if (s == null || s.trim().isEmpty()) return defaultVal;
        try { return Double.parseDouble(s.trim()); } catch (NumberFormatException e) { return defaultVal; }
    }

    private int parseInt(String s, int defaultVal) {
        if (s == null || s.trim().isEmpty()) return defaultVal;
        try { return Integer.parseInt(s.trim()); } catch (NumberFormatException e) { return defaultVal; }
    }

    private boolean isValidBookInput(
            String title, String author, String category, double price, int stock, double rating) {
        return title != null && !title.trim().isEmpty()
            && author != null && !author.trim().isEmpty()
            && category != null && !category.trim().isEmpty()
            && Double.isFinite(price) && price >= 0
            && stock >= 0
            && Double.isFinite(rating) && rating >= 0 && rating <= 5;
    }

    private String bookToJson(Book b) {
        return "{" +
            "\"id\":\"" + esc(b.getId()) + "\"," +
            "\"title\":\"" + esc(b.getTitle()) + "\"," +
            "\"author\":\"" + esc(b.getAuthor()) + "\"," +
            "\"category\":\"" + esc(b.getCategory()) + "\"," +
            "\"price\":" + b.getPrice() + "," +
            "\"stock\":" + b.getStock() + "," +
            "\"description\":\"" + esc(b.getDescription()) + "\"," +
            "\"coverImage\":\"" + esc(b.getCoverImage()) + "\"," +
            "\"rating\":" + b.getRating() +
            "}";
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
