import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Mail, Lock, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    if (!usernameOrEmail.trim()) {
      setFieldErrors((prev) => ({ ...prev, usernameOrEmail: 'Please enter your username or email.' }));
      return;
    }
    if (!password) {
      setFieldErrors((prev) => ({ ...prev, password: 'Please enter your password.' }));
      return;
    }

    try {
      setLoading(true);
      await login(usernameOrEmail.trim(), password);
      success('Welcome back to TaskFlow!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error?.message || 'Invalid username/email or password.';
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (role) => {
    if (role === 'admin') {
      setUsernameOrEmail('alex@codealpha.io');
      setPassword('Password123!');
    } else if (role === 'frontend') {
      setUsernameOrEmail('sophia@codealpha.io');
      setPassword('Password123!');
    } else if (role === 'backend') {
      setUsernameOrEmail('marcus@codealpha.io');
      setPassword('Password123!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-xl shadow-indigo-600/30 mb-4">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome to TaskFlow
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Enterprise Agile Workspace for high-performing engineering teams
          </p>
        </div>

        {/* Card Form */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username or Email"
              type="text"
              icon={Mail}
              placeholder="e.g. alex@codealpha.io or alex"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              error={fieldErrors.usernameOrEmail}
              required
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={loading}
              icon={ArrowRight}
              iconPosition="right"
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Logins for Internship Reviewers */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick Demo Accounts (1-Click Fill)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin')}
                className="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-medium transition-colors"
              >
                Admin (Alex)
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('frontend')}
                className="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-medium transition-colors"
              >
                Lead UI (Sophia)
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('backend')}
                className="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-medium transition-colors"
              >
                Backend (Marcus)
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          CodeAlpha Full Stack Development Internship • Built with React, Vite & Django
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
