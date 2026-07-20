import React, { useState } from 'react';
import { ShoppingCart, Eye, Star, BookOpen, AlertCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Book } from '../types';

interface BookCardProps {
  key?: React.Key;
  book: Book;
  onAddToCart: (book: Book) => void;
  addLog: (type: 'JDBC' | 'FILTER' | 'SERVLET' | 'JSP', message: string, query?: string) => void;
}

export default function BookCard({ book, onAddToCart, addLog }: BookCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(book);
    addLog('SERVLET', `CartServlet: 用户直接点击将 [${book.title}] 加入购物车`);
  };

  const handleOpenDetail = () => {
    setIsDetailOpen(true);
    addLog('JSP', `JSP 视图解析: 动态载入书籍 [${book.title}] 的详细数据模型`);
    addLog('JDBC', `单书查询`, `SELECT * FROM t_books WHERE id='${book.id}' LIMIT 1`);
  };

  return (
    <>
      {/* Book Grid Card Component */}
      <motion.div
        id={`book-card-${book.id}`}
        onClick={handleOpenDetail}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="group relative bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all duration-300 cursor-pointer flex flex-col justify-between h-full card-float"
      >
        {/* Image wrapper */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-850 border-b border-slate-100 dark:border-slate-800">
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="px-5 py-2.5 bg-white/95 backdrop-blur text-slate-800 rounded-xl font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 text-xs flex items-center gap-2">
              <Eye className="h-4 w-4 text-indigo-600" />
              <span>查看书籍详情</span>
            </span>
          </div>

          {/* Stock badge - top right */}
          {book.stock <= 3 && book.stock > 0 && (
            <span className="absolute top-3 right-3 bg-amber-500/90 text-white text-[9px] font-bold px-2 py-1 rounded-lg backdrop-blur shadow-sm">
              仅剩 {book.stock} 册
            </span>
          )}
          {book.stock === 0 && (
            <span className="absolute top-3 right-3 bg-rose-500/90 text-white text-[9px] font-bold px-2 py-1 rounded-lg backdrop-blur shadow-sm">
              已售罄
            </span>
          )}

          {/* Book Category Tag */}
          <span className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 text-[10px] font-extrabold px-2.5 py-1 rounded-lg backdrop-blur shadow-sm font-sans">
            {book.category === 'Literature' && '📖 文学经典'}
            {book.category === 'Science' && '🔬 前沿科学'}
            {book.category === 'Technology' && '💻 计算机技术'}
            {book.category === 'Business' && '💼 商业财经'}
            {book.category === 'Children' && '🧒 儿童文学'}
          </span>
        </div>

        {/* Info Block */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={book.title}>
                《{book.title}》
              </h3>
              <span className="flex items-center gap-1 shrink-0 text-amber-500 text-[10px] font-bold mt-0.5">
                <Star className="h-3 w-3 fill-current" />
                {book.rating}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              作者: {book.author}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 leading-relaxed min-h-[36px]" title={book.description}>
              {book.description || '该书籍内容正在由管理员录入中。它涵盖了本学科的核心知识重点、关键解题思路。'}
            </p>
          </div>

          <div className="pt-3 border-t border-dashed border-slate-100 dark:border-slate-800/85 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-extrabold text-rose-500">
                ¥{book.price.toFixed(1)}
              </span>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg border ${
                book.stock > 5
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40'
                  : book.stock > 0
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40'
              }`}>
                {book.stock > 0 ? `在库 ${book.stock} 册` : '暂无库存'}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetail();
              }}
              disabled={book.stock === 0}
              className="w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-200 text-center flex items-center justify-center gap-1.5
                bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white
                dark:bg-indigo-950/40 dark:hover:bg-indigo-600 dark:text-indigo-400 dark:hover:text-white
                border border-indigo-200 dark:border-indigo-800/50 hover:border-indigo-600
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-50 disabled:hover:text-indigo-600
                dark:disabled:hover:bg-indigo-950/40 dark:disabled:hover:text-indigo-400
                active:scale-[0.98] shadow-sm"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>{book.stock > 0 ? '立即购书' : '暂无库存'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Book Detailed Overlay Dialog Modal (Animated with motion and AnimatePresence) */}
      <AnimatePresence>
        {isDetailOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-lg"
            />

            {/* Modal Dialog Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200/80 dark:border-slate-700/60 overflow-hidden flex flex-col md:flex-row z-10"
            >

              {/* Close trigger button */}
              <button
                onClick={() => setIsDetailOpen(false)}
                className="absolute right-4 top-4 z-10 p-2 bg-white/90 hover:bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full shadow-md hover:scale-105 active:scale-95 transition-all backdrop-blur"
                title="关闭"
              >
                <XCircle className="h-5 w-5" />
              </button>

              {/* Left Cover */}
              <div className="md:w-72 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-850 shrink-0 aspect-[3/4] md:aspect-auto border-r border-slate-100 dark:border-slate-700/60">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Right details content */}
              <div className="flex-grow p-6 md:p-8 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                      {book.category === 'Literature' && '📖 文学经典'}
                      {book.category === 'Science' && '🔬 前沿科学'}
                      {book.category === 'Technology' && '💻 计算机技术'}
                      {book.category === 'Business' && '💼 商业财经'}
                      {book.category === 'Children' && '🧒 儿童文学'}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500 font-mono text-xs font-bold">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>{book.rating} / 5.0</span>
                    </div>
                    {book.stock <= 3 && book.stock > 0 && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 text-[9px] font-bold rounded border border-amber-200 dark:border-amber-900/30">
                        仅剩 {book.stock} 册
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-xl font-extrabold text-slate-950 dark:text-white leading-tight">
                      《{book.title}》
                    </h2>
                    <p className="text-xs text-slate-500 mt-1.5">
                      作者/编著: <span className="font-semibold text-slate-700 dark:text-slate-300">{book.author}</span>
                    </p>
                  </div>

                  <div className="border-t border-b border-slate-100 dark:border-slate-800/60 py-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20 px-4 rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block mb-0.5">特惠活动零售价</span>
                      <span className="text-2xl font-mono font-extrabold text-rose-500">¥{book.price.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block mb-0.5">虚拟库物理库存</span>
                      <span className={`text-xs font-bold ${book.stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                        {book.stock > 0 ? `${book.stock} 册 (现货)` : '已售罄'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                      图书内容梗概介绍：
                    </h5>
                    <p className="text-xs text-slate-500 leading-relaxed dark:text-slate-400">
                      {book.description || '该书籍内容正在由管理员录入中。它涵盖了本学科的核心知识重点、关键解题思路、以及丰富的实践案例，是不可多得的优秀教材和读本。'}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex gap-3">
                  <button
                    disabled={book.stock === 0}
                    onClick={(e) => {
                      handleQuickAdd(e);
                      setIsDetailOpen(false);
                    }}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>{book.stock > 0 ? '立即加入购物车' : '暂无库存'}</span>
                  </button>
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
                  >
                    关闭
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
