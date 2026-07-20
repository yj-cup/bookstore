import React, { useState, useEffect } from 'react';
import { 
  BookOpen, ShoppingCart, ShieldAlert, LogOut, LogIn, UserCheck, 
  Terminal, Home, ClipboardList, BookMarked, User, Sun, Moon, Menu, X
} from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  currentUser: UserType | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenCart: () => void;
  cartCount: number;
  activeTab: 'books' | 'orders' | 'admin';
  setActiveTab: (tab: 'books' | 'orders' | 'admin') => void;
  isConsoleOpen: boolean;
  setIsConsoleOpen: () => void;
  addLog: (type: 'JDBC' | 'FILTER' | 'SERVLET' | 'JSP', message: string, query?: string) => void;
}

export default function Navbar({
  currentUser,
  onLogout,
  onOpenAuth,
  onOpenCart,
  cartCount,
  activeTab,
  setActiveTab,
  isConsoleOpen,
  setIsConsoleOpen,
  addLog
}: NavbarProps) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('bookstore-theme', isDark ? 'dark' : 'light');
    } catch {}
  }, [isDark]);

  const toggleDark = () => setIsDark(prev => !prev);

  const navLinks = (
    <>
      <button
        onClick={() => {
          setActiveTab('books');
          setMobileMenuOpen(false);
          addLog('SERVLET', 'BookServlet: 拦截客户端书籍列表请求，正在加载书籍数据模型');
        }}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all duration-200 nav-tab ${
          activeTab === 'books'
            ? 'nav-tab-active bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <Home className="h-4 w-4" />
        <span>前台图书商城</span>
      </button>

      {currentUser && (
        <button
          onClick={() => {
            setActiveTab('orders');
            setMobileMenuOpen(false);
            addLog('SERVLET', 'OrderServlet: 获取当前买家的订单历史记录');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all duration-200 nav-tab ${
            activeTab === 'orders'
              ? 'nav-tab-active bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>我的订单历史</span>
        </button>
      )}

      {currentUser?.role === 'admin' && (
        <button
          onClick={() => {
            setActiveTab('admin');
            setMobileMenuOpen(false);
            addLog('FILTER', 'SecurityFilter: 检测管理员令牌并授权进入后台管理 Servlet');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all duration-200 nav-tab nav-tab-danger ${
            activeTab === 'admin'
              ? 'nav-tab-active bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm font-bold'
              : 'text-slate-500 hover:text-rose-600 dark:hover:text-rose-400'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>管理系统后台</span>
        </button>
      )}
    </>
  );

  return (
    <nav className="sticky top-0 z-40 glass-heavy border-b border-slate-200/40 dark:border-slate-700/30 shadow-sm transition-all font-sans"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,246,251,0.93) 100%)',
        backdropFilter: 'blur(24px)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Left Side Brand Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setActiveTab('books')}>
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20 group-hover:shadow-indigo-600/30 group-hover:scale-105 transition-all duration-200">
              <BookMarked className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base tracking-wide text-slate-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                在线书屋
              </span>
              <span className="text-[9px] text-slate-400 font-mono tracking-wider block -mt-0.5">
                MVC & JDBC COURSE DESIGN
              </span>
            </div>
          </div>

          {/* Desktop Center Links */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/40 p-1 rounded-xl text-xs font-semibold">
            {navLinks}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDark}
              className="p-2 sm:p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-sm active:scale-95"
              title={isDark ? '切换到亮色模式' : '切换到深色模式'}
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-500" />}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => {
                onOpenCart();
                addLog('SERVLET', 'CartServlet: 打开购物车视图 JavaBean');
              }}
              className="relative p-2 sm:p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-sm active:scale-95"
            >
              <ShoppingCart className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-mono text-[9px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-md shadow-rose-500/30">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Desktop Divider */}
            <span className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-800"></span>

            {/* Login / Profile Logout Control */}
            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/50" />
                    {currentUser.username}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {currentUser.role === 'admin' ? '管理员' : '会员'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    onLogout();
                    addLog('SERVLET', 'LogoutServlet: 清销当前会话 Session 令牌，登出系统');
                  }}
                  className="p-2 sm:p-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 dark:bg-slate-800 dark:hover:bg-rose-950/30 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-sm active:scale-95"
                  title="登出账号"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  addLog('SERVLET', 'AuthServlet: 转向登录及注册页');
                }}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 active:scale-[0.96] transition-all duration-200 cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">登录 / 注册</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="md:hidden p-2 sm:p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 rounded-xl transition-all duration-200 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-4 w-4 text-slate-600 dark:text-slate-300" /> : <Menu className="h-4 w-4 text-slate-600 dark:text-slate-300" />}
            </button>

          </div>

        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-3 border-t border-slate-200 dark:border-slate-800 pt-3">
            <div className="flex flex-col gap-1 bg-slate-100/60 dark:bg-slate-800/40 p-2 rounded-xl text-xs font-semibold">
              {navLinks}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}