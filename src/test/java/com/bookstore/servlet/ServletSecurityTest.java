package com.bookstore.servlet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.bookstore.dao.BookDao;
import com.bookstore.dao.OrderDao;
import com.bookstore.dao.UserDao;
import com.bookstore.entity.Book;
import com.bookstore.entity.Order;
import com.bookstore.entity.User;
import java.io.PrintWriter;
import java.io.StringWriter;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class ServletSecurityTest {
    @Test
    void rejectsUnauthenticatedUserManagement() throws Exception {
        UserDao userDao = mock(UserDao.class);
        AuthServlet servlet = new AuthServlet(userDao);
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mockResponse();
        when(request.getParameter("action")).thenReturn("deleteUser");
        when(request.getSession(false)).thenReturn(null);

        servlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verifyNoInteractions(userDao);
    }

    @Test
    void rejectsNonAdminBookMutation() throws Exception {
        BookDao bookDao = mock(BookDao.class);
        BookServlet servlet = new BookServlet(bookDao);
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mockResponse();
        HttpSession session = mock(HttpSession.class);
        User user = new User("u1", "user", null, "user", "", "", "", "");
        when(request.getParameter("action")).thenReturn("deleteBook");
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute("currentUser")).thenReturn(user);

        servlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verifyNoInteractions(bookDao);
    }

    @Test
    void rejectsNonAdminOrderMutation() throws Exception {
        OrderDao orderDao = mock(OrderDao.class);
        OrderServlet servlet = new OrderServlet(orderDao, mock(BookDao.class));
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mockResponse();
        HttpSession session = mock(HttpSession.class);
        User user = new User("u1", "user", null, "user", "", "", "", "");
        when(request.getParameter("action")).thenReturn("updateOrderStatus");
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute("currentUser")).thenReturn(user);

        servlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(orderDao, never()).updateStatus(any(), any());
    }

    @Test
    void pricesOrdersFromServerSideBookData() throws Exception {
        OrderDao orderDao = mock(OrderDao.class);
        BookDao bookDao = mock(BookDao.class);
        OrderServlet servlet = new OrderServlet(orderDao, bookDao);
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mockResponse();
        HttpSession session = mock(HttpSession.class);
        User user = new User("u1", "user", null, "user", "", "", "", "");
        Book canonical = new Book(
            "b1", "Canonical title", "Author", "Novel", 19.99, 10, "", "/cover.jpg", 4.5
        );

        when(request.getSession()).thenReturn(session);
        when(session.getAttribute("currentUser")).thenReturn(user);
        when(request.getParameter("action")).thenReturn("placeOrder");
        when(request.getParameter("receiverName")).thenReturn("Receiver");
        when(request.getParameter("phone")).thenReturn("13800138000");
        when(request.getParameter("idCard")).thenReturn("110101199001011234");
        when(request.getParameter("address")).thenReturn("Address");
        when(request.getParameter("itemBookId_0")).thenReturn("b1");
        when(request.getParameter("itemQty_0")).thenReturn("2");
        when(request.getParameter("itemPrice_0")).thenReturn("0.01");
        when(request.getParameter("itemTitle_0")).thenReturn("Attacker title");
        when(request.getParameter("itemBookId_1")).thenReturn(null);
        when(bookDao.findById("b1")).thenReturn(canonical);
        when(orderDao.saveOrderWithTransaction(any(Order.class))).thenReturn(true);

        servlet.doPost(request, response);

        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(orderDao).saveOrderWithTransaction(orderCaptor.capture());
        Order savedOrder = orderCaptor.getValue();
        assertEquals(39.98, savedOrder.getTotalAmount(), 0.001);
        assertEquals(19.99, savedOrder.getItems().get(0).getBookPrice(), 0.001);
        assertEquals("Canonical title", savedOrder.getItems().get(0).getBookTitle());
        assertTrue(savedOrder.getItems().get(0).getQuantity() > 0);
    }

    @Test
    void rejectsNegativeOrderQuantity() throws Exception {
        OrderDao orderDao = mock(OrderDao.class);
        OrderServlet servlet = new OrderServlet(orderDao, mock(BookDao.class));
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mockResponse();
        HttpSession session = mock(HttpSession.class);
        User user = new User("u1", "user", null, "user", "", "", "", "");

        when(request.getSession()).thenReturn(session);
        when(session.getAttribute("currentUser")).thenReturn(user);
        when(request.getParameter("action")).thenReturn("placeOrder");
        when(request.getParameter("receiverName")).thenReturn("Receiver");
        when(request.getParameter("phone")).thenReturn("13800138000");
        when(request.getParameter("idCard")).thenReturn("110101199001011234");
        when(request.getParameter("address")).thenReturn("Address");
        when(request.getParameter("itemBookId_0")).thenReturn("b1");
        when(request.getParameter("itemQty_0")).thenReturn("-2");

        servlet.doPost(request, response);

        verify(orderDao, never()).saveOrderWithTransaction(any(Order.class));
    }

    private HttpServletResponse mockResponse() throws Exception {
        HttpServletResponse response = mock(HttpServletResponse.class);
        when(response.getWriter()).thenReturn(new PrintWriter(new StringWriter()));
        return response;
    }
}
