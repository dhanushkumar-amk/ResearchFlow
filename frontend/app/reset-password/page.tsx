'use client';

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants';
import useAuth from '@/hooks/useAuth';
import * as Lucide from 'lucide-react';
import { motion } from 'framer-motion';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuth();

  // Get state from location
  const email = location.state?.email || '';
  const resetToken = location.state?.resetToken || '';
  const verified = location.state?.verified || false;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await resetPassword({ email, password, resetToken });
      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => {
        navigate(ROUTES.LOGIN);
      }, 3000);
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    }
  };

  if (!verified || !email || !resetToken) {
    return (
      <div className="min-h-screen bg-white text-[#0a0a0a] font-sans antialiased relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden">
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
          <div className="bg-white border border-neutral-200 rounded-[16px] shadow-[0_12px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 text-center">
            <Lucide.AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-neutral-955 mb-2">Invalid Session</h2>
            <p className="text-xs text-neutral-500 mb-6">
              Your password reset session has expired or is invalid. Please request a new verification code.
            </p>
            <button
              onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
              className="w-full bg-neutral-950 text-white hover:bg-neutral-800 font-semibold py-2.5 rounded-md text-sm transition-all cursor-pointer"
            >
              Request New Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] font-sans antialiased relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/[0.02] rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-6">
        <div className="flex justify-center items-center gap-2.5 mb-4">
          <div className="bg-emerald-500 text-white p-2 rounded-[6px] shadow-[0_4px_12px_rgba(16,185,129,0.15)] cursor-pointer" onClick={() => navigate(ROUTES.HOME)}>
            <Lucide.Brain className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-[#0a0a0a] cursor-pointer" onClick={() => navigate(ROUTES.HOME)}>
            ResearchMind
          </span>
        </div>
        <h2 className="text-[28px] font-extrabold text-[#0a0a0a] tracking-tight">
          Reset password
        </h2>
        <p className="mt-2 text-xs text-neutral-450">
          Enter your new password to regain access to your account
        </p>
      </div>

      {/* Card */}
      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-neutral-200 rounded-[16px] shadow-[0_12px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8"
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

          {success ? (
            <div className="text-center py-4">
              <Lucide.CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-lg font-bold text-neutral-900 mb-1">Password reset successfully!</h3>
              <p className="text-xs text-neutral-500">
                Redirecting you to the sign-in page in a few seconds...
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  New Password
                </label>
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
                    className="block w-full pl-10 pr-10 py-2 border border-neutral-200 rounded-md text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-neutral-955 placeholder-neutral-400"
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

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lucide.LockKeyhole className="h-4 w-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-md text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-neutral-955 placeholder-neutral-400"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-neutral-950 text-white hover:bg-neutral-800 font-semibold py-2.5 rounded-md text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer relative"
              >
                {isLoading ? (
                  <>
                    <Lucide.Loader className="h-4 w-4 animate-spin" />
                    <span>Resetting password...</span>
                  </>
                ) : (
                  <>
                    <Lucide.ShieldAlert className="h-4 w-4" />
                    <span>Reset Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Back Link */}
          {!success && (
            <div className="mt-6 flex justify-center border-t border-neutral-100 pt-4">
              <span 
                onClick={() => navigate(ROUTES.LOGIN)}
                className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-emerald-600 cursor-pointer transition-colors"
              >
                <Lucide.ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
