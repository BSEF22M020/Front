'use client';

import { useState } from 'react';
import { 
  Video, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  Copy, 
  ExternalLink,
  Check,
  Settings,
  FileText,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function CreateMeeting() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domainName: '',
    domainRestrictionFlag: false,
  });
  

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
      console.log('called!')
        const result = await axios.post(
            "https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/api/CreateOrganization",
            formData,
            {
              headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
              }
          )
      if(result.status == 201){
          router.push('/main'); 
      }


  };
  return (
    <div className="min-h-screen bg-alice-white">
      {/* Background Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-royal-blue/5 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-deep-wine/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-alice-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-royal-wine rounded-xl flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-rich-black">
                Smart<span className="text-gradient">Meet</span>
              </span>
            </div>

            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/dashboard'}
              className="text-onyx-gray hover:text-royal-blue"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12 relative">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-3xl shadow-2xl p-8 card-shadow-hover">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-rich-black mb-4">
                Create New Organization
              </h1>
              <p className="text-lg text-onyx-gray/80">
                Set your meeting details and share the invite link instantly.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Meeting Title */}
              <div>
                <label className="block text-sm font-semibold text-rich-black mb-2">
                  Organization Title *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Dept1 & Dept2"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 h-12 rounded-xl border-2 border-gray-200 focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20 transition-all duration-200"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-rich-black mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Brief description of the meeting agenda..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20 transition-all duration-200 resize-none"
                />
              </div>


              {/* Meeting Options */}
              <div className="bg-alice-white rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-rich-black mb-4">Organization Security</h3>
                <div className="space-y-4">

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.domainRestrictionFlag}
                      onChange={(e) => handleInputChange('domainRestrictionFlag', e.target.checked)}
                      className="w-5 h-5 text-royal-blue border-2 border-gray-300 rounded focus:ring-royal-blue focus:ring-2"
                    />
                    <div>
                      <span className="font-medium text-rich-black">Restrict to Domain name</span>
                      <p className="text-sm text-onyx-gray/60">only join account have same domain name in their email</p>
                    </div>
                  </label>

                  {formData.domainRestrictionFlag && (
                    <div className="ml-8 mt-3">
                      <Input
                        type="text"
                        placeholder="e.g., @pucit.edu.pk"
                        value={formData.domainName}
                        onChange={(e) => handleInputChange('domainName', e.target.value)}
                        className="w-full px-4 py-2 h-10 rounded-lg border-2 border-gray-200 focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20 transition-all duration-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-royal-blue to-deep-wine hover:from-deep-wine hover:to-royal-blue text-white py-4 h-14 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                disabled={!formData.name.trim()}
              >
                <Video className="w-5 h-5 mr-2" />
                Create Organization
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}