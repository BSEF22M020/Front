'use client';

import { useState } from 'react';
import { Video, Eye, EyeOff, ArrowLeft, Mail, Lock, User, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios  from 'axios';
import { useRouter } from 'next/navigation'
import { error } from 'console';

export default function ResetPassword() {
  const router = useRouter();
  const [isActivation, setActivation] = useState(true);
  const [logError, setIsError] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<{
  code: string;
  password: string;
  confirmPassword: string;
  email:string
  }>({
    code: '',
    password: '',
    confirmPassword: '',
    email:localStorage.getItem('email') ?? ''
  });

  async function SendCodeAgain(){
    const result= await axios.post(
      "https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/api/ForgetPassword",
      formData
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Called! ---- ')
    try{
      if (isActivation){
        console.log('Activatipn  == ')
        const result= await axios.post(`https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/api/verifyResetCode` , formData)
        console.log('-->: bef' , result.data);
        if(result.status == 200){
          setActivation(false)
        }
    }
    else{
      if (formData.confirmPassword !== formData.password){
          alert('both Password field Does not Match')
        }
        const data = new FormData();
        data.append('code', formData.code);
        data.append('password', formData.password);
        const result= await axios.post(`https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/api/resetPassword` , formData)
        if(result.status == 200){
          localStorage.setItem('token' , result.data.token)
          router.push('/main'); 
        }
    }
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

          {/* Welcome Message */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-rich-black mb-2">
              {isActivation ? 'Activation Code' : 'New Password'}
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className='text-md font-bold text-danger'>{logError} </p>
            {isActivation && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-onyx-gray/40" />
                <Input
                  type="text"
                  placeholder="Code "
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  className="pl-12 py-3 h-12 rounded-xl border-2 border-gray-200 focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20 transition-all duration-200"
                  required={!isActivation}
                />
              </div>
            )}

             {!isActivation && (<div className="relative">
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
            </div>)}

            {!isActivation && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-onyx-gray/40" />
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="pl-12 py-3 h-12 rounded-xl border-2 border-gray-200 focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20 transition-all duration-200"
                  required={!isActivation}
                />
              </div>
            )}


            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-royal-blue to-deep-wine hover:from-deep-wine hover:to-royal-blue text-white py-3 h-12 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
              {isActivation ? 'verify Code' : 'Set New Password'}
            </Button>
          </form>
          {isActivation && (
                <div className="flex justify-between items-center text-sm">
                  <Button 
                    onClick={()=>{SendCodeAgain()}}
                   className="bg-transparent hover:bg-transparent  text-royal-blue hover:text-deep-wine font-medium">
                    Send Code Again?
                  </Button>
              </div>
          )}

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