'use client';

import { use, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  ArrowLeft, Download, FileSpreadsheet, Calendar, Clock, Users,
  TrendingUp, Eye, Target, Award, Activity,
  CheckCircle, AlertCircle, Circle as XCircle, Share2, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_PREFIX } from '@/constants/api';

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

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const meetingId = Number(id);
  const [meeting, setMeeting] = useState<MeetingDTOs | null>(null);
  const [participants, setParticipants] = useState<MeetingParticipantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [engagementView, setEngagementView] = useState<'overview' | 'individual'>('overview');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [animateCircles, setAnimateCircles] = useState(false);
  const deepDiveRef = useRef<HTMLDivElement>(null);
  const [expectedParticipants, setExpectedParticipants] = useState(0);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const query = `query { getMeetingById(id: ${meetingId}) { id name description organizationId startTime daily weekly EnableEngagement Engagment meetingDuration meetingLink hostId participants { id meetingId userId totalActiveSeconds avgAttention avgGaze avgFace firstJoinTime lastLeaveTime user { id name ImagePath } } } }`;
        const res = await axios.post(
          `${API_PREFIX}/graphql`,
          { query },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (res.data?.errors) { setLoading(false); return; }

        const data = res.data?.data;
        if (!data || !data.getMeetingById) { setLoading(false); return; }

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

  useEffect(() => {
    if (!meeting?.organizationId) return;
    const fetchOrgParticipants = async () => {
      try {
        const query = `{ getOrganizationbyId(id: ${meeting.organizationId}) { totalParticipants } }`;
        const res = await axios.post(
          `${API_PREFIX}/graphql`,
          { query },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setExpectedParticipants(res.data?.data?.getOrganizationbyId?.totalParticipants || 0);
      } catch (err) {
        console.error('fetchOrgParticipants error', err);
      }
    };
    fetchOrgParticipants();
  }, [meeting?.organizationId]);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setAnimateCircles(true), 300);
      return () => clearTimeout(t);
    }
  }, [loading]);

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

  // ── Date fix: startTime comes as ms timestamp string ──────────────────────
  const startTime = new Date(Number(meeting.startTime));
  const meetingDurationMinutes = meeting.meetingDuration;
  const totalParticipants = participants.length;

  // ── Per-participant engagement helper (falls back when attention is 0) ────
  const getEngagement = (p: MeetingParticipantDto) =>
    p.avgAttention > 0
      ? Math.round(p.avgAttention)
      : Math.round((p.avgGaze + p.avgFace) / 2);

  const avgAttentionAll = participants.length === 0 ? 0 : Math.round(participants.reduce((a, p) => a + p.avgAttention, 0) / participants.length);
  const avgGazeAll     = participants.length === 0 ? 0 : Math.round(participants.reduce((a, p) => a + p.avgGaze, 0) / participants.length);
  const avgFaceAll     = participants.length === 0 ? 0 : Math.round(participants.reduce((a, p) => a + p.avgFace, 0) / participants.length);
  const avgEngagement  = participants.length === 0 ? 0 : Math.round(participants.reduce((a, p) => a + getEngagement(p), 0) / participants.length);

  const onTimeCount = participants.filter(p => {
    if (!p.firstJoinTime) return false;
    const diff = (new Date(Number(p.firstJoinTime)).getTime() - startTime.getTime()) / 60000;
    return diff <= 5;
  }).length;

  const earlyLeaveCount = participants.filter(p => {
    if (!p.lastLeaveTime) return false;
    const endTime = new Date(startTime.getTime() + meetingDurationMinutes * 60000);
    return (endTime.getTime() - new Date(Number(p.lastLeaveTime)).getTime()) / 60000 > 5;
  }).length;

  const attendanceRate = participants.length === 0 ? 0 :
    Math.min(100, Math.round(
      (participants.reduce((sum, p) => sum + (p.totalActiveSeconds || 0), 0) /
      (participants.length * meetingDurationMinutes * 60)) * 100
    ));

  const participation = participants.length === 0 || expectedParticipants === 0
    ? 0
    : Math.min(100, Math.round((participants.length / expectedParticipants) * 100));

  const sessionQuality = Math.round((avgEngagement + attendanceRate) / 2);

  const formatTime     = (ts: string | null) => ts ? new Date(Number(ts)).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'N/A';
  const formatDuration = (s: number) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };
  const getInitials    = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getStatus      = (e: number): 'high' | 'moderate' | 'low' => e >= 90 ? 'high' : e >= 70 ? 'moderate' : 'low';
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'high':     return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:         return 'text-red-600 bg-red-50 border-red-200';
    }
  };
  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'high':     return <CheckCircle className="w-4 h-4" />;
      case 'moderate': return <AlertCircle className="w-4 h-4" />;
      default:         return <XCircle className="w-4 h-4" />;
    }
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    console.log(`Exporting as ${type}`);
    setShowExportMenu(false);
  };

  const scrollToDeepDive = () => deepDiveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const circleConfig = [
    {
      label: 'Attendance',
      value: attendanceRate,
      color: '#3B82F6',
      glow: 'rgba(59,130,246,0.3)',
      bg: 'from-blue-500/10 to-blue-600/5',
      border: 'border-blue-200/50',
      icon: <Users className="w-6 h-6 text-blue-500" />,
      sub: 'Adherence to defined meeting time'
    },
    {
      label: 'Attention',
      value: avgAttentionAll,
      color: '#7C3AED',
      glow: 'rgba(124,58,237,0.3)',
      bg: 'from-purple-500/10 to-purple-600/5',
      border: 'border-purple-200/50',
      icon: <Eye className="w-6 h-6 text-purple-500" />,
      sub: 'Average Gaze'
    },
    {
      label: 'Attentiveness',
      value: avgFaceAll,
      color: '#059669',
      glow: 'rgba(5,150,105,0.3)',
      bg: 'from-emerald-500/10 to-emerald-600/5',
      border: 'border-emerald-200/50',
      icon: <Target className="w-6 h-6 text-emerald-500" />,
      sub: 'Based on posture score'
    }
  ];

  const sortedByEngagement = [...participants].sort((a, b) => getEngagement(b) - getEngagement(a));

  return (
    <div className="min-h-screen bg-gradient-to-br from-alice-white to-white">
      <style>{`
        @keyframes fillCircle {
          from { stroke-dashoffset: 283; }
          to { stroke-dashoffset: var(--target-offset); }
        }
        @keyframes pulseRing {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 0.2; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes barGrow {
          from { width: 0%; }
          to { width: var(--bar-width); }
        }
        .circle-fill {
          animation: fillCircle 1.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          animation-delay: var(--delay, 0s);
          stroke-dashoffset: 283;
        }
        .pulse-ring { animation: pulseRing 2.5s ease-in-out infinite; }
        .fade-slide {
          animation: fadeSlideUp 0.6s ease forwards;
          animation-delay: var(--delay, 0s);
          opacity: 0;
        }
        .bar-grow {
          animation: barGrow 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          animation-delay: var(--delay, 0.2s);
          width: 0%;
        }
        .shimmer-text {
          background: linear-gradient(90deg, #1e40af, #7c3aed, #059669, #1e40af);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .card-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.08);
        }
        .engagement-glow {
          box-shadow: 0 0 40px rgba(59,130,246,0.15), 0 8px 32px rgba(0,0,0,0.06);
        }
      `}</style>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-royal-blue/3 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-deep-wine/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
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
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Completed</div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-onyx-gray/70">
                  <span>Dashboard › Reports › {meeting.name}</span>
                </div>
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
                  <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-onyx-gray hover:bg-alice-white hover:text-royal-blue transition-colors flex items-center">
                    <Download className="w-4 h-4 mr-3" />Download PDF
                  </button>
                  <button onClick={() => handleExport('excel')} className="w-full text-left px-4 py-2 text-onyx-gray hover:bg-alice-white hover:text-deep-wine transition-colors flex items-center">
                    <FileSpreadsheet className="w-4 h-4 mr-3" />Export to Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">

        {/* Meeting Title */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 card-shadow-hover border border-white/50 mb-8 fade-slide" style={{ '--delay': '0s' } as React.CSSProperties}>
          <h2 className="text-3xl font-bold text-rich-black mb-3">{meeting.name}</h2>
          <div className="flex flex-wrap items-center gap-6 text-onyx-gray/70">
            <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" /><span>{startTime.toLocaleDateString()}</span></div>
            <div className="flex items-center"><Clock className="w-4 h-4 mr-2" /><span>{startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></div>
            <div className="flex items-center"><Users className="w-4 h-4 mr-2" /><span>{totalParticipants} participants</span></div>
          </div>
        </div>

        {/* THREE ANIMATED CIRCLES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {circleConfig.map((c, i) => {
            const radius = 45;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (c.value / 100) * circumference;
            return (
              <div
                key={c.label}
                className={`bg-gradient-to-br ${c.bg} backdrop-blur-sm rounded-3xl p-8 border ${c.border} card-hover fade-slide engagement-glow`}
                style={{ '--delay': `${0.1 + i * 0.15}s` } as React.CSSProperties}
              >
                <div className="flex flex-col items-center">
                  <div className="relative w-40 h-40 mb-4">
                    <div
                      className="pulse-ring absolute inset-0 rounded-full"
                      style={{ background: `radial-gradient(circle, ${c.glow} 0%, transparent 70%)` }}
                    ></div>
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r={radius} fill="none"
                        stroke={c.color} strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        className={animateCircles ? 'circle-fill' : ''}
                        style={{
                          '--target-offset': `${offset}`,
                          '--delay': `${0.3 + i * 0.2}s`,
                          strokeDashoffset: animateCircles ? undefined : circumference
                        } as React.CSSProperties}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      {c.icon}
                      <span className="text-3xl font-black text-rich-black mt-1">{c.value}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-rich-black mb-1">{c.label}</div>
                    <div className="text-sm text-onyx-gray/60">{c.sub}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ENGAGEMENT SHOWCASE + SESSION HIGHLIGHTS */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">

          {/* Engagement Showcase */}
          <div className="lg:col-span-2 fade-slide" style={{ '--delay': '0.3s' } as React.CSSProperties}>
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 card-shadow-hover border border-white/50 h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-rich-black mb-1">Participant Engagement</h3>
                  <p className="text-onyx-gray/60 text-sm">Engagement is the primary measure of session success</p>
                </div>
                <div className="bg-white/60 rounded-2xl p-1 shadow-sm border border-alice-white/50 flex space-x-1">
                  {(['overview', 'individual'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setEngagementView(v)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${engagementView === v ? 'bg-royal-blue text-white shadow-sm' : 'text-onyx-gray hover:text-royal-blue'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {engagementView === 'overview' ? (
                <div className="space-y-4">
                  <div className="relative bg-gradient-to-br from-royal-blue/5 to-deep-wine/5 rounded-2xl p-8 border border-royal-blue/10 text-center mb-4 overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(ellipse at center, #3b82f6 0%, transparent 70%)' }}></div>
                    <div className="shimmer-text text-7xl font-black mb-2">{avgEngagement}%</div>
                    <div className="text-onyx-gray/70 font-medium text-lg">Average Session Engagement</div>
                    <div className="flex justify-center gap-6 mt-4 text-sm">
                      <div><span className="font-bold text-green-600">{participants.filter(p => getStatus(getEngagement(p)) === 'high').length}</span><span className="text-onyx-gray/60 ml-1">highly engaged</span></div>
                      <div><span className="font-bold text-yellow-500">{participants.filter(p => getStatus(getEngagement(p)) === 'moderate').length}</span><span className="text-onyx-gray/60 ml-1">moderate</span></div>
                      <div><span className="font-bold text-red-500">{participants.filter(p => getStatus(getEngagement(p)) === 'low').length}</span><span className="text-onyx-gray/60 ml-1">need attention</span></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {sortedByEngagement.slice(0, 4).map((p, i) => {
                      const eng = getEngagement(p);
                      const st = getStatus(eng);
                      return (
                        <div key={p.id} className="flex items-center space-x-4 group">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-royal-blue/10 to-deep-wine/10 flex items-center justify-center text-xs font-bold text-royal-blue">#{i + 1}</div>
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-blue/20 to-deep-wine/20 flex items-center justify-center font-bold text-royal-blue text-sm flex-shrink-0">
                            {getInitials(p.user.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-semibold text-rich-black text-sm truncate">{p.user.name}</span>
                              <span className="font-bold text-sm ml-2" style={{ color: st === 'high' ? '#16a34a' : st === 'moderate' ? '#ca8a04' : '#dc2626' }}>{eng}%</span>
                            </div>
                            <div className="w-full bg-alice-white rounded-full h-2.5 overflow-hidden">
                              <div
                                className="h-full rounded-full bar-grow"
                                style={{
                                  '--bar-width': `${eng}%`,
                                  '--delay': `${0.5 + i * 0.1}s`,
                                  background: st === 'high' ? 'linear-gradient(90deg,#16a34a,#4ade80)' : st === 'moderate' ? 'linear-gradient(90deg,#ca8a04,#facc15)' : 'linear-gradient(90deg,#dc2626,#f87171)'
                                } as React.CSSProperties}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {participants.length > 4 && (
                    <button
                      onClick={() => { setEngagementView('individual'); scrollToDeepDive(); }}
                      className="w-full mt-2 py-3 rounded-2xl border border-royal-blue/20 text-royal-blue font-medium text-sm hover:bg-royal-blue/5 transition-all flex items-center justify-center space-x-2"
                    >
                      <span>See Individual Engagement</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {sortedByEngagement.map((p, i) => {
                    const eng = getEngagement(p);
                    const st = getStatus(eng);
                    return (
                      <div key={p.id} className="bg-white/50 rounded-2xl p-4 border border-white/30 hover:border-royal-blue/20 transition-all duration-200">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-royal-blue/20 to-deep-wine/20 flex items-center justify-center font-bold text-royal-blue text-xs flex-shrink-0">
                            {getInitials(p.user.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-rich-black text-sm truncate">{p.user.name}</div>
                            <div className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center space-x-1 mt-0.5 ${getStatusColor(st)}`}>
                              {getStatusIcon(st)}<span className="ml-1">{st === 'high' ? 'High' : st === 'moderate' ? 'Moderate' : 'Low'}</span>
                            </div>
                          </div>
                          <div className="text-2xl font-black" style={{ color: st === 'high' ? '#16a34a' : st === 'moderate' ? '#ca8a04' : '#dc2626' }}>{eng}%</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {[['Attention', p.avgAttention], ['Gaze', p.avgGaze], ['Posture', p.avgFace]].map(([label, val]) => (
                            <div key={label as string} className="text-center">
                              <div className="text-onyx-gray/60 mb-1">{label}</div>
                              <div className="w-full bg-alice-white rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-royal-blue to-deep-wine rounded-full bar-grow" style={{ '--bar-width': `${Math.round(val as number)}%`, '--delay': `${0.3 + i * 0.05}s` } as React.CSSProperties}></div>
                              </div>
                              <div className="font-bold text-rich-black mt-1">{Math.round(val as number)}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Session Highlights */}
          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 card-shadow-hover border border-white/50 fade-slide" style={{ '--delay': '0.4s' } as React.CSSProperties}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-rich-black">Session Highlights</h3>
                <Award className="w-5 h-5 text-royal-blue" />
              </div>
              <div className="space-y-4">
                {[
                  { icon: <Activity className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-500/10', label: 'Engagement',   sub: 'Average engagement score',  value: avgEngagement,                              color: 'text-purple-600' },
                  { icon: <TrendingUp className="w-5 h-5 text-royal-blue" />, bg: 'bg-royal-blue/10', label: 'Productivity', sub: 'Posture & focus combined',   value: Math.round((avgGazeAll + avgFaceAll) / 2),   color: 'text-royal-blue' },
                  { icon: <Users className="w-5 h-5 text-green-600" />,  bg: 'bg-green-500/10',  label: 'Participation', sub: 'Joined out of all',           value: participation,                              color: 'text-green-600'  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between group">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
                        {item.icon}
                      </div>
                      <div>
                        <div className="font-bold text-rich-black">{item.label}</div>
                        <div className="text-sm text-onyx-gray/60">{item.sub}</div>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${item.color}`}>{item.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ENGAGEMENT DEEP DIVE */}
        <div ref={deepDiveRef} className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 card-shadow-hover border border-white/50 mb-8 fade-slide" style={{ '--delay': '0.5s' } as React.CSSProperties}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-rich-black mb-2">Engagement Deep Dive</h3>
              <p className="text-onyx-gray/60">Individual engagement breakdown — the core of session success</p>
            </div>
            <div className="text-right">
              <div className="shimmer-text text-4xl font-black">{avgEngagement}%</div>
              <div className="text-sm text-onyx-gray/60">Session Engagement</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {sortedByEngagement.map((participant, i) => {
              const overallEngagement = getEngagement(participant);
              const status = getStatus(overallEngagement);
              const duration = formatDuration(participant.totalActiveSeconds);

              return (
                <div
                  key={participant.id}
                  className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:border-royal-blue/20 hover:shadow-lg transition-all duration-300 card-hover fade-slide"
                  style={{ '--delay': `${0.1 + i * 0.07}s` } as React.CSSProperties}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {participant.user.ImagePath ? (
                          <img src={participant.user.ImagePath} alt={participant.user.name} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-royal-blue/20 to-deep-wine/20 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm">
                            <span className="font-bold text-royal-blue">{getInitials(participant.user.name)}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-rich-black">{participant.user.name}</h4>
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center mt-1 ${getStatusColor(status)}`}>
                          {getStatusIcon(status)}
                          <span className="ml-1">{status === 'high' ? 'Highly Engaged' : status === 'moderate' ? 'Moderate' : 'Needs Attention'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black" style={{ color: status === 'high' ? '#16a34a' : status === 'moderate' ? '#ca8a04' : '#dc2626' }}>{overallEngagement}%</div>
                      <div className="text-xs text-onyx-gray/50">engagement</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="w-full bg-alice-white rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bar-grow"
                        style={{
                          '--bar-width': `${overallEngagement}%`,
                          '--delay': `${0.6 + i * 0.08}s`,
                          background: status === 'high' ? 'linear-gradient(90deg,#16a34a,#4ade80)' : status === 'moderate' ? 'linear-gradient(90deg,#ca8a04,#facc15)' : 'linear-gradient(90deg,#dc2626,#f87171)'
                        } as React.CSSProperties}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                    {[['Attention', participant.avgAttention, '#3b82f6'], ['Gaze', participant.avgGaze, '#7c3aed'], ['Posture', participant.avgFace, '#059669']].map(([label, val, color]) => (
                      <div key={label as string} className="text-center bg-alice-white/50 rounded-xl p-2">
                        <div className="text-onyx-gray/60 mb-1">{label}</div>
                        <div className="font-bold text-rich-black" style={{ color: color as string }}>{Math.round(val as number)}%</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-onyx-gray/70">
                    <div>Joined: <span className="font-bold text-rich-black">{formatTime(participant.firstJoinTime)}</span></div>
                    <div>Left: <span className="font-bold text-rich-black">{formatTime(participant.lastLeaveTime)}</span></div>
                    <div className="col-span-2">Active Time: <span className="font-bold text-rich-black">{duration}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RECOMMENDATIONS */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 card-shadow-hover border border-white/50 fade-slide" style={{ '--delay': '0.6s' } as React.CSSProperties}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-rich-black mb-1">Recommendations</h3>
              <p className="text-onyx-gray/60 text-sm">Based on your session quality score of <strong className="text-royal-blue">{sessionQuality}%</strong></p>
            </div>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${sessionQuality >= 80 ? 'bg-green-100' : sessionQuality >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
              <TrendingUp className={`w-8 h-8 ${sessionQuality >= 80 ? 'text-green-600' : sessionQuality >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: <CheckCircle className="w-5 h-5 text-green-600" />,
                bg: 'bg-green-50 border-green-100',
                title: participants.filter(p => getStatus(getEngagement(p)) === 'low').length > 0 ? 'Schedule Follow-ups' : 'Keep the Momentum',
                desc: participants.filter(p => getStatus(getEngagement(p)) === 'low').length > 0
                  ? `${participants.filter(p => getStatus(getEngagement(p)) === 'low').length} participant(s) showed low engagement. A 1:1 check-in can help.`
                  : 'Great engagement across the board! Replicate this meeting format in future sessions.'
              },
              {
                icon: <Eye className="w-5 h-5 text-royal-blue" />,
                bg: 'bg-royal-blue/5 border-royal-blue/10',
                title: meetingDurationMinutes > 60 ? 'Consider Shorter Sessions' : 'Session Length is Optimal',
                desc: meetingDurationMinutes > 60
                  ? 'Meetings over 60 minutes often see engagement drop. Break into focused 45-min blocks.'
                  : 'Your session length is well-suited for maintaining participant focus and attention.'
              },
              {
                icon: <Activity className="w-5 h-5 text-purple-600" />,
                bg: 'bg-purple-50 border-purple-100',
                title: avgEngagement < 75 ? 'Boost Interactivity' : 'Excellent Engagement',
                desc: avgEngagement < 75
                  ? 'Try polls, breakout rooms, or Q&A to increase real-time participant engagement.'
                  : `${avgEngagement}% average engagement is strong. Adding interactive checkpoints can push it even higher.`
              }
            ].map((rec, i) => (
              <div key={i} className={`${rec.bg} border rounded-2xl p-5 card-hover`}>
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">{rec.icon}</div>
                  <div>
                    <div className="font-bold text-rich-black mb-1">{rec.title}</div>
                    <div className="text-sm text-onyx-gray/70 leading-relaxed">{rec.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}