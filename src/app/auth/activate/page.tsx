'use client';

import { useState } from 'react';
import { Video, ArrowLeft, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios  from 'axios';
import{API_PREFIX} from '@/constants/api';  

export default function Activate() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await axios.post(
        `${API_PREFIX}/api/activateAccount`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (result.data) {
        window.location.href = "/main";
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Invalid activation code. Please try again.');
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
          disabled={isLoading}
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

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-rich-black mb-2">
              Activate Your Account
            </h2>
            <p className="text-onyx-gray/70">
              Enter the activation code sent to your email
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-onyx-gray/40" />
              <Input
                type="text"
                placeholder="Enter activation code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                className="pl-12 py-3 h-12 rounded-xl border-2 border-gray-200 focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20 transition-all duration-200"
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-royal-blue to-deep-wine hover:from-deep-wine hover:to-royal-blue text-white py-3 h-12 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Activating Account...
                </span>
              ) : (
                <span>Activate Account</span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}