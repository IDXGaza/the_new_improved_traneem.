import React, { useState } from 'react';
import { loginWithEmail, registerWithEmail } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = "حدث خطأ أثناء المصادقة.";
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
      } else if (err.code === 'auth/email-already-in-use') {
        msg = "هذا البريد الإلكتروني مستخدم بالفعل.";
      } else if (err.code === 'auth/weak-password') {
        msg = "كلمة المرور ضعيفة جداً. استخدم 6 أحرف على الأقل.";
      } else if (err.code === 'auth/invalid-email') {
        msg = "صيغة البريد الإلكتروني غير صحيحة.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
            </h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#4da8ab] focus:border-transparent outline-none transition-all"
                placeholder="name@example.com"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#4da8ab] focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 px-4 bg-[#4da8ab] hover:bg-[#3d8a8d] text-white font-bold rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'جاري التحميل...' : (isLogin ? 'دخول' : 'إنشاء حساب')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {isLogin ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#4da8ab] font-bold hover:underline"
            >
              {isLogin ? 'سجل الآن' : 'سجل الدخول'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
