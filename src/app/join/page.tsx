'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Video, Mic, MicOff, VideoOff, Settings, Loader2, AlertCircle, Clock, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { API_PREFIX } from '@/constants/api';

interface UserData {
  id: number;
  name: string;
  email: string;
  ImagePath?: string;
}

interface MeetingData {
  id: string;
  name: string;
  startTime: string;
  meetingDuration: number;
  organization: {
    name: string;
  };
}

export default function JoinMeeting() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  
  const meetingId = searchParams.get('meetingId');
  const organizationId = searchParams.get('organizationId');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null);
  const [meetingNotStarted, setMeetingNotStarted] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState('');
  const [notAuthorized, setNotAuthorized] = useState(false);
  
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push(`/auth?redirect=/join?meetingId=${meetingId}&organizationId=${organizationId}`);
      return;
    }

    if (meetingId && organizationId) {
      fetchUserAndMeetingData();
    }
  }, [isLoggedIn, meetingId, organizationId]);

  useEffect(() => {
    if (isVideoEnabled && !meetingNotStarted && !notAuthorized) {
      startVideo();
    } else {
      stopVideo();
    }

    return () => {
      stopVideo();
    };
  }, [isVideoEnabled, meetingNotStarted, notAuthorized]);

  useEffect(() => {
    if (!meetingData || !meetingNotStarted) return;

    const interval = setInterval(() => {
      const now = new Date();
      const startTime = new Date(Number(meetingData.startTime));
      const diff = startTime.getTime() - now.getTime();

      if (diff <= 0) {
        setMeetingNotStarted(false);
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeUntilStart(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeUntilStart(`${minutes}m ${seconds}s`);
      } else {
        setTimeUntilStart(`${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [meetingData, meetingNotStarted]);

  const fetchUserAndMeetingData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const appToken = localStorage.getItem("token");
      if (!appToken) {
        router.push(`/auth?redirect=/join?meetingId=${meetingId}&organizationId=${organizationId}`);
        return;
      }

      // Fetch user data
      const userRes = await fetch(`${API_PREFIX}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${appToken}`
        },
        body: JSON.stringify({
          query: `{ getUserbyId { id name email ImagePath } }`
        })
      });

      const userJson = await userRes.json();
      if (userJson.errors) {
        console.error("getUserbyId errors", userJson.errors);
        setError('Failed to load user data');
        setIsLoading(false);
        return;
      }
      const user = userJson.data.getUserbyId;
      setUserData(user);

      const orgRes = await fetch(`${API_PREFIX}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${appToken}`
        },
        body: JSON.stringify({
          query: `{ getOrganizationbyId(id: ${organizationId}) { ownerId members { id user { id } } } }`
        })
      });

      const orgJson = await orgRes.json();
      if (orgJson.errors) {
        console.error("getOrganizationbyId errors", orgJson.errors);
        setError('Organization not found');
        setIsLoading(false);
        return;
      }

      const org = orgJson.data.getOrganizationbyId;

      const isOwner = org.ownerId === user.id;
      const isMember = org.members.some((m: { user: { id: number } }) => m.user.id === user.id);

      if (!isOwner && !isMember) {
        setNotAuthorized(true);
        setIsLoading(false);
        return;
      }


      const meetingRes = await fetch(`${API_PREFIX}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${appToken}`
        },
        body: JSON.stringify({
          query: `{ getMeetingById(id: ${meetingId}) { id name startTime meetingDuration organization { name } } }`
        })
      });

      const meetingJson = await meetingRes.json();
      if (meetingJson.errors) {
        console.error("getMeetingById errors", meetingJson.errors);
        setError('Meeting not found');
        setIsLoading(false);
        return;
      }
      
      const meeting = meetingJson.data.getMeetingById;
      setMeetingData(meeting);


      const now = new Date();
      const startTime = new Date(Number(meeting.startTime));
      
      if (now < startTime) {
        setMeetingNotStarted(true);
      }

    } catch (err) {
      console.error('[Error fetching data]:', err);
      setError('Failed to load meeting. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      setVideoStream(stream);
      
      const videoElement = document.getElementById('preview-video') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setIsVideoEnabled(false);
    }
  };

  const stopVideo = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
  };

  const handleJoinMeeting = () => {
    if (!userData) return;
    setIsJoining(true);
    
    sessionStorage.setItem('meetingPreferences', JSON.stringify({
      micEnabled: isMicEnabled,
      videoEnabled: isVideoEnabled
    }));
    
    stopVideo();
    
    const meetingUrl = `/meeting?userId=${userData.id}&meetingId=${meetingId}`;
    router.push(meetingUrl);
  };

  const getImageUrl = (imagePath?: string): string => {
    if (!imagePath) return '';
    const normalizedPath = imagePath.replace(/\\/g, "/");
    return `${API_PREFIX}/${normalizedPath}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-alice-white to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-royal-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-onyx-gray">Loading meeting...</p>
        </div>
      </div>
    );
  }

  if (notAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-alice-white to-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl p-8 card-shadow border border-white/50 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-rich-black mb-4">Access Denied</h1>
            <p className="text-onyx-gray/70 mb-6">
              You are not a member of the organization that owns this meeting.
            </p>
            <Button
              onClick={() => router.push('/main')}
              className="bg-gradient-to-r from-royal-blue to-deep-wine hover:from-deep-wine hover:to-royal-blue text-white px-6 py-3 rounded-xl font-semibold"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error && !meetingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-alice-white to-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl p-8 card-shadow border border-white/50 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-rich-black mb-4">Unable to Load Meeting</h1>
            <p className="text-onyx-gray/70 mb-6">{error}</p>
            <Button
              onClick={() => router.push('/main')}
              className="bg-gradient-to-r from-royal-blue to-deep-wine hover:from-deep-wine hover:to-royal-blue text-white px-6 py-3 rounded-xl font-semibold"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (meetingNotStarted && meetingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-alice-white to-white flex items-center justify-center px-4">
        <div className="absolute top-20 left-20 w-72 h-72 bg-royal-blue/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-deep-wine/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

        <div className="w-full max-w-2xl relative">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl p-12 card-shadow border border-white/50 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-royal-blue/10 to-deep-wine/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-12 h-12 text-royal-blue" />
            </div>

            <h1 className="text-3xl font-bold text-rich-black mb-4">
              Meeting Hasn't Started Yet
            </h1>
            <p className="text-lg text-onyx-gray/70 mb-8">
              The meeting <span className="font-semibold text-royal-blue">{meetingData.name}</span> will start in
            </p>

            <div className="bg-gradient-to-br from-alice-white to-white rounded-2xl p-8 mb-8 border border-gray-100">
              <div className="text-5xl font-bold text-transparent bg-gradient-to-r from-royal-blue to-deep-wine bg-clip-text mb-4">
                {timeUntilStart}
              </div>
              <p className="text-sm text-onyx-gray/60">
                Scheduled for {new Date(Number(meetingData.startTime)).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push('/main')}
                className="w-full bg-gradient-to-r from-royal-blue to-deep-wine hover:from-deep-wine hover:to-royal-blue text-white px-8 py-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
              
              <p className="text-sm text-onyx-gray/60">
                This page will automatically update when the meeting starts
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-alice-white to-white">
      <div className="absolute top-20 left-20 w-72 h-72 bg-royal-blue/5 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-deep-wine/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      <nav className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-alice-white/50">
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
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12 relative">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl p-8 card-shadow border border-white/50">
            <div className="aspect-video bg-gray-900 rounded-2xl mb-6 relative overflow-hidden">
              {isVideoEnabled ? (
                <video
                  id="preview-video"
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div 
                      className="w-32 h-32 bg-gradient-to-br from-royal-blue to-deep-wine rounded-full flex items-center justify-center text-white text-5xl font-bold mx-auto mb-4"
                      style={userData?.ImagePath ? {
                        backgroundImage: `url(${getImageUrl(userData.ImagePath)})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      } : {}}
                    >
                      {!userData?.ImagePath && userData?.name?.[0]?.toUpperCase()}
                    </div>
                    <p className="text-white text-lg font-semibold">{userData?.name}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={() => setIsMicEnabled(!isMicEnabled)}
                className={`w-14 h-14 rounded-full transition-all duration-200 ${
                  isMicEnabled
                    ? 'bg-white hover:bg-gray-100 text-rich-black border-2 border-gray-200'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {isMicEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </Button>

              <Button
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                className={`w-14 h-14 rounded-full transition-all duration-200 ${
                  isVideoEnabled
                    ? 'bg-white hover:bg-gray-100 text-rich-black border-2 border-gray-200'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </Button>

              <Button
                className="w-14 h-14 rounded-full bg-white hover:bg-gray-100 text-rich-black border-2 border-gray-200 transition-all duration-200"
              >
                <Settings className="w-6 h-6" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl p-8 card-shadow border border-white/50 mb-6">
              <h1 className="text-3xl font-bold text-rich-black mb-4">
                Ready to join?
              </h1>
              
              {meetingData && (
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-onyx-gray/60 mb-1">Meeting</p>
                    <p className="text-xl font-semibold text-rich-black">{meetingData.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-onyx-gray/60 mb-1">Organization</p>
                    <p className="text-lg font-medium text-rich-black">{meetingData.organization.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-onyx-gray/60 mb-1">Start Time</p>
                      <p className="font-medium text-rich-black">
                        {new Date(Number(meetingData.startTime)).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-onyx-gray/60 mb-1">Duration</p>
                      <p className="font-medium text-rich-black">{meetingData.meetingDuration} minutes</p>
                    </div>
                  </div>
                </div>
              )}

             <Button
                onClick={handleJoinMeeting}
                disabled={!userData || isJoining}
                className="w-full bg-gradient-to-r from-royal-blue to-deep-wine hover:from-deep-wine hover:to-royal-blue text-white py-6 h-14 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                {isJoining ? (
                    <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Joining...
                    </span>
                ) : (
                    'Join Meeting'
                )}
            </Button>
            </div>

            <div className="bg-gradient-to-br from-alice-white to-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-rich-black mb-3">Before you join</h3>
              <ul className="space-y-2 text-sm text-onyx-gray/70">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-royal-blue rounded-full mr-2"></div>
                  Check your camera and microphone settings
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-royal-blue rounded-full mr-2"></div>
                  Find a quiet location with good lighting
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-royal-blue rounded-full mr-2"></div>
                  Ensure stable internet connection
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}