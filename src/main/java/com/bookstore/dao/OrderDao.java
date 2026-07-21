package com.bookstore.dao;

import com.bookstore.entity.Order;
import com.bookstore.entity.OrderItem;
import com.bookstore.util.DBUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class OrderDao {

    /**
     * 核心事务结算方法 (ACID 事务控制示范)
     */
    public boolean saveOrderWithTransaction(Order order) {
        Connection conn = null;
        PreparedStatement orderStmt = null;
        PreparedStatement itemStmt = null;
        PreparedStatement stockStmt = null;

        try {
            conn = DBUtil.getConnection();
            // 1. 关闭自动提交，开启 JDBC 级联手动控制事务
            conn.setAutoCommit(false);

            // 2. 级联写入订单主表信息
            String insertOrderSql = "INSERT INTO t_orders (id, user_id, total_amount, status, id_card, receiver_name, phone, qq, email, address, order_time) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            orderStmt = conn.prepareStatement(insertOrderSql);
            orderStmt.setString(1, order.getId());
            orderStmt.setString(2, order.getUserId());
            orderStmt.setDouble(3, order.getTotalAmount());
            orderStmt.setString(4, order.getStatus());
            orderStmt.setString(5, order.getIdCard());
            orderStmt.setString(6, order.getReceiverName());
            orderStmt.setString(7, order.getPhone());
            orderStmt.setString(8, order.getQq());
            orderStmt.setString(9, order.getEmail());
            orderStmt.setString(10, order.getShippingAddress());
            orderStmt.setString(11, order.getOrderTime());
            orderStmt.executeUpdate();

            // 3. 循环批量级联写入订单商品细表
            String insertItemSql = "INSERT INTO t_order_items (order_id, book_id, book_title, book_cover, book_price, quantity) VALUES (?, ?, ?, ?, ?, ?)";
            itemStmt = conn.prepareStatement(insertItemSql);

            // 4. 库存强锁与扣减语句
            String updateStockSql = "UPDATE t_books SET stock = stock - ? WHERE id = ? AND stock >= ?";
            stockStmt = conn.prepareStatement(updateStockSql);

            for (OrderItem item : order.getItems()) {
                // 写入明细
                itemStmt.setString(1, order.getId());
                itemStmt.setString(2, item.getBookId());
                itemStmt.setString(3, item.getBookTitle());
                itemStmt.setString(4, item.getBookCover());
                itemStmt.setDouble(5, item.getBookPrice());
                itemStmt.setInt(6, item.getQuantity());
                itemStmt.executeUpdate();

                // 扣库存 (带原子性防护：stock >= 购买量，防超卖)
                stockStmt.setInt(1, item.getQuantity());
                stockStmt.setString(2, item.getBookId());
                stockStmt.setInt(3, item.getQuantity());
                
                int updatedRows = stockStmt.executeUpdate();
                if (updatedRows == 0) {
                    // 锁库存失败 (由于超发、并发扣量导致库存穿透)，直接主动抛出异常触发回滚
                    throw new SQLException("扣减图书 '" + item.getBookTitle() + "' 库存失败：库存不足，交易失败。");
                }
            }

            // 5. 所有的级联处理均成功，向数据库发起正式的数据落盘提交
            conn.commit();
            return true;

        } catch (SQLException e) {
            e.printStackTrace();
            // 6. 出错时触发事务全回滚，保证脏数据一律不上卷
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException rollbackEx) {
                    rollbackEx.printStackTrace();
                }
            }
            return false;
        } finally {
            // 物理关闭
            DBUtil.close(orderStmt, null);
            DBUtil.close(itemStmt, null);
            DBUtil.close(stockStmt, conn);
        }
    }

    public Order findById(String orderId) {
        Order order = null;
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;

        try {
            conn = DBUtil.getConnection();
            stmt = conn.prepareStatement("SELECT o.*, u.username, u.role as user_role FROM t_orders o LEFT JOIN t_users u ON o.user_id=u.id WHERE o.id = ?");
            stmt.setString(1, orderId);
            rs = stmt.executeQuery();
            if (rs.next()) {
                order = extractOrder(rs);
                order.setItems(queryOrderItems(order.getId()));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            DBUtil.close(rs, stmt, conn);
        }
        return order;
    }

    public List<Order> findByUserId(String userId) {
        List<Order> list = new ArrayList<>();
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;

        try {
            conn = DBUtil.getConnection();
            stmt = conn.prepareStatement("SELECT o.*, u.username, u.role as user_role FROM t_orders o LEFT JOIN t_users u ON o.user_id=u.id WHERE o.user_id=? ORDER BY o.order_time DESC");
            stmt.setString(1, userId);
            rs = stmt.executeQuery();
            while (rs.next()) {
                Order order = extractOrder(rs);
                // 级联拉取订单商品明细
                order.setItems(queryOrderItems(order.getId()));
                list.add(order);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            DBUtil.close(rs, stmt, conn);
        }
        return list;
    }

    public List<Order> findAll() {
        List<Order> list = new ArrayList<>();
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;

        try {
            conn = DBUtil.getConnection();
            stmt = conn.prepareStatement("SELECT o.*, u.username, u.role as user_role FROM t_orders o LEFT JOIN t_users u ON o.user_id=u.id ORDER BY o.order_time DESC");
            rs = stmt.executeQuery();
            while (rs.next()) {
                Order order = extractOrder(rs);
                order.setItems(queryOrderItems(order.getId()));
                list.add(order);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            DBUtil.close(rs, stmt, conn);
        }
        return list;
    }

    public boolean updateStatus(String orderId, String status) {
        Connection conn = null;
        PreparedStatement stmt = null;
        PreparedStatement queryStmt = null;
        ResultSet rs = null;
        try {
            conn = DBUtil.getConnection();

            // 取消订单涉及库存恢复，必须把状态检查、库存恢复和状态更新放在
            // 同一事务中，并锁住订单行，避免并发取消导致库存被重复恢复。
            if ("Cancelled".equals(status)) {
                conn.setAutoCommit(false);

                queryStmt = conn.prepareStatement(
                    "SELECT status FROM t_orders WHERE id = ? FOR UPDATE"
                );
                queryStmt.setString(1, orderId);
                rs = queryStmt.executeQuery();

                if (!rs.next()) {
                    conn.rollback();
                    return false;
                }

                String currentStatus = rs.getString("status");
                rs.close();
                rs = null;
                queryStmt.close();
                queryStmt = null;

                // 获得行锁后再次判断；其他并发请求会在此看到已取消状态。
                if ("Cancelled".equals(currentStatus)) {
                    conn.commit();
                    return true;
                }

                List<OrderItem> items = queryOrderItems(conn, orderId);
                try (PreparedStatement restoreStmt = conn.prepareStatement(
                        "UPDATE t_books SET stock = stock + ? WHERE id = ?")) {
                    for (OrderItem item : items) {
                        restoreStmt.setInt(1, item.getQuantity());
                        restoreStmt.setString(2, item.getBookId());
                        restoreStmt.executeUpdate();
                    }
                }

                stmt = conn.prepareStatement(
                    "UPDATE t_orders SET status = ? WHERE id = ? AND status <> 'Cancelled'"
                );
                stmt.setString(1, status);
                stmt.setString(2, orderId);
                int updatedRows = stmt.executeUpdate();
                if (updatedRows != 1) {
                    conn.rollback();
                    return false;
                }

                conn.commit();
                return true;
            }
            
            // 查询订单当前状态
            queryStmt = conn.prepareStatement("SELECT status FROM t_orders WHERE id = ?");
            queryStmt.setString(1, orderId);
            rs = queryStmt.executeQuery();
            
            if (!rs.next()) {
                return false; // 订单不存在
            }
            
            String currentStatus = rs.getString("status");
            rs.close();
            queryStmt.close();
            
            // 其他状态变更,正常更新
            stmt = conn.prepareStatement("UPDATE t_orders SET status = ? WHERE id = ?");
            stmt.setString(1, status);
            stmt.setString(2, orderId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException rollbackEx) {
                    rollbackEx.printStackTrace();
                }
            }
            return false;
        } finally {
            DBUtil.close(rs, queryStmt, null);
            DBUtil.close(stmt, conn);
        }
    }

    public boolean delete(String orderId) {
        Connection conn = null;
        PreparedStatement stmt = null;
        PreparedStatement itemDeleteStmt = null;
        PreparedStatement queryStmt = null;
        ResultSet rs = null;
        try {
            conn = DBUtil.getConnection();
            conn.setAutoCommit(false);
            
            // 查询订单当前状态,防止重复恢复库存
            queryStmt = conn.prepareStatement("SELECT status FROM t_orders WHERE id = ?");
            queryStmt.setString(1, orderId);
            rs = queryStmt.executeQuery();
            
            if (!rs.next()) {
                return false; // 订单不存在
            }
            
            String currentStatus = rs.getString("status");
            rs.close();
            queryStmt.close();
            
            // 1. 查询订单明细,获取所有书籍及数量
            List<OrderItem> items = queryOrderItems(orderId);
            
            // 2. 只有待处理的订单才需要恢复库存(已完成的订单书籍已卖出，已取消的订单库存已经恢复过了)
            if ("Pending".equals(currentStatus)) {
                String restoreStockSql = "UPDATE t_books SET stock = stock + ? WHERE id = ?";
                PreparedStatement restoreStmt = conn.prepareStatement(restoreStockSql);
                for (OrderItem item : items) {
                    restoreStmt.setInt(1, item.getQuantity());
                    restoreStmt.setString(2, item.getBookId());
                    restoreStmt.executeUpdate();
                }
                restoreStmt.close();
            }
            
            // 3. 删除订单明细
            itemDeleteStmt = conn.prepareStatement("DELETE FROM t_order_items WHERE order_id = ?");
            itemDeleteStmt.setString(1, orderId);
            itemDeleteStmt.executeUpdate();
            
            // 4. 删除订单主表
            stmt = conn.prepareStatement("DELETE FROM t_orders WHERE id = ?");
            stmt.setString(1, orderId);
            stmt.executeUpdate();
            
            conn.commit();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException rollbackEx) {
                    rollbackEx.printStackTrace();
                }
            }
            return false;
        } finally {
            DBUtil.close(rs, queryStmt, null);
            DBUtil.close(itemDeleteStmt, null);
            DBUtil.close(stmt, conn);
        }
    }

    private List<OrderItem> queryOrderItems(String orderId) {
        List<OrderItem> list = new ArrayList<>();
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        try {
            conn = DBUtil.getConnection();
            stmt = conn.prepareStatement("SELECT * FROM t_order_items WHERE order_id = ?");
            stmt.setString(1, orderId);
            rs = stmt.executeQuery();
            while (rs.next()) {
                OrderItem item = new OrderItem();
                item.setId(rs.getInt("id"));
                item.setOrderId(rs.getString("order_id"));
                item.setBookId(rs.getString("book_id"));
                item.setBookTitle(rs.getString("book_title"));
                item.setBookCover(rs.getString("book_cover"));
                item.setBookPrice(rs.getDouble("book_price"));
                item.setQuantity(rs.getInt("quantity"));
                list.add(item);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            // 注意这里不关闭最外层 conn 避免级联查询失败，或使用池连接
            DBUtil.close(rs, stmt, conn);
        }
        return list;
    }

    /**
     * 在调用方事务的同一连接中查询订单明细，保证取消订单时读取到一致数据。
     */
    private List<OrderItem> queryOrderItems(Connection conn, String orderId) throws SQLException {
        List<OrderItem> list = new ArrayList<>();
        String sql = "SELECT * FROM t_order_items WHERE order_id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, orderId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    OrderItem item = new OrderItem();
                    item.setId(rs.getInt("id"));
                    item.setOrderId(rs.getString("order_id"));
                    item.setBookId(rs.getString("book_id"));
                    item.setBookTitle(rs.getString("book_title"));
                    item.setBookCover(rs.getString("book_cover"));
                    item.setBookPrice(rs.getDouble("book_price"));
                    item.setQuantity(rs.getInt("quantity"));
                    list.add(item);
                }
            }
        }
        return list;
    }

    private Order extractOrder(ResultSet rs) throws SQLException {
        Order order = new Order();
        order.setId(rs.getString("id"));
        order.setUserId(rs.getString("user_id"));
        order.setUsername(rs.getString("username"));
        order.setUserRole(rs.getString("user_role"));
        order.setTotalAmount(rs.getDouble("total_amount"));
        order.setStatus(rs.getString("status"));
        order.setIdCard(rs.getString("id_card"));
        order.setReceiverName(rs.getString("receiver_name"));
        order.setPhone(rs.getString("phone"));
        order.setQq(rs.getString("qq"));
        order.setEmail(rs.getString("email"));
        order.setShippingAddress(rs.getString("address"));
        order.setOrderTime(rs.getString("order_time"));
        return order;
    }
}
