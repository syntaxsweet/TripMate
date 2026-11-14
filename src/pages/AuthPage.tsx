import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, Lock, Mail, User } from 'lucide-react';
import { useTripContext } from '../context/TripContext';
import { GENERATED_IMAGES } from '../data/destinations';
import { TravelImage } from '../components/TravelImage';

export const AuthPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useTripContext();

  const initialMode = location.pathname === '/signup' ? 'signup' : 'login';
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      const res = login(email, password, rememberMe);
      if (!res.ok) {
        setError(res.error || 'Unable to sign in.');
        return;
      }
      navigate('/dashboard');
    } else {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      const res = register(fullName, email, password);
      if (!res.ok) {
        setError(res.error || 'Unable to create account.');
        return;
      }
      navigate('/create-trip');
    }
  };

  const handleDemoLogin = () => {
    login('simar.kaur@tripmate.in', 'travel2026', true);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FCFBF7] grid grid-cols-1 lg:grid-cols-12">
      {/* Left Photography Column */}
      <div className="hidden lg:block lg:col-span-6 relative overflow-hidden">
        <TravelImage
          src={GENERATED_IMAGES.kerala}
          alt="Kerala backwaters at golden dawn"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/20" />
        <div className="relative z-10 h-full p-12 flex flex-col justify-between text-white">
          <Link
            to="/"
            className="font-display text-2xl font-semibold flex items-center gap-2.5 w-fit"
          >
            <Compass className="w-6 h-6 text-[#D8AC55]" />
            <span>TripMate</span>
          </Link>

          <div className="max-w-md">
            <h2 className="font-display text-3xl font-semibold leading-snug [text-wrap:balance]">
              Every edit shapes the journey.
            </h2>
            <p className="mt-3 text-sm text-white/85 leading-relaxed">
              Save multiple custom itineraries, compare budget allocations across days, and keep every trip organized locally in your browser.
            </p>
          </div>
        </div>
      </div>

      {/* Right Auth Card */}
      <div className="lg:col-span-6 flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
        <div className="w-full max-w-md mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A645F] hover:text-[#174B3A] mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-1 p-1 bg-[#F8F5EC] rounded-xl border border-[#252B28]/10 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setForgotOpen(false);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                mode === 'login' ? 'bg-white text-[#174B3A] shadow-sm' : 'text-[#5A645F]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
                setForgotOpen(false);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                mode === 'signup' ? 'bg-white text-[#174B3A] shadow-sm' : 'text-[#5A645F]'
              }`}
            >
              Create Account
            </button>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#252B28]">
            {mode === 'login' ? 'Welcome back' : 'Start planning with TripMate'}
          </h1>
          <p className="mt-1.5 text-sm text-[#5A645F]">
            {mode === 'login'
              ? 'Sign in to access your saved itineraries and expense trackers.'
              : 'Create a traveler profile to build and persist personalized trips.'}
          </p>

          {error && (
            <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {forgotOpen ? (
            <div className="mt-6 bg-white rounded-2xl border border-[#252B28]/10 p-6 space-y-4">
              <h2 className="text-base font-semibold text-[#252B28]">Reset your password</h2>
              <p className="text-xs text-[#5A645F]">
                Enter your account email and we will simulate sending a local reset link.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm focus:outline-none focus:border-[#174B3A]"
              />
              {resetSent && (
                <div className="text-xs font-medium text-[#174B3A] bg-[#F8F5EC] px-3 py-2 rounded-lg">
                  Password reset instructions prepared for {email || 'your email'}.
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setForgotOpen(false);
                    setResetSent(false);
                  }}
                  className="text-xs font-medium text-[#5A645F] hover:text-[#252B28]"
                >
                  Back to Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setResetSent(true)}
                  className="px-4 py-2 rounded-xl bg-[#174B3A] text-white text-xs font-semibold hover:bg-[#123B2D]"
                >
                  Send Reset Link
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#5A645F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Simar Kaur"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-white text-sm focus:outline-none focus:border-[#174B3A]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#5A645F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="traveler@example.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-white text-sm focus:outline-none focus:border-[#174B3A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#5A645F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-white text-sm focus:outline-none focus:border-[#174B3A]"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#5A645F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-white text-sm focus:outline-none focus:border-[#174B3A]"
                    />
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="flex items-center justify-between text-xs">
                  <label className="inline-flex items-center gap-2 text-[#5A645F] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#252B28]/30 text-[#174B3A] focus:ring-[#174B3A]"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="font-medium text-[#174B3A] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#174B3A] text-white text-sm font-semibold hover:bg-[#123B2D] transition-colors"
              >
                {mode === 'login' ? 'Sign In to Workspace' : 'Create Traveler Account'}
              </button>

              <div className="relative py-2">
                <div className="border-t border-[#252B28]/10" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FCFBF7] px-3 text-xs text-[#5A645F]">
                  or
                </span>
              </div>

              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2.5 rounded-xl bg-[#F8F5EC] border border-[#252B28]/12 text-[#174B3A] text-sm font-semibold hover:bg-[#efe9d8] transition-colors"
              >
                Continue as Demo Traveler
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
