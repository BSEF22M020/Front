'use client';

import { useEffect, useState } from 'react';
import { Video, Plus, Users, ChartBar as BarChart3, FileText, Calendar, Clock, Eye, Settings, LogOut, Copy, ExternalLink, TrendingUp, Award, Target, Bell, Search, Filter, MoveHorizontal as MoreHorizontal, ArrowUpRight, Zap, Shield, Globe, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import organCard from '@/components/ui/organizationCard';
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import Loader from '@/components/ui/loader';

interface Meeting {
  id: string;
  name: string;
  startTime: string;
  meetingDuration: number;
}

interface Organization {
  id: number;
  name: string;
  description?: string;
  imagePath?: string;
  totalParticipants: number;
  createAt: string;
  ownerId: number;
  meeting: Meeting[];
}

interface MemberOrganization {
  organization: Organization;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  ImagePath?: string;
  member: MemberOrganization[];
  ownedOrganizations: Organization[];
}

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  icon: unknown;
  trend: string;
  trendUp: boolean;
  color: string;
}

export default function Dashboard() {
  const router = useRouter();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [data, setData] = useState<UserData | null>(null);
  const [memberOrganizations, setMemberOrganizations] = useState<MemberOrganization[] | null>(null);
  const [ownOrganizations, setOwnOrganizations] = useState<Organization[] | null>(null);
  const [loading, setloading] = useState(true);
  const [upcoming, setupcoming] = useState<Meeting[]>([]);
  const [runing, setRunningMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    const fetchData = async () => { 
      const now = Date.now(); 
      const twoHoursAgo = now - 2 * 60 * 60 * 1000;
      const query = `{ getUserbyId { id name email ImagePath member { organization { id name  totalParticipants createAt ownerId  meeting(time: "${twoHoursAgo}" , limit: 2){id name  startTime  meetingDuration}  } } ownedOrganizations { id name  totalParticipants createAt ownerId meeting(time: "${twoHoursAgo}" , limit: 2){id name  startTime  meetingDuration} } }}`;

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
        
        setData(result.data.data.getUserbyId);
        setloading(false);
        let meet: Meeting[] = [];
        const upcomingMeetings: Meeting[] = [];
        const runningMeetings: Meeting[] = [];

        console.log('data ===== > ', result.data.data.getUserbyId.member);
        
        if (result.data.data.getUserbyId.member && result.data.data.getUserbyId.member.length > 0) {
          meet = result.data.data.getUserbyId.member.flatMap((org: MemberOrganization) => org.organization.meeting);
          setMemberOrganizations(result.data.data.getUserbyId.member);
        }
        
        if (result.data.data.getUserbyId.ownedOrganizations && result.data.data.getUserbyId.ownedOrganizations.length > 0) {
          meet = meet.concat(result.data.data.getUserbyId.ownedOrganizations.flatMap((org: Organization) => org.meeting));
          setOwnOrganizations(result.data.data.getUserbyId.ownedOrganizations);
        }

        meet.forEach(item => {
          const meetingStart = new Date(Number(item.startTime));
          const meetingEnd = new Date(meetingStart.getTime() + Number(item.meetingDuration) * 60000);
          const now = new Date();

          if (now >= meetingStart && now <= meetingEnd) {
            runningMeetings.push(item);
          } else if (now < meetingStart) {
            upcomingMeetings.push(item);
          }
        });
        
        upcomingMeetings.sort((a, b) => Number(a.startTime) - Number(b.startTime));
        setupcoming(upcomingMeetings);
        setRunningMeetings(runningMeetings);

      } catch (error) {
        console.error('[Error]: ', error instanceof Error ? error.message : 'Unknown error');
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className='w-screen h-screen flex justify-center items-center'>
        <Loader />
      </div>
    );
  }

  const handleViewMeeting = (userId: number, orgId: number) => {
    router.push(`/dashboard?userId=${userId}&organizationId=${orgId}`);
  };

  console.log('[data]: ', data);

  // Dummy data
  const stats: StatCard[] = [
    {
      title: 'Meetings Hosted',
      value: '47',
      subtitle: 'This month (+12 from last)',
      icon: Video,
      trend: '+12%',
      trendUp: true,
      color: 'from-royal-blue/20 to-royal-blue/10'
    },
    {
      title: 'Average Engagement',
      value: '87%',
      subtitle: 'Across all meetings (+5% up)',
      icon: Target,
      trend: '+5%',
      trendUp: true,
      color: 'from-green-500/20 to-green-400/10'
    },
    {
      title: 'Total Participants',
      value: '324',
      subtitle: 'Unique attendees (+18% growth)',
      icon: Users,
      trend: '+18%',
      trendUp: true,
      color: 'from-deep-wine/20 to-deep-wine/10'
    },
    {
      title: 'Reports Generated',
      value: '42',
      subtitle: 'Automated insights (+8 new)',
      icon: FileText,
      trend: '+8%',
      trendUp: true,
      color: 'from-purple-500/20 to-purple-400/10'
    }
  ];

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

  function getRemainingMinutes(startTime: string | number, meetingDuration: number): number {
    const start = new Date(Number(startTime)); 
    const durationMs = Number(meetingDuration) * 60000; 
    const end = new Date(start.getTime() + durationMs); 
    const now = new Date();
    const timeLeftMs = end.getTime() - now.getTime();

    return timeLeftMs > 0 ? Math.ceil(timeLeftMs / 60000) : 0; 
  }

  function getImageUrl(imagePath: string): string {
    const normalizedPath = imagePath.replace(/\\/g, "/");
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

              <Button
                className="bg-gradient-to-r from-royal-blue to-royal-blue/90 hover:from-deep-wine hover:to-deep-wine/90 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
                onClick={() => window.location.href = '/create-organization'}
              >
                <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Create Organization
              </Button>

              <Button
                className="bg-gradient-to-r from-royal-blue to-royal-blue/90 hover:from-deep-wine hover:to-deep-wine/90 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
                onClick={() => window.location.href = '/join-organization'}
              >
                <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Join 
              </Button>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  className="w-10 h-10 bg-gradient-to-br from-royal-blue to-deep-wine rounded-xl flex items-center justify-center text-white font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  {data?.name?.[0] || 'U'}
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-alice-white/50 py-3 z-50">
                    <div className="px-4 py-2 border-b border-alice-white">
                      <p className="font-semibold text-rich-black">{data?.name || 'User'}</p>
                      <p className="text-sm text-onyx-gray">{data?.email || ''}</p>
                    </div>
                    <button className="w-full text-left px-4 py-2 text-onyx-gray hover:bg-alice-white hover:text-royal-blue transition-colors flex items-center">
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </button>
                    <button className="w-full text-left px-4 py-2 text-onyx-gray hover:bg-alice-white hover:text-deep-wine transition-colors flex items-center">
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
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
                Welcome {data?.name || 'User'}
              </h1>
              <p className="text-xl text-onyx-gray/70 mb-4">
                This is your workspace, you can create organizations here.
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
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Meetings */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl card-shadow border border-white/50">
              {ownOrganizations && ownOrganizations.length > 0 && (
                <>
                  <div className="p-6 border-b border-alice-white/50">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-rich-black">Your Organizations</h2>
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
                          <th className="text-left py-5 px-6 text-sm font-bold text-rich-black uppercase tracking-wider">Participants</th>
                          <th className="text-left py-5 px-6 text-sm font-bold text-rich-black uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ownOrganizations.map((organ: Organization) => (
                          <tr key={organ.id} className="border-b border-alice-white/30 hover:bg-royal-blue/5 transition-all duration-200 group">
                            <td className="py-5 px-6">
                              <div>
                                <div className="font-semibold text-rich-black group-hover:text-royal-blue transition-colors">{organ.name}</div>
                              </div>
                            </td>
                            <td className="py-5 px-6 text-onyx-gray font-medium">
                              {new Date(parseInt(organ.createAt)).toLocaleDateString()}
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex items-center text-onyx-gray font-medium">
                                <Users className="w-4 h-4 mr-2" />
                                {organ.totalParticipants}
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <Button
                                className="bg-royal-blue hover:bg-deep-wine text-white transition-all duration-200"
                                onClick={() => data && handleViewMeeting(data.id, organ.id)}
                              >
                                Schedule and View Meetings
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {memberOrganizations && memberOrganizations.length > 0 && (
                <>
                  <div className="p-6 border-b border-alice-white/50">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-rich-black">Joined</h2>
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
                          <th className="text-left py-5 px-6 text-sm font-bold text-rich-black uppercase tracking-wider">Participants</th>
                          <th className="text-left py-5 px-6 text-sm font-bold text-rich-black uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberOrganizations.map((organ: MemberOrganization) => (
                          <tr key={organ.organization.id} className="border-b border-alice-white/30 hover:bg-royal-blue/5 transition-all duration-200 group">
                            <td className="py-5 px-6">
                              <div>
                                <div className="font-semibold text-rich-black group-hover:text-royal-blue transition-colors">{organ.organization.name}</div>
                              </div>
                            </td>
                            <td className="py-5 px-6 text-onyx-gray font-medium">
                              {new Date(parseInt(organ.organization.createAt)).toLocaleDateString()}
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex items-center text-onyx-gray font-medium">
                                <Users className="w-4 h-4 mr-2" />
                                {organ.organization.totalParticipants}
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <Button
                                className="bg-royal-blue hover:bg-deep-wine text-white transition-all duration-200"
                                onClick={() => data && handleViewMeeting(data.id, organ.organization.id)}
                              >
                                View Meeting
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Upcoming Meetings */}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}