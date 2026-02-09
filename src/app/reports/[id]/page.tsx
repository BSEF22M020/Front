'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, Download, FileSpreadsheet, Calendar, Clock, Users, TrendingUp, Eye, Target, Award, ChartBar as BarChart3, ChartPie as PieChart, Activity, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Circle as XCircle, Share2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MeetingParticipantDto {
  id: number;
  meetingId: number;
  userId: number;
  totalActiveSeconds: number;
  avgAttention: number;
  avgGaze: number;
  avgFace: number;
  firstJoinTime: string | null;
  lastLeaveTime: string | null;
  user: {
    id: number;
    name: string;
    ImagePath: string | null;
  };
}

interface MeetingDTOs {
  id: number;
  name: string;
  description: string | null;
  organizationId: number;
  startTime: string;
  daily: boolean;
  weekly: boolean;
  EnableEngagement: boolean;
  Engagment: number;
  meetingDuration: number;
  meetingLink: string;
  hostId: number;
  participants?: MeetingParticipantDto[];
}

interface EngagementPoint {
  time: string;
  engagement: number;
  participants: number;
}

export default function ReportPage({ params }: { params: { id: string } }) {
  const meetingId = Number(params.id);
  const [meeting, setMeeting] = useState<MeetingDTOs | null>(null);
  const [participants, setParticipants] = useState<MeetingParticipantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const query = `query { getMeetingById(id: ${meetingId}) { id name description organizationId startTime daily weekly EnableEngagement Engagment meetingDuration meetingLink hostId participants { id meetingId userId totalActiveSeconds avgAttention avgGaze avgFace firstJoinTime lastLeaveTime user { id name ImagePath } } } }`;

        const res = await axios.post(
          'https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/graphql',
          { query },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (res.data?.errors) {
          console.error('GraphQL errors:', res.data.errors);
          setLoading(false);
          return;
        }

        const data = res.data?.data;
        if (!data || !data.getMeetingById) {
          setLoading(false);
          return;
        }

        setMeeting(data.getMeetingById);
        
        setParticipants(data.getMeetingById.participants || []);

      } catch (err) {
        console.error('fetchReport error', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [meetingId]);

  if (loading || !meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-alice-white to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-royal-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-onyx-gray">Loading report...</p>
        </div>
      </div>
    );
  }

  
  const totalParticipants = participants.length;
  const meetingDurationMinutes = meeting.meetingDuration;
  const meetingDurationFormatted = `${Math.floor(meetingDurationMinutes / 60)}h ${meetingDurationMinutes % 60}m`;

  const avgEngagement = participants.length === 0
    ? 0
    : Math.round(participants.reduce((a, p) => a + p.avgAttention, 0) / participants.length);

  const peakEngagement = participants.length === 0 
    ? 0 
    : Math.round(Math.max(...participants.map(p => p.avgAttention)));

  const lowestEngagement = participants.length === 0
    ? 0
    : Math.min(...participants.map(p => p.avgAttention));

  
  const generateEngagementData = (): EngagementPoint[] => {
    const points: EngagementPoint[] = [];
    const startTime = new Date(meeting.startTime);
    const intervals = 8;
    const intervalMinutes = meetingDurationMinutes / intervals;

    for (let i = 0; i <= intervals; i++) {
      const time = new Date(startTime.getTime() + i * intervalMinutes * 60000);
      const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }).slice(0, 5);
      
     
      const baseEngagement = avgEngagement;
      const variation = Math.sin(i / intervals * Math.PI) * 10;
      const engagement = Math.min(100, Math.max(60, Math.round(baseEngagement + variation)));
      
      points.push({
        time: timeStr,
        engagement,
        participants: totalParticipants
      });
    }

    return points;
  };

  const engagementData = generateEngagementData();

  
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatus = (engagement: number): 'high' | 'moderate' | 'low' => {
    if (engagement >= 90) return 'high';
    if (engagement >= 70) return 'moderate';
    return 'low';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-onyx-gray bg-alice-white border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'high':
        return <CheckCircle className="w-4 h-4" />;
      case 'moderate':
        return <AlertCircle className="w-4 h-4" />;
      case 'low':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    console.log(`Exporting as ${type}`);
    setShowExportMenu(false);
  };

  // Calculate attendance stats
  const onTimeCount = participants.filter(p => {
    if (!p.firstJoinTime) return false;
    const joinTime = new Date(p.firstJoinTime);
    const startTime = new Date(meeting.startTime);
    const diffMinutes = (joinTime.getTime() - startTime.getTime()) / 60000;
    return diffMinutes <= 5;
  }).length;

  const lateCount = participants.filter(p => {
    if (!p.firstJoinTime) return false;
    const joinTime = new Date(p.firstJoinTime);
    const startTime = new Date(meeting.startTime);
    const diffMinutes = (joinTime.getTime() - startTime.getTime()) / 60000;
    return diffMinutes > 5;
  }).length;

  const earlyLeaveCount = participants.filter(p => {
    if (!p.lastLeaveTime) return false;
    const leaveTime = new Date(p.lastLeaveTime);
    const endTime = new Date(new Date(meeting.startTime).getTime() + meetingDurationMinutes * 60000);
    const diffMinutes = (endTime.getTime() - leaveTime.getTime()) / 60000;
    return diffMinutes > 5;
  }).length;

  const attendanceRate = totalParticipants > 0 
    ? Math.round((onTimeCount / totalParticipants) * 100)
    : 0;

  // Generate sparkline data for each participant
  const generateSparkline = (avgAttention: number): number[] => {
    const baseline = avgAttention;
    return Array.from({ length: 8 }, () => {
      const variation = (Math.random() - 0.5) * 10;
      return Math.min(100, Math.max(0, Math.round(baseline + variation)));
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-alice-white to-white">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-royal-blue/3 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-deep-wine/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/2 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-alice-white/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="text-onyx-gray hover:text-royal-blue hover:bg-royal-blue/5 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-alice-white"></div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-rich-black">Meeting Report</h1>
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Completed
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-onyx-gray/70">
                  <span>Dashboard › Reports › {meeting.name}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-1 shadow-sm border border-alice-white/50">
                <div className="flex space-x-1">
                  {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'participants', label: 'Participants', icon: Users },
                    { id: 'timeline', label: 'Timeline', icon: Clock }
                  ].map((view) => {
                    const Icon = view.icon;
                    return (
                      <button
                        key={view.id}
                        onClick={() => setSelectedView(view.id)}
                        className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          selectedView === view.id
                            ? 'bg-royal-blue text-white shadow-sm'
                            : 'text-onyx-gray hover:text-royal-blue hover:bg-royal-blue/5'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {view.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="border-royal-blue/20 text-royal-blue hover:bg-royal-blue/5 hover:border-royal-blue/40 transition-all duration-200"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Export
                </Button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-alice-white/50 py-2 z-50">
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full text-left px-4 py-2 text-onyx-gray hover:bg-alice-white hover:text-royal-blue transition-colors flex items-center"
                    >
                      <Download className="w-4 h-4 mr-3" />
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full text-left px-4 py-2 text-onyx-gray hover:bg-alice-white hover:text-deep-wine transition-colors flex items-center"
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-3" />
                      Export to Excel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Meeting Summary Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 card-shadow-hover border border-white/50 mb-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-rich-black mb-3">{meeting.name}</h2>
            <div className="flex flex-wrap items-center gap-6 text-onyx-gray/70">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{new Date(meeting.startTime).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>{new Date(meeting.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span>{totalParticipants} participants</span>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-royal-blue/5 to-royal-blue/10 rounded-2xl p-6 border border-royal-blue/10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-royal-blue/20 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-royal-blue" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-rich-black">{totalParticipants}</div>
                  <div className="text-sm text-onyx-gray/60">Participants</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-deep-wine/5 to-deep-wine/10 rounded-2xl p-6 border border-deep-wine/10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-deep-wine/20 rounded-2xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-deep-wine" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-rich-black">{avgEngagement}%</div>
                  <div className="text-sm text-onyx-gray/60">Avg Engagement</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-2xl p-6 border border-green-500/10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-rich-black">{peakEngagement}%</div>
                  <div className="text-sm text-onyx-gray/60">Peak Engagement</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 rounded-2xl p-6 border border-purple-500/10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-rich-black">{meetingDurationFormatted}</div>
                  <div className="text-sm text-onyx-gray/60">Duration</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Chart & Attendance */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Engagement Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 card-shadow-hover border border-white/50">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-rich-black mb-2">Engagement Over Time</h3>
                  <p className="text-onyx-gray/60">Real-time participant engagement throughout the session</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-3 h-3 bg-royal-blue rounded-full"></div>
                    <span className="text-onyx-gray/60">Engagement %</span>
                  </div>
                </div>
              </div>
              
              {/* Chart Area */}
              <div className="h-96 bg-gradient-to-br from-alice-white to-royal-blue/5 rounded-2xl p-6 relative overflow-hidden border border-royal-blue/10">
                <div className="relative h-full flex items-end justify-between space-x-2">
                  {engagementData.map((point, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center group">
                      <div
                        className="w-full bg-gradient-to-t from-royal-blue via-royal-blue to-deep-wine rounded-t-lg transition-all duration-500 group-hover:shadow-lg group-hover:scale-105 relative"
                        style={{ height: `${point.engagement}%` }}
                      >
                        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm text-rich-black px-4 py-3 rounded-xl text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl border border-royal-blue/20 whitespace-nowrap">
                          <div className="font-bold text-royal-blue">{point.engagement}% Engagement</div>
                          <div className="text-onyx-gray/70">{point.participants} participants active</div>
                          <div className="text-xs text-onyx-gray/50 mt-1">Time: {point.time}</div>
                        </div>
                      </div>
                      <div className="text-sm text-onyx-gray/70 mt-3 font-medium group-hover:text-royal-blue transition-colors">{point.time}</div>
                    </div>
                  ))}
                </div>
                
                <div className="absolute inset-6 pointer-events-none">
                  {[25, 50, 75].map((line) => (
                    <div
                      key={line}
                      className="absolute left-0 right-0 border-t border-onyx-gray/10"
                      style={{ bottom: `${line}%` }}
                    >
                      <span className="absolute -left-8 -top-2 text-xs text-onyx-gray/40">{line}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 card-shadow-hover border border-white/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-rich-black">Session Highlights</h3>
                <Award className="w-5 h-5 text-royal-blue" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-bold text-rich-black">Peak Engagement</div>
                      <div className="text-sm text-onyx-gray/60">Highest recorded point</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{peakEngagement}%</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-royal-blue/10 rounded-2xl flex items-center justify-center">
                      <Eye className="w-5 h-5 text-royal-blue" />
                    </div>
                    <div>
                      <div className="font-bold text-rich-black">Average Focus</div>
                      <div className="text-sm text-onyx-gray/60">Overall session</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-royal-blue">{avgEngagement}%</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-deep-wine/10 rounded-2xl flex items-center justify-center">
                      <Target className="w-5 h-5 text-deep-wine" />
                    </div>
                    <div>
                      <div className="font-bold text-rich-black">Attendance</div>
                      <div className="text-sm text-onyx-gray/60">Engagement stability</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-deep-wine">{attendanceRate}%</div>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 card-shadow-hover border border-white/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-rich-black">Attendance Summary</h3>
                <Users className="w-5 h-5 text-royal-blue" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-onyx-gray">On Time</span>
                  </div>
                  <span className="font-bold text-green-600">{onTimeCount} participants</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium text-onyx-gray">Late (5+ min)</span>
                  </div>
                  <span className="font-bold text-yellow-600">{lateCount} participants</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-medium text-onyx-gray">Early Leave</span>
                  </div>
                  <span className="font-bold text-red-500">{earlyLeaveCount} participant{earlyLeaveCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-alice-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-onyx-gray">Overall Attendance Rate</span>
                  <span className="text-lg font-bold text-royal-blue">{attendanceRate}%</span>
                </div>
                <div className="w-full bg-alice-white rounded-full h-3">
                  <div className="bg-gradient-to-r from-royal-blue to-deep-wine h-3 rounded-full transition-all duration-700" style={{ width: `${attendanceRate}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Participant Insights */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 card-shadow-hover border border-white/50 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-rich-black mb-2">Participant Insights</h3>
              <p className="text-onyx-gray/60">Individual performance breakdown and engagement metrics</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-onyx-gray/60">High (90%+)</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-onyx-gray/60">Moderate (70-89%)</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-onyx-gray/60">Low (-70%)</span>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {participants.map((participant) => {
              const overallEngagement = Math.round((participant.avgAttention + participant.avgGaze + participant.avgFace) / 3);
              const status = getStatus(overallEngagement);
              const sparklineData = generateSparkline(overallEngagement);
              const duration = formatDuration(participant.totalActiveSeconds);

              return (
                <div
                  key={participant.id}
                  className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:border-royal-blue/20 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {participant.user.ImagePath ? (
                          <img
                            src={participant.user.ImagePath}
                            alt={participant.user.name}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-royal-blue/20 to-deep-wine/20 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm">
                            <span className="text-lg font-bold text-royal-blue">
                              {getInitials(participant.user.name)}
                            </span>
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${getStatusColor(status).split(' ')[0]}`}>
                          {getStatusIcon(status)}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-rich-black">{participant.user.name}</h4>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center mt-1 ${getStatusColor(status)}`}>
                          {getStatusIcon(status)}
                          <span className="ml-1">
                            {status === 'high' ? 'Highly Engaged' : status === 'moderate' ? 'Moderately Engaged' : 'Needs Improvement'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-rich-black">{overallEngagement}%</div>
                      <div className="text-sm text-onyx-gray/60">Overall</div>
                    </div>
                  </div>
                  
                  {/* Mini Sparkline Chart */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-onyx-gray/70">Engagement Trend</span>
                      <span className="text-xs text-onyx-gray/50">{duration} duration</span>
                    </div>
                    <div className="h-12 flex items-end space-x-1">
                      {sparklineData.map((value, index) => (
                        <div
                          key={index}
                          className="flex-1 bg-gradient-to-t from-royal-blue/20 to-royal-blue/60 rounded-t-sm transition-all duration-300 group-hover:from-royal-blue/30 group-hover:to-royal-blue/70"
                          style={{ height: `${value}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-onyx-gray/70">Attention:</span>
                        <span className="font-bold text-rich-black">{Math.round(participant.avgAttention)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-onyx-gray/70">Gaze:</span>
                        <span className="font-bold text-rich-black">{Math.round(participant.avgGaze)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-onyx-gray/70">Face:</span>
                        <span className="font-bold text-rich-black">{Math.round(participant.avgFace)}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-onyx-gray/70">Joined:</span>
                        <span className="font-bold text-rich-black">{formatTime(participant.firstJoinTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-onyx-gray/70">Left:</span>
                        <span className="font-bold text-rich-black">{formatTime(participant.lastLeaveTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-onyx-gray/70">Active Time:</span>
                        <span className="font-bold text-rich-black">{duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Summary Card */}
          <div className="mt-8 bg-gradient-to-r from-royal-blue/5 to-deep-wine/5 rounded-2xl p-6 border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl font-bold text-rich-black mb-2">Engagement Summary</h4>
                <p className="text-onyx-gray/60">
                  {participants.filter(p => getStatus(Math.round((p.avgAttention + p.avgGaze + p.avgFace) / 3)) === 'high').length} participants showed high engagement, 
                  while {participants.filter(p => getStatus(Math.round((p.avgAttention + p.avgGaze + p.avgFace) / 3)) === 'low').length} may need follow-up.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-royal-blue">{avgEngagement}%</div>
                <div className="text-sm text-onyx-gray/60">Average Session Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Metrics Breakdown */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 card-shadow-hover border border-white/50">
          <h3 className="text-2xl font-bold text-rich-black mb-8">Detailed Metrics Breakdown</h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-royal-blue/5 to-royal-blue/10 rounded-2xl p-6 border border-royal-blue/10">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-onyx-gray">Focus Duration</span>
                <span className="text-2xl font-bold text-royal-blue">
                  {Math.round(participants.reduce((a, p) => a + (p.totalActiveSeconds * p.avgAttention / 100), 0) / 3600)}h
                </span>
              </div>
              <p className="text-sm text-onyx-gray/60">Total focused time across all participants</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-2xl p-6 border border-green-500/10">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-onyx-gray">Consistency Score</span>
                <span className="text-2xl font-bold text-green-600">
                  {Math.round(participants.reduce((a, p) => {
                    const engagement = Math.round((p.avgAttention + p.avgGaze + p.avgFace) / 3);
                    return a + (engagement >= 70 ? 100 : engagement);
                  }, 0) / participants.length)}%
                </span>
              </div>
              <p className="text-sm text-onyx-gray/60">Participant consistency throughout</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 rounded-2xl p-6 border border-purple-500/10">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-onyx-gray">Active Participation</span>
                <span className="text-2xl font-bold text-purple-600">
                  {Math.round(participants.filter(p => p.avgAttention >= 80).length / participants.length * 100)}%
                </span>
              </div>
              <p className="text-sm text-onyx-gray/60">Participants actively engaged</p>
            </div>
            
            <div className="bg-gradient-to-br from-deep-wine/5 to-deep-wine/10 rounded-2xl p-6 border border-deep-wine/10">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-onyx-gray">Session Quality</span>
                <span className="text-2xl font-bold text-deep-wine">
                  {Math.round((avgEngagement + attendanceRate + (100 - lowestEngagement)) / 3)}%
                </span>
              </div>
              <p className="text-sm text-onyx-gray/60">Overall session effectiveness</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-alice-white to-white rounded-2xl p-6 border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-rich-black">Recommendations</h4>
              <Activity className="w-5 h-5 text-royal-blue" />
            </div>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-onyx-gray">Schedule follow-up meetings with participants showing low engagement</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-royal-blue/10 rounded-full flex items-center justify-center">
                  <Eye className="w-4 h-4 text-royal-blue" />
                </div>
                <span className="text-onyx-gray">Consider shorter, more focused sessions for better engagement</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-onyx-gray">Implement interactive elements during peak engagement times</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}