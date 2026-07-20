package com.bookstore.servlet;

import com.bookstore.dao.BookDao;
import com.bookstore.entity.Book;
import com.bookstore.entity.CartItem;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class CartServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private BookDao bookDao = new BookDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String action = req.getParameter("action");
        if (action == null) {
            action = "view";
        }

        switch (action) {
            case "add":
                addToCart(req, resp);
                break;
            case "update":
                updateCartQty(req, resp);
                break;
            case "remove":
                removeFromCart(req, resp);
                break;
            case "clear":
                clearCart(req, resp);
                break;
            case "view":
            default:
                req.getRequestDispatcher("/WEB-INF/jsp/cart.jsp").forward(req, resp);
                break;
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        doGet(req, resp);
    }

    @SuppressWarnings("unchecked")
    private List<CartItem> getCartFromSession(HttpSession session) {
        List<CartItem> cart = (List<CartItem>) session.getAttribute("cart");
        if (cart == null) {
            cart = new ArrayList<>();
            session.setAttribute("cart", cart);
        }
        return cart;
    }

    private void addToCart(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String bookId = req.getParameter("bookId");
        HttpSession session = req.getSession();
        List<CartItem> cart = getCartFromSession(session);

        Book book = bookDao.findById(bookId);
        if (book != null) {
            boolean found = false;
            for (CartItem item : cart) {
                if (item.getBookId().equals(bookId)) {
                    // 库存上限防护
                    if (item.getQuantity() < book.getStock()) {
                        item.setQuantity(item.getQuantity() + 1);
                    }
                    found = true;
                    break;
                }
            }
            if (!found) {
                cart.add(new CartItem(book.getId(), book.getTitle(), book.getCoverImage(), book.getPrice(), 1));
            }
        }
        // 重定向回购物车详情页，防止表单重复提交
        resp.sendRedirect(req.getContextPath() + "/cart");
    }

    private void updateCartQty(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String bookId = req.getParameter("bookId");
        int qty = Integer.parseInt(req.getParameter("qty"));
        
        HttpSession session = req.getSession();
        List<CartItem> cart = getCartFromSession(session);

        Book book = bookDao.findById(bookId);
        if (book != null && qty > 0) {
            for (CartItem item : cart) {
                if (item.getBookId().equals(bookId)) {
                    // 库存防护校验
                    item.setQuantity(Math.min(qty, book.getStock()));
                    break;
                }
            }
        }
        resp.sendRedirect(req.getContextPath() + "/cart");
    }

    private void removeFromCart(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String bookId = req.getParameter("bookId");
        HttpSession session = req.getSession();
        List<CartItem> cart = getCartFromSession(session);

        cart.removeIf(item -> item.getBookId().equals(bookId));
        resp.sendRedirect(req.getContextPath() + "/cart");
    }

    private void clearCart(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpSession session = req.getSession();
        session.removeAttribute("cart");
        resp.sendRedirect(req.getContextPath() + "/cart");
    }
}