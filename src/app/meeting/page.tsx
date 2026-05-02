'use client';

import { useEffect, useState, useRef, useMemo, Suspense } from 'react'
import {
  StreamCall,
  useStreamVideoClient,
  useCallStateHooks,
  ParticipantView,
  useCall,
  Call,
  hasAudio,
  hasVideo,
  hasScreenShare,
} from '@stream-io/video-react-sdk'

import {
  Chat,
  Channel,
  Window,
  MessageList,
  MessageInput,
  useChatContext,
} from 'stream-chat-react'

import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Users,
  Clock,
  Loader2,
  Monitor,
  MonitorOff,
  MessageSquare,
  X,
  Maximize2,
  Minimize2,
  User,
  ScreenShare,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Radio,
} from 'lucide-react'

import StreamVideoWrapper, { useMeetingData } from './stream'
import { useSearchParams } from 'next/navigation'
import useFaceMesh from '@/mediapipe/FaceMesh';
import useDeepProcess from '@/mediapipe/DeepProcess'
import axios from 'axios';
import { API_PREFIX } from '@/constants/api';


function MeetingPage() {
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState('')
  const [meetingId, setMeetingId] = useState('')

  useEffect(() => {
    const userIdParam = searchParams.get('userId')
    const meetingIdParam = searchParams.get('meetingId')
    if (userIdParam) setUserId(String(userIdParam))
    if (meetingIdParam) setMeetingId(String(meetingIdParam))
  }, [searchParams])

  const callId = meetingId

  if (!userId || !meetingId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-alice-white via-white to-alice-white">
        <div className="text-center relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-royal-blue/10 to-deep-wine/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Loader2 className="w-12 h-12 text-royal-blue animate-spin" />
          </div>
          <p className="text-2xl font-bold text-rich-black mb-2">Preparing meeting...</p>
          <p className="text-sm text-onyx-gray/60">Please wait</p>
        </div>
      </div>
    )
  }

  return (
    <StreamVideoWrapper userId={userId} meetingId={callId}>
      <MeetingRoom callId={callId} meetingId={meetingId} />
    </StreamVideoWrapper>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-alice-white via-white to-alice-white">
        <div className="text-center relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-royal-blue/10 to-deep-wine/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Loader2 className="w-12 h-12 text-royal-blue animate-spin" />
          </div>
          <p className="text-2xl font-bold text-rich-black">Loading...</p>
        </div>
      </div>
    }>
      <MeetingPage />
    </Suspense>
  )
}



// ─── Stats Sidebar ────────────────────────────────────────────────────────────

function ArcRing({ value }: { value: number }) {
  const r = 15
  const circ = 2 * Math.PI * r
  const offset = circ - (circ * (value / 100))
  return (
    <svg viewBox="0 0 38 38" style={{ width: 38, height: 38, transform: 'rotate(-90deg)' }}>
      <circle cx="19" cy="19" r={r} fill="none" stroke="#B5D4F4" strokeWidth="2.5" />
      <circle
        cx="19" cy="19" r={r} fill="none"
        stroke="#185FA5" strokeWidth="2.5"
        strokeDasharray={circ.toFixed(2)}
        strokeDashoffset={offset.toFixed(2)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  )
}

const SCROLL_WIDTHS = [22, 30, 18, 26, 14, 28, 20, 16, 24, 20, 18, 22]
const SCROLL_OPACITIES = [0.7, 0.9, 0.55, 0.75, 0.85, 0.6, 0.8, 0.5, 0.9, 0.65, 0.7, 0.55]

function StatsSidebar({
  posture,
  attention,
  visible,
  onToggle,
}: {
  posture: number
  attention: number
  visible: boolean
  onToggle: () => void
}) {
  const postureColor   = posture   >= 70 ? '#3B6D11' : posture   >= 40 ? '#854F0B' : '#A32D2D'
  const postureBarColor= posture   >= 70 ? '#639922' : posture   >= 40 ? '#BA7517' : '#E24B4A'
  const postureHint    = posture   >= 70 ? 'Good posture — keep it up' : posture >= 40 ? 'Sit up straighter' : 'Poor — adjust position'
  const attentionHint  = attention >= 70 ? 'Highly focused' : attention >= 40 ? 'Stay focused' : 'Eyes on screen'

  // doubled strip for seamless loop
  const strip = [...SCROLL_WIDTHS, ...SCROLL_WIDTHS]
  const ops   = [...SCROLL_OPACITIES, ...SCROLL_OPACITIES]

  return (
    <div className="relative flex h-full shrink-0">
      {/* toggle tab */}
      <button
        onClick={onToggle}
        className="absolute -left-6 top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-white border border-gray-200 border-r-0 rounded-l-lg flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
      >
        {visible
          ? <ChevronRight size={13} className="text-gray-400" />
          : <ChevronLeft  size={13} className="text-gray-400" />
        }
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out border-l border-gray-200 bg-white flex flex-col h-full"
        style={{ width: visible ? 220 : 0 }}
      >
        <div className="flex flex-col h-full overflow-y-auto" style={{ width: 220 }}>

          {/* header */}
          <div className="px-3.5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
              Live analytics
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse inline-block" />
              Live
            </span>
          </div>

          {/* posture */}
          <div className="px-3.5 py-3.5 border-b border-gray-100">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs text-gray-500">Posture</span>
              <span className="text-[12px] font-medium transition-colors duration-500" style={{ color: postureColor }}>
                {posture}/100
              </span>
            </div>
            <div className="h-[3px] bg-gray-100 rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${posture}%`,
                  background: postureBarColor,
                  transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1), background 0.6s',
                }}
              />
            </div>
            <span className="text-[11px] text-gray-400">{postureHint}</span>
          </div>

          {/* attention */}
          <div className="px-3.5 py-3.5 border-b border-gray-100">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs text-gray-500">Attention</span>
              <span className="text-[12px] font-medium text-blue-700">
                {attention}/100
              </span>
            </div>
            <div className="h-[3px] bg-gray-100 rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{
                  width: `${attention}%`,
                  transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </div>
            <span className="text-[11px] text-gray-400">{attentionHint}</span>
          </div>

          {/* engagement */}
          <div className="px-3.5 py-3.5 flex-1">
            <span className="text-xs text-gray-500 block mb-2.5">Engagement score</span>

            <div className="rounded-xl p-3" style={{ background: '#E6F1FB' }}>
              {/* arc + label row */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="relative shrink-0" style={{ width: 38, height: 38 }}>
                  <ArcRing value={attention} />
                  <span
                    className="absolute inset-0 flex items-center justify-center text-[10px] font-medium"
                    style={{ color: '#185FA5' }}
                  >
                    —
                  </span>
                </div>
                <div>
                  <p className="text-[12px] font-medium leading-tight mb-0.5" style={{ color: '#0C447C' }}>
                    Calculating…
                  </p>
                  <p className="text-[11px]" style={{ color: '#378ADD' }}>
                    Deep tracking active
                  </p>
                </div>
              </div>

              {/* rolling bar strip */}
              <div className="overflow-hidden rounded-sm mb-2.5" style={{ height: 6 }}>
                <div
                  className="flex gap-[3px]"
                  style={{
                    width: 'max-content',
                    animation: 'statsSidebarScroll 7s linear infinite',
                  }}
                >
                  {strip.map((w, i) => (
                    <div
                      key={i}
                      style={{
                        width: w,
                        height: 6,
                        borderRadius: 3,
                        background: '#378ADD',
                        opacity: ops[i],
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              </div>

              <p className="text-[11px] leading-relaxed" style={{ color: '#185FA5' }}>
                Full report generated when meeting ends.
              </p>
            </div>

            {/* notice strip */}
            <div
              className="mt-2.5 px-2.5 py-2 rounded-lg"
              style={{ background: '#E6F1FB', border: '0.5px solid #B5D4F4' }}
            >
              <p className="text-[11px] leading-relaxed" style={{ color: '#0C447C' }}>
                Posture &amp; attention tracked in real time.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* keyframe injected once */}
      <style>{`
        @keyframes statsSidebarScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

// ─── Meeting room plumbing ────────────────────────────────────────────────────

function MeetingRoom({ callId, meetingId }: { callId: string; meetingId: string }) {
  const client = useStreamVideoClient()
  const [call, setCall] = useState<Call | null>(null)
  const [error, setError] = useState<string | null>(null)
  const joinedRef = useRef(false)

  useEffect(() => {
    if (!client || joinedRef.current) return
    joinedRef.current = true

    const join = async () => {
      try {
        const preferencesString = sessionStorage.getItem('meetingPreferences')
        let micEnabled = false
        let videoEnabled = false

        if (preferencesString) {
          try {
            const preferences = JSON.parse(preferencesString)
            micEnabled = preferences.micEnabled || false
            videoEnabled = preferences.videoEnabled || false
            sessionStorage.removeItem('meetingPreferences')
          } catch (error) {
            console.error('Error parsing preferences:', error)
          }
        }

        const c = client.call('default', callId)
        await c.camera.disable()
        await c.microphone.disable()
        await c.join({ create: true })
        if (videoEnabled) await c.camera.enable()
        if (micEnabled) await c.microphone.enable()
        setCall(c)
      } catch (e) {
        console.error('Join failed:', e)
        setError(e instanceof Error ? e.message : 'Failed to join meeting')
      }
    }

    join()
  }, [client, callId])

  useEffect(() => {
    return () => {
      if (call) call.leave().catch((e: Error) => console.error('Leave error:', e))
    }
  }, [call])

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-100 px-4">
        <div className="text-center max-w-md w-full mx-auto p-10 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <X className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-rich-black mb-3">Failed to Join Meeting</h3>
          <p className="text-onyx-gray/70 mb-8">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-royal-blue to-deep-wine text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!call) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-alice-white via-white to-alice-white">
        <div className="text-center relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-royal-blue/10 to-deep-wine/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Loader2 className="w-12 h-12 text-royal-blue animate-spin" />
          </div>
          <p className="text-2xl font-bold text-rich-black mb-2">Joining meeting...</p>
          <p className="text-sm text-onyx-gray/60">Connecting to video call</p>
        </div>
      </div>
    )
  }

  return (
    <StreamCall call={call}>
      <MeetingWithChat meetingId={meetingId} />
    </StreamCall>
  )
}

function MeetingWithChat({ meetingId }: { meetingId: string }) {
  const { client: chatClient } = useChatContext()
  const [showChat, setShowChat] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const { posture, attention } = useMeetingData()
  const [meetingDuration, setMeetingDuration] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setMeetingDuration(v => v + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) setShowChat(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const channel = useMemo(() => {
    if (!chatClient) return null
    return chatClient.channel('messaging', meetingId)
  }, [chatClient, meetingId])

  useEffect(() => {
    if (!channel) return
    channel.watch().catch(console.error)
  }, [channel])

  if (!channel) return null

  return (
    <div className="h-screen flex bg-gradient-to-br from-alice-white to-white relative overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <MeetingUI
          onToggleChat={() => setShowChat(!showChat)}
          showChat={showChat}
          meetingDuration={meetingDuration}
        />
      </div>

      <StatsSidebar
        posture={posture}
        attention={attention}
        visible={showStats}
        onToggle={() => setShowStats(v => !v)}
      />

      {showChat && (
        <>
          {isMobile && (
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
              onClick={() => setShowChat(false)}
            />
          )}
          <div className={`${isMobile ? 'fixed inset-y-0 right-0 z-50 w-full max-w-sm' : 'w-[380px]'} border-l border-gray-200 bg-white shadow-2xl`}>
            <Chat client={chatClient} theme="messaging light">
              <Channel channel={channel}>
                <Window>
                  <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-royal-blue/5 to-deep-wine/5">
                    <h3 className="font-bold text-gray-800 text-lg">Meeting Chat</h3>
                    <button
                      onClick={() => setShowChat(false)}
                      className="p-2 hover:bg-gray-200 rounded-xl transition-all duration-200"
                    >
                      <X size={20} className="text-gray-600" />
                    </button>
                  </div>
                  <MessageList />
                  <MessageInput />
                </Window>
              </Channel>
            </Chat>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Meeting UI ───────────────────────────────────────────────────────────────

function MeetingEndedScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="text-center max-w-md mx-auto px-8">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
          <PhoneOff className="w-12 h-12 text-red-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Meeting Ended</h2>
        <p className="text-gray-400 text-base mb-2">The meeting duration has been reached.</p>
        <p className="text-gray-500 text-sm">You can now close this window.</p>
      </div>
    </div>
  )
}

function MeetingUI({
  onToggleChat,
  showChat,
  meetingDuration,
}: {
  onToggleChat: () => void
  showChat: boolean
  meetingDuration: number
}) {
  const call = useCall()
  const { useParticipants, useMicrophoneState, useCameraState, useScreenShareState } = useCallStateHooks()
  const participants = useParticipants()
  const { microphone, isMute } = useMicrophoneState()
  const { camera, isMute: cameraOff } = useCameraState()
  // Added video ref object
  
  const mediaStream = camera.state.mediaStream

  const { status: screenShareStatus } = useScreenShareState()
  const isLocalUserSharing = screenShareStatus === 'enabled'

  const { meetingTotalDuration, meetingStartTime, videoRef, onScores } = useMeetingData()

  const [focusedParticipant, setFocusedParticipant] = useState<string | null>(null)
  const [screenShareError, setScreenShareError] = useState<string | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [meetingEnded, setMeetingEnded] = useState(false)
  const warningShownRef = useRef(false)
  const endedRef = useRef(false)

  const screenSharingParticipant = participants.find(p => hasScreenShare(p))
  const someoneIsSharing = !!screenSharingParticipant

  const elapsedSeconds = meetingStartTime
    ? Math.floor((Date.now() - meetingStartTime) / 1000)
    : meetingDuration

  const remainingSeconds = meetingTotalDuration ? Math.max(0, meetingTotalDuration - elapsedSeconds) : null

  useEffect(() => {
    if (!meetingTotalDuration || !meetingStartTime) return
    const remaining = meetingTotalDuration - elapsedSeconds
    if (remaining <= 60 && remaining > 0 && !warningShownRef.current) {
      warningShownRef.current = true
      setShowWarning(true)
    }
    if (remaining <= 0 && !endedRef.current) {
      endedRef.current = true
      setShowWarning(false)
      setMeetingEnded(true)
      const handlers = (window as any).__meetingHandlers
      handlers?.leave()
      call?.leave().catch((e: Error) => console.error('Auto-leave error:', e))
    }
  }, [meetingDuration, meetingTotalDuration, meetingStartTime, call])

  useEffect(() => {
    if (someoneIsSharing && screenSharingParticipant) {
      setFocusedParticipant(screenSharingParticipant.sessionId)
    }
  }, [someoneIsSharing, screenSharingParticipant?.sessionId])

  useEffect(() => {
    if (screenShareError) {
      const t = setTimeout(() => setScreenShareError(null), 5000)
      return () => clearTimeout(t)
    }
  }, [screenShareError])

  useFaceMesh(videoRef as React.RefObject<HTMLVideoElement>, onScores)


  // Here we are calling api where the deep engagement will be get


  // Added UseEffect to set up MediaPipe FaceMesh
 useEffect(() => {
    const track = mediaStream?.getVideoTracks()[0]
    if (!track || !videoRef.current) return

    videoRef.current.srcObject = new MediaStream([track])
    videoRef.current.play().catch(console.error)
  }, [mediaStream])

  const searchParams = useSearchParams()
  // Here I am running deep face analysis
   const { start } = useDeepProcess(videoRef, `${API_PREFIX}/api/upload`, {
      userId: Number(searchParams.get("userId") || 0),
      meetingId: Number(searchParams.get("meetingId") || 0),
      durationSeconds: 10,
      framesPerSecond: 6,
      cropSize: 224,
    })

    useEffect(() => {
      const interval = setInterval(()=>
      {
        console.log("Running deep process analysis...")
        start()  
      }, 30000)
      return ()=>clearInterval(interval)
    }, [])



   

  const toggleMic = async () => {
    try {
      if (isMute) await microphone.enable()
      else await microphone.disable()
    } catch (e) { console.error('Mic toggle failed:', e) }
  }

  const toggleCam = async () => {
    try {
      if (cameraOff) await camera.enable()
      else await camera.disable()
    } catch (e) { console.error('Camera toggle failed:', e) }
  }

  const toggleScreenShare = async () => {
    if (!call) return
    setScreenShareError(null)
    try {
      await call.screenShare.toggle()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      if (msg.includes('Permission denied') || msg.includes('NotAllowedError')) {
        setScreenShareError('Screen share permission was denied. Please allow it in your browser settings.')
      } else if (msg.includes('not supported')) {
        setScreenShareError('Screen sharing is not supported in your browser.')
      } else if (!msg.includes('cancel') && !msg.includes('AbortError')) {
        setScreenShareError('Failed to share screen: ' + msg)
      }
    }
  }

  const leave = async () => {
    if (!confirm('Are you sure you want to leave this meeting?')) return
    const handlers = (window as any).__meetingHandlers
    if (handlers?.leave) await handlers.leave()
    if (call) await call.leave().catch((e: Error) => console.error('Leave error:', e))
    window.location.href = '/'
  }

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const nameOf = (p: any) => p.isLocalParticipant ? 'You' : p.name || p.userId || 'Guest'

  const getGridClass = () => {
    const count = participants.length
    if (focusedParticipant) return 'grid-cols-1'
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-1 md:grid-cols-2'
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2'
    if (count <= 6) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    if (count <= 9) return 'grid-cols-2 md:grid-cols-3'
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  }

  const displayParticipants = focusedParticipant && !someoneIsSharing
    ? participants.filter(p => p.sessionId === focusedParticipant)
    : participants

  if (meetingEnded) return <MeetingEndedScreen />

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <video ref={videoRef} muted playsInline style={{ display: 'none' }} />

      {showWarning && remainingSeconds !== null && remainingSeconds > 0 && (
        <div className="shrink-0 mx-4 mt-3 flex items-center gap-3 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-xl shadow-sm text-sm">
          <AlertTriangle size={16} className="shrink-0 text-amber-600" />
          <span className="font-semibold">
            Meeting ends in {formatDuration(remainingSeconds)} — please wrap up.
          </span>
          <button onClick={() => setShowWarning(false)} className="ml-auto shrink-0 hover:text-amber-900">
            <X size={14} />
          </button>
        </div>
      )}

      <header className="bg-white/90 backdrop-blur-lg px-4 sm:px-8 py-4 sm:py-5 flex justify-between items-center border-b border-gray-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-royal-blue to-deep-wine rounded-xl flex items-center justify-center shadow-md">
            <Video className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-lg sm:text-xl text-rich-black">Meeting Room</h1>
          {isLocalUserSharing && (
            <div className="hidden sm:flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <Monitor size={14} />
              Sharing screen
            </div>
          )}
          {someoneIsSharing && !isLocalUserSharing && (
            <div className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <ScreenShare size={14} />
              {nameOf(screenSharingParticipant)} is sharing
            </div>
          )}
        </div>

        <div className="flex gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 bg-gradient-to-r from-royal-blue/10 to-deep-wine/10 px-3 sm:px-4 py-2 rounded-xl border border-royal-blue/20">
            <Clock size={15} className="text-royal-blue" />
            <span className="font-semibold text-rich-black">{formatDuration(meetingDuration)}</span>
            {remainingSeconds !== null && (
              <span className={`text-[11px] font-medium ${remainingSeconds <= 60 ? 'text-red-500' : 'text-gray-400'}`}>
                -{formatDuration(remainingSeconds)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-royal-blue/10 to-deep-wine/10 px-3 sm:px-4 py-2 rounded-xl border border-royal-blue/20">
            <Users size={15} className="text-deep-wine" />
            <span className="font-semibold text-rich-black">{participants.length}</span>
          </div>
        </div>
      </header>

      {screenShareError && (
        <div className="shrink-0 mx-4 mt-3 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <X size={16} className="mt-0.5 shrink-0" />
          <span>{screenShareError}</span>
          <button onClick={() => setScreenShareError(null)} className="ml-auto shrink-0"><X size={14} /></button>
        </div>
      )}

      <div className="flex-1 p-3 sm:p-6 md:p-8 overflow-auto">
        {someoneIsSharing ? (
          <div className="flex gap-4 h-full">
            <div className="flex-1 relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-green-400/40">
              <ParticipantView participant={screenSharingParticipant!} trackType="screenShareTrack" />
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-green-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg">
                <ScreenShare size={14} />
                Screen share
              </div>
              <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg border border-white/10">
                {nameOf(screenSharingParticipant)}
              </div>
              {isLocalUserSharing && (
                <button
                  onClick={toggleScreenShare}
                  className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-lg hover:scale-105"
                >
                  <MonitorOff size={14} />
                  Stop sharing
                </button>
              )}
            </div>
            <div className="w-48 sm:w-56 flex flex-col gap-3 overflow-y-auto shrink-0">
              {participants.map(p => {
                const isVideoOff = p.isLocalParticipant ? cameraOff : !hasVideo(p)
                const isAudioOff = p.isLocalParticipant ? isMute : !hasAudio(p)
                return (
                  <div key={p.sessionId} className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg aspect-video shrink-0">
                    {isVideoOff ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-royal-blue/20 via-deep-wine/10 to-royal-blue/20">
                        <div className="w-10 h-10 bg-gradient-to-br from-royal-blue to-deep-wine rounded-full flex items-center justify-center shadow-md">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0"><ParticipantView participant={p} /></div>
                    )}
                    <div className="absolute top-1.5 right-1.5 flex gap-1 z-10">
                      {isAudioOff && <div className="bg-red-500 p-1 rounded-lg"><MicOff size={10} className="text-white" /></div>}
                      {isVideoOff && <div className="bg-red-500 p-1 rounded-lg"><VideoOff size={10} className="text-white" /></div>}
                    </div>
                    <div className="absolute bottom-1.5 left-1.5 bg-black/80 text-white px-2 py-0.5 rounded-lg text-xs font-semibold truncate max-w-[calc(100%-0.75rem)] border border-white/10">
                      {nameOf(p)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className={`grid gap-3 sm:gap-4 md:gap-5 ${getGridClass()} h-full content-start`}>
            {displayParticipants.map(p => {
              const isVideoOff = p.isLocalParticipant ? cameraOff : !hasVideo(p)
              const isAudioOff = p.isLocalParticipant ? isMute : !hasAudio(p)
              const isSharingScreen = hasScreenShare(p)
              return (
                <div
                  key={p.sessionId}
                  className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl aspect-video group transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => { if (participants.length > 1) setFocusedParticipant(focusedParticipant === p.sessionId ? null : p.sessionId) }}
                >
                  {isVideoOff ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-royal-blue/20 via-deep-wine/10 to-royal-blue/20">
                      <div className="text-center">
                        <div className="w-24 h-24 sm:w-36 sm:h-36 bg-gradient-to-br from-royal-blue to-deep-wine rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl ring-4 ring-white/10">
                          <User className="w-12 h-12 sm:w-20 sm:h-20 text-white" />
                        </div>
                        <p className="text-white text-base sm:text-xl font-bold drop-shadow-lg">{nameOf(p)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0"><ParticipantView participant={p} /></div>
                  )}
                  {participants.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setFocusedParticipant(focusedParticipant === p.sessionId ? null : p.sessionId) }}
                      className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-black/70 backdrop-blur-md p-2 sm:p-2.5 rounded-xl opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 z-10 hover:bg-black/90"
                    >
                      {focusedParticipant === p.sessionId ? <Minimize2 size={18} className="text-white" /> : <Maximize2 size={18} className="text-white" />}
                    </button>
                  )}
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-2 z-10">
                    {isSharingScreen && <div className="bg-green-500 p-2 sm:p-2.5 rounded-xl shadow-lg"><ScreenShare size={16} className="text-white" /></div>}
                    {isAudioOff && <div className="bg-red-500 p-2 sm:p-2.5 rounded-xl shadow-lg"><MicOff size={16} className="text-white" /></div>}
                    {isVideoOff && <div className="bg-red-500 p-2 sm:p-2.5 rounded-xl shadow-lg"><VideoOff size={16} className="text-white" /></div>}
                  </div>
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 bg-black/80 backdrop-blur-md text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-2xl max-w-[calc(100%-1.5rem)] truncate z-10 border border-white/10">
                    {nameOf(p)}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {focusedParticipant && participants.length > 1 && !someoneIsSharing && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setFocusedParticipant(null)}
              className="text-sm text-royal-blue hover:text-deep-wine font-semibold underline transition-colors"
            >
              Show all participants
            </button>
          </div>
        )}
      </div>

      <div className="bg-white/90 backdrop-blur-lg border-t border-gray-200 px-3 sm:px-8 py-4 sm:py-6 shadow-2xl shrink-0">
        <div className="flex justify-center items-center gap-2 sm:gap-4 flex-wrap">
          <button
            onClick={toggleMic}
            className={`p-4 sm:p-5 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 ${isMute ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200'}`}
            title={isMute ? 'Unmute' : 'Mute'}
          >
            {isMute ? <MicOff size={20} className="sm:w-6 sm:h-6" /> : <Mic size={20} className="sm:w-6 sm:h-6" />}
          </button>

          <button
            onClick={toggleCam}
            className={`p-4 sm:p-5 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 ${cameraOff ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200'}`}
            title={cameraOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {cameraOff ? <VideoOff size={20} className="sm:w-6 sm:h-6" /> : <Video size={20} className="sm:w-6 sm:h-6" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-4 sm:p-5 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 hidden sm:flex items-center justify-center ${isLocalUserSharing ? 'bg-gradient-to-br from-green-500 to-green-600 text-white ring-2 ring-green-300 ring-offset-1' : someoneIsSharing ? 'bg-white text-gray-400 border-2 border-gray-200 opacity-50 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200'}`}
            disabled={someoneIsSharing && !isLocalUserSharing}
            title={isLocalUserSharing ? 'Stop sharing' : someoneIsSharing ? `${nameOf(screenSharingParticipant)} is already sharing` : 'Share screen'}
          >
            {isLocalUserSharing ? <MonitorOff size={20} className="sm:w-6 sm:h-6" /> : <Monitor size={20} className="sm:w-6 sm:h-6" />}
          </button>

          <button
            onClick={onToggleChat}
            className={`p-4 sm:p-5 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 ${showChat ? 'bg-gradient-to-br from-royal-blue to-deep-wine text-white' : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200'}`}
            title="Toggle chat"
          >
            <MessageSquare size={20} className="sm:w-6 sm:h-6" />
          </button>

          <div className="hidden sm:block w-px h-12 bg-gray-300 mx-2" />

          <button
            onClick={leave}
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
            title="Leave meeting"
          >
            <PhoneOff size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}