'use client';

import { useEffect, useState } from 'react';
import { Video, Plus, Users, ChartBar as BarChart3, FileText, Calendar, Clock, Eye, Settings, LogOut, Copy, ExternalLink, TrendingUp, Award, Target, Bell, Search, Filter, MoveHorizontal as MoreHorizontal, ArrowUpRight, Zap, Shield, Globe, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import Loader from '@/components/ui/loader';

interface Meeting {
  id: string;
  name: string;
  startTime: string;
  Engagment: number;
  meetingDuration: number;
  status?: string;
}

interface User {
  id: number;
  name: string;
  ImagePath: string;
}

interface Member {
  id: number;
  joinedAt: string;
  user: User;
}

interface Owner {
  id: number;
  name: string;
  ImagePath: string;
}

interface OrganizationData {
  id: number;
  name: string;
  description: string;
  organizationCode: string;
  createAt: string;
  ownerId: number;
  totalParticipants: number;
  owner: Owner;
  meeting: Meeting[];
  members: Member[];
}

interface ChartData {
  month: string;
  engagement: number;
  meetings: number;
}

export default function Dashboard() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<number | null>(null);
  const [organId, setorganId] = useState<number | null>(null);
  const [loading, setloading] = useState(true);
  const [data, setData] = useState<OrganizationData | null>(null);
  const [admin, setAdmin] = useState<Owner | null>(null);
  const [member, setmember] = useState<Member[]>([]);
  const [meetings, setmeeting] = useState<Meeting[]>([]);
  const [upcoming, setUpcomings] = useState<Meeting[]>([]);
  const [runing, setRuningMeeting] = useState<Meeting[]>([]);
  const [memberView, setMemberView] = useState(false);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [organizationCode, setorganizationCode] = useState<string | null>(null);
 
  useEffect(() => {
    setUserId(Number(searchParams.get("userId")));
    setorganId(Number(searchParams.get("organizationId")));
  }, [searchParams]);

  useEffect(() => {
    if (!organId) return;
    
    const fetchData = async () => { 
      const query = `{ getOrganizationbyId(id: ${organId}) { id name description organizationCode createAt ownerId totalParticipants owner { id name ImagePath} meeting { id name startTime Engagment meetingDuration } members { id joinedAt user{ id name ImagePath} } } }`;

      try {
        console.log('token: ', localStorage.getItem("token"));

        const result = await axios.post(
          "https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/graphql",
          { 'query': query },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }
          }
        );
        
        setAdmin(result.data.data.getOrganizationbyId.owner);
        setData(result.data.data.getOrganizationbyId);
        setorganizationCode(result.data.data.getOrganizationbyId.organizationCode);
        setloading(false);
        
        if (result.data.data.getOrganizationbyId.members && result.data.data.getOrganizationbyId.members.length > 0) {
          setmember(result.data.data.getOrganizationbyId.members);
        }
        
        if (result.data.data.getOrganizationbyId.meeting && result.data.data.getOrganizationbyId.meeting.length > 0) {
          const meetingData: Meeting[] = result.data.data.getOrganizationbyId.meeting;
          setmeeting(meetingData);
          
          // Set Up-Coming Meeting 
          const upComings = meetingData
            .filter(item => {
              const meetingDate = new Date(Number(item.startTime));
              return meetingDate > new Date();
            })
            .sort((a, b) => Number(a.startTime) - Number(b.startTime)) 
            .slice(0, 4); 
          setUpcomings(upComings);

          // Set Running Meeting 
          const onGo = meetingData.filter(item => {
            const meetingStart = new Date(Number(item.startTime));
            const meetingEnd = new Date(meetingStart.getTime() + Number(item.meetingDuration) * 60000); 
            console.log(meetingEnd.getHours() + ':' + meetingEnd.getMinutes() + ':' + meetingEnd.getSeconds());
            const now = new Date();
            return now >= meetingStart && now <= meetingEnd;
          });
          setRuningMeeting(onGo);
          console.log('running Meeting: ___ ', onGo);
        }
        
        console.log(result.data.data.getOrganizationbyId);
        setloading(false);
      } catch (error) {
        console.error('[Error]: ', error instanceof Error ? error.message : 'Unknown error');
        alert(error instanceof Error ? error.message : 'An error occurred');
      }
    };
    
    fetchData();
  }, [organId]);

  function createMeeting() {
    router.push(`/create-meeting?userId=${userId}&organizationId=${organId}`);
  }

  function joinMeeting(meetingId: string) {
    router.push(`/meeting?userId=${userId}&meetingId=${meetingId}`);
  }

  async function changeOrganizationCode() {
    try {
      const result = await axios.get(
        `https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/api/changeOrganizationCode/${organId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }
        }
      );
      setorganizationCode(result.data.organizationCode);
    } catch (error) {
      console.error('[Error changing code]: ', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  function getRemainingMinutes(startTime: string | number, meetingDuration: number): number {
    const start = new Date(Number(startTime)); 
    const durationMs = Number(meetingDuration) * 60000; 
    const end = new Date(start.getTime() + durationMs); 
    const now = new Date();
    const timeLeftMs = end.getTime() - now.getTime();

    return timeLeftMs > 0 ? Math.ceil(timeLeftMs / 60000) : 0; 
  }

  function findStatus(startTime: string | Date, duration: number): string {
    const now = new Date();
    const dateObj = new Date(Number(startTime)); 
    const endTime = new Date(dateObj.getTime() + Number(duration) * 60000);
    
    if (now > endTime) {
      return 'completed';
    } else if (now < dateObj) {
      return 'upcoming';
    } else {
      return 'in-progress';
    }
  }

  const chartData: ChartData[] = [
    { month: 'Jul', engagement: 78, meetings: 12 },
    { month: 'Aug', engagement: 82, meetings: 15 },
    { month: 'Sep', engagement: 79, meetings: 18 },
    { month: 'Oct', engagement: 85, meetings: 22 },
    { month: 'Nov', engagement: 88, meetings: 28 },
    { month: 'Dec', engagement: 87, meetings: 35 },
    { month: 'Jan', engagement: 92, meetings: 47 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'upcoming':
        return 'text-royal-blue bg-royal-blue/10';
      case 'in-progress':
        return 'text-deep-wine bg-deep-wine/10';
      default:
        return 'text-onyx-gray bg-alice-white';
    }
  };

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 90) return 'text-green-600';
    if (engagement >= 75) return 'text-royal-blue';
    if (engagement >= 60) return 'text-yellow-600';
    return 'text-red-500';
  };

  function formatMeetingTime(meetingTime: string | number | Date): string {
    const date = new Date(Number(meetingTime));
    if (isNaN(date.getTime())) return "Invalid Date";

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const pad = (n: number) => n.toString().padStart(2, "0");
    const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

    // Today
    if (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      return `Today at ${timeStr}`;
    }

    // Tomorrow
    if (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    ) {
      return `Tomorrow at ${timeStr}`;
    }

    // This week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Saturday

    if (date >= weekStart && date <= weekEnd) {
      return `${dayNames[date.getDay()]} at ${timeStr}`;
    }

    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${timeStr}`;
  }

  if (loading) {
    return (
      <div className='w-screen h-screen flex justify-center items-center'>
        <Loader />
      </div>
    );
  }

  function getImageUrl(imagePath: string): string {
    const normalizedPath = imagePath.replace(/\\/g, "/");
    console.log('[Pic - Path]: ', `https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/${normalizedPath}`);
    return `https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/${normalizedPath}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-alice-white to-white">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-royal-blue/3 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-deep-wine/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/2 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-alice-white/50 sticky top-0 z-50">
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

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-onyx-gray/40" />
                  <input
                    type="text"
                    placeholder="Search meetings..."
                    className="pl-10 pr-4 py-2 w-64 bg-alice-white/50 border border-alice-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-royal-blue/20 focus:border-royal-blue transition-all"
                  />
                </div>
                
                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-royal-blue hover:text-white hover:bg-royal-blue border-royal-blue/20 hover:border-royal-blue transition-all duration-200"
                  onClick={() => window.location.href = `/reports/123`}
                >
                  <Bell className="w-4 h-4" />
                </Button>
              </div>

              {admin && admin.id === userId && (
                <Button
                  className="bg-gradient-to-r from-royal-blue to-royal-blue/90 hover:from-deep-wine hover:to-deep-wine/90 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
                  onClick={createMeeting}
                >
                  <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  Create Meeting
                </Button>
              )}

              {/* Profile Menu */}
              {organizationCode && (
                <div className="relative">
                  <Button
                    className="bg-gradient-to-r from-royal-blue to-royal-blue/90 hover:from-deep-wine hover:to-deep-wine/90 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                  >
                    <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    Code
                  </Button>
                  
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-alice-white/50 py-3 z-50">
                      <div className="px-4 py-2 border-b border-alice-white">
                        <p className="font-semibold text-rich-black">code</p>
                        <p className="text-sm text-onyx-gray">{organizationCode}</p>
                      </div>
                      <button onClick={changeOrganizationCode} className="w-full text-left px-4 py-2 text-onyx-gray hover:bg-alice-white hover:text-royal-blue transition-colors flex items-center">
                        <Settings className="w-4 h-4 mr-3" />
                        Change Code
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Welcome Header */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/'}
                className="text-onyx-gray hover:text-royal-blue"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to home
              </Button>
              <h1 className="text-4xl font-bold text-rich-black mb-3">
                {data?.name || 'Organization'}
              </h1>
              <p className="text-xl text-onyx-gray/70 mb-4">
                {data?.description || ''}
              </p>
              <div className="flex items-center space-x-6 text-sm text-onyx-gray/60">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>All systems operational</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Last sync: 2 minutes ago</span>
                </div>
              </div>
            </div>
            
            {/* Time Range Selector */}
            <div className="mt-6 lg:mt-0">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-1 shadow-sm border border-alice-white/50">
                <div className="flex space-x-1">
                  {['Meetings', 'Members', '90d'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setMemberView(!memberView)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        selectedTimeRange === range
                          ? 'bg-royal-blue text-white shadow-sm'
                          : 'text-onyx-gray hover:text-royal-blue hover:bg-royal-blue/5'
                      }`}
                    >
                      {range === 'Meetings' ? 'Meetings' : range === 'Members' ? 'Members' : 'Last 90 days'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {runing.map((stat) => {
            const Icon = Video;
            return (
              <div
                key={stat.id}
                className="group bg-white/70 backdrop-blur-sm rounded-3xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300 transform hover:-translate-y-2 border border-white/50 relative overflow-hidden"
              >
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-royal-blue/20 to-royal-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-royal-blue/20 to-royal-blue/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-7 h-7 text-royal-blue" />
                    </div>
                    <div className="flex items-center text-sm font-bold px-3 py-1 rounded-full text-red-700 bg-red-100">
                      {getRemainingMinutes(stat.startTime, stat.meetingDuration)}min Left
                    </div>
                  </div>
                  <div className="text-sm text-onyx-gray/70 leading-relaxed">
                    {stat.name}
                  </div>
                  <div className="w-full mt-3 text-sm text-onyx-gray/70 leading-relaxed">
                    <Button
                      className="bg-gradient-to-r from-royal-blue to-royal-blue/90 hover:from-deep-wine hover:to-deep-wine/90 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
                      onClick={() => joinMeeting(stat.id)}
                    >
                      Join Meeting
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!memberView && (
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Recent Meetings */}
            <div className="lg:col-span-2">
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl card-shadow border border-white/50">
                <div className="p-6 border-b border-alice-white/50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-rich-black">Recent Meetings</h2>
                    <Button
                      variant="outline"
                      className="text-royal-blue hover:text-deep-wine"
                    >
                      View All
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-alice-white/50">
                        <th className="text-left py-5 px-6 text-sm font-bold text-rich-black uppercase tracking-wider">Meeting</th>
                        <th className="text-left py-5 px-6 text-sm font-bold text-rich-black uppercase tracking-wider">Date</th>
                        <th className="text-left py-5 px-6 text-sm font-bold text-rich-black uppercase tracking-wider">Duration</th>
                        <th className="text-left py-5 px-6 text-sm font-bold text-rich-black uppercase tracking-wider">Engagement</th>
                        {admin && admin.id === userId && <th className="text-left py-5 px-6 text-sm font-bold text-rich-black uppercase tracking-wider">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {meetings && meetings.map((meet) => (
                        <tr key={meet.id} className="border-b border-alice-white/30 hover:bg-royal-blue/5 transition-all duration-200 group">
                          <td className="py-5 px-6">
                            <div>
                              <div className="font-semibold text-rich-black group-hover:text-royal-blue transition-colors">{meet.name}</div>
                              <div className="text-sm text-onyx-gray/70 mt-1">{meet.meetingDuration} min</div>
                            </div>
                          </td>
                          <td className="py-5 px-6 text-onyx-gray font-medium">
                            {new Date(Number(meet.startTime)).toLocaleDateString()}
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center text-onyx-gray font-medium">
                              {meet.meetingDuration} min
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            {findStatus(meet.startTime, meet.meetingDuration) === 'upcoming' ? (
                              <span className={`px-4 py-2 rounded-full text-xs font-bold ${getStatusColor('upcoming')}`}>
                                Upcoming
                              </span>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <div className="w-12 bg-alice-white rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      meet.Engagment >= 90 ? 'bg-green-500' :
                                      meet.Engagment >= 75 ? 'bg-royal-blue' :
                                      meet.Engagment >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${meet.Engagment}%` }}
                                  ></div>
                                </div>
                                <span className={`font-bold text-sm ${getEngagementColor(meet.Engagment)}`}>
                                  {meet.Engagment}%
                                </span>
                              </div>
                            )}
                          </td>
                          {admin && admin.id === userId && (
                            <td className="py-5 px-6">
                              <Button
                                variant={findStatus(meet.startTime, meet.meetingDuration) === 'upcoming' ? "outline" : "default"}
                                size="sm"
                                className={findStatus(meet.startTime, meet.meetingDuration) === 'upcoming' 
                                  ? "text-royal-blue hover:text-white hover:bg-royal-blue border-royal-blue/20 hover:border-royal-blue transition-all duration-200"
                                  : "bg-royal-blue hover:bg-deep-wine text-white transition-all duration-200"
                                }
                                onClick={() => {
                                  if (findStatus(meet.startTime, meet.meetingDuration) === 'upcoming') {
                                    window.location.href = `/create-meeting?edit=${meet.id}`;
                                  } else {
                                    window.location.href = `/reports/${meet.id}`;
                                  }
                                }}
                              >
                                {findStatus(meet.startTime, meet.meetingDuration) === 'upcoming' ? (
                                  <>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Edit
                                  </>
                                ) : (
                                  <>
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    View Report
                                  </>
                                )}
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 card-shadow border border-white/50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-rich-black">Upcoming</h3>
                  <Calendar className="w-5 h-5 text-royal-blue" />
                </div>
                <div className="space-y-4">
                  {upcoming && upcoming.map((meet) => (
                    <div key={meet.id} className="group p-4 rounded-2xl hover:bg-royal-blue/5 transition-all duration-200 border border-transparent hover:border-royal-blue/20">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-rich-black group-hover:text-royal-blue transition-colors text-sm">
                            {meet.name}
                          </h4>
                          <div className="flex items-center space-x-3 mt-2">
                            <div className="flex items-center text-xs text-onyx-gray/60">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatMeetingTime(meet.startTime)}
                            </div>
                            <div className="flex items-center text-xs text-onyx-gray/60">
                              <Clock className="w-3 h-3 mr-1" />
                              {meet.meetingDuration} min
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-6 mt-4">
                {/* Engagement Trends */}
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 card-shadow border border-white/50">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-rich-black">Engagement Trends</h3>
                    <BarChart3 className="w-5 h-5 text-royal-blue" />
                  </div>
                  <div className="space-y-4">
                    {chartData.slice(-5).map((data, index) => (
                      <div key={index} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-onyx-gray font-semibold">{data.month}</span>
                          <div className="flex items-center space-x-3">
                            <span className="text-xs text-onyx-gray/60">{data.meetings} meetings</span>
                            <span className="text-sm font-bold text-royal-blue">
                              {data.engagement}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-alice-white rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-royal-blue to-deep-wine h-3 rounded-full transition-all duration-700 group-hover:shadow-lg"
                            style={{ width: `${data.engagement}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 card-shadow border border-white/50">
                  <h3 className="text-xl font-bold text-rich-black mb-6">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-onyx-gray hover:text-white hover:bg-royal-blue group transition-all duration-200 h-12 rounded-xl"
                    >
                      <Calendar className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                      Schedule Meeting
                      <ArrowUpRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-onyx-gray hover:text-white hover:bg-deep-wine group transition-all duration-200 h-12 rounded-xl"
                    >
                      <BarChart3 className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                      View Analytics
                      <ArrowUpRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-onyx-gray hover:text-white hover:bg-purple-600 group transition-all duration-200 h-12 rounded-xl"
                    >
                      <Award className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                      Export Reports
                      <ArrowUpRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {memberView && (
          <div>        
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl card-shadow-hover border border-white/50">
              <div className="p-8 border-b border-alice-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-rich-black mb-2">Members</h3>
                    <p className="text-onyx-gray/60">List of All the Members of this organization</p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-alice-white/50 bg-alice-white/30">
                      <th className="text-left py-6 px-8 text-sm font-bold text-rich-black uppercase tracking-wider">Member</th>
                      <th className="text-left py-6 px-6 text-sm font-bold text-rich-black uppercase tracking-wider">Join Date</th>
                      <th className="text-left py-6 px-6 text-sm font-bold text-rich-black uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin && (
                      <tr key={admin.id} className="border-b border-alice-white/30 hover:bg-gradient-to-r hover:from-royal-blue/5 hover:to-deep-wine/5 transition-all duration-300 group">
                        <td className="py-6 px-8">
                          <div className="flex items-center space-x-4">
                            <div 
                              className="w-12 h-12 bg-gradient-to-br from-royal-blue to-deep-wine rounded-2xl flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform duration-300"
                              style={{
                                backgroundImage: `url(${getImageUrl(admin.ImagePath)})`,
                                backgroundSize: "cover",  
                                backgroundPosition: "center", 
                                backgroundRepeat: "no-repeat" 
                              }}
                            >
                            </div>
                            <div>
                              <div className="font-bold text-rich-black group-hover:text-royal-blue transition-colors">
                                {admin.name}
                              </div>
                              <div className="text-sm text-onyx-gray/60">Host</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-6">
                          {data && new Date(Number(data.createAt)).toLocaleDateString()}
                        </td>
                        <td className="py-6 px-6">
                          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold border">
                            <span className="capitalize">Host</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {member.map((participant: Member) => (
                      <tr key={participant.id} className="border-b border-alice-white/30 hover:bg-gradient-to-r hover:from-royal-blue/5 hover:to-deep-wine/5 transition-all duration-300 group">
                        <td className="py-6 px-8">
                          <div className="flex items-center space-x-4">
                            <div 
                              className="w-12 h-12 bg-gradient-to-br from-royal-blue to-deep-wine rounded-2xl flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform duration-300"
                              style={{
                                backgroundImage: `url(${getImageUrl(participant.user.ImagePath)})`,
                                backgroundSize: "cover",  
                                backgroundPosition: "center", 
                                backgroundRepeat: "no-repeat" 
                              }}
                            >
                            </div>
                            <div>
                              <div className="font-bold text-rich-black group-hover:text-royal-blue transition-colors">
                                {participant.user.name}
                              </div>
                              <div className="text-sm text-onyx-gray/60">Member</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-6">
                          {new Date(Number(participant.joinedAt)).toLocaleDateString()}
                        </td>
                        <td className="py-6 px-6">
                          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold border">
                            <span className="capitalize">Member</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Table Footer */}
              <div className="p-6 bg-alice-white/30 border-t border-alice-white/50">
                <div className="flex items-center justify-between text-sm text-onyx-gray/60">
                  <span>Showing {member.length + 1} participants</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Section - Recent Activity */}
        <div className="bg-white/70 mt-9 backdrop-blur-sm rounded-3xl p-8 card-shadow border border-white/50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-rich-black mb-2">Recent Activity</h2>
              <p className="text-onyx-gray/70">Stay updated with your latest meeting activities</p>
            </div>
            <Button variant="outline" className="text-royal-blue border-royal-blue/20 hover:bg-royal-blue hover:text-white">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-royal-blue/5 to-royal-blue/10 hover:from-royal-blue/10 hover:to-royal-blue/20 transition-all duration-300 border border-royal-blue/10">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-royal-blue/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-royal-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-rich-black">High Engagement</h3>
                  <p className="text-sm text-onyx-gray/70">Product Review Meeting</p>
                </div>
              </div>
              <p className="text-sm text-onyx-gray/80">Achieved 95% engagement rate with 12 participants</p>
              <div className="mt-4 text-xs text-royal-blue font-medium">2 hours ago</div>
            </div>

            <div className="group p-6 rounded-2xl bg-gradient-to-br from-green-500/5 to-green-500/10 hover:from-green-500/10 hover:to-green-500/20 transition-all duration-300 border border-green-500/10">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-rich-black">Report Generated</h3>
                  <p className="text-sm text-onyx-gray/70">Weekly Team Standup</p>
                </div>
              </div>
              <p className="text-sm text-onyx-gray/80">Automated meeting summary and action items ready</p>
              <div className="mt-4 text-xs text-green-600 font-medium">5 hours ago</div>
            </div>
            
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-deep-wine/5 to-deep-wine/10 hover:from-deep-wine/10 hover:to-deep-wine/20 transition-all duration-300 border border-deep-wine/10">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-deep-wine/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-deep-wine" />
                </div>
                <div>
                  <h3 className="font-semibold text-rich-black">Security Update</h3>
                  <p className="text-sm text-onyx-gray/70">Account Settings</p>
                </div>
              </div>
              <p className="text-sm text-onyx-gray/80">Two-factor authentication enabled successfully</p>
              <div className="mt-4 text-xs text-deep-wine font-medium">1 day ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}