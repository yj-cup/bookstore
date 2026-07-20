package com.bookstore.servlet;

import com.bookstore.dao.BookDao;
import com.bookstore.dao.OrderDao;
import com.bookstore.dao.UserDao;
import com.bookstore.entity.Book;
import com.bookstore.entity.Order;
import com.bookstore.entity.User;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

public class AdminServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private BookDao bookDao = new BookDao();
    private UserDao userDao = new UserDao();
    private OrderDao orderDao = new OrderDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "/main";

        switch (pathInfo) {
            case "/main":
            default:
                List<Book> books = bookDao.queryBooks(null, null, null);
                List<User> users = userDao.findAll();
                List<Order> orders = orderDao.findAll();

                req.setAttribute("books", books);
                req.setAttribute("users", users);
                req.setAttribute("orders", orders);
                req.getRequestDispatcher("/WEB-INF/jsp/admin.jsp").forward(req, resp);
                break;
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) {
            resp.sendRedirect(req.getContextPath() + "/admin/manage/main");
            return;
        }

        switch (pathInfo) {
            case "/addBook":
                handleAddBook(req, resp);
                break;
            case "/editBook":
                handleEditBook(req, resp);
                break;
            case "/deleteBook":
                handleDeleteBook(req, resp);
                break;
            case "/updateOrderStatus":
                handleUpdateOrderStatus(req, resp);
                break;
            case "/deleteOrder":
                handleDeleteOrder(req, resp);
                break;
            case "/editUser":
                handleEditUser(req, resp);
                break;
            case "/deleteUser":
                handleDeleteUser(req, resp);
                break;
        }
    }

    private void handleAddBook(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String id = "b_" + (int)(Math.random()*900000+100000);
        String title = req.getParameter("title");
        String author = req.getParameter("author");
        String category = req.getParameter("category");
        double price = Double.parseDouble(req.getParameter("price"));
        int stock = Integer.parseInt(req.getParameter("stock"));
        String description = req.getParameter("description");
        String coverImage = req.getParameter("coverImage");
        double rating = Double.parseDouble(req.getParameter("rating"));

        if (coverImage == null || coverImage.trim().isEmpty()) {
            coverImage = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600";
        }

        Book book = new Book(id, title, author, category, price, stock, description, coverImage, rating);
        bookDao.insert(book);
        resp.sendRedirect(req.getContextPath() + "/admin/manage/main");
    }

    private void handleEditBook(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String id = req.getParameter("id");
        String title = req.getParameter("title");
        String author = req.getParameter("author");
        String category = req.getParameter("category");
        double price = Double.parseDouble(req.getParameter("price"));
        int stock = Integer.parseInt(req.getParameter("stock"));
        String description = req.getParameter("description");
        String coverImage = req.getParameter("coverImage");
        double rating = Double.parseDouble(req.getParameter("rating"));

        Book book = new Book(id, title, author, category, price, stock, description, coverImage, rating);
        bookDao.update(book);
        resp.sendRedirect(req.getContextPath() + "/admin/manage/main");
    }

    private void handleDeleteBook(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String id = req.getParameter("id");
        bookDao.delete(id);
        resp.sendRedirect(req.getContextPath() + "/admin/manage/main");
    }

    private void handleUpdateOrderStatus(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String id = req.getParameter("id");
        String status = req.getParameter("status");
        orderDao.updateStatus(id, status);
        resp.sendRedirect(req.getContextPath() + "/admin/manage/main");
    }

    private void handleDeleteOrder(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String id = req.getParameter("id");
        orderDao.delete(id);
        resp.sendRedirect(req.getContextPath() + "/admin/manage/main");
    }

    private void handleEditUser(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String id = req.getParameter("id");
        String role = req.getParameter("role");
        String password = req.getParameter("password");
        String idCard = req.getParameter("idCard");
        String qq = req.getParameter("qq");
        String phone = req.getParameter("phone");
        String email = req.getParameter("email");

        User u = new User(id, null, password, role, idCard, qq, phone, email);
        userDao.update(u);
        resp.sendRedirect(req.getContextPath() + "/admin/manage/main");
    }

    private void handleDeleteUser(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String id = req.getParameter("id");
        userDao.delete(id);
        resp.sendRedirect(req.getContextPath() + "/admin/manage/main");
    }
}