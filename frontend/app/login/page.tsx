'use client';

import Brand from '@/components/Brand';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';
import useAuth from '@/hooks/useAuth';
import * as Lucide from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] font-sans antialiased relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/[0.03] rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/[0.02] rounded-full blur-[130px] pointer-events-none z-0" />
      {/* Dot Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none z-0" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-6">
        <div className="mb-6 flex justify-center"><Brand /></div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-ui-muted">
          Sign in to your research workspace.
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rf-auth-card p-6 sm:p-8"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 rounded-[8px] bg-red-50 border border-red-100 text-xs font-semibold text-red-650 flex items-center gap-2"
            >
              <Lucide.AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Lucide.Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-3 py-2 border border-ui-border rounded-md text-sm  transition-colors focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand bg-white text-neutral-900 placeholder-neutral-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-neutral-700">
                  Password
                </label>
                <span
                  onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                  className="text-xs font-semibold text-brand hover:text-brand-hover cursor-pointer transition-colors"
                >
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Lucide.Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2 border border-ui-border rounded-md text-sm  transition-colors focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand bg-white text-neutral-900 placeholder-neutral-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? (
                    <Lucide.EyeOff className="h-4 w-4" />
                  ) : (
                    <Lucide.Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-ui-border text-brand focus:ring-brand/10 cursor-pointer"
                />
                <span className="text-xs text-neutral-500 font-medium">Keep me signed in</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rf-button rf-button-primary cursor-pointer relative"
            >
              {isLoading ? (
                <>
                  <Lucide.Loader className="h-4 w-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <Lucide.LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="mt-6 text-center text-sm text-ui-muted">
            New to ResearchFlow?{' '}
            <span
              onClick={() => navigate(ROUTES.REGISTER)}
              className="font-bold text-brand hover:text-brand-hover cursor-pointer transition-colors"
            >
              Create an account
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
