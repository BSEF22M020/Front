'use client';

import { useState, Suspense, useEffect } from 'react';
import { 
  Video, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Check,
  Zap,
  Loader2,
  AlertCircle,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from "next/navigation";
import axios from 'axios';
import {API_PREFIX} from '@/constants/api';

interface Member {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface OrganizationData {
  owner: {
    email: string;
  };
  members: Member[];
}

function CreateMeetingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const userId = Number(searchParams.get("userId"));
  const organId = Number(searchParams.get("organizationId"));
  
  const [isScheduleNow, setIsScheduleNow] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date:'',
    time:'',
    meetingDuration: '30',
    enableEngagement: true,
    daily:false,
    weekly:false,
    hostId:userId,
    meetingLink: '', 
    organizationId:organId,
    startTime:new Date(),
  });
  
  const [meetingCreated, setMeetingCreated] = useState(false);
  const [createdMeetingId, setCreatedMeetingId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMembers, setIsFetchingMembers] = useState(true);
  const [error, setError] = useState('');
  const [notifyMembers, setNotifyMembers] = useState(true);
  const [memberEmails, setMemberEmails] = useState<string[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!organId) return;
      
      setIsFetchingMembers(true);
      const query = `{ getOrganizationbyId(id: ${organId}) { owner { email } members { id user { id name email } } } }`;

      try {
        const result = await axios.post(
          `${API_PREFIX}/graphql`,
          { 'query': query },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }
          }
        );
        
        const orgData: OrganizationData = result.data.data.getOrganizationbyId;
        const emails: string[] = [];
        
        if (orgData.owner?.email) {
          emails.push(orgData.owner.email);
        }
        
        if (orgData.members && orgData.members.length > 0) {
          orgData.members.forEach((member: Member) => {
            if (member.user?.email) {
              emails.push(member.user.email);
            }
          });
        }
        
        setMemberEmails(emails);
      } catch (error) {
        console.error('[Error fetching members]: ', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsFetchingMembers(false);
      }
    };
    
    fetchMembers();
  }, [organId]);

  useEffect(() => {
    if (isScheduleNow) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      setFormData(prev => ({
        ...prev,
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`
      }));
    }
  }, [isScheduleNow]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  function back(){
    router.push(`/dashboard?userId=${userId}&organizationId=${organId}`);
  }

  const validateDateTime = () => {
    if (!formData.date || !formData.time) {
      setError('Please select both date and time for the meeting');
      return false;
    }

    if (!isScheduleNow) {
      const selectedDateTime = new Date(`${formData.date}T${formData.time}:00`);
      const now = new Date();

      if (selectedDateTime <= now) {
        setError('Meeting time must be in the future. Please select a later date and time.');
        return false;
      }
    }

    return true;
  };

  const sendNotificationEmails = async (meetingId: string) => {
    if (!notifyMembers || memberEmails.length === 0) return;

    const meetingDateTime = new Date(`${formData.date}T${formData.time}:00`);
    const meetingLink = `${window.location.origin}/join?meetingId=${meetingId}&organizationId=${organId}`;
    
    const emailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">Meeting Invitation</h2>
            <p>You have been invited to a meeting:</p>
            
            <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1F2937;">${formData.name}</h3>
              ${formData.description ? `<p style="margin: 10px 0;"><strong>Description:</strong> ${formData.description}</p>` : ''}
              <p style="margin: 10px 0;"><strong>Date:</strong> ${meetingDateTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p style="margin: 10px 0;"><strong>Time:</strong> ${formData.time}</p>
              <p style="margin: 10px 0;"><strong>Duration:</strong> ${formData.meetingDuration} minutes</p>
            </div>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${meetingLink}" 
                 style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block;
                        font-weight: bold;">
                Join Meeting
              </a>
            </div>
            
            <p style="color: #6B7280; font-size: 14px;">Or copy and paste this link in your browser:</p>
            <p style="background-color: #F9FAFB; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
              ${meetingLink}
            </p>
            
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
            
            <p style="color: #6B7280; font-size: 12px; text-align: center;">
              This is an automated message from SmartMeet. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    try {
      await axios.post(
        `${API_PREFIX}/api/SendEmail`,
        {
          receivers: memberEmails,
          content: emailContent,
          time: meetingDateTime.toISOString()
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }
        }
      );
    } catch (error) {
      console.error('[Error sending emails]: ', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateDateTime()) {
      return;
    }

    setIsLoading(true);

    formData.startTime = new Date(`${formData.date}T${formData.time}:00`);
    formData.meetingLink = `${window.location.origin}/meeting`;

    try {
      const result = await axios.post(
        `${API_PREFIX}/api/CreateMeeting`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }
        }
      );
      
      if (result.status === 201) {
        const meetingId = result.data.meetingId || result.data.id;
        setCreatedMeetingId(meetingId);
        await sendNotificationEmails(meetingId);
        setMeetingCreated(true);
      }
    } catch (e) {
      if (axios.isAxiosError(e)) {
        setError(e.response?.data?.message || 'Failed to create meeting. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingMembers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-alice-white to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-royal-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-onyx-gray">Loading organization details...</p>
        </div>
      </div>
    );
  }

  if (meetingCreated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-alice-white to-white flex items-center justify-center px-4">
        <div className="absolute top-20 left-20 w-72 h-72 bg-royal-blue/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-deep-wine/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

        <div className="w-full max-w-2xl relative">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl p-12 card-shadow border border-white/50 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-royal-blue to-deep-wine rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Check className="w-12 h-12 text-white" />
            </div>

            <h1 className="text-3xl font-bold text-rich-black mb-4">
              Meeting Created Successfully!
            </h1>
            <p className="text-lg text-onyx-gray/70 mb-8">
              Your meeting <span className="font-semibold text-royal-blue">{formData.name}</span> has been scheduled
              {notifyMembers && memberEmails.length > 0 && (
                <span className="block mt-2 text-sm text-onyx-gray/60">
                  Notification emails sent to {memberEmails.length} member{memberEmails.length !== 1 ? 's' : ''}
                </span>
              )}
            </p>

            <div className="bg-gradient-to-br from-alice-white to-white rounded-2xl p-6 mb-8 border border-gray-100">
              <div className="grid gap-4 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-royal-blue/10 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-royal-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-onyx-gray/60">Date</p>
                    <p className="font-semibold text-rich-black">
                      {new Date(formData.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-deep-wine/10 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-deep-wine" />
                  </div>
                  <div>
                    <p className="text-sm text-onyx-gray/60">Time & Duration</p>
                    <p className="font-semibold text-rich-black">
                      {formData.time} ({formData.meetingDuration} minutes)
                    </p>
                  </div>
                </div>

                {formData.enableEngagement && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-onyx-gray/60">Features</p>
                      <p className="font-semibold text-rich-black">Engagement Tracking Enabled</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              className="bg-gradient-to-r from-royal-blue to-deep-wine hover:from-deep-wine hover:to-royal-blue text-white px-8 py-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              onClick={back}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-alice-white to-white">
      <div className="absolute top-20 left-20 w-72 h-72 bg-royal-blue/5 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-deep-wine/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      <nav className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-alice-white/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-royal-wine rounded-xl flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-rich-black">
                Smart<span className="text-gradient">Meet</span>
              </span>
            </div>

            <Button
              variant="ghost"
              onClick={back}
              className="text-onyx-gray hover:text-royal-blue"
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center px-4 py-12 relative">
        <div className="w-full max-w-2xl">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl p-8 card-shadow border border-white/50">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-rich-black mb-4">
                Create New Meeting
              </h1>
              <p className="text-lg text-onyx-gray/70">
                Set your meeting details and schedule it for your team
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-rich-black mb-2">
                  Meeting Title *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Weekly Team Standup"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 h-12 rounded-xl border-2 border-gray-200 focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20 transition-all duration-200"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-rich-black mb-2">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Brief description of the meeting agenda..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20 transition-all duration-200 resize-none"
                  disabled={isLoading}
                />
              </div>

              <div className="bg-gradient-to-br from-alice-white to-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-rich-black">Schedule Time</h3>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isScheduleNow}
                      onChange={(e) => setIsScheduleNow(e.target.checked)}
                      className="w-4 h-4 text-royal-blue border-2 border-gray-300 rounded focus:ring-royal-blue focus:ring-2"
                      disabled={isLoading}
                    />
                    <span className="text-sm font-medium text-rich-black">Start Now</span>
                  </label>
                </div>

                {!isScheduleNow && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-rich-black mb-2">
                        Date *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-onyx-gray/40 pointer-events-none" />
                        <Input
                          type="date"
                          value={formData.date}
                          onChange={(e) => handleInputChange('date', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="pl-12 py-3 h-12 rounded-xl border-2 border-gray-200 focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20 transition-all duration-200"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-rich-black mb-2">
                        Time *
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-onyx-gray/40 pointer-events-none" />
                        <Input
                          type="time"
                          value={formData.time}
                          onChange={(e) => handleInputChange('time', e.target.value)}
                          className="pl-12 py-3 h-12 rounded-xl border-2 border-gray-200 focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20 transition-all duration-200"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {isScheduleNow && (
                  <div className="bg-royal-blue/5 rounded-xl p-4 border border-royal-blue/20">
                    <p className="text-sm text-royal-blue font-medium">
                      Meeting will start immediately after creation
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-rich-black mb-2">
                  Expected Duration (minutes)
                </label>
                <select
                  value={formData.meetingDuration}
                  onChange={(e) => handleInputChange('meetingDuration', e.target.value)}
                  className="w-full px-4 py-3 h-12 rounded-xl border-2 border-gray-200 focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/20 transition-all duration-200 bg-white"
                  disabled={isLoading}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>

              <div className="bg-gradient-to-br from-alice-white to-white rounded-2xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-rich-black mb-4">Meeting Options</h3>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableEngagement}
                      onChange={(e) => handleInputChange('enableEngagement', e.target.checked)}
                      className="w-5 h-5 text-royal-blue border-2 border-gray-300 rounded focus:ring-royal-blue focus:ring-2"
                      disabled={isLoading}
                    />
                    <div>
                      <span className="font-medium text-rich-black">Enable Engagement Tracking</span>
                      <p className="text-sm text-onyx-gray/60">Track participant attention and generate insights</p>
                    </div>
                  </label>

                  {!isScheduleNow && (
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyMembers}
                        onChange={(e) => setNotifyMembers(e.target.checked)}
                        className="w-5 h-5 text-royal-blue border-2 border-gray-300 rounded focus:ring-royal-blue focus:ring-2"
                        disabled={isLoading}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-rich-black">Notify Organization Members</span>
                          {memberEmails.length > 0 && (
                            <span className="flex items-center text-xs text-onyx-gray/60 bg-alice-white px-2 py-1 rounded-full">
                              <Users className="w-3 h-3 mr-1" />
                              {memberEmails.length} member{memberEmails.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-onyx-gray/60">Send email notifications with meeting link to all members</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

                {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

              <Button
                type="submit"
                disabled={!formData.name.trim() || isLoading}
                className="w-full bg-gradient-to-r from-royal-blue to-deep-wine hover:from-deep-wine hover:to-royal-blue text-white py-4 h-14 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Meeting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Video className="w-5 h-5" />
                    {isScheduleNow ? 'Create & Start Meeting' : 'Create Meeting'}
                  </span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateMeeting() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-alice-white to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-royal-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-onyx-gray">Loading...</p>
        </div>
      </div>
    }>
      <CreateMeetingContent />
    </Suspense>
  );
}