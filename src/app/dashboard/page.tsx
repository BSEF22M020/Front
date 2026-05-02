'use client';

import { Suspense, useEffect, useState } from 'react';
import { Video, Plus, Users, ChartBar as BarChart3, Share, Calendar, Clock, Settings, LogOut, Search, Bell, ArrowLeft, CalendarPlus, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import Loader from '@/components/ui/loader';
import { API_PREFIX } from '@/constants/api';

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

function DashboardContent() {
  const [showCodeMenu, setShowCodeMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedView, setSelectedView] = useState<'meetings' | 'members'>('meetings');
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

        const org = result.data.data.getOrganizationbyId;
        setAdmin(org.owner);
        setData(org);
        setorganizationCode(org.organizationCode);
        setloading(false);

        if (org.members?.length > 0) setmember(org.members);

        if (org.meeting?.length > 0) {
          const meetingData: Meeting[] = org.meeting;
          setmeeting(meetingData);

          const upComings = meetingData
            .filter(item => new Date(Number(item.startTime)) > new Date())
            .sort((a, b) => Number(a.startTime) - Number(b.startTime))
            .slice(0, 4);
          setUpcomings(upComings);

          const onGo = meetingData.filter(item => {
            const start = new Date(Number(item.startTime));
            const end = new Date(start.getTime() + Number(item.meetingDuration) * 60000);
            const now = new Date();
            return now >= start && now <= end;
          });
          setRuningMeeting(onGo);
        }
      } catch (error) {
        console.error('[Error]: ', error instanceof Error ? error.message : 'Unknown error');
      }
    };

    fetchData();
  }, [organId]);

  function createMeeting() {
    router.push(`/create-meeting?userId=${userId}&organizationId=${organId}`);
  }

  function joinMeeting(meetingId: string) {
    router.push(`/join?meetingId=${meetingId}&organizationId=${organId}`);
  }

  async function changeOrganizationCode() {
    try {
      const result = await axios.get(
        `${API_PREFIX}/api/changeOrganizationCode/${organId}`,
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
    const end = new Date(start.getTime() + Number(meetingDuration) * 60000);
    const timeLeftMs = end.getTime() - new Date().getTime();
    return timeLeftMs > 0 ? Math.ceil(timeLeftMs / 60000) : 0;
  }

  function findStatus(startTime: string | Date | number, duration: number): string {
    const now = new Date();
    const start = new Date(Number(startTime));
    if (isNaN(start.getTime())) return 'invalid';
    const end = new Date(start.getTime() + duration * 60000);
    if (now >= end) return 'completed';
    if (now < start) return 'upcoming';
    return 'in-progress';
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'upcoming': return 'text-royal-blue bg-royal-blue/10';
      case 'in-progress': return 'text-deep-wine bg-deep-wine/10';
      default: return 'text-onyx-gray bg-alice-white';
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
    if (date.toDateString() === now.toDateString()) return `Today at ${timeStr}`;
    if (date.toDateString() === tomorrow.toDateString()) return `Tomorrow at ${timeStr}`;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    if (date >= weekStart && date <= weekEnd) return `${dayNames[date.getDay()]} at ${timeStr}`;
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${timeStr}`;
  }

  function getImageUrl(imagePath: string): string {
    return `${API_PREFIX}/${imagePath.replace(/\\/g, "/")}`;
  }

  if (loading) {
    return (
      <div className='w-screen h-screen flex justify-center items-center'>
        <Loader />
      </div>
    );
  }

  const hasNoMeetings = !meetings || meetings.length === 0;
  const isAdmin = admin && admin.id === userId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-alice-white to-white">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-royal-blue/3 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-deep-wine/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-alice-white/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-royal-wine rounded-xl flex items-center justify-center">
                <Video className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-rich-black">
                Smart<span className="text-gradient">Meet</span>
              </span>
            </div>

            {/* Desktop actions */}
            <div className="hidden lg:flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-onyx-gray/40" />
                <input
                  type="text"
                  placeholder="Search meetings..."
                  className="pl-10 pr-4 py-2 w-64 bg-alice-white/50 border border-alice-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-royal-blue/20 focus:border-royal-blue transition-all"
                />
              </div>

              <Button variant="ghost" size="sm" className="text-royal-blue hover:text-white hover:bg-royal-blue border-royal-blue/20 hover:border-royal-blue transition-all duration-200">
                <Bell className="w-4 h-4" />
              </Button>

              {isAdmin && (
                <Button
                  className="bg-gradient-to-r from-royal-blue to-royal-blue/90 hover:from-deep-wine hover:to-deep-wine/90 text-white px-5 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
                  onClick={createMeeting}
                >
                  <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  Create Meeting
                </Button>
              )}

              {organizationCode && (
                <div className="relative">
                  <Button
                    className="bg-gradient-to-r from-royal-blue to-royal-blue/90 hover:from-deep-wine hover:to-deep-wine/90 text-white px-5 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
                    onClick={() => setShowCodeMenu(!showCodeMenu)}
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Code
                  </Button>

                  {showCodeMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-alice-white/50 py-3 z-50">
                      <div className="px-4 py-2 border-b border-alice-white">
                        <p className="font-semibold text-rich-black text-xs uppercase tracking-wider mb-1">Org Code</p>
                        <p className="text-sm text-onyx-gray font-mono">{organizationCode}</p>
                      </div>
                      <button
                        onClick={changeOrganizationCode}
                        className="w-full text-left px-4 py-2 text-onyx-gray hover:bg-alice-white hover:text-royal-blue transition-colors flex items-center text-sm"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Change Code
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-alice-white text-onyx-gray hover:bg-alice-white transition-colors"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile dropdown */}
          {showMobileMenu && (
            <div className="lg:hidden pb-4 pt-2 space-y-3 border-t border-alice-white/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-onyx-gray/40" />
                <input
                  type="text"
                  placeholder="Search meetings..."
                  className="w-full pl-10 pr-4 py-2 bg-alice-white/50 border border-alice-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-royal-blue/20"
                />
              </div>

              <div className="flex flex-col gap-2">
                {isAdmin && (
                  <Button
                    className="w-full bg-gradient-to-r from-royal-blue to-royal-blue/90 hover:from-deep-wine hover:to-deep-wine/90 text-white rounded-xl font-semibold group"
                    onClick={createMeeting}
                  >
                    <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    Create Meeting
                  </Button>
                )}

                {organizationCode && (
                  <div className="bg-alice-white/60 rounded-xl p-3 border border-alice-white">
                    <p className="text-xs font-semibold text-onyx-gray uppercase tracking-wider mb-1">Org Code</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-mono text-rich-black">{organizationCode}</p>
                      <button
                        onClick={changeOrganizationCode}
                        className="text-xs text-royal-blue hover:text-deep-wine font-medium flex items-center gap-1"
                      >
                        <Settings className="w-3 h-3" /> Change
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/main'}
                className="text-onyx-gray hover:text-royal-blue mb-2 -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to organizations
              </Button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-rich-black mb-2 sm:mb-3">
                {data?.name || 'Organization'}
              </h1>
              <p className="text-base sm:text-xl text-onyx-gray/70">
                {data?.description || ''}
              </p>
            </div>

            {/* View toggle */}
            <div className="flex-shrink-0">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-1 shadow-sm border border-alice-white/50 inline-flex">
                <button
                  onClick={() => setSelectedView('meetings')}
                  className={`px-4 sm:px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedView === 'meetings'
                      ? 'bg-royal-blue text-white shadow-sm'
                      : 'text-onyx-gray hover:text-royal-blue hover:bg-royal-blue/5'
                  }`}
                >
                  Meetings
                </button>
                <button
                  onClick={() => setSelectedView('members')}
                  className={`px-4 sm:px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedView === 'members'
                      ? 'bg-royal-blue text-white shadow-sm'
                      : 'text-onyx-gray hover:text-royal-blue hover:bg-royal-blue/5'
                  }`}
                >
                  Members
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Running meetings */}
        {runing.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {runing.map((stat) => (
              <div
                key={stat.id}
                className="group bg-white/70 backdrop-blur-sm rounded-3xl p-5 sm:p-6 card-shadow hover:card-shadow-hover transition-all duration-300 transform hover:-translate-y-2 border border-white/50 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-royal-blue/20 to-royal-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-royal-blue/20 to-royal-blue/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Video className="w-6 h-6 sm:w-7 sm:h-7 text-royal-blue" />
                    </div>
                    <div className="flex items-center text-xs font-bold px-2 sm:px-3 py-1 rounded-full text-red-700 bg-red-100">
                      {getRemainingMinutes(stat.startTime, stat.meetingDuration)}min Left
                    </div>
                  </div>
                  <p className="text-sm text-onyx-gray/70 leading-relaxed mb-3 font-medium">{stat.name}</p>
                  <Button
                    className="w-full bg-gradient-to-r from-royal-blue to-royal-blue/90 hover:from-deep-wine hover:to-deep-wine/90 text-white py-2 rounded-xl font-semibold transition-all duration-300 text-sm"
                    onClick={() => joinMeeting(stat.id)}
                  >
                    Join Meeting
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Meetings view */}
        {selectedView === 'meetings' && (
          hasNoMeetings ? (
            <div className="flex items-center justify-center py-12 sm:py-20">
              <div className="text-center max-w-2xl px-4">
                <div className="mb-6 sm:mb-8 flex justify-center">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-royal-blue/10 to-deep-wine/10 rounded-3xl flex items-center justify-center">
                    <CalendarPlus className="w-12 h-12 sm:w-16 sm:h-16 text-royal-blue" />
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-rich-black mb-3 sm:mb-4">No Meetings Yet</h2>
                <p className="text-base sm:text-lg text-onyx-gray/70 mb-6 sm:mb-8">
                  {isAdmin
                    ? "You haven't created any meetings yet. Get started by scheduling your first meeting."
                    : "No meetings have been scheduled yet. Check back later or contact the organization admin."}
                </p>
                {isAdmin && (
                  <Button
                    className="w-full sm:w-auto bg-gradient-to-r from-royal-blue to-deep-wine hover:from-deep-wine hover:to-royal-blue text-white px-8 py-4 sm:py-6 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
                    onClick={createMeeting}
                  >
                    <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    Create First Meeting
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
              {/* Meetings table */}
              <div className="lg:col-span-2">
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl card-shadow border border-white/50 overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-alice-white/50 flex items-center justify-between">
                    <h2 className="text-lg sm:text-2xl font-bold text-rich-black">Recent Meetings</h2>
                    <Button variant="outline" size="sm" className="text-royal-blue hover:text-deep-wine text-sm">
                      View All
                    </Button>
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-alice-white/50">
                          <th className="text-left py-4 px-6 text-xs font-bold text-rich-black uppercase tracking-wider">Meeting</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-rich-black uppercase tracking-wider">Date</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-rich-black uppercase tracking-wider">Duration</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-rich-black uppercase tracking-wider">Engagement</th>
                          {isAdmin && <th className="text-left py-4 px-6 text-xs font-bold text-rich-black uppercase tracking-wider">Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {meetings.map((meet) => {
                          const status = findStatus(meet.startTime, meet.meetingDuration);
                          return (
                            <tr key={meet.id} className="border-b border-alice-white/30 hover:bg-royal-blue/5 transition-all duration-200 group">
                              <td className="py-4 px-6">
                                <div className="font-semibold text-rich-black group-hover:text-royal-blue transition-colors text-sm">{meet.name}</div>
                                <div className="text-xs text-onyx-gray/70 mt-0.5">{meet.meetingDuration} min</div>
                              </td>
                              <td className="py-4 px-6 text-onyx-gray font-medium text-sm">
                                {new Date(Number(meet.startTime)).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-6 text-onyx-gray font-medium text-sm">{meet.meetingDuration} min</td>
                              <td className="py-4 px-6">
                                {status === 'upcoming' ? (
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor('upcoming')}`}>Upcoming</span>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <div className="w-12 bg-alice-white rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full ${meet.Engagment >= 90 ? 'bg-green-500' : meet.Engagment >= 75 ? 'bg-royal-blue' : meet.Engagment >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${meet.Engagment}%` }}
                                      />
                                    </div>
                                    <span className={`font-bold text-sm ${getEngagementColor(meet.Engagment)}`}>{meet.Engagment}%</span>
                                  </div>
                                )}
                              </td>
                              {isAdmin && (
                                <td className="py-4 px-6">
                                  <Button
                                    variant={status === 'upcoming' ? "outline" : "default"}
                                    size="sm"
                                    className={status === 'upcoming'
                                      ? "text-royal-blue hover:text-white hover:bg-royal-blue border-royal-blue/20 text-sm"
                                      : "bg-royal-blue hover:bg-deep-wine text-white text-sm"
                                    }
                                    onClick={() => {
                                      if (status === 'upcoming') window.location.href = `/create-meeting?edit=${meet.id}&userId=${userId}&organizationId=${organId}`;
                                      else window.location.href = `/reports/${meet.id}`;
                                    }}
                                  >
                                    {status === 'upcoming' ? (
                                      <><Settings className="w-3 h-3 mr-1.5" />Edit</>
                                    ) : status === 'in-progress' ? (
                                      <><Video className="w-3 h-3 mr-1.5" />Join</>
                                    ) : (
                                      <><BarChart3 className="w-3 h-3 mr-1.5" />Report</>
                                    )}
                                  </Button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="sm:hidden divide-y divide-alice-white/30">
                    {meetings.map((meet) => {
                      const status = findStatus(meet.startTime, meet.meetingDuration);
                      return (
                        <div key={meet.id} className="p-4 hover:bg-royal-blue/5 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 mr-3">
                              <p className="font-semibold text-rich-black text-sm">{meet.name}</p>
                              <p className="text-xs text-onyx-gray mt-0.5">
                                {new Date(Number(meet.startTime)).toLocaleDateString()} · {meet.meetingDuration} min
                              </p>
                            </div>
                            {status === 'upcoming' ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${getStatusColor('upcoming')}`}>Upcoming</span>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <div className="w-10 bg-alice-white rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${meet.Engagment >= 90 ? 'bg-green-500' : meet.Engagment >= 75 ? 'bg-royal-blue' : meet.Engagment >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${meet.Engagment}%` }}
                                  />
                                </div>
                                <span className={`font-bold text-xs ${getEngagementColor(meet.Engagment)}`}>{meet.Engagment}%</span>
                              </div>
                            )}
                          </div>
                          {isAdmin && (
                            <Button
                              size="sm"
                              className={`w-full mt-2 text-sm ${status === 'upcoming'
                                ? "border border-royal-blue/30 text-royal-blue hover:bg-royal-blue hover:text-white"
                                : "bg-royal-blue hover:bg-deep-wine text-white"
                              }`}
                              onClick={() => {
                                if (status === 'upcoming') window.location.href = `/create-meeting?edit=${meet.id}&userId=${userId}&organizationId=${organId}`;
                                else window.location.href = `/reports/${meet.id}`;
                              }}
                            >
                              {status === 'upcoming' ? 'Edit Meeting' : status === 'in-progress' ? 'Join Meeting' : 'View Report'}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Upcoming sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-4 sm:p-6 card-shadow border border-white/50">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-rich-black">Upcoming</h3>
                    <Calendar className="w-5 h-5 text-royal-blue flex-shrink-0" />
                  </div>
                  {upcoming && upcoming.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {upcoming.map((meet) => (
                        <div key={meet.id} className="group p-3 sm:p-4 rounded-2xl hover:bg-royal-blue/5 transition-all duration-200 border border-transparent hover:border-royal-blue/20">
                          <h4 className="font-semibold text-rich-black group-hover:text-royal-blue transition-colors text-sm">{meet.name}</h4>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                            <div className="flex items-center text-xs text-onyx-gray/60">
                              <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                              {formatMeetingTime(meet.startTime)}
                            </div>
                            <div className="flex items-center text-xs text-onyx-gray/60">
                              <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                              {meet.meetingDuration} min
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-onyx-gray/30 mx-auto mb-3" />
                      <p className="text-sm text-onyx-gray/60">No upcoming meetings</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {/* Members view */}
        {selectedView === 'members' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl card-shadow-hover border border-white/50 overflow-hidden">
            <div className="p-5 sm:p-8 border-b border-alice-white/50">
              <h3 className="text-lg sm:text-2xl font-bold text-rich-black mb-1 sm:mb-2">Members</h3>
              <p className="text-sm sm:text-base text-onyx-gray/60">List of all the members of this organization</p>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-alice-white/50 bg-alice-white/30">
                    <th className="text-left py-5 px-8 text-xs font-bold text-rich-black uppercase tracking-wider">Member</th>
                    <th className="text-left py-5 px-6 text-xs font-bold text-rich-black uppercase tracking-wider">Join Date</th>
                    <th className="text-left py-5 px-6 text-xs font-bold text-rich-black uppercase tracking-wider">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {admin && (
                    <tr className="border-b border-alice-white/30 hover:bg-gradient-to-r hover:from-royal-blue/5 hover:to-deep-wine/5 transition-all duration-300 group">
                      <td className="py-5 px-8">
                        <div className="flex items-center space-x-4">
                          <div
                            className="w-11 h-11 bg-gradient-to-br from-royal-blue to-deep-wine rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300"
                            style={{ backgroundImage: `url(${getImageUrl(admin.ImagePath)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                          />
                          <div>
                            <div className="font-bold text-rich-black group-hover:text-royal-blue transition-colors">{admin.name}</div>
                            <div className="text-sm text-onyx-gray/60">Host</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-sm text-onyx-gray">
                        {data && new Date(Number(data.createAt)).toLocaleDateString()}
                      </td>
                      <td className="py-5 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border border-royal-blue/20 text-royal-blue bg-royal-blue/5">Host</span>
                      </td>
                    </tr>
                  )}
                  {member.map((participant) => (
                    <tr key={participant.id} className="border-b border-alice-white/30 hover:bg-gradient-to-r hover:from-royal-blue/5 hover:to-deep-wine/5 transition-all duration-300 group">
                      <td className="py-5 px-8">
                        <div className="flex items-center space-x-4">
                          <div
                            className="w-11 h-11 bg-gradient-to-br from-royal-blue to-deep-wine rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300"
                            style={{ backgroundImage: `url(${getImageUrl(participant.user.ImagePath)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                          />
                          <div>
                            <div className="font-bold text-rich-black group-hover:text-royal-blue transition-colors">{participant.user.name}</div>
                            <div className="text-sm text-onyx-gray/60">Member</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-sm text-onyx-gray">
                        {new Date(Number(participant.joinedAt)).toLocaleDateString()}
                      </td>
                      <td className="py-5 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border border-alice-white text-onyx-gray">Member</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile member cards */}
            <div className="sm:hidden divide-y divide-alice-white/30">
              {admin && (
                <div className="p-4 flex items-center justify-between hover:bg-royal-blue/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-blue to-deep-wine flex-shrink-0"
                      style={{ backgroundImage: `url(${getImageUrl(admin.ImagePath)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    />
                    <div>
                      <p className="font-bold text-rich-black text-sm">{admin.name}</p>
                      <p className="text-xs text-onyx-gray/60">{data && new Date(Number(data.createAt)).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full border border-royal-blue/20 text-royal-blue bg-royal-blue/5 flex-shrink-0">Host</span>
                </div>
              )}
              {member.map((participant) => (
                <div key={participant.id} className="p-4 flex items-center justify-between hover:bg-royal-blue/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-blue to-deep-wine flex-shrink-0"
                      style={{ backgroundImage: `url(${getImageUrl(participant.user.ImagePath)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    />
                    <div>
                      <p className="font-bold text-rich-black text-sm">{participant.user.name}</p>
                      <p className="text-xs text-onyx-gray/60">{new Date(Number(participant.joinedAt)).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full border border-alice-white text-onyx-gray flex-shrink-0">Member</span>
                </div>
              ))}
            </div>

            <div className="p-4 sm:p-6 bg-alice-white/30 border-t border-alice-white/50">
              <p className="text-sm text-onyx-gray/60">Showing {member.length + 1} participants</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className='w-screen h-screen flex justify-center items-center'>
        <Loader />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}