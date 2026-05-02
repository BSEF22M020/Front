'use client';

import { useEffect, useState } from 'react';
import { Video, Plus, Users, FileText, Calendar, Clock, Loader2, Settings, LogOut, Search, Bell, ArrowUpRight, Building2, UserPlus, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from "axios";
import { useRouter } from "next/navigation";
import Loader from '@/components/ui/loader';
import { API_PREFIX } from '@/constants/api';

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

export default function Dashboard() {
  const router = useRouter();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [data, setData] = useState<UserData | null>(null);
  const [memberOrganizations, setMemberOrganizations] = useState<MemberOrganization[] | null>(null);
  const [ownOrganizations, setOwnOrganizations] = useState<Organization[] | null>(null);
  const [loading, setloading] = useState(true);
  const [upcoming, setupcoming] = useState<Meeting[]>([]);
  const [runing, setRunningMeetings] = useState<Meeting[]>([]);
  const [buttonLoading, setButtonLoading] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const now = Date.now();
      const twoHoursAgo = now - 2 * 60 * 60 * 1000;
      const query = `{ getUserbyId { id name email ImagePath member { organization { id name totalParticipants createAt ownerId meeting(time: "${twoHoursAgo}", limit: 2){id name startTime meetingDuration} } } ownedOrganizations { id name totalParticipants createAt ownerId meeting(time: "${twoHoursAgo}", limit: 2){id name startTime meetingDuration} } }}`;

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

        setData(result.data.data.getUserbyId);
        setloading(false);
        let meet: Meeting[] = [];
        const upcomingMeetings: Meeting[] = [];
        const runningMeetings: Meeting[] = [];

        if (result.data.data.getUserbyId.member?.length > 0) {
          meet = result.data.data.getUserbyId.member.flatMap((org: MemberOrganization) => org.organization.meeting);
          setMemberOrganizations(result.data.data.getUserbyId.member);
        }

        if (result.data.data.getUserbyId.ownedOrganizations?.length > 0) {
          meet = meet.concat(result.data.data.getUserbyId.ownedOrganizations.flatMap((org: Organization) => org.meeting));
          setOwnOrganizations(result.data.data.getUserbyId.ownedOrganizations);
        }

        meet.forEach(item => {
          const meetingStart = new Date(Number(item.startTime));
          const meetingEnd = new Date(meetingStart.getTime() + Number(item.meetingDuration) * 60000);
          const now = new Date();
          if (now >= meetingStart && now <= meetingEnd) runningMeetings.push(item);
          else if (now < meetingStart) upcomingMeetings.push(item);
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
    setButtonLoading(orgId);
    router.push(`/dashboard?userId=${userId}&organizationId=${orgId}`);
  };

  const hasNoOrganizations =
    (!ownOrganizations || ownOrganizations.length === 0) &&
    (!memberOrganizations || memberOrganizations.length === 0);

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

            {/* Desktop nav */}
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

              <Button
                className="bg-gradient-to-r from-royal-blue to-royal-blue/90 hover:from-deep-wine hover:to-deep-wine/90 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
                onClick={() => window.location.href = '/create-organization'}
              >
                <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Create Organization
              </Button>

              <Button
                className="bg-gradient-to-r from-royal-blue to-royal-blue/90 hover:from-deep-wine hover:to-deep-wine/90 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
                onClick={() => window.location.href = '/join-organization'}
              >
                <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Join
              </Button>

              {/* Profile */}
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
                      <p className="text-sm text-onyx-gray truncate">{data?.email || ''}</p>
                    </div>
                    <button className="w-full text-left px-4 py-2 text-onyx-gray hover:bg-alice-white hover:text-royal-blue transition-colors flex items-center">
                      <Settings className="w-4 h-4 mr-3" /> Settings
                    </button>
                    <button className="w-full text-left px-4 py-2 text-onyx-gray hover:bg-alice-white hover:text-deep-wine transition-colors flex items-center">
                      <LogOut className="w-4 h-4 mr-3" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile nav controls */}
            <div className="flex lg:hidden items-center space-x-2">
              <button
                className="w-9 h-9 bg-gradient-to-br from-royal-blue to-deep-wine rounded-xl flex items-center justify-center text-white font-semibold"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                {data?.name?.[0] || 'U'}
              </button>
              <button
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-alice-white text-onyx-gray hover:bg-alice-white transition-colors"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {showMobileMenu && (
            <div className="lg:hidden pb-4 pt-2 space-y-3 border-t border-alice-white/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-onyx-gray/40" />
                <input
                  type="text"
                  placeholder="Search meetings..."
                  className="w-full pl-10 pr-4 py-2 bg-alice-white/50 border border-alice-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-royal-blue/20 focus:border-royal-blue"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  className="w-full sm:w-auto bg-gradient-to-r from-royal-blue to-royal-blue/90 hover:from-deep-wine hover:to-deep-wine/90 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 group"
                  onClick={() => window.location.href = '/create-organization'}
                >
                  <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  Create Organization
                </Button>
                <Button
                  className="w-full sm:w-auto bg-gradient-to-r from-royal-blue to-royal-blue/90 hover:from-deep-wine hover:to-deep-wine/90 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 group"
                  onClick={() => window.location.href = '/join-organization'}
                >
                  <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  Join Organization
                </Button>
              </div>
            </div>
          )}

          {/* Mobile profile menu */}
          {showProfileMenu && (
            <div className="lg:hidden pb-3 border-t border-alice-white/50">
              <div className="pt-3 px-1">
                <div className="bg-white/95 rounded-2xl shadow-md border border-alice-white/50 py-3">
                  <div className="px-4 py-2 border-b border-alice-white">
                    <p className="font-semibold text-rich-black">{data?.name || 'User'}</p>
                    <p className="text-sm text-onyx-gray truncate">{data?.email || ''}</p>
                  </div>
                  <button className="w-full text-left px-4 py-2 text-onyx-gray hover:bg-alice-white hover:text-royal-blue transition-colors flex items-center">
                    <Settings className="w-4 h-4 mr-3" /> Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-onyx-gray hover:bg-alice-white hover:text-deep-wine transition-colors flex items-center">
                    <LogOut className="w-4 h-4 mr-3" /> Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-rich-black mb-2 sm:mb-3">
            Welcome {data?.name || 'User'}
          </h1>
          <p className="text-base sm:text-xl text-onyx-gray/70">
            Here's an overview of your organizations
          </p>
        </div>

        {hasNoOrganizations ? (
          /* Empty state */
          <div className="flex items-center justify-center py-12 sm:py-20">
            <div className="text-center max-w-2xl px-4">
              <div className="mb-6 sm:mb-8 flex justify-center">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-royal-blue/10 to-deep-wine/10 rounded-3xl flex items-center justify-center">
                  <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-royal-blue" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-rich-black mb-3 sm:mb-4">
                No Organizations Yet
              </h2>
              <p className="text-base sm:text-lg text-onyx-gray/70 mb-6 sm:mb-8">
                You haven't created or joined any organizations yet. Get started by creating your first organization or joining an existing one.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  className="w-full sm:w-auto bg-gradient-to-r from-royal-blue to-deep-wine hover:from-deep-wine hover:to-royal-blue text-white px-6 sm:px-8 py-4 sm:py-6 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
                  onClick={() => window.location.href = '/create-organization'}
                >
                  <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  Create Organization
                </Button>
                <Button
                  className="w-full sm:w-auto bg-white hover:bg-alice-white text-royal-blue border-2 border-royal-blue px-6 sm:px-8 py-4 sm:py-6 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
                  onClick={() => window.location.href = '/join-organization'}
                >
                  <UserPlus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Join Organization
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Main grid */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Organizations panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Owned Organizations */}
              {ownOrganizations && ownOrganizations.length > 0 && (
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl card-shadow border border-white/50 overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-alice-white/50 flex items-center justify-between">
                    <h2 className="text-lg sm:text-2xl font-bold text-rich-black">Your Organizations</h2>
                    <Button variant="outline" size="sm" className="text-royal-blue hover:text-deep-wine text-sm">
                      View All
                    </Button>
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-alice-white/50">
                          <th className="text-left py-4 px-6 text-xs font-bold text-rich-black uppercase tracking-wider">Organization</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-rich-black uppercase tracking-wider">Date</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-rich-black uppercase tracking-wider">Participants</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-rich-black uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ownOrganizations.map((organ: Organization) => (
                          <tr key={organ.id} className="border-b border-alice-white/30 hover:bg-royal-blue/5 transition-all duration-200 group">
                            <td className="py-4 px-6">
                              <div className="font-semibold text-rich-black group-hover:text-royal-blue transition-colors">{organ.name}</div>
                            </td>
                            <td className="py-4 px-6 text-onyx-gray font-medium text-sm">
                              {new Date(parseInt(organ.createAt)).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center text-onyx-gray font-medium text-sm">
                                <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                                {organ.totalParticipants}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <Button
                                size="sm"
                                className="bg-royal-blue hover:bg-deep-wine text-white transition-all duration-200 text-sm whitespace-nowrap"
                                onClick={() => data && handleViewMeeting(data.id, organ.id)}
                                disabled={buttonLoading === organ.id}
                              >
                                {buttonLoading === organ.id ? (
                                  <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                                  </span>
                                ) : 'Schedule & View'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="sm:hidden divide-y divide-alice-white/30">
                    {ownOrganizations.map((organ: Organization) => (
                      <div key={organ.id} className="p-4 hover:bg-royal-blue/5 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-rich-black">{organ.name}</p>
                            <p className="text-xs text-onyx-gray mt-0.5">
                              {new Date(parseInt(organ.createAt)).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center text-onyx-gray text-sm ml-3">
                            <Users className="w-4 h-4 mr-1" />
                            {organ.totalParticipants}
                          </div>
                        </div>
                        <Button
                          className="w-full bg-royal-blue hover:bg-deep-wine text-white transition-all duration-200 text-sm"
                          onClick={() => data && handleViewMeeting(data.id, organ.id)}
                          disabled={buttonLoading === organ.id}
                        >
                          {buttonLoading === organ.id ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                            </span>
                          ) : 'Schedule & View Meetings'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Member Organizations */}
              {memberOrganizations && memberOrganizations.length > 0 && (
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl card-shadow border border-white/50 overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-alice-white/50 flex items-center justify-between">
                    <h2 className="text-lg sm:text-2xl font-bold text-rich-black">Joined</h2>
                    <Button variant="outline" size="sm" className="text-royal-blue hover:text-deep-wine text-sm">
                      View All
                    </Button>
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-alice-white/50">
                          <th className="text-left py-4 px-6 text-xs font-bold text-rich-black uppercase tracking-wider">Organization</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-rich-black uppercase tracking-wider">Date</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-rich-black uppercase tracking-wider">Participants</th>
                          <th className="text-left py-4 px-6 text-xs font-bold text-rich-black uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberOrganizations.map((organ: MemberOrganization) => (
                          <tr key={organ.organization.id} className="border-b border-alice-white/30 hover:bg-royal-blue/5 transition-all duration-200 group">
                            <td className="py-4 px-6">
                              <div className="font-semibold text-rich-black group-hover:text-royal-blue transition-colors">{organ.organization.name}</div>
                            </td>
                            <td className="py-4 px-6 text-onyx-gray font-medium text-sm">
                              {new Date(parseInt(organ.organization.createAt)).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center text-onyx-gray font-medium text-sm">
                                <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                                {organ.organization.totalParticipants}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <Button
                                size="sm"
                                className="bg-royal-blue hover:bg-deep-wine text-white transition-all duration-200 text-sm"
                                onClick={() => data && handleViewMeeting(data.id, organ.organization.id)}
                                disabled={buttonLoading === organ.organization.id}
                              >
                                {buttonLoading === organ.organization.id ? (
                                  <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                                  </span>
                                ) : 'View Meeting'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="sm:hidden divide-y divide-alice-white/30">
                    {memberOrganizations.map((organ: MemberOrganization) => (
                      <div key={organ.organization.id} className="p-4 hover:bg-royal-blue/5 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-rich-black">{organ.organization.name}</p>
                            <p className="text-xs text-onyx-gray mt-0.5">
                              {new Date(parseInt(organ.organization.createAt)).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center text-onyx-gray text-sm ml-3">
                            <Users className="w-4 h-4 mr-1" />
                            {organ.organization.totalParticipants}
                          </div>
                        </div>
                        <Button
                          className="w-full bg-royal-blue hover:bg-deep-wine text-white transition-all duration-200 text-sm"
                          onClick={() => data && handleViewMeeting(data.id, organ.organization.id)}
                          disabled={buttonLoading === organ.organization.id}
                        >
                          {buttonLoading === organ.organization.id ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                            </span>
                          ) : 'View Meeting'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
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
                        <h4 className="font-semibold text-rich-black group-hover:text-royal-blue transition-colors text-sm">
                          {meet.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
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
                  <div className="text-center py-8 sm:py-10">
                    <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-onyx-gray/30 mx-auto mb-3" />
                    <p className="text-sm text-onyx-gray/60">No upcoming meetings</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}