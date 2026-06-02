'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { 
  User, 
  Mail, 
  ArrowLeft, 
  Camera, 
  Key, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Loader2, 
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { 
    user, 
    updateProfile, 
    uploadAvatar, 
    requestPasswordChangeOtp, 
    verifyPasswordChange 
  } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile Details Form State
  const [name, setName] = useState(user?.name || '');
  const [details, setDetails] = useState(user?.details || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Avatar Upload State
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Change Password Form State
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  // Password Visibility toggles
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  if (!user) return null;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (5MB limit)
    if (!file.type.startsWith('image/')) {
      setProfileMessage({ type: 'error', text: 'Please select a valid image file.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage({ type: 'error', text: 'Image file size must be less than 5MB.' });
      return;
    }

    setUploadingAvatar(true);
    setProfileMessage(null);

    try {
      await uploadAvatar(file);
      setProfileMessage({ type: 'success', text: 'Profile picture uploaded successfully!' });
    } catch (err: any) {
      console.error(err);
      setProfileMessage({ type: 'error', text: err.message || 'Failed to upload profile picture.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileMessage({ type: 'error', text: 'Name cannot be empty.' });
      return;
    }

    setProfileSaving(true);
    setProfileMessage(null);

    try {
      await updateProfile(name, details);
      setProfileMessage({ type: 'success', text: 'Profile details updated successfully!' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleRequestOtp = async () => {
    setSendingOtp(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      await requestPasswordChangeOtp();
      setOtpSent(true);
      setPasswordSuccess('A 6-digit verification code has been sent to your email.');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword || !newPassword || !otpCode) {
      setPasswordError('All fields including the verification code are required.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password confirmation does not match.');
      return;
    }

    setChangingPassword(true);

    try {
      await verifyPasswordChange({
        oldPassword,
        newPassword,
        code: otpCode
      });
      setPasswordSuccess('Your password has been changed successfully!');
      // Reset fields
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpCode('');
      setOtpSent(false);
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordSuccess(null);
      }, 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password. Please check your verification code.');
    } finally {
      setChangingPassword(false);
    }
  };

  // Get resolved avatar url (handles S3 and local relative uploads)
  const avatarUrl = user.avatarUrl 
    ? (user.avatarUrl.startsWith('/') 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${user.avatarUrl}` 
        : user.avatarUrl)
    : null;

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-16">
      <main className="max-w-4xl mx-auto px-6 py-6 animate-in fade-in duration-300">
        
        {/* Back Link */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-xs">
            <ArrowLeft className="w-4 h-4 text-slate-650" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Account Profile</h1>
            <p className="text-xs text-slate-500">Manage your profile, identity details, and account security</p>
          </div>
        </div>

        {/* Profile Alert Message */}
        {profileMessage && (
          <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 border ${
            profileMessage.type === 'success' 
              ? 'bg-emerald-50/80 border-emerald-250 text-emerald-800' 
              : 'bg-rose-50/80 border-rose-250 text-rose-800'
          }`}>
            {profileMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <p className="text-xs font-semibold leading-relaxed">{profileMessage.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile Card & Avatar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
              {/* Avatar Photo Frame with Upload Trigger */}
              <div className="relative group cursor-pointer mt-4 mb-6" onClick={handleAvatarClick}>
                <div className="w-28 h-28 rounded-full border-4 border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shadow-md transition-all duration-300 group-hover:scale-105 group-hover:border-emerald-200">
                  {uploadingAvatar ? (
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  ) : avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-black bg-gradient-to-tr from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                {/* Upload camera overlay */}
                <div className="absolute inset-0 w-28 h-28 rounded-full bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 text-white">
                  <Camera className="w-6 h-6" />
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <h2 className="text-base font-extrabold text-slate-800">{user.name}</h2>
              <p className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 font-extrabold uppercase px-3 py-0.5 rounded-full tracking-wider mt-1.5">
                Researcher Profile
              </p>

              <div className="w-full border-t border-slate-100 my-6" />

              <div className="w-full text-left space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="overflow-hidden">
                    <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Email Address</p>
                    <p className="text-xs font-semibold text-slate-700 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Settings Shortcut Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-extrabold text-slate-800 mb-3">Quick Navigation</h3>
              <p className="text-[11px] text-slate-500 mb-4">Modify app settings, keys, and model selections.</p>
              <Link 
                href="/settings"
                className="w-full flex items-center justify-center py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Go to App Settings
              </Link>
            </div>
          </div>

          {/* Right Column: Edit Profile & Password Update */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Edit details form */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm">
              <h2 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-4 h-4 text-emerald-500" />
                Profile Information
              </h2>

              <form onSubmit={handleProfileSave} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-medium text-slate-800 transition-all bg-slate-50/20"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="details" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                    About / Bio / Professional Details
                  </label>
                  <textarea
                    id="details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-medium text-slate-800 transition-all bg-slate-50/20 resize-none"
                    placeholder="Tell us about yourself (e.g. Research field, job title, company name)..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-650 hover:to-teal-650 text-white rounded-xl text-xs font-extrabold transition-all shadow-[0_4px_12px_rgba(16,185,129,0.15)] disabled:opacity-50 cursor-pointer"
                  >
                    {profileSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Account Security Card (Change password with OTP) */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm">
              <h2 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2 pb-1">
                <Lock className="w-4 h-4 text-emerald-500" />
                Security & Authentication
              </h2>
              <p className="text-[11px] text-slate-500 mb-6 border-b border-slate-100 pb-3">
                Secure your research workspace. Change your account password via high-security email OTP verification.
              </p>

              {passwordError && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-50/80 border border-rose-205 text-rose-800 flex items-start gap-2 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-205 text-emerald-800 flex items-start gap-2 text-xs font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {!showPasswordChange ? (
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(true)}
                  className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  Change Password
                </button>
              ) : (
                <div className="space-y-6">
                  {!otpSent ? (
                    <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                      <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                        To change your password, we must verify your identity. We will send a 6-digit verification code to <span className="font-extrabold text-slate-800">{user.email}</span>.
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleRequestOtp}
                          disabled={sendingOtp}
                          className="flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-805 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {sendingOtp ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Sending code...
                            </>
                          ) : (
                            'Send Verification Code'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordChange(false);
                            setPasswordError(null);
                            setPasswordSuccess(null);
                          }}
                          className="px-5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-650 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handlePasswordChangeSubmit} className="space-y-5">
                      
                      {/* OTP Code input */}
                      <div>
                        <label htmlFor="otpCode" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                          Verification OTP Code (6-digit)
                        </label>
                        <input
                          type="text"
                          id="otpCode"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full max-w-[200px] px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-center tracking-[8px] text-base font-extrabold text-slate-800 bg-slate-50/20"
                          placeholder="000000"
                        />
                        <p className="text-[10px] text-slate-400 mt-1.5 font-semibold">We sent this code to {user.email}. Check your spam folder if it doesn't arrive.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Old password */}
                        <div className="relative">
                          <label htmlFor="oldPassword" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                            Current Password
                          </label>
                          <input
                            type={showOldPwd ? 'text' : 'password'}
                            id="oldPassword"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-medium text-slate-800 bg-slate-50/20"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPwd(!showOldPwd)}
                            className="absolute right-3.5 bottom-3.5 text-slate-400 hover:text-slate-600"
                          >
                            {showOldPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* New password */}
                        <div className="relative">
                          <label htmlFor="newPassword" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                            New Password
                          </label>
                          <input
                            type={showNewPwd ? 'text' : 'password'}
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-medium text-slate-800 bg-slate-50/20"
                            placeholder="Minimum 6 characters"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPwd(!showNewPwd)}
                            className="absolute right-3.5 bottom-3.5 text-slate-400 hover:text-slate-600"
                          >
                            {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Confirm new password */}
                        <div className="md:col-span-2">
                          <label htmlFor="confirmPassword" className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-medium text-slate-800 bg-slate-50/20"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={changingPassword}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-650 hover:to-teal-650 text-white rounded-xl text-xs font-extrabold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                        >
                          {changingPassword ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Verifying & Changing Password...
                            </>
                          ) : (
                            'Confirm Password Change'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setPasswordError(null);
                            setPasswordSuccess(null);
                          }}
                          className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Change OTP Code
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordChange(false);
                            setOtpSent(false);
                            setPasswordError(null);
                            setPasswordSuccess(null);
                            setOldPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                            setOtpCode('');
                          }}
                          className="px-5 py-2.5 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
