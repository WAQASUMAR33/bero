'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    setIsLoading(true);
    setError('');

    try {
      console.log('Making API request...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        console.log('Login successful, storing data...');
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('Redirecting to dashboard...');
        // Redirect to dashboard
        router.push('/admin');
      } else {
        console.log('Login failed:', data.error);
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row relative">
      {/* Global Grid Pattern */}
      <div className="absolute inset-0 opacity-5 z-0">
        <div className="h-full w-full" style={{
          backgroundImage: `linear-gradient(to right, #224fa6 1px, transparent 1px), linear-gradient(to bottom, #224fa6 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Left Panel - Welcome Section - Hidden on mobile */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-white z-10 min-h-screen">
        {/* Decorative Background Elements - Only visible on larger screens */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-[#224fa6]/10 to-[#3270e9]/10 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-20 h-20 bg-gradient-to-br from-[#3270e9]/5 to-[#224fa6]/5 rotate-45 animate-bounce"></div>
        <div className="absolute bottom-32 left-16 w-24 h-24 bg-gradient-to-br from-[#224fa6]/8 to-[#3270e9]/8 rounded-full"></div>
        <div className="absolute bottom-20 right-16 w-16 h-16 bg-gradient-to-br from-[#3270e9]/6 to-[#224fa6]/6 rotate-12"></div>
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-center items-center p-16">
          {/* Logo */}
          <div className="mb-12">
            <Image
              src="/assets/logo2.png"
              alt="Logo"
              width={200}
              height={200}
              className="object-contain drop-shadow-lg w-48 h-48 xl:w-52 xl:h-52"
            />
          </div>
          
          {/* Gradient Heading */}
          <h1 className="text-6xl font-bold mb-8 bg-gradient-to-r from-[#224fa6] to-[#3270e9] bg-clip-text text-transparent text-center leading-tight px-4">
            Welcome Back
          </h1>
          
          {/* Description */}
          <p className="text-xl text-gray-600 text-center max-w-lg leading-relaxed px-4">
            Sign in to your account and continue your journey with us. Access all your features and manage your profile seamlessly.
          </p>
          
          {/* Decorative Elements */}
          <div className="mt-16 flex space-x-4">
            <div className="w-3 h-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-gradient-to-r from-[#3270e9] to-[#224fa6] rounded-full animate-pulse delay-100"></div>
            <div className="w-3 h-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] rounded-full animate-pulse delay-200"></div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 bg-white flex items-center justify-center p-4 sm:p-8 lg:p-16 relative z-10 min-h-[50vh] lg:min-h-screen">
        {/* Mobile decorative elements - Only visible on mobile */}
        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating gradient circles */}
          <div className="absolute top-10 left-4 w-16 h-16 bg-gradient-to-br from-[#224fa6]/15 to-[#3270e9]/10 rounded-full animate-pulse pointer-events-none"></div>
          <div className="absolute top-20 right-6 w-12 h-12 bg-gradient-to-br from-[#3270e9]/10 to-[#224fa6]/15 rounded-full animate-bounce delay-300 pointer-events-none"></div>
          <div className="absolute bottom-32 left-6 w-20 h-20 bg-gradient-to-br from-[#224fa6]/8 to-[#3270e9]/12 rounded-full animate-pulse delay-700 pointer-events-none"></div>
          <div className="absolute bottom-20 right-8 w-14 h-14 bg-gradient-to-br from-[#3270e9]/12 to-[#224fa6]/8 rounded-full animate-bounce delay-1000 pointer-events-none"></div>
          
          {/* Geometric shapes */}
          <div className="absolute top-32 left-8 w-8 h-8 bg-gradient-to-br from-[#224fa6]/20 to-[#3270e9]/15 rotate-45 animate-pulse delay-500 pointer-events-none"></div>
          <div className="absolute bottom-40 right-12 w-6 h-6 bg-gradient-to-br from-[#3270e9]/15 to-[#224fa6]/20 rotate-12 animate-bounce delay-800 pointer-events-none"></div>
          
          {/* Subtle wave pattern */}
          <div className="absolute top-0 left-0 w-full h-32 opacity-5 pointer-events-none">
            <svg viewBox="0 0 400 100" className="w-full h-full pointer-events-none">
              <path d="M0,50 Q100,20 200,50 T400,50 L400,100 L0,100 Z" fill="url(#mobileGradient)" />
              <defs>
                <linearGradient id="mobileGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#224fa6" />
                  <stop offset="100%" stopColor="#3270e9" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="w-full max-w-sm sm:max-w-md relative z-20">
          {/* Mobile Logo - Only visible on mobile */}
          <div className="lg:hidden mb-8 flex justify-center relative z-20">
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-[#224fa6]/20 to-[#3270e9]/20 rounded-full animate-pulse pointer-events-none"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-br from-[#3270e9]/20 to-[#224fa6]/20 rounded-full animate-bounce delay-500 pointer-events-none"></div>
            <Image
              src="/asstes/logo2.png"
              alt="Logo"
              width={120}
              height={120}
              className="object-contain drop-shadow-lg w-24 h-24 relative z-10"
            />
          </div>

          {/* Mobile welcome text - Only visible on mobile */}
          <div className="lg:hidden mb-6 text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#224fa6] to-[#3270e9] bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-600">
              Sign in to continue your journey
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-6 sm:p-8 lg:p-12 border border-gray-100 relative overflow-hidden z-20">
            {/* Subtle background pattern in form */}
            <div className="absolute inset-0 opacity-5 z-0 pointer-events-none">
              <div className="w-full h-full" style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, #224fa6 2px, transparent 2px), radial-gradient(circle at 75% 75%, #3270e9 2px, transparent 2px)`,
                backgroundSize: '30px 30px'
              }}></div>
            </div>
            {/* Form Header */}
            <div className="text-center mb-6 sm:mb-8 lg:mb-10 relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Sign In</h2>
              <p className="text-sm sm:text-base text-gray-600">Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 lg:space-y-6 relative z-10">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 relative z-10">
                  {error}
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1 sm:space-y-2 relative z-10">
                <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-[#224fa6] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:border-[#224fa6] focus:ring-2 focus:ring-[#224fa6]/20 focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1 sm:space-y-2 relative z-10">
                <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-[#224fa6] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 border-2 border-gray-200 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:border-[#224fa6] focus:ring-2 focus:ring-[#224fa6]/20 focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-[#224fa6] transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <div className="relative z-10">
                <button
                  type="submit"
                  disabled={isLoading}
                  onClick={() => console.log('Button clicked!')}
                  className="w-full bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 sm:hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#224fa6]/20 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                >
                <span className="flex items-center justify-center">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <svg className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
              </div>
            </form>

            {/* Forgot Password */}
            <div className="text-center mt-6 sm:mt-8 relative z-10">
              <a href="#" className="text-[#224fa6] hover:text-[#3270e9] transition-colors font-medium text-xs sm:text-sm">
                Forgot your password?
              </a>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="mt-6 sm:mt-8 flex justify-center space-x-1 sm:space-x-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-300 rounded-full"></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] rounded-full"></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-300 rounded-full"></div>
          </div>

          {/* Mobile decorative dots - Only visible on mobile */}
          <div className="lg:hidden mt-8 flex justify-center space-x-3">
            <div className="w-2 h-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-gradient-to-r from-[#3270e9] to-[#224fa6] rounded-full animate-pulse delay-300"></div>
            <div className="w-2 h-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] rounded-full animate-pulse delay-600"></div>
            <div className="w-2 h-2 bg-gradient-to-r from-[#3270e9] to-[#224fa6] rounded-full animate-pulse delay-900"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

