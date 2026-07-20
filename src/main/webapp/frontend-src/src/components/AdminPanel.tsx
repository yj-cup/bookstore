import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, ShoppingBag, Users, Plus, Edit3, Trash2, Search, Filter, 
  Eye, Check, X, ShieldAlert, BookOpenCheck, Settings, CheckCircle, Save,
  Clock, Package, Truck, Wallet, TrendingUp, MapPin, Phone, Mail, CreditCard,
  UserCircle, FileText, Boxes
} from 'lucide-react';
import { Book, Order, User, Category } from '../types';

interface AdminPanelProps {
  books: Book[];
  orders: Order[];
  users: User[];
  onAddBook: (book: Book) => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  onUpdateOrderStatus: (id: string, status: Order['status']) => void;
  onDeleteOrder: (id: string) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onRefreshBooks?: () => void;
  addLog: (type: 'JDBC' | 'FILTER' | 'SERVLET' | 'JSP', message: string, query?: string) => void;
}

export default function AdminPanel({
  books,
  orders,
  users,
  onAddBook,
  onEditBook,
  onDeleteBook,
  onUpdateOrderStatus,
  onDeleteOrder,
  onEditUser,
  onDeleteUser,
  onRefreshBooks,
  addLog
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'books' | 'orders' | 'users'>('books');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Book CRUD Modal/State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    category: 'Literature' as Category,
    price: 45.0,
    stock: 10,
    description: '',
    coverImage: ''
  });

  // User Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    phone: '',
    email: '',
    qq: '',
    idCard: ''
  });

  // View Order detail state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Pagination states
  const [bookPage, setBookPage] = useState(1);
  const itemsPerPage = 5;

  // Filter books
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || book.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalBookPages = Math.ceil(filteredBooks.length / itemsPerPage) || 1;
  const paginatedBooks = filteredBooks.slice((bookPage - 1) * itemsPerPage, bookPage * itemsPerPage);

  // Filter orders
  const filteredOrders = orders.filter(order => 
    order.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter users
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.phone.includes(searchQuery)
  );

  // Book actions
  const handleOpenAddBook = () => {
    setEditingBook(null);
    setBookForm({
      title: '',
      author: '',
      category: 'Literature',
      price: 49.00,
      stock: 15,
      description: '',
      coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'
    });
    setIsBookModalOpen(true);
  };

  const handleOpenEditBook = (book: Book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      category: book.category as Category,
      price: book.price,
      stock: book.stock,
      description: book.description,
      coverImage: book.coverImage
    });
    setIsBookModalOpen(true);
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBook) {
      const updated: Book = {
        ...editingBook,
        ...bookForm
      };
      onEditBook(updated);
      addLog('SERVLET', `AdminBookServlet: 修改图书 [${updated.title}] 信息成功`);
      addLog('JDBC', `更新图书表 t_books`, 
        `UPDATE t_books SET title='${updated.title}', author='${updated.author}', category='${updated.category}', price=${updated.price}, stock=${updated.stock} WHERE id='${updated.id}'`
      );
    } else {
      const newBook: Book = {
        id: 'b_' + Math.random().toString(36).substr(2, 9),
        ...bookForm,
        rating: 4.5
      };
      onAddBook(newBook);
      addLog('SERVLET', `AdminBookServlet: 新增图书 [${newBook.title}] 成功并上架入库`);
      addLog('JDBC', `插入新图书记录`, 
        `INSERT INTO t_books (id, title, author, category, price, stock, description, cover_image, rating) \nVALUES ('${newBook.id}', '${newBook.title}', '${newBook.author}', '${newBook.category}', ${newBook.price}, ${newBook.stock}, '${newBook.description}', '${newBook.coverImage}', 4.5)`
      );
    }
    setIsBookModalOpen(false);
  };

  const handleBookDelete = (id: string, title: string) => {
    if (window.confirm(`确定要彻底删除图书 《${title}》 吗？此操作不可逆！`)) {
      onDeleteBook(id);
      addLog('SERVLET', `AdminBookServlet: 下架并物理删除图书 [${title}]`);
      addLog('JDBC', `从图书表中删除记录`, `DELETE FROM t_books WHERE id='${id}'`);
    }
  };

  // User actions
  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      phone: user.phone,
      email: user.email,
      qq: user.qq,
      idCard: user.idCard
    });
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // Validate email / phone regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^1[3-9]\d{9}$/;
    const qqRegex = /^[1-9][0-9]{4,10}$/;

    if (!emailRegex.test(userForm.email) || !phoneRegex.test(userForm.phone) || !qqRegex.test(userForm.qq)) {
      alert('请输入合法的邮箱、QQ和手机号格式（满足 Regex 验证）');
      return;
    }

    const updatedUser: User = {
      ...editingUser,
      ...userForm
    };

    onEditUser(updatedUser);
    setEditingUser(null);
    addLog('SERVLET', `AdminUserServlet: 修改用户 [${updatedUser.username}] 档案成功`);
    addLog('JDBC', `更新用户表 t_users`, 
      `UPDATE t_users SET phone='${updatedUser.phone}', email='${updatedUser.email}', qq='${updatedUser.qq}', id_card='${updatedUser.idCard}' WHERE id='${updatedUser.id}'`
    );
  };

  const handleUserDelete = (id: string, username: string) => {
    if (id === 'admin_1') {
      alert('系统超级管理员账户禁止删除！');
      return;
    }
    if (window.confirm(`确认删除用户 [${username}] 吗？\n\n删除后：\n1. 该用户的所有数据将从数据库中彻底删除\n2. 该用户的待处理订单将被自动取消\n3. 该用户的已完成/已发货订单仍会保留（显示为用户已删除）\n4. 此操作不可恢复！`)) {
      onDeleteUser(id);
      addLog('SERVLET', `AdminUserServlet: 彻底删除用户 [${username}] 档案（硬删除）`);
      addLog('JDBC', `删除用户并取消待处理订单`, `UPDATE t_orders SET status='Cancelled' WHERE user_id='${id}' AND status='Pending'; DELETE FROM t_users WHERE id='${id}';`);
    }
  };

  // Order actions
  const handleOrderStatusUpdate = (id: string, currentStatus: Order['status'], newStatus: Order['status']) => {
    onUpdateOrderStatus(id, newStatus);
    // 如果订单被取消,需要刷新图书库存
    if (newStatus === 'Cancelled') {
      onRefreshBooks?.();
    }
    addLog('SERVLET', `AdminOrderServlet: 变更订单 [${id}] 状态: ${currentStatus} ➔ ${newStatus}`);
    addLog('JDBC', `更新订单状态`, `UPDATE t_orders SET status='${newStatus}' WHERE id='${id}'`);
  };

  const handleOrderDelete = (id: string) => {
    if (window.confirm(`确定要彻底删除订单 ${id} 吗？`)) {
      onDeleteOrder(id);
      setSelectedOrder(null);
      // 删除订单后需要刷新图书库存
      onRefreshBooks?.();
      addLog('SERVLET', `AdminOrderServlet: 彻底物理删除订单 ${id}`);
      addLog('JDBC', `级联删除订单及详情`, `DELETE FROM t_order_items WHERE order_id='${id}';\nDELETE FROM t_orders WHERE id='${id}';`);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10 font-sans relative">
      {/* Subtle admin background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(30deg, #4f46e5 12%, transparent 12.5%, transparent 87%, #4f46e5 87.5%, #4f46e5),
            linear-gradient(150deg, #4f46e5 12%, transparent 12.5%, transparent 87%, #4f46e5 87.5%, #4f46e5),
            linear-gradient(30deg, #4f46e5 12%, transparent 12.5%, transparent 87%, #4f46e5 87.5%, #4f46e5),
            linear-gradient(150deg, #4f46e5 12%, transparent 12.5%, transparent 87%, #4f46e5 87.5%, #4f46e5)
          `,
          backgroundSize: '80px 140px',
          backgroundPosition: '0 0, 0 0, 40px 70px, 40px 70px'
        }}
      />
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                后台运营管理中心
                <span className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 font-mono px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-900/40">
                  Servlet & JDBC Control Panel
                </span>
              </h1>
              <p className="text-slate-500 text-xs mt-1">负责图书库存、所有用户交易、出货、订单退单等物理数据运营工作</p>
            </div>
          </div>

          {/* Module Tab Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700/50 self-start md:self-auto">
            <button
              onClick={() => { setActiveTab('books'); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                activeTab === 'books'
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>图书库管理</span>
            </button>
            <button
              onClick={() => { setActiveTab('orders'); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                activeTab === 'orders'
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>全网订单管理</span>
            </button>
            <button
              onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                activeTab === 'users'
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>会员用户管理</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Search and Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'books' ? '搜索图书标题、作者名称...' : 
                activeTab === 'orders' ? '搜索订单ID、买家用户名...' : '搜索会员用户名、联系电话...'
              }
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
            {activeTab === 'books' && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 focus:outline-none text-slate-700 dark:text-slate-300 font-semibold"
                >
                  <option value="ALL">全部图书分类</option>
                  <option value="Literature">文学经典</option>
                  <option value="Science">前沿科学</option>
                  <option value="Technology">计算机技术</option>
                  <option value="Business">商业财经</option>
                  <option value="Children">儿童文学</option>
                </select>
              </div>
            )}

            {activeTab === 'books' && (
              <button
                onClick={handleOpenAddBook}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>录入新图书</span>
              </button>
            )}
          </div>
        </div>

        {/* --- Module 1: Book Management --- */}
        {activeTab === 'books' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 font-semibold text-xs border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4 pl-6">图书封面 / 详情</th>
                    <th className="p-4">分类</th>
                    <th className="p-4 font-mono">零售价格</th>
                    <th className="p-4">库存状态</th>
                    <th className="p-4">评分</th>
                    <th className="p-4 text-center pr-6">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  {paginatedBooks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                        未检索到匹配的馆藏图书，请修改关键词或添加新图书。
                      </td>
                    </tr>
                  ) : (
                    paginatedBooks.map((book) => (
                      <tr key={book.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex gap-3.5 items-center">
                            <img 
                              src={book.coverImage} 
                              alt={book.title} 
                              className="h-14 w-10 object-cover rounded shadow-sm bg-slate-100"
                            />
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-900 dark:text-white truncate max-w-sm text-sm">
                                {book.title}
                              </h3>
                              <p className="text-slate-400 text-[11px] mt-0.5">作者: {book.author} | ID: {book.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 dark:bg-slate-850 dark:text-slate-300 font-semibold rounded text-[10px]">
                            {book.category}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-300">
                          ¥{book.price.toFixed(2)}
                        </td>
                        <td className="p-4">
                          {book.stock === 0 ? (
                            <span className="text-rose-500 font-bold flex items-center gap-1">
                              ● 已售罄 (需补货)
                            </span>
                          ) : (
                            <span className="text-slate-700 dark:text-slate-300">
                              {book.stock} 册
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-amber-500 font-semibold">★ {book.rating}</td>
                        <td className="p-4 pr-6">
                          <div className="flex items-center justify-center gap-2.5">
                            <button
                              onClick={() => handleOpenEditBook(book)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-all"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleBookDelete(book.id, book.title)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalBookPages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-950/20">
                <span className="text-slate-400">
                  当前显示第 {(bookPage - 1) * itemsPerPage + 1} - {Math.min(bookPage * itemsPerPage, filteredBooks.length)} 条，共 {filteredBooks.length} 条图书
                </span>
                
                <div className="flex gap-1.5">
                  <button
                    disabled={bookPage === 1}
                    onClick={() => setBookPage(bookPage - 1)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 disabled:opacity-40"
                  >
                    上一页
                  </button>
                  <span className="px-3 py-1.5 text-slate-500 font-semibold">
                    {bookPage} / {totalBookPages}
                  </span>
                  <button
                    disabled={bookPage === totalBookPages}
                    onClick={() => setBookPage(bookPage + 1)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 disabled:opacity-40"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Module 2: Order Management --- */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            
            {/* Order Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Orders */}
              <div className="stat-card bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl">
                    <Boxes className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono block">{filteredOrders.length}</span>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">订单总数</p>
              </div>
              {/* Pending */}
              <div className="stat-card bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
                </div>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono block">
                  {filteredOrders.filter(o => o.status === 'Pending').length}
                </span>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">待发货</p>
              </div>
              {/* Completed */}
              <div className="stat-card bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono block">
                  {filteredOrders.filter(o => o.status === 'Completed').length}
                </span>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">已完成</p>
              </div>
              {/* Total Revenue */}
              <div className="stat-card bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl">
                    <Wallet className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                </div>
                <span className="text-xl font-extrabold text-rose-500 font-mono block">
                  ¥{filteredOrders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.totalAmount, 0).toFixed(0)}
                </span>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">总营收额</p>
              </div>
            </div>

            {/* Orders Table + Detail Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
            {/* Order Table list */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 font-semibold text-xs border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4 pl-6">订单编号 / 时间</th>
                      <th className="p-4">买家</th>
                      <th className="p-4 font-mono">交易额</th>
                      <th className="p-4">当前状态</th>
                      <th className="p-4 text-center pr-6">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-16 text-center">
                          <div className="flex flex-col items-center gap-3 text-slate-400">
                            <ShoppingBag className="h-10 w-10 opacity-20" />
                            <span className="font-medium">全网暂无成交订单纪录</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr 
                          key={order.id} 
                          className={`hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-all cursor-pointer ${selectedOrder?.id === order.id ? 'bg-indigo-50/50 dark:bg-indigo-950/15 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'}`}
                          onClick={() => {
                            setSelectedOrder(order);
                            addLog('SERVLET', `AdminOrderServlet: 查看订单详情: ${order.id}`);
                          }}
                        >
                          <td className="p-4 pl-6">
                            <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                              {order.id}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                              <Clock className="h-3 w-3" />
                              {new Date(order.orderTime).toLocaleString()}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {order.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{order.username}</div>
                                {order.userRole === 'disabled' && (
                                  <span className="text-[9px] text-rose-500 font-bold">已禁用</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                              ¥{order.totalAmount.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full border ${
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
                              {order.status === 'Shipped' && '已发货'}
                              {order.status === 'Completed' && '已完成'}
                              {order.status === 'Cancelled' && '已取消'}
                            </span>
                          </td>
                          <td className="p-4 pr-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-all"
                                title="查看详情"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleOrderDelete(order.id)}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                                title="删除订单"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order details panel view */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              {selectedOrder ? (
                <div className="flex flex-col">
                  {/* Detail Header */}
                  <div className={`px-4 py-2.5 border-b border-slate-150 dark:border-slate-800 ${
                    selectedOrder.status === 'Pending' ? 'bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20' :
                    selectedOrder.status === 'Shipped' ? 'bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/20' :
                    selectedOrder.status === 'Completed' ? 'bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/20' :
                    'bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">订单明细看板</h3>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                        selectedOrder.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40' :
                        selectedOrder.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40' :
                        selectedOrder.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40' :
                        'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          selectedOrder.status === 'Pending' ? 'bg-amber-500 animate-pulse' :
                          selectedOrder.status === 'Shipped' ? 'bg-blue-500' :
                          selectedOrder.status === 'Completed' ? 'bg-emerald-500' :
                          'bg-slate-400'
                        }`} />
                        {selectedOrder.status === 'Pending' && '待发货'}
                        {selectedOrder.status === 'Shipped' && '已发货'}
                        {selectedOrder.status === 'Completed' && '已完成'}
                        {selectedOrder.status === 'Cancelled' && '已取消'}
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">{selectedOrder.id}</div>
                  </div>

                  {/* Scrollable content area */}
                  <div className="overflow-y-auto p-3 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                    {/* Customer info card */}
                    <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                        {selectedOrder.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{selectedOrder.username}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(selectedOrder.orderTime).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-slate-400">实付总额</div>
                        <div className="font-mono font-extrabold text-rose-500 text-sm">¥{selectedOrder.totalAmount.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Shipping Recipient details */}
                    <div className="space-y-1.5">
                      <h4 className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-xs">
                        <UserCircle className="h-3 w-3 text-indigo-500" />
                        买家收件信息
                      </h4>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] leading-relaxed bg-slate-50 dark:bg-slate-950/30 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 shrink-0">收货人:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{selectedOrder.details.receiverName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{selectedOrder.details.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 shrink-0">QQ:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{selectedOrder.details.qq}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate" title={selectedOrder.details.idCard}>
                            {selectedOrder.details.idCard}
                          </span>
                        </div>
                        <div className="col-span-2 flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{selectedOrder.details.email}</span>
                        </div>
                        <div className="col-span-2 flex items-start gap-1.5 pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-800">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                          <span className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{selectedOrder.details.shippingAddress}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items list */}
                    <div className="space-y-1.5">
                      <h4 className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-xs">
                        <Package className="h-3 w-3 text-indigo-500" />
                        购买图书明细
                        <span className="ml-auto text-[10px] text-slate-400 font-normal">共 {selectedOrder.items.length} 种</span>
                      </h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5">
                        {selectedOrder.items.map(item => (
                          <div key={item.bookId} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/20 p-1.5 border border-slate-100 dark:border-slate-850 rounded-lg">
                            <img 
                              src={item.book.coverImage} 
                              alt={item.book.title}
                              className="h-8 w-6 object-cover rounded shadow-sm bg-slate-100 dark:bg-slate-800 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-slate-700 dark:text-slate-300 truncate text-[11px]" title={item.book.title}>《{item.book.title}》</div>
                              <div className="text-[9px] text-slate-400">¥{item.book.price.toFixed(2)} × {item.quantity}</div>
                            </div>
                            <span className="font-mono text-[9px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                              ¥{(item.book.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action states changer */}
                  {selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Completed' && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                      <h4 className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-[11px] mb-1.5">
                        <Truck className="h-3 w-3 text-indigo-500" />
                        更新订单物流进度
                      </h4>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handleOrderStatusUpdate(selectedOrder.id, selectedOrder.status, 'Shipped')}
                          className="flex items-center justify-center gap-1 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          <Truck className="h-3 w-3" />
                          确认发货
                        </button>
                        <button
                          onClick={() => handleOrderStatusUpdate(selectedOrder.id, selectedOrder.status, 'Completed')}
                          className="flex items-center justify-center gap-1 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          <CheckCircle className="h-3 w-3" />
                          标记完成
                        </button>
                        <button
                          onClick={() => handleOrderStatusUpdate(selectedOrder.id, selectedOrder.status, 'Cancelled')}
                          className="flex items-center justify-center gap-1 py-2 bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 rounded-lg text-[11px] font-semibold col-span-2 transition-all cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                          取消本笔订单
                        </button>
                      </div>
                    </div>
                  )}
                  {(selectedOrder.status === 'Cancelled' || selectedOrder.status === 'Completed') && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                      <div className="py-2 text-center text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-950/30 rounded-lg border border-slate-200 dark:border-slate-800">
                        {selectedOrder.status === 'Cancelled' ? '🔒 订单已取消，无法进行任何操作' : '✅ 订单已完成，无法进行任何操作'}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl">
                    <Eye className="h-8 w-8 opacity-40" />
                  </div>
                  <span className="text-xs font-medium max-w-[200px] text-center leading-relaxed">点击左侧订单行查看详细档案信息并进行物流发货等控制</span>
                </div>
              )}
            </div>
            </div>
          </div>
        )}

        {/* --- Module 3: User Management --- */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* User List Table */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 font-semibold text-xs border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4 pl-6">注册用户名 / 权限</th>
                      <th className="p-4">手机号码</th>
                      <th className="p-4">电子邮箱</th>
                      <th className="p-4">注册时间</th>
                      <th className="p-4 text-center pr-6">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    {filteredUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors cursor-pointer ${editingUser?.id === user.id ? 'bg-indigo-50/40 dark:bg-indigo-950/10' : ''}`}
                        onClick={() => {
                          handleOpenEditUser(user);
                          addLog('SERVLET', `AdminUserServlet: 获取用户 [${user.username}] 档案用于修改`);
                        }}
                      >
                        <td className="p-4 pl-6">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">{user.username}</span>
                            {user.role === 'admin' ? (
                              <span className="ml-2 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-[9px] px-1.5 py-0.2 rounded font-semibold font-mono">
                                Admin
                              </span>
                            ) : (
                              <span className="ml-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[9px] px-1.5 py-0.2 rounded">
                                User
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">ID: {user.id}</div>
                        </td>
                        <td className="p-4 font-mono font-semibold">{user.phone}</td>
                        <td className="p-4">{user.email}</td>
                        <td className="p-4">{new Date(user.registeredAt).toLocaleDateString()}</td>
                        <td className="p-4 pr-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditUser(user)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-all"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              disabled={user.role === 'admin'}
                              onClick={() => handleUserDelete(user.id, user.username)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded disabled:opacity-30 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Edit Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm pb-3 border-b border-slate-150 dark:border-slate-800 mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4 text-indigo-500" />
                会员档案修改面板
              </h3>

              {editingUser ? (
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div className="text-xs text-slate-500">
                    正在编辑用户：<span className="font-bold text-slate-800 dark:text-white">{editingUser.username}</span>
                  </div>

                  {/* ID Card */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      身份证
                    </label>
                    <input
                      type="text"
                      required
                      value={userForm.idCard}
                      onChange={(e) => setUserForm(prev => ({ ...prev, idCard: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all text-xs"
                    />
                  </div>

                  {/* QQ */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      QQ号码
                    </label>
                    <input
                      type="text"
                      required
                      value={userForm.qq}
                      onChange={(e) => setUserForm(prev => ({ ...prev, qq: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all text-xs"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      联系电话
                    </label>
                    <input
                      type="text"
                      required
                      value={userForm.phone}
                      onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all text-xs"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      邮箱
                    </label>
                    <input
                      type="email"
                      required
                      value={userForm.email}
                      onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all text-xs"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      <span>保存修改 (Regex 验证)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs transition-all"
                    >
                      取消
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-20 text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Users className="h-8 w-8 opacity-30" />
                  <span>请点击左侧表格中任一会员，即可在此快速编辑其核心安全档案。</span>
                </div>
              )}
            </div>
          </div>
        )}

        </div>

      {/* --- Book CRUD Modal Dialog --- */}
      <AnimatePresence>
        {isBookModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Dark blur backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between z-10"
            >
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-950/40 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-950 dark:text-white text-base flex items-center gap-2">
                {editingBook ? (
                  <> <Edit3 className="h-4 w-4 text-indigo-500" /> 修改图书 ➔ 《{editingBook.title}》</>
                ) : (
                  <> <Plus className="h-4 w-4 text-indigo-500" /> 录入新图书到虚拟数据库</>
                )}
              </h3>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="p-6 space-y-4 text-xs">
              {/* Title & Author */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    图书标题
                  </label>
                  <input
                    type="text"
                    required
                    value={bookForm.title}
                    onChange={(e) => setBookForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="请输入书籍标题"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    作者名称
                  </label>
                  <input
                    type="text"
                    required
                    value={bookForm.author}
                    onChange={(e) => setBookForm(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="署名作者"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all text-xs"
                  />
                </div>
              </div>

              {/* Category, Price & Stock */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    分类标签
                  </label>
                  <select
                    value={bookForm.category}
                    onChange={(e) => setBookForm(prev => ({ ...prev, category: e.target.value as Category }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                  >
                    <option value="Literature">文学经典</option>
                    <option value="Science">前沿科学</option>
                    <option value="Technology">计算机技术</option>
                    <option value="Business">商业财经</option>
                    <option value="Children">儿童文学</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    零售价
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={bookForm.price}
                    onChange={(e) => setBookForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    初始库存
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={bookForm.stock}
                    onChange={(e) => setBookForm(prev => ({ ...prev, stock: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Cover URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  封面网络 URL 地址
                </label>
                <input
                  type="url"
                  required
                  value={bookForm.coverImage}
                  onChange={(e) => setBookForm(prev => ({ ...prev, coverImage: e.target.value }))}
                  placeholder="请输入图片外链"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  图书简要梗概描述
                </label>
                <textarea
                  rows={3}
                  required
                  value={bookForm.description}
                  onChange={(e) => setBookForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="输入图书核心梗概介绍（限100字）"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {editingBook ? (
                    <><Save className="h-4 w-4" /> 确认更新图书数据</>
                  ) : (
                    <><Plus className="h-4 w-4" /> 录入图书库入库</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all active:scale-95"
                >
                  关闭
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    </div>
  );
}
