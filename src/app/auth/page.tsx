'use client';

import { useState } from 'react';
import { Video, Eye, EyeOff, ArrowLeft, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios  from 'axios';
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext';
import { API_PREFIX } from '@/constants/api';

export default function Auth() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<{
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  image: string | File; 
  }>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    image: '' 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try{
      if (!isLogin){
        if (formData.confirmPassword !== formData.password){
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('password', formData.password);
      
      if (formData.image instanceof File) {
        data.append('image', formData.image); 
      }
      const result= await axios.post(`${API_PREFIX}/api/signup` , data)
      if(result.data){
          login(result.data.Token);
          router.push('/auth/activate'); 
      }
    }
    else{
      const result= await axios.post(`${API_PREFIX}/api/login` , formData)
      if(result.data){
        login(result.data.Token);
        router.push('/main'); 
      }
    }
    }catch(error){
        if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Something went wrong. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-alice-white to-white flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-20 left-20 w-72 h-72 bg-royal-blue/5 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-deep-wine/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-royal-blue/3 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }}></div>
      
      <div className="absolute top-8 left-8">
        <Button
          variant="ghost"
          className="text-onyx-gray hover:text-royal-blue transition-colors"
          onClick={() => window.location.href = '/'}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>

      <div className="w-full max-w-lg relative">
        <div className="bg-white rounded-3xl shadow-2xl p-8 card-shadow-hover">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-royal-wine rounded-xl flex items-center justify-center">
              <Video className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-rich-black">
              Smart<span className="text-gradient">Meet</span>
            </span>
          </div>

          <div className="bg-gradient-to-r from-alice-white to-gray-50 rounded-2xl p-1 mb-8 shadow-inner">
            <div className="grid grid-cols-2 gap-1">
              <button
                className={`py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                  isLogin
                    ? 'bg-white text-royal-blue shadow-sm'
                    : 'text-onyx-gray/60 hover:text-onyx-gray'
                }`}
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }}
                disabled={isLoading}
              >
                Login
              </button>
              <button
                className={`py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                  !isLogin
                    ? 'bg-white text-royal-blue shadow-sm'
                    : 'text-onyx-gray/60 hover:text-onyx-gray'
                }`}
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
                disabled={isLoading}
              >
                Sign Up
              </button>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-rich-black mb-2">
              {isLogin ? 'Get Started' : 'Join SmartMeet'}
            </h2>
            <p className="text-onyx-gray/70">
              {isLogin ? 'Sign in to your account to continue' : 'Create your account to get started'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-onyx-gray/40" />
                <Input
                  type="text"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="pl-12 py-3 h-12 rounded-xl border-2 border-gray-200 focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20 transition-all duration-200"
                  required={!isLogin}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-onyx-gray/40" />
              <Input
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="pl-12 py-3 h-12 rounded-xl border-2 border-gray-200 focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20 transition-all duration-200"
                required
                disabled={isLoading}
              />
            </div>

            {!isLogin && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-onyx-gray/40" />
                <Input
                  type="file"
                  accept="image/png, image/jpeg"   
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      if (!["image/png", "image/jpeg"].includes(file.type)) {
                        setError("Please select PNG or JPEG image only!");
                        return;
                      }

                      setFormData(prev => ({
                          ...prev,
                          image: file
                        }));
                        if (error) setError('');
                    }
                  }}
                  className="pl-12 pr-12 py-3 h-12 rounded-xl border-2 border-gray-200 focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20 transition-all duration-200"
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-onyx-gray/40" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="pl-12 pr-12 py-3 h-12 rounded-xl border-2 border-gray-200 focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20 transition-all duration-200"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-onyx-gray/40 hover:text-onyx-gray transition-colors disabled:opacity-50"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {!isLogin && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-onyx-gray/40" />
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="pl-12 py-3 h-12 rounded-xl border-2 border-gray-200 focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20 transition-all duration-200"
                  required={!isLogin}
                  disabled={isLoading}
                />
              </div>
            )}

            {isLogin && (
              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center space-x-2 text-onyx-gray">
                  <input type="checkbox" className="rounded border-gray-300 text-royal-blue focus:ring-royal-blue" disabled={isLoading} />
                  <span>Remember me</span>
                </label>
                <Button
                  type="button"
                  onClick={()=>router.push('/forgetRequest/findAccount')}
                  className="bg-transparent hover:bg-transparent border-0 p-0 text-royal-blue font-medium hover:text-deep-wine transition-colors duration-300"
                  disabled={isLoading}
                >
                  Forgot password?
                </Button>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-royal-blue to-deep-wine hover:from-deep-wine hover:to-royal-blue text-white py-3 h-12 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </span>
              ) : (
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}