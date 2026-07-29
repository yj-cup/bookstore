import React, { useState, useEffect } from 'react';
import { 
  BookMarked, Sparkles, Filter, Search, SlidersHorizontal, BookOpen, 
  HelpCircle, ChevronLeft, ChevronRight, Terminal, ClipboardList, XCircle,
  Clock, Package, MapPin, Phone, Mail, CreditCard, CheckCircle, Truck, ShoppingBag
} from 'lucide-react';
import { motion } from 'motion/react';
import { INITIAL_BOOKS } from './data/mockBooks';
import { Book, User, CartItem, Order, LogEntry, OrderDetails } from './types';
import Navbar from './components/Navbar';
import BookCard from './components/BookCard';
import AuthModal from './components/AuthModal';
import CartModal from './components/CartModal';
import AdminPanel from './components/AdminPanel';

export default function App() {
  // Core Data States
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // UI Display States
  const [activeTab, setActiveTab] = useState<'books' | 'orders' | 'admin'>('books');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('DEFAULT');
  const [bookPage, setBookPage] = useState<number>(1);
  const booksPerPage = 6;

  // Modals Visibility
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);

  // Active Logged-in Session (default: not logged in, user needs to login)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load users and books from backend MySQL on mount
  useEffect(() => {
    const fetchInitData = async () => {
      // 检查当前用户登录状态
      try {
        const res = await fetch('/bookstore/auth?action=getCurrentUser', {
          headers: { 'Accept': 'application/json' }, credentials: 'include'
        });
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser({
            id: data.user.id, username: data.user.username, role: data.user.role,
            idCard: data.user.idCard, qq: data.user.qq, phone: data.user.phone, email: data.user.email,
            registeredAt: ''
          });
        }
      } catch (err) { console.warn('Failed to check current user:', err); }

      // 加载用户列表
      try {
        const res = await fetch('/bookstore/auth?action=listUsers', {
          headers: { 'Accept': 'application/json' }, credentials: 'include'
        });
        const data = await res.json();
        if (data.success && data.users) {
          setUsers(data.users.map((u: any) => ({
            id: u.id, username: u.username, role: u.role,
            idCard: u.idCard, qq: u.qq, phone: u.phone, email: u.email,
            registeredAt: ''
          })));
        }
      } catch (err) { console.warn('Failed to load users:', err); }

      // 加载图书列表
      try {
        const res = await fetch('/bookstore/books', {
          headers: { 'Accept': 'application/json' }, credentials: 'include'
        });
        const data = await res.json();
        if (data.success && data.books) {
          setBooks(data.books);
        }
      } catch (err) { console.warn('Failed to load books:', err); }
    };
    fetchInitData();
  }, []);

  // 加载订单列表
  const fetchOrders = async () => {
    try {
      const res = await fetch('/bookstore/order?action=list', {
        headers: { 'Accept': 'application/json' }, credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders.map((o: any) => ({
          id: o.id, userId: o.userId, username: o.username, userRole: o.userRole,
          totalAmount: o.totalAmount, status: o.status, orderTime: o.orderTime,
          details: o.details || { idCard: '', qq: '', phone: '', email: '', shippingAddress: '', receiverName: '' },
          items: (o.items || []).map((it: any) => ({
            bookId: it.bookId,
            book: { id: it.bookId, title: it.bookTitle, author: '', category: '', price: it.bookPrice, stock: 0, description: '', coverImage: it.bookCover, rating: 0 },
            quantity: it.quantity
          }))
        })));
      }
    } catch (err) { console.warn('Failed to load orders:', err); }
  };

  // 加载所有订单（管理员）
  const fetchAllOrders = async () => {
    try {
      const res = await fetch('/bookstore/order?action=listAllOrders', {
        headers: { 'Accept': 'application/json' }, credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders.map((o: any) => ({
          id: o.id, userId: o.userId, username: o.username, userRole: o.userRole,
          totalAmount: o.totalAmount, status: o.status, orderTime: o.orderTime,
          details: o.details || { idCard: '', qq: '', phone: '', email: '', shippingAddress: '', receiverName: '' },
          items: (o.items || []).map((it: any) => ({
            bookId: it.bookId,
            book: { id: it.bookId, title: it.bookTitle, author: '', category: '', price: it.bookPrice, stock: 0, description: '', coverImage: it.bookCover, rating: 0 },
            quantity: it.quantity
          }))
        })));
      }
    } catch (err) { console.warn('Failed to load all orders:', err); }
  };

  // 加载图书列表（刷新用）
  const fetchBooks = async () => {
    try {
      const res = await fetch('/bookstore/books', {
        headers: { 'Accept': 'application/json' }, credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.books) setBooks(data.books);
    } catch (err) { console.warn('Failed to refresh books:', err); }
  };

  // Load orders when switching to orders/admin tabs
  useEffect(() => {
    if (activeTab === 'orders' && currentUser) {
      fetchOrders();
    } else if (activeTab === 'admin' && currentUser?.role === 'admin') {
      fetchAllOrders();
    }
  }, [activeTab]);

  // Logging engine entries
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'log_boot_1',
      timestamp: new Date(Date.now() - 5000).toLocaleTimeString(),
      type: 'FILTER',
      message: 'CharacterEncodingFilter: 字符编码拦截器注册成功 (已强制统一采用 UTF-8 编码避免乱码)'
    },
    {
      id: 'log_boot_2',
      timestamp: new Date(Date.now() - 4000).toLocaleTimeString(),
      type: 'FILTER',
      message: 'SecurityFilter: 系统权限拦截器已挂载成功，当前拦截路径规则: /admin/*'
    },
    {
      id: 'log_boot_3',
      timestamp: new Date(Date.now() - 3000).toLocaleTimeString(),
      type: 'JDBC',
      message: 'DBUtil: 成功建立虚拟持久化 JDBC 连接池 (URL: jdbc:mysql://localhost:3306/db_bookstore)',
      query: 'SHOW TABLES IN db_bookstore'
    },
    {
      id: 'log_boot_4',
      timestamp: new Date(Date.now() - 2000).toLocaleTimeString(),
      type: 'SERVLET',
      message: 'BookServlet: 预装载图书，成功拉取 8 种热销书籍记录。正在触发JSP标签动态页面编译'
    },
    {
      id: 'log_boot_5',
      timestamp: new Date().toLocaleTimeString(),
      type: 'JSP',
      message: 'JSP编译引擎: 成功在客户端解析 /WEB-INF/jsp/books.jsp (已成功运用 JSTL core 标签及 EL 表达式)'
    }
  ]);

  const addLog = (type: LogEntry['type'], message: string, query?: string) => {
    const newEntry: LogEntry = {
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      query
    };
    setLogs(prev => [newEntry, ...prev]);
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('SERVLET', '控制台日志已被清空');
  };

  // Auth Handlers
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    addLog('FILTER', `LoginFilter: 拦截并检查当前用户 [${user.username}] 会话并建立 HTTP Session 实体`);
    
    // Auto shift view based on logged in user role
    if (user.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('books');
    }
  };

  const handleLogout = () => {
    // 调用后端注销 API
    fetch('/bookstore/auth?action=logout', {
      headers: { 'Accept': 'application/json' }, credentials: 'include'
    }).catch(() => {});
    setCurrentUser(null);
    setCart([]);
    setActiveTab('books');
    addLog('SERVLET', 'LogoutServlet: 已销毁客户端 Session 信息并重定向到主页');
  };

  // Cart operations
  const handleAddToCart = (book: Book) => {
    setCart(prev => {
      const existing = prev.find(item => item.bookId === book.id);
      if (existing) {
        if (existing.quantity >= book.stock) {
          addLog('SERVLET', `CartServlet: 图书 [${book.title}] 添加购物车失败 - 物理库存不足 (当前限额 ${book.stock} 册)`);
          return prev;
        }
        addLog('SERVLET', `CartServlet: 更新已有商品数量 -> 《${book.title}》 x ${existing.quantity + 1}`);
        return prev.map(item => item.bookId === book.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      addLog('SERVLET', `CartServlet: 新增商品入购物车 JavaBean ➔ 《${book.title}》`);
      return [...prev, { bookId: book.id, book, quantity: 1 }];
    });
  };

  const handleUpdateCartQty = (bookId: string, qty: number) => {
    setCart(prev => prev.map(item => item.bookId === bookId ? { ...item, quantity: qty } : item));
  };

  const handleRemoveCartItem = (bookId: string) => {
    setCart(prev => prev.filter(item => item.bookId !== bookId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Place Order Transaction - 调用后端 API
  const handleSubmitOrder = async (details: OrderDetails) => {
    if (cart.length === 0) return;

    const orderTotal = cart.reduce((sum, item) => sum + item.book.price * item.quantity, 0);

    // Logging ACID transaction operations
    addLog('SERVLET', `OrderServlet: 收取购物车 JavaBean 明细, 调起 OrderDao 进行强一致性多表事务插入...`);
    addLog('JDBC', `开启手动连接事务 (conn.setAutoCommit(false))`);

    // 构建表单参数（包含购物车商品索引格式）
    const params = new URLSearchParams({
      action: 'placeOrder',
      receiverName: details.receiverName,
      phone: details.phone,
      qq: details.qq,
      idCard: details.idCard,
      email: details.email,
      address: details.shippingAddress
    });
    // 添加购物车商品索引参数
    cart.forEach((item, i) => {
      params.append(`itemBookId_${i}`, item.bookId);
      params.append(`itemQty_${i}`, String(item.quantity));
    });

    try {
      const res = await fetch('/bookstore/order', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include',
        body: params.toString()
      });
      const data = await res.json();
      if (data.success) {
        addLog('JDBC', `1. 向 t_orders 写入订单主表信息`,
          `INSERT INTO t_orders (id, user_id, total_amount, status, order_time, id_card, address, phone, receiver_name) VALUES ('${data.orderId}', '${currentUser?.id}', ${orderTotal}, 'Pending', NOW(), '${details.idCard}', '${details.shippingAddress}', '${details.phone}', '${details.receiverName}')`
        );
        cart.forEach(item => {
          addLog('JDBC', `2. 向 t_order_items 级联写入销售详情`,
            `INSERT INTO t_order_items (order_id, book_id, book_title, quantity, book_price) VALUES ('${data.orderId}', '${item.bookId}', '${item.book.title}', ${item.quantity}, ${item.book.price})`
          );
          addLog('JDBC', `3. 并发安全锁：扣减图书表 t_books 中的物理库存`,
            `UPDATE t_books SET stock = stock - ${item.quantity} WHERE id='${item.bookId}' AND stock >= ${item.quantity}`
          );
        });
        addLog('JDBC', `提交连接事务： conn.commit() ➔ 级联记录写入成功！数据落盘。`);

        // 刷新订单和图书库存
        fetchOrders();
        fetchBooks();
        setCart([]);
      } else {
        addLog('SERVLET', `OrderServlet: 下单失败 - ${data.message}`);
        alert('下单失败：' + data.message);
      }
    } catch (err) {
      addLog('SERVLET', `OrderServlet: 请求后端失败 - ${err}`);
      alert('网络错误，无法提交订单');
    }
  };

  // Admin Book handlers - 调用后端 API
  const handleAddBook = async (newBook: Book) => {
    const params = new URLSearchParams({
      action: 'addBook', title: newBook.title, author: newBook.author,
      category: newBook.category, price: String(newBook.price), stock: String(newBook.stock),
      description: newBook.description, coverImage: newBook.coverImage, rating: String(newBook.rating)
    });
    try {
      const res = await fetch('/bookstore/books', {
        method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include', body: params.toString()
      });
      const data = await res.json();
      if (data.success) { fetchBooks(); }
    } catch (err) { console.warn('Add book failed:', err); }
  };

  const handleEditBook = async (updatedBook: Book) => {
    const params = new URLSearchParams({
      action: 'editBook', id: updatedBook.id, title: updatedBook.title, author: updatedBook.author,
      category: updatedBook.category, price: String(updatedBook.price), stock: String(updatedBook.stock),
      description: updatedBook.description, coverImage: updatedBook.coverImage, rating: String(updatedBook.rating)
    });
    try {
      const res = await fetch('/bookstore/books', {
        method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include', body: params.toString()
      });
      const data = await res.json();
      if (data.success) { fetchBooks(); }
    } catch (err) { console.warn('Edit book failed:', err); }
  };

  const handleDeleteBook = async (id: string) => {
    try {
      const res = await fetch('/bookstore/books', {
        method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include', body: new URLSearchParams({ action: 'deleteBook', id }).toString()
      });
      const data = await res.json();
      if (data.success) { fetchBooks(); }
    } catch (err) { console.warn('Delete book failed:', err); }
  };

  // Admin User handlers - 调用后端 API
  const handleEditUser = async (updatedUser: User) => {
    const params = new URLSearchParams({
      action: 'updateUser', id: updatedUser.id, role: updatedUser.role,
      idCard: updatedUser.idCard, qq: updatedUser.qq, phone: updatedUser.phone, email: updatedUser.email
    });
    try {
      const res = await fetch('/bookstore/auth', {
        method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include', body: params.toString()
      });
      const data = await res.json();
      if (data.success) {
        // 刷新用户列表
        const listRes = await fetch('/bookstore/auth?action=listUsers', { headers: { 'Accept': 'application/json' }, credentials: 'include' });
        const listData = await listRes.json();
        if (listData.success) setUsers(listData.users.map((u: any) => ({ id: u.id, username: u.username, role: u.role, idCard: u.idCard, qq: u.qq, phone: u.phone, email: u.email, registeredAt: '' })));
      }
    } catch (err) { console.warn('Edit user failed:', err); }
    if (currentUser?.id === updatedUser.id) setCurrentUser(updatedUser);
  };

  const handleDeleteUser = async (id: string) => {
    try {
      // 真正删除用户（从数据库中删除）
      const res = await fetch('/bookstore/auth', {
        method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include', body: new URLSearchParams({ action: 'deleteUser', id }).toString()
      });
      const data = await res.json();
      if (data.success) {
        // 刷新用户列表
        const listRes = await fetch('/bookstore/auth?action=listUsers', { headers: { 'Accept': 'application/json' }, credentials: 'include' });
        const listData = await listRes.json();
        if (listData.success) setUsers(listData.users.map((u: any) => ({ id: u.id, username: u.username, role: u.role, idCard: u.idCard, qq: u.qq, phone: u.phone, email: u.email, registeredAt: '' })));
        // 刷新订单列表（因为待处理订单已被取消）
        fetchAllOrders();
        alert('用户已成功删除！');
      } else {
        alert('删除失败：' + data.message);
      }
    } catch (err) { console.warn('Delete user failed:', err); }
  };

  // User Cancel Order - 调用后端 API（普通用户取消订单）
  const handleCancelOrder = async (id: string) => {
    try {
      const res = await fetch('/bookstore/order', {
        method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include', body: new URLSearchParams({ action: 'cancelOrder', id }).toString()
      });
      const data = await res.json();
      if (data.success) {
        addLog('SERVLET', `OrderServlet: 用户取消订单 [${id}]，库存已恢复`);
        fetchOrders();
      } else {
        addLog('SERVLET', `OrderServlet: 取消订单失败 - ${data.message}`);
        alert('取消失败：' + data.message);
      }
    } catch (err) { console.warn('Cancel order failed:', err); }
  };

  // Admin Order handlers - 调用后端 API
  const handleUpdateOrderStatus = async (id: string, status: Order['status']) => {
    try {
      const res = await fetch('/bookstore/order', {
        method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include', body: new URLSearchParams({ action: 'updateOrderStatus', id, status }).toString()
      });
      const data = await res.json();
      if (data.success) { fetchAllOrders(); }
    } catch (err) { console.warn('Update order status failed:', err); }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      const res = await fetch('/bookstore/order', {
        method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include', body: new URLSearchParams({ action: 'deleteOrder', id }).toString()
      });
      const data = await res.json();
      if (data.success) { fetchAllOrders(); }
    } catch (err) { console.warn('Delete order failed:', err); }
  };

  // Category selection handler with log
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setBookPage(1);
    addLog('SERVLET', `BookServlet: 用户浏览分类 [${category === 'ALL' ? '全部分类' : category}]，执行对应索引检索`);
    if (category !== 'ALL') {
      addLog('JDBC', `条件查询对应图书`, `SELECT * FROM t_books WHERE category='${category}' AND stock > 0`);
    } else {
      addLog('JDBC', `查询所有非空库存图书`, `SELECT * FROM t_books WHERE stock > 0`);
    }
  };

  // Book filtering and sorting logic
  const filteredBooks = books.filter(book => {
    const matchesCategory = selectedCategory === 'ALL' || book.category === selectedCategory;
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          book.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === 'PRICE_LOW') return a.price - b.price;
    if (sortBy === 'PRICE_HIGH') return b.price - a.price;
    if (sortBy === 'RATING') return b.rating - a.rating;
    return 0; // default order
  });

  const totalBookPages = Math.ceil(sortedBooks.length / booksPerPage) || 1;
  const paginatedBooks = sortedBooks.slice((bookPage - 1) * booksPerPage, bookPage * booksPerPage);

  // User's specific orders list
  const userOrders = orders.filter(o => o.userId === currentUser?.id);

  return (
    <div className="min-h-screen bg-page text-slate-900 dark:text-slate-100 flex flex-col transition-colors relative overflow-hidden">

      {/* Rich Background Layers */}
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />
      <div className="bg-blob bg-blob-4" />
      <div className="bg-blob bg-blob-5" />
      <div className="bg-grid-overlay" />
      <div className="bg-particles" />
      <div className="bg-noise" />
      
      {/* Dynamic Header Navbar */}
      <Navbar 
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConsoleOpen={isConsoleOpen}
        setIsConsoleOpen={() => setIsConsoleOpen(!isConsoleOpen)}
        addLog={addLog}
      />

      {/* --- Main Contents Container --- */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- View 1: Main Online Store --- */}
        {activeTab === 'books' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-8"
          >
            
            {/* Hero Banner with Animated Gradient */}
            <div className="relative rounded-3xl p-8 md:p-12 text-white shadow-2xl overflow-hidden border border-white/10 animate-gradient-shift"
              style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #1e1b4b 50%, #312e81 75%, #1e1b4b 100%)',
                backgroundSize: '200% 200%'
              }}
            >
              {/* Decorative floating orbs */}
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-float-slow pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl animate-float pointer-events-none" style={{animationDelay: '2s'}} />

              {/* Book icon decoration */}
              <div className="absolute top-0 right-0 opacity-[0.06] pointer-events-none transform translate-x-12 -translate-y-12">
                <BookMarked className="h-96 w-96 text-white" />
              </div>

              {/* Subtle grid pattern */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                  backgroundSize: '32px 32px'
                }}
              />

              <div className="relative z-10 max-w-2xl space-y-5">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-xs font-semibold text-indigo-200">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                  <span>2026 雅阁馆藏新学季特惠活动</span>
                  <span className="ml-1 px-1.5 py-0.5 bg-rose-500/30 text-rose-200 rounded-full text-[10px] font-bold">NEW</span>
                </div>

                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                  格物致知
                  <span className="block text-2xl md:text-3xl font-bold text-indigo-300/80 mt-1 tracking-wider">雅室墨香</span>
                </h1>

                <p className="text-sm text-indigo-200/70 max-w-md leading-relaxed hidden md:block">
                  精选海量优质图书，涵盖文学经典、前沿科学、计算机技术等多元领域，为每一位书友提供极致的阅读探索体验。
                </p>
              </div>
            </div>


            {/* Layout Splitter: Filter Sidebar and Books Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Category selector list sidebar */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Category Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-4 card-hover">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-3 border-b border-slate-150 dark:border-slate-800 flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg">
                      <Filter className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span>馆藏图书分类</span>
                  </h3>

                  <div className="flex flex-col gap-1.5 text-xs">
                    {[
                      { key: 'ALL', label: '全部馆藏图书', icon: '📚' },
                      { key: 'Literature', label: '文学经典', icon: '📖' },
                      { key: 'Science', label: '前沿科学', icon: '🔬' },
                      { key: 'Technology', label: '计算机技术', icon: '💻' },
                      { key: 'Business', label: '商业财经', icon: '💼' },
                      { key: 'Children', label: '儿童文学', icon: '🧒' }
                    ].map(cat => (
                      <button
                        key={cat.key}
                        onClick={() => handleCategorySelect(cat.key)}
                        className={`w-full text-left px-3.5 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2.5 ${
                          selectedCategory === cat.key
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15 scale-[1.02]'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60 hover:scale-[1.01]'
                        }`}
                      >
                        <span className="text-sm">{cat.icon}</span>
                        <span>{cat.label}</span>
                        {selectedCategory === cat.key && (
                          <span className="ml-auto h-1.5 w-1.5 bg-white rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sorters and search card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-4 card-hover">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-3 border-b border-slate-150 dark:border-slate-800 flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg">
                      <SlidersHorizontal className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span>条件筛选与搜索</span>
                  </h3>

                  {/* Search text input */}
                  <div className="space-y-1.5 text-xs">
                    <label className="text-slate-500 font-semibold flex items-center gap-1">
                      <Search className="h-3 w-3" />
                      全文检索
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setBookPage(1);
                        }}
                        placeholder="书籍标题 / 作者..."
                        className="w-full pl-4 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Sort selection dropdown */}
                  <div className="space-y-1.5 text-xs">
                    <label className="text-slate-500 font-semibold flex items-center gap-1">
                      <SlidersHorizontal className="h-3 w-3" />
                      价格及评分排序
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        paddingRight: '2.25rem'
                      }}
                    >
                      <option value="DEFAULT">默认入库推荐</option>
                      <option value="PRICE_LOW">按售价：从低到高</option>
                      <option value="PRICE_HIGH">按售价：从高到低</option>
                      <option value="RATING">按书友评分：从高到低</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Books listing grid section */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Header indicators */}
                <div className="flex justify-between items-center text-xs bg-white dark:bg-slate-900 rounded-xl px-4 py-3 border border-slate-200/60 dark:border-slate-800 shadow-sm">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                    检索到 <b className="text-indigo-600 dark:text-indigo-400 mx-0.5">{sortedBooks.length}</b> 册在库图书
                  </span>
                  <span className="text-slate-400 italic hidden sm:inline">每页显示 {booksPerPage} 册</span>
                </div>

                {/* Books Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {paginatedBooks.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-slate-400 font-medium bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 flex flex-col items-center gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl">
                        <Search className="h-10 w-10 opacity-30" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">暂无匹配书籍</p>
                        <p className="text-xs text-slate-400">没有找到符合该筛选条件的馆藏书籍，请修改关键字重试。</p>
                      </div>
                    </div>
                  ) : (
                    paginatedBooks.map((book) => (
                      <BookCard 
                        key={book.id}
                        book={book}
                        onAddToCart={handleAddToCart}
                        addLog={addLog}
                      />
                    ))
                  )}
                </div>

                {/* Pagination footer */}
                {totalBookPages > 1 && (
                  <div className="flex justify-center items-center gap-4 pt-6 text-xs select-none">
                    <button
                      disabled={bookPage === 1}
                      onClick={() => setBookPage(bookPage - 1)}
                      className="flex items-center gap-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all font-semibold text-slate-600 dark:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">上一页</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalBookPages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          onClick={() => setBookPage(p)}
                          className={`h-8 w-8 rounded-lg text-xs font-bold transition-all page-btn ${
                            p === bookPage
                              ? 'page-btn-active bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button
                      disabled={bookPage === totalBookPages}
                      onClick={() => setBookPage(bookPage + 1)}
                      className="flex items-center gap-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all font-semibold text-slate-600 dark:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <span className="hidden sm:inline">下一页</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

              </div>

            </div>

          </motion.div>
        )}

        {/* --- View 2: User's Private Orders History --- */}
        {activeTab === 'orders' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-5 max-w-5xl mx-auto"
          >
            {/* Section Header with summary */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 rounded-xl shadow-sm">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">买家个人订单历史</h2>
                  <p className="text-xs text-slate-400 mt-0.5">查看及追踪您所订购的图书物流配送进度</p>
                </div>
              </div>
              {userOrders.length > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs shadow-sm">
                  <ShoppingBag className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="text-slate-500 font-medium">共</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-base">{userOrders.length}</span>
                  <span className="text-slate-500 font-medium">笔订单</span>
                </div>
              )}
            </div>

            {userOrders.length === 0 ? (
              <div className="py-20 bg-white dark:bg-slate-900 rounded-2xl text-center text-slate-400 font-medium border border-slate-200/60 dark:border-slate-800 flex flex-col items-center justify-center gap-4">
                <div className="p-5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl">
                  <BookOpen className="h-12 w-12 opacity-20" />
                </div>
                <div>
                  <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">暂无订单记录</p>
                  <span className="text-xs">您暂无任何购书交易订单，去前台挑几本好书吧！</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.map((order) => {
                  // Status progress calculation
                  const statusSteps = [
                    { key: 'placed', label: '已下单', icon: CheckCircle, reached: true },
                    { key: 'Pending', label: '待发货', icon: Clock, reached: ['Pending', 'Shipped', 'Completed'].includes(order.status) },
                    { key: 'Shipped', label: '配送中', icon: Truck, reached: ['Shipped', 'Completed'].includes(order.status) },
                    { key: 'Completed', label: '已完成', icon: CheckCircle, reached: order.status === 'Completed' }
                  ];
                  const isCancelled = order.status === 'Cancelled';
                  
                  return (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs card-hover"
                  >
                    {/* Header bar with status badge */}
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-150 dark:border-slate-800/80 flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{order.id}</span>
                        <span className="flex items-center gap-1 text-slate-400 text-[10px]">
                          <Clock className="h-3 w-3" />
                          {new Date(order.orderTime).toLocaleString()}
                        </span>
                        {order.userRole === 'disabled' && (
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 rounded text-[9px] font-bold">
                            用户已禁用
                          </span>
                        )}
                      </div>
                      
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        order.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40' :
                        order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40' :
                        order.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40' :
                        'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          order.status === 'Pending' ? 'bg-amber-500 animate-pulse' :
                          order.status === 'Shipped' ? 'bg-blue-500' :
                          order.status === 'Completed' ? 'bg-emerald-500' :
                          'bg-slate-400'
                        }`} />
                        {order.status === 'Pending' && '待发货'}
                        {order.status === 'Shipped' && '配送中'}
                        {order.status === 'Completed' && '已完成'}
                        {order.status === 'Cancelled' && '已取消'}
                      </span>
                    </div>

                    {/* Status Progress Bar */}
                    {!isCancelled ? (
                      <div className="px-4 py-3 bg-slate-50/30 dark:bg-slate-950/10 border-b border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center justify-between">
                          {statusSteps.map((step, idx) => (
                            <React.Fragment key={step.key}>
                              <div className="flex flex-col items-center gap-1 shrink-0">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                                  step.reached
                                    ? step.key === 'Completed' 
                                      ? 'bg-emerald-500 text-white'
                                      : step.key === 'Shipped'
                                        ? 'bg-blue-500 text-white'
                                        : step.key === 'Pending'
                                          ? 'bg-amber-500 text-white'
                                          : 'bg-indigo-500 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                }`}>
                                  <step.icon className="h-3 w-3" />
                                </div>
                                <span className={`text-[9px] font-semibold ${step.reached ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                                  {step.label}
                                </span>
                              </div>
                              {idx < statusSteps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${
                                  statusSteps[idx + 1].reached ? 'bg-indigo-400' : 'bg-slate-200 dark:bg-slate-700'
                                }`} />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-2.5 bg-rose-50/50 dark:bg-rose-950/10 border-b border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center gap-2 text-[11px] text-rose-500 font-medium">
                          <XCircle className="h-3.5 w-3.5" />
                          此订单已被取消，库存已恢复
                        </div>
                      </div>
                    )}

                    {/* Order contents block */}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Products List detail */}
                      <div className="md:col-span-2 space-y-2">
                        <h4 className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                          <Package className="h-3.5 w-3.5 text-indigo-500" />
                          购买书籍明细
                          <span className="ml-auto text-[10px] text-slate-400 font-normal">{order.items.length} 种 / {order.items.reduce((s,i)=>s+i.quantity,0)} 本</span>
                        </h4>
                        <div className="space-y-2">
                          {order.items.map(item => (
                            <div key={item.bookId} className="flex gap-2.5 items-center">
                              <img 
                                src={item.book.coverImage} 
                                alt={item.book.title} 
                                className="h-11 w-8 object-cover rounded bg-slate-100 shadow-xs shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <h5 className="font-bold text-xs truncate max-w-[260px]">《{item.book.title}》</h5>
                                <p className="text-[10px] text-slate-400 mt-0.5">¥{item.book.price.toFixed(2)} × {item.quantity}</p>
                              </div>
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                                ¥{(item.book.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recipient box */}
                      <div className="bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200/40 dark:border-slate-850 space-y-1.5">
                        <h4 className="font-bold text-slate-850 dark:text-slate-200 text-[11px] border-b border-slate-200/50 dark:border-slate-800 pb-1.5">收货人档案</h4>
                        <div className="space-y-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 shrink-0 w-10">姓名:</span>
                            <span className="font-medium truncate">{order.details.receiverName}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="font-medium truncate">{order.details.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 shrink-0 w-10">QQ:</span>
                            <span className="font-medium truncate">{order.details.qq}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="font-mono truncate" title={order.details.idCard}>{order.details.idCard}</span>
                          </div>
                          <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-1.5 mt-0.5 flex items-start gap-1.5">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                            <span className="font-medium text-slate-700 dark:text-slate-300 leading-tight">{order.details.shippingAddress}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Total billing line */}
                    <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-150 dark:border-slate-800/80 flex justify-between items-center">
                      <span className="text-slate-400 font-medium text-[11px]">共 {order.items.reduce((s,i)=>s+i.quantity,0)} 本书籍</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 mr-1 text-[11px]">实付款合计:</span>
                        <span className="font-mono font-extrabold text-rose-500 text-sm">¥{order.totalAmount.toFixed(2)}</span>
                        {order.status === 'Pending' && (
                          <button
                            onClick={() => {
                              if (confirm(`确认取消订单 ${order.id} 吗？取消后库存将恢复。`)) {
                                handleCancelOrder(order.id);
                              }
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            取消订单
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* --- View 3: Administrative Backend Control panel --- */}
        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <AdminPanel 
              books={books}
              orders={orders}
              users={users}
              onAddBook={handleAddBook}
              onEditBook={handleEditBook}
              onDeleteBook={handleDeleteBook}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onDeleteOrder={handleDeleteOrder}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onRefreshBooks={fetchBooks}
              addLog={addLog}
            />
          </motion.div>
        )}

      </main>

      {/* --- Overlay Modals (Lazy render based on toggle states) --- */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        addLog={addLog}
        users={users}
        setUsers={setUsers}
      />

      <CartModal 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateCartQty={handleUpdateCartQty}
        removeCartItem={handleRemoveCartItem}
        clearCart={handleClearCart}
        currentUser={currentUser}
        submitOrder={handleSubmitOrder}
        addLog={addLog}
        openAuthModal={() => setIsAuthOpen(true)}
      />
    </div>
  );
}
