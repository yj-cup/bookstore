package com.bookstore.dao;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class OrderDaoConcurrencyTest {
    private String jdbcUrl;

    @BeforeEach
    void createDatabase() throws Exception {
        jdbcUrl = "jdbc:h2:mem:" + UUID.randomUUID()
            + ";MODE=MySQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=5000";
        try (Connection connection = DriverManager.getConnection(jdbcUrl);
             Statement statement = connection.createStatement()) {
            statement.execute("CREATE TABLE t_books (id VARCHAR(50) PRIMARY KEY, stock INT NOT NULL)");
            statement.execute(
                "CREATE TABLE t_orders (id VARCHAR(50) PRIMARY KEY, status VARCHAR(20) NOT NULL)"
            );
            statement.execute(
                "CREATE TABLE t_order_items ("
                    + "id INT AUTO_INCREMENT PRIMARY KEY, order_id VARCHAR(50) NOT NULL, "
                    + "book_id VARCHAR(50) NOT NULL, book_title VARCHAR(255) NOT NULL, "
                    + "book_cover VARCHAR(512), book_price DECIMAL(10,2) NOT NULL, quantity INT NOT NULL)"
            );
            statement.execute("INSERT INTO t_books (id, stock) VALUES ('b1', 5)");
            statement.execute("INSERT INTO t_orders (id, status) VALUES ('o1', 'Pending')");
            statement.execute(
                "INSERT INTO t_order_items "
                    + "(order_id, book_id, book_title, book_cover, book_price, quantity) "
                    + "VALUES ('o1', 'b1', 'Book', '', 10.00, 2)"
            );
        }
    }

    @Test
    void concurrentCancellationRestoresStockOnce() throws Exception {
        OrderDao dao = new OrderDao(() -> DriverManager.getConnection(jdbcUrl));
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            Future<Boolean> first = executor.submit(() -> cancelTogether(dao, ready, start));
            Future<Boolean> second = executor.submit(() -> cancelTogether(dao, ready, start));
            assertTrue(ready.await(5, TimeUnit.SECONDS));
            start.countDown();

            assertTrue(first.get(10, TimeUnit.SECONDS));
            assertTrue(second.get(10, TimeUnit.SECONDS));
        } finally {
            executor.shutdownNow();
        }

        try (Connection connection = DriverManager.getConnection(jdbcUrl);
             Statement statement = connection.createStatement()) {
            ResultSet stock = statement.executeQuery("SELECT stock FROM t_books WHERE id = 'b1'");
            assertTrue(stock.next());
            assertEquals(7, stock.getInt(1));

            ResultSet status = statement.executeQuery("SELECT status FROM t_orders WHERE id = 'o1'");
            assertTrue(status.next());
            assertEquals("Cancelled", status.getString(1));
        }
    }

    private boolean cancelTogether(OrderDao dao, CountDownLatch ready, CountDownLatch start)
            throws Exception {
        ready.countDown();
        start.await(5, TimeUnit.SECONDS);
        return dao.updateStatus("o1", "Cancelled");
    }
}
