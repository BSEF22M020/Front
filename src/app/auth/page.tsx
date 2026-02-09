'use client';

import { useState } from 'react';
import { Video, Eye, EyeOff, ArrowLeft, Mail, Lock, User, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios  from 'axios';
import { useRouter } from 'next/navigation'
import { error } from 'console';

export default function Auth() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [logError, setIsError] = useState(true);
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
  function navigateToOtherPage(e:React.MouseEvent){
    e.preventDefault();
    router.push('/auth/activate'); 
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try{
      if (!isLogin){
        if (formData.confirmPassword !== formData.password){
          alert('both Password field Does not Match')
        }
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('password', formData.password);
      
      if (formData.image instanceof File) {
        data.append('image', formData.image); 
      }
      const result= await axios.post(`https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/api/signup` , data)
      console.log('-->: bef' , result.data);
      if(result.data){
          console.log(formData, 'inside -- ');
          console.log('login ' , result.data.token)
          localStorage.setItem('token' , result.data.Token)
          router.push('/auth/activate'); 
      }
    }
    else{
      const result= await axios.post(`https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/api/login` , formData)
      if(result.data){
        localStorage.setItem('token' , result.data.Token)
        router.push('/main'); 
      }
    }
    // Redirect to meeting room for demo
    }catch(error){
        if (axios.isAxiosError(error)) {
        console.error("Axios Error:", error.response?.status, error.response?.data);
        alert("Error: " + error.response?.data?.message || error.message);
      } else {
        console.error("Other Error:", error);
        
        alert("An unexpected error occurred.");
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-alice-white to-white flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-royal-blue/5 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-deep-wine/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-royal-blue/3 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }}></div>
      
      {/* Back to Home */}
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

      {/* Auth Card */}
      <div className="w-full max-w-lg relative">
        <div className="bg-white rounded-3xl shadow-2xl p-8 card-shadow-hover">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-royal-wine rounded-xl flex items-center justify-center">
              <Video className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-rich-black">
              Smart<span className="text-gradient">Meet</span>
            </span>
          </div>

          {/* Tab Switcher */}
          <div className="bg-gradient-to-r from-alice-white to-gray-50 rounded-2xl p-1 mb-8 shadow-inner">
            <div className="grid grid-cols-2 gap-1">
              <button
                className={`py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                  isLogin
                    ? 'bg-white text-royal-blue shadow-sm'
                    : 'text-onyx-gray/60 hover:text-onyx-gray'
                }`}
                onClick={() => setIsLogin(true)}
              >
                Login
              </button>
              <button
                className={`py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                  !isLogin
                    ? 'bg-white text-royal-blue shadow-sm'
                    : 'text-onyx-gray/60 hover:text-onyx-gray'
                }`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-rich-black mb-2">
              {isLogin ? 'Welcome back!' : 'Join SmartMeet'}
            </h2>
            <p className="text-onyx-gray/70">
              {isLogin ? 'Sign in to your account to continue' : 'Create your account to get started'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className='text-md font-bold text-danger'>{logError} </p>
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
              />
            </div>

            {!isLogin && (
              <div className="relative">
                {/* Optional: icon */}
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-onyx-gray/40" />

                {/* File input */}
                <Input
                  type="file"
                  accept="image/png, image/jpeg"   
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];

                      // Optional: check type again
                      if (!["image/png", "image/jpeg"].includes(file.type)) {
                        alert("Please select PNG or JPEG image only!");
                        return;
                      }

                      setFormData(prev => ({
                          ...prev,
                          image: file
                        }));
                    }
                  }}
                  className="pl-12 pr-12 py-3 h-12 rounded-xl border-2 border-gray-200 focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20 transition-all duration-200"
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
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-onyx-gray/40 hover:text-onyx-gray transition-colors"
                onClick={() => setShowPassword(!showPassword)}
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
                />
              </div>
            )}

            {isLogin && (
              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center space-x-2 text-onyx-gray">
                  <input type="checkbox" className="rounded border-gray-300 text-royal-blue focus:ring-royal-blue" />
                  <span>Remember me</span>
                </label>
                <Button
                  onClick={()=>router.push('/forgetRequest/findAccount')}
                  className="bg-transparent hover:bg-transparent border-0 p-0 text-royal-blue font-medium hover:text-deep-wine transition-colors duration-300">
                  Forgot password?
                </Button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-royal-blue to-deep-wine hover:from-deep-wine hover:to-royal-blue text-white py-3 h-12 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Social Login */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-onyx-gray/60">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="border-2 border-gray-200 hover:border-royal-blue hover:bg-royal-blue/5 transition-all duration-200 py-3 h-12 rounded-xl group"
                onClick={(e)=>navigateToOtherPage(e)}
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </Button>
              <Button
                variant="outline"
                className="border-2 border-gray-200 hover:border-royal-blue hover:bg-royal-blue/5 transition-all duration-200 py-3 h-12 rounded-xl group"
                onClick={(e)=>navigateToOtherPage(e)}
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"/>
                </svg>
              </Button>
              <Button
                variant="outline"
                className="border-2 border-gray-200 hover:border-royal-blue hover:bg-royal-blue/5 transition-all duration-200 py-3 h-12 rounded-xl group"
                onClick={(e)=>navigateToOtherPage(e)}
              >
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center space-x-6 text-xs text-onyx-gray/60 mb-4">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>256-bit SSL</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-royal-blue rounded-full"></div>
                  <span>GDPR Compliant</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-deep-wine rounded-full"></div>
                  <span>SOC 2 Type II</span>
                </div>
              </div>
              <p className="text-xs text-onyx-gray/50">
                Trusted by 10,000+ teams worldwide
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-onyx-gray/60">
              By continuing, you agree to our{' '}
              <a href="#" className="text-royal-blue hover:text-deep-wine font-medium">Terms</a> and{' '}
              <a href="#" className="text-royal-blue hover:text-deep-wine font-medium">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}