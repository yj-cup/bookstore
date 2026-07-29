package com.bookstore.servlet;

import com.bookstore.dao.BookDao;
import com.bookstore.dao.OrderDao;
import com.bookstore.entity.Book;
import com.bookstore.entity.CartItem;
import com.bookstore.entity.Order;
import com.bookstore.entity.OrderItem;
import com.bookstore.entity.User;
import com.bookstore.util.AuthorizationUtil;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class OrderServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private final OrderDao orderDao;
    private final BookDao bookDao;

    public OrderServlet() {
        this(new OrderDao(), new BookDao());
    }

    OrderServlet(OrderDao orderDao, BookDao bookDao) {
        this.orderDao = orderDao;
        this.bookDao = bookDao;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String action = req.getParameter("action");

        if ("listAllOrders".equals(action)) {
            if (!AuthorizationUtil.requireAdmin(req, resp)) {
                return;
            }
            // Admin API: 获取所有订单
            List<Order> orders = orderDao.findAll();
            writeJson(resp, "{\"success\":true,\"orders\":[" + ordersToJson(orders) + "]}");
            return;
        }

        HttpSession session = req.getSession();
        User currentUser = (User) session.getAttribute("currentUser");

        if ("list".equals(action) || action == null) {
            if (isAjax(req)) {
                if (currentUser == null) {
                    writeJson(resp, "{\"success\":false,\"message\":\"未登录\"}");
                    return;
                }
                List<Order> orders = orderDao.findByUserId(currentUser.getId());
                writeJson(resp, "{\"success\":true,\"orders\":[" + ordersToJson(orders) + "]}");
            } else {
                if (currentUser == null) {
                    resp.sendRedirect(req.getContextPath() + "/auth?action=loginView");
                    return;
                }
                List<Order> orders = orderDao.findByUserId(currentUser.getId());
                req.setAttribute("orders", orders);
                req.getRequestDispatcher("/WEB-INF/jsp/orders.jsp").forward(req, resp);
            }
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String action = req.getParameter("action");

        if ("placeOrder".equals(action)) {
            handlePlaceOrder(req, resp);
        } else if ("updateOrderStatus".equals(action)) {
            handleUpdateOrderStatus(req, resp);
        } else if ("deleteOrder".equals(action)) {
            handleDeleteOrder(req, resp);
        } else if ("cancelOrder".equals(action)) {
            handleCancelOrder(req, resp);
        } else {
            // Legacy JSP flow
            handleLegacyPlaceOrder(req, resp);
        }
    }

    private void handlePlaceOrder(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpSession session = req.getSession();
        User currentUser = (User) session.getAttribute("currentUser");

        if (currentUser == null) {
            writeJson(resp, "{\"success\":false,\"message\":\"需要登录才能下单\"}");
            return;
        }

        // 解析收货信息
        String receiverName = req.getParameter("receiverName");
        String phone = req.getParameter("phone");
        String qq = req.getParameter("qq");
        String idCard = req.getParameter("idCard");
        String email = req.getParameter("email");
        String address = req.getParameter("address");

        if (receiverName == null || receiverName.trim().isEmpty() ||
            phone == null || !phone.matches("^1[3-9]\\d{9}$") ||
            idCard == null || !idCard.matches("^\\d{17}[0-9Xx]$") ||
            address == null || address.trim().isEmpty()) {
            writeJson(resp, "{\"success\":false,\"message\":\"收货人信息不合法，请检查手机号和身份证格式\"}");
            return;
        }

        // 仅接收图书ID和数量；价格、标题及封面必须从数据库加载。
        Order order = new Order();
        String orderId = "ORDER_" + new SimpleDateFormat("yyyyMMdd").format(new Date()) + (int)(Math.random() * 9000 + 1000);
        order.setId(orderId);
        order.setUserId(currentUser.getId());
        order.setUsername(currentUser.getUsername());
        order.setReceiverName(receiverName.trim());
        order.setPhone(phone.trim());
        order.setQq(qq != null ? qq.trim() : "");
        order.setIdCard(idCard.trim());
        order.setEmail(email != null ? email.trim() : "");
        order.setShippingAddress(address.trim());
        order.setStatus("Pending");
        order.setOrderTime(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));

        double totalAmount = 0;
        Set<String> seenBookIds = new HashSet<>();
        for (int i = 0; i < 100; i++) {
            String bookId = req.getParameter("itemBookId_" + i);
            if (bookId == null) break;
            bookId = bookId.trim();
            int qty = parseInt(req.getParameter("itemQty_" + i), 0);
            if (!seenBookIds.add(bookId)) {
                writeJson(resp, "{\"success\":false,\"message\":\"订单中包含重复图书\"}");
                return;
            }

            OrderItem item;
            try {
                item = createCanonicalOrderItem(bookId, qty);
            } catch (IllegalArgumentException invalidItem) {
                writeJson(resp, "{\"success\":false,\"message\":\"" + esc(invalidItem.getMessage()) + "\"}");
                return;
            }
            order.getItems().add(item);
            totalAmount += item.getBookPrice() * item.getQuantity();
        }

        if (order.getItems().isEmpty()) {
            writeJson(resp, "{\"success\":false,\"message\":\"购物车为空，无法下单\"}");
            return;
        }
        order.setTotalAmount(totalAmount);

        boolean success = orderDao.saveOrderWithTransaction(order);
        if (success) {
            session.removeAttribute("cart");
            writeJson(resp, "{\"success\":true,\"message\":\"订单提交成功\",\"orderId\":\"" + orderId + "\"}");
        } else {
            writeJson(resp, "{\"success\":false,\"message\":\"下单失败：库存不足或数据库错误\"}");
        }
    }

    private void handleUpdateOrderStatus(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!AuthorizationUtil.requireAdmin(req, resp)) {
            return;
        }
        String id = req.getParameter("id");
        String status = req.getParameter("status");
        if (!isAllowedOrderStatus(status)) {
            writeJson(resp, "{\"success\":false,\"message\":\"订单状态不合法\"}");
            return;
        }
        if (orderDao.updateStatus(id, status)) {
            writeJson(resp, "{\"success\":true,\"message\":\"订单状态已更新\"}");
        } else {
            writeJson(resp, "{\"success\":false,\"message\":\"更新失败\"}");
        }
    }

    private void handleDeleteOrder(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!AuthorizationUtil.requireAdmin(req, resp)) {
            return;
        }
        String id = req.getParameter("id");
        if (orderDao.delete(id)) {
            writeJson(resp, "{\"success\":true,\"message\":\"订单已删除\"}");
        } else {
            writeJson(resp, "{\"success\":false,\"message\":\"删除失败\"}");
        }
    }

    private void handleCancelOrder(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpSession session = req.getSession();
        User currentUser = (User) session.getAttribute("currentUser");

        if (currentUser == null) {
            writeJson(resp, "{\"success\":false,\"message\":\"需要登录才能取消订单\"}");
            return;
        }

        String orderId = req.getParameter("id");
        if (orderId == null || orderId.trim().isEmpty()) {
            writeJson(resp, "{\"success\":false,\"message\":\"订单ID不能为空\"}");
            return;
        }

        // 查询订单，校验归属权和状态
        Order order = orderDao.findById(orderId.trim());
        if (order == null) {
            writeJson(resp, "{\"success\":false,\"message\":\"订单不存在\"}");
            return;
        }

        // 安全校验：只能取消自己的订单
        if (!order.getUserId().equals(currentUser.getId())) {
            writeJson(resp, "{\"success\":false,\"message\":\"无权取消他人的订单\"}");
            return;
        }

        // 业务规则：只有待发货(Pending)状态的订单才能被用户取消
        if (!"Pending".equals(order.getStatus())) {
            writeJson(resp, "{\"success\":false,\"message\":\"当前订单状态不可取消（仅待发货状态可取消）\"}");
            return;
        }

        boolean success = orderDao.updateStatus(orderId.trim(), "Cancelled");
        if (success) {
            writeJson(resp, "{\"success\":true,\"message\":\"订单已取消，库存已恢复\"}");
        } else {
            writeJson(resp, "{\"success\":false,\"message\":\"取消订单失败，请稍后重试\"}");
        }
    }

    // Legacy JSP flow
    private void handleLegacyPlaceOrder(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession();
        User currentUser = (User) session.getAttribute("currentUser");

        if (currentUser == null) {
            resp.sendRedirect(req.getContextPath() + "/auth?action=loginView");
            return;
        }

        @SuppressWarnings("unchecked")
        List<CartItem> cart = (List<CartItem>) session.getAttribute("cart");
        if (cart == null || cart.isEmpty()) {
            req.setAttribute("cart_error", "您的购物车空空如也，无法进行结账！");
            req.getRequestDispatcher("/WEB-INF/jsp/cart.jsp").forward(req, resp);
            return;
        }

        String receiverName = req.getParameter("receiverName");
        String phone = req.getParameter("phone");
        String qq = req.getParameter("qq");
        String idCard = req.getParameter("idCard");
        String email = req.getParameter("email");
        String address = req.getParameter("address");

        if (receiverName == null || receiverName.trim().isEmpty() ||
            phone == null || !phone.matches("^1[3-9]\\d{9}$") ||
            idCard == null || !idCard.matches("^\\d{17}[0-9Xx]$") ||
            address == null || address.trim().isEmpty()) {
            req.setAttribute("checkout_error", "下单失败：收货人信息不合法！");
            req.getRequestDispatcher("/WEB-INF/jsp/cart.jsp").forward(req, resp);
            return;
        }

        String orderId = "ORDER_" + new SimpleDateFormat("yyyyMMdd").format(new Date()) + (int)(Math.random() * 9000 + 1000);
        Order order = new Order();
        order.setId(orderId);
        order.setUserId(currentUser.getId());
        order.setUsername(currentUser.getUsername());
        order.setReceiverName(receiverName.trim());
        order.setPhone(phone.trim());
        order.setQq(qq != null ? qq.trim() : "");
        order.setIdCard(idCard.trim());
        order.setEmail(email != null ? email.trim() : "");
        order.setShippingAddress(address.trim());
        order.setStatus("Pending");
        order.setOrderTime(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));

        double totalAmount = 0;
        for (CartItem item : cart) {
            OrderItem detail;
            try {
                detail = createCanonicalOrderItem(item.getBookId(), item.getQuantity());
            } catch (IllegalArgumentException invalidItem) {
                req.setAttribute("checkout_error", "下单失败：" + invalidItem.getMessage());
                req.getRequestDispatcher("/WEB-INF/jsp/cart.jsp").forward(req, resp);
                return;
            }
            order.getItems().add(detail);
            totalAmount += detail.getBookPrice() * detail.getQuantity();
        }
        order.setTotalAmount(totalAmount);

        boolean success = orderDao.saveOrderWithTransaction(order);
        if (success) {
            session.removeAttribute("cart");
            resp.sendRedirect(req.getContextPath() + "/order?action=list");
        } else {
            req.setAttribute("checkout_error", "下单失败：库存不足！");
            req.getRequestDispatcher("/WEB-INF/jsp/cart.jsp").forward(req, resp);
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

    private int parseInt(String s, int defaultVal) {
        if (s == null || s.trim().isEmpty()) return defaultVal;
        try { return Integer.parseInt(s.trim()); } catch (NumberFormatException e) { return defaultVal; }
    }

    OrderItem createCanonicalOrderItem(String bookId, int quantity) {
        if (bookId == null || bookId.trim().isEmpty()) {
            throw new IllegalArgumentException("图书ID不能为空");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("购买数量必须大于0");
        }

        Book book = bookDao.findById(bookId.trim());
        if (book == null) {
            throw new IllegalArgumentException("图书不存在");
        }
        return new OrderItem(
            book.getId(),
            book.getTitle(),
            book.getCoverImage(),
            book.getPrice(),
            quantity
        );
    }

    private boolean isAllowedOrderStatus(String status) {
        return "Pending".equals(status)
            || "Shipped".equals(status)
            || "Completed".equals(status)
            || "Cancelled".equals(status);
    }

    private String ordersToJson(List<Order> orders) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < orders.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(orderToJson(orders.get(i)));
        }
        return sb.toString();
    }

    private String orderToJson(Order o) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":\"").append(esc(o.getId())).append("\",");
        sb.append("\"userId\":\"").append(esc(o.getUserId())).append("\",");
        sb.append("\"username\":\"").append(esc(o.getUsername())).append("\",");
        sb.append("\"userRole\":\"").append(esc(o.getUserRole())).append("\",");
        sb.append("\"totalAmount\":").append(o.getTotalAmount()).append(",");
        sb.append("\"status\":\"").append(esc(o.getStatus())).append("\",");
        sb.append("\"orderTime\":\"").append(esc(o.getOrderTime())).append("\",");
        // Details
        sb.append("\"details\":{");
        sb.append("\"idCard\":\"").append(esc(o.getIdCard())).append("\",");
        sb.append("\"qq\":\"").append(esc(o.getQq())).append("\",");
        sb.append("\"phone\":\"").append(esc(o.getPhone())).append("\",");
        sb.append("\"email\":\"").append(esc(o.getEmail())).append("\",");
        sb.append("\"shippingAddress\":\"").append(esc(o.getShippingAddress())).append("\",");
        sb.append("\"receiverName\":\"").append(esc(o.getReceiverName())).append("\"");
        sb.append("},");
        // Items
        sb.append("\"items\":[");
        List<OrderItem> items = o.getItems();
        for (int j = 0; j < items.size(); j++) {
            if (j > 0) sb.append(",");
            OrderItem it = items.get(j);
            sb.append("{");
            sb.append("\"bookId\":\"").append(esc(it.getBookId())).append("\",");
            sb.append("\"bookTitle\":\"").append(esc(it.getBookTitle())).append("\",");
            sb.append("\"bookCover\":\"").append(esc(it.getBookCover())).append("\",");
            sb.append("\"bookPrice\":").append(it.getBookPrice()).append(",");
            sb.append("\"quantity\":").append(it.getQuantity());
            sb.append("}");
        }
        sb.append("]");
        sb.append("}");
        return sb.toString();
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
