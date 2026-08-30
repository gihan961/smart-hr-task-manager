import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, Mail, Sparkles, LogIn, KeyRound, CheckCircle, AlertCircle, X, ShieldAlert } from 'lucide-react';

export default function LoginPage({ onNavigateRegister, onSuccessLogin }) {
  const { login, switchRole, forgotPassword, resetPassword } = useAuth();
  const [email, setEmail] = useState('gihansenavirathna96@gmail.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');



  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Send Email, 2: Enter Token & New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetTokenCode, setResetTokenCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [devTokenCode, setDevTokenCode] = useState(null);
  const [mailPreviewUrl, setMailPreviewUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      if (onSuccessLogin) {
        onSuccessLogin();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to authenticate. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role) => {
    switchRole(role);
  };

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setForgotLoading(true);
    try {
      const res = await forgotPassword(forgotEmail);
      setForgotMessage(res.message || 'Reset code sent to your email.');
      if (res.devToken) {
        setDevTokenCode(res.devToken);
      }
      if (res.previewUrl) {
        setMailPreviewUrl(res.previewUrl);
      }
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to request password reset code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCompleteReset = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setForgotLoading(true);
    try {
      const res = await resetPassword(forgotEmail, resetTokenCode, newPassword);
      setForgotMessage(res.message || 'Password successfully updated.');
      setTimeout(() => {
        setEmail(forgotEmail);
        setPassword(newPassword);
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotEmail('');
        setResetTokenCode('');
        setNewPassword('');
        setDevTokenCode(null);
      }, 1800);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to reset password. Check verification code.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-6 relative z-10 glow-indigo">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Smart HR & Task Manager</h1>
          <p className="text-xs text-slate-400">Healthcare Revenue Cycle Management (RCM) Platform</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="user@apexrcm.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                }}
                className="text-[11px] text-indigo-400 hover:underline font-semibold"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
          </button>
        </form>


      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Reset Password</h3>
                  <p className="text-[11px] text-slate-400">Nodemailer Email Security Dispatch</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotStep(1);
                  setForgotError('');
                  setForgotMessage('');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{forgotMessage}</span>
                </div>
                {devTokenCode && (
                  <div className="text-[11px] pt-1 font-mono text-indigo-300 bg-indigo-950/50 p-2 rounded-lg border border-indigo-500/30 flex items-center justify-between">
                    <span>🔑 Security Reset Code: <strong>{devTokenCode}</strong></span>
                  </div>
                )}
                {mailPreviewUrl && (
                  <a
                    href={mailPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-[11px] text-indigo-400 hover:underline font-bold"
                  >
                    📩 Click to view Nodemailer Sent Email Preview →
                  </a>
                )}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendResetEmail} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Enter Account Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    placeholder="user@apexrcm.com"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    We will send a 6-digit security code to this email address via our automated Nodemailer email service.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    {forgotLoading ? 'Dispatching Mail...' : 'Send Reset Code Email'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCompleteReset} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">6-Digit Reset Security Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetTokenCode}
                    onChange={(e) => setResetTokenCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest text-center text-indigo-300 focus:outline-none focus:border-indigo-500"
                    placeholder="123456"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Enter new strong password"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-xs text-slate-400 hover:text-indigo-300 underline"
                  >
                    ← Back to Email
                  </button>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    {forgotLoading ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
