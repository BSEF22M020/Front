'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import {
  StreamCall,
  useStreamVideoClient,
  useCallStateHooks,
  ParticipantView,
  useCall,
} from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'

import {
  Chat,
  Channel,
  Window,
  MessageList,
  MessageInput,
  useChatContext,
} from 'stream-chat-react'
import 'stream-chat-react/dist/css/v2/index.css'

import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Users,
  Settings,
  Clock,
  Loader2,
  Monitor,
  MonitorOff,
  MessageSquare,
  X,
  Volume2,
} from 'lucide-react'

import StreamVideoWrapper from './stream'
import { useSearchParams } from 'next/navigation'

export default function Page() {
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

  const handleLeave = () => {
    // Callback when participant leaves - handled in stream.tsx
  }

  const handleCameraOff = () => {
    // Callback when camera turns off - handled in stream.tsx
  }

  const handleCameraOn = () => {
    // Callback when camera turns on - handled in stream.tsx
  }

  const handleEnd = async () => {
    // Callback when host ends meeting - handled in stream.tsx
  }

  if (!userId || !meetingId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Loading meeting parameters...</p>
        </div>
      </div>
    )
  }

  return (
    <StreamVideoWrapper 
      userId={userId} 
      meetingId={callId}
      onLeave={handleLeave}
      onCameraOff={handleCameraOff}
      onCameraOn={handleCameraOn}
      onEnd={handleEnd}
    >
      <MeetingRoom callId={callId} meetingId={meetingId} />
    </StreamVideoWrapper>
  )
}

function MeetingRoom({ callId, meetingId }: { callId: string; meetingId: string }) {
  const client = useStreamVideoClient()
  const [call, setCall] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const joinedRef = useRef(false)

  useEffect(() => {
    if (!client || joinedRef.current) return
    joinedRef.current = true

    const join = async () => {
      try {
        const c = client.call('default', callId)
        await c.join({ create: true })
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
      if (call) {
        call.leave().catch((e: Error) => console.error('Leave error:', e))
      }
    }
  }, [call])

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Join</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!call) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Joining meeting...</p>
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
  const [showChat, setShowChat] = useState(true)

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
    <div className="h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex-1">
        <MeetingUI onToggleChat={() => setShowChat(!showChat)} showChat={showChat} meetingId={meetingId} />
      </div>

      {showChat && (
        <div className="w-[360px] border-l bg-white shadow-2xl">
          <Chat client={chatClient} theme="messaging light">
            <Channel channel={channel}>
              <Window>
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                  <h3 className="font-semibold text-gray-800">Meeting Chat</h3>
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
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
      )}
    </div>
  )
}

function MeetingUI({ 
  onToggleChat, 
  showChat,
  meetingId 
}: { 
  onToggleChat: () => void
  showChat: boolean
  meetingId: string
}) {
  const call = useCall()

  const {
    useParticipants,
    useMicrophoneState,
    useCameraState,
    useScreenShareState,
  } = useCallStateHooks()

  const participants = useParticipants()
  const { microphone, isMute } = useMicrophoneState()
  const { camera, isMute: cameraOff } = useCameraState()
  const { isEnabled: isScreenSharing } = useScreenShareState()

  const [meetingDuration, setMeetingDuration] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setMeetingDuration(v => v + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const toggleMic = async () => {
    try {
      isMute ? await microphone.enable() : await microphone.disable()
    } catch (e) {
      console.error('Mic toggle failed:', e)
    }
  }

  const toggleCam = async () => {
    try {
      if (cameraOff) {
        await camera.enable()
        if (typeof window !== 'undefined' && (window as any).__meetingHandlers) {
          await (window as any).__meetingHandlers.cameraOn()
        }
      } else {
        await camera.disable()
        if (typeof window !== 'undefined' && (window as any).__meetingHandlers) {
          await (window as any).__meetingHandlers.cameraOff()
        }
      }
    } catch (e) {
      console.error('Camera toggle failed:', e)
    }
  }

  const toggleScreenShare = async () => {
    if (!call) return
    try {
      isScreenSharing
        ? await call.screenShare.disable()
        : await call.screenShare.enable()
    } catch (e) {
      console.error('Screen share toggle failed:', e)
    }
  }

  const leave = async () => {
    if (!call) return
    if (!confirm('Are you sure you want to leave this meeting?')) return
    
    try {
      if (typeof window !== 'undefined' && (window as any).__meetingHandlers) {
        await (window as any).__meetingHandlers.leave()
      }
      
      await call.leave()
      window.location.href = '/'
    } catch (e) {
      console.error('Leave failed:', e)
    }
  }

  // Get unique participants
  const allParticipants = useMemo(() => {
    const seen = new Set()
    return participants.filter(p => {
      if (!p.userId || seen.has(p.userId)) return false
      seen.add(p.userId)
      return true
    })
  }, [participants])

  // Find participants who are screen sharing
  const screenSharingParticipants = useMemo(() => {
    return allParticipants.filter(p => p.screenShareStream)
  }, [allParticipants])

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const nameOf = (p: any) =>
    p.isLocalParticipant ? 'You' : p.name || p.userId || 'Guest'

  // Check if participant has video enabled
  const hasVideo = (p: any) => {
    return p.videoStream !== undefined && p.videoStream !== null
  }

  // Check if participant has audio enabled
  const hasAudio = (p: any) => {
    return p.audioStream !== undefined && p.audioStream !== null
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white px-6 py-4 flex justify-between items-center border-b shadow-sm">
        <h1 className="font-semibold text-xl text-gray-800">Meeting Room</h1>
        <div className="flex gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
            <Clock size={16} className="text-gray-500" />
            <span className="font-medium">{formatDuration(meetingDuration)}</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
            <Users size={16} className="text-gray-500" />
            <span className="font-medium">{allParticipants.length}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-auto">
        {/* Screen Share View - Priority layout when someone is sharing */}
        {screenSharingParticipants.length > 0 ? (
          <div className="h-full flex flex-col gap-4">
            {/* Main screen share area */}
            <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden shadow-lg relative">
              <ParticipantView 
                participant={screenSharingParticipants[0]} 
                trackType="screenShareTrack"
              />
              <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg">
                <Monitor size={18} />
                {nameOf(screenSharingParticipants[0])} is sharing screen
              </div>
            </div>

            {/* Thumbnails of all participants */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allParticipants.map(p => (
                <div 
                  key={p.sessionId} 
                  className="relative bg-gray-900 rounded-lg overflow-hidden shadow-md flex-shrink-0"
                  style={{ width: '180px', height: '120px' }}
                >
                  {hasVideo(p) ? (
                    <ParticipantView participant={p} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                          <span className="text-lg font-bold text-white">
                            {nameOf(p).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Name badge */}
                  <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium">
                    {nameOf(p)}
                  </div>

                  {/* Status indicators */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {!hasAudio(p) && (
                      <div className="bg-red-500 p-1 rounded shadow-md">
                        <MicOff size={14} className="text-white" />
                      </div>
                    )}
                    {!hasVideo(p) && (
                      <div className="bg-red-500 p-1 rounded shadow-md">
                        <VideoOff size={14} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Speaking indicator */}
                  {p.isSpeaking && hasAudio(p) && (
                    <div className="absolute top-2 left-2 bg-green-500 p-1.5 rounded-full animate-pulse shadow-md">
                      <Volume2 size={14} className="text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Regular Grid View - When no screen sharing */
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr h-full">
            {allParticipants.map(p => (
              <div 
                key={p.sessionId} 
                className="relative bg-gray-900 rounded-xl overflow-hidden shadow-lg min-h-[280px]"
              >
                {hasVideo(p) ? (
                  <ParticipantView participant={p} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <span className="text-4xl font-bold text-white">
                          {nameOf(p).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-white font-medium text-lg">{nameOf(p)}</p>
                      <p className="text-gray-400 text-sm mt-1">Camera off</p>
                    </div>
                  </div>
                )}

                {/* Name badge */}
                <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg">
                  {nameOf(p)}
                </div>

                {/* Status indicators */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {!hasAudio(p) && (
                    <div className="bg-red-500 p-2.5 rounded-full shadow-lg">
                      <MicOff size={18} className="text-white" />
                    </div>
                  )}
                  {!hasVideo(p) && (
                    <div className="bg-red-500 p-2.5 rounded-full shadow-lg">
                      <VideoOff size={18} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Speaking indicator */}
                {p.isSpeaking && hasAudio(p) && (
                  <div className="absolute top-4 left-4 bg-green-500 p-2.5 rounded-full animate-pulse shadow-lg">
                    <Volume2 size={18} className="text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border-t px-6 py-5 shadow-lg">
        <div className="flex justify-center items-center gap-3">
          <button
            onClick={toggleMic}
            className={`p-4 rounded-full transition-all shadow-md ${
              isMute
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title={isMute ? 'Unmute' : 'Mute'}
          >
            {isMute ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button
            onClick={toggleCam}
            className={`p-4 rounded-full transition-all shadow-md ${
              cameraOff
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title={cameraOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition-all shadow-md ${
              isScreenSharing
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
          </button>

          <button
            onClick={onToggleChat}
            className={`p-4 rounded-full transition-all shadow-md ${
              showChat
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="Toggle chat"
          >
            <MessageSquare size={20} />
          </button>

          <button
            onClick={leave}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all ml-2 shadow-md"
            title="Leave meeting"
          >
            <PhoneOff size={20} />
          </button>

          <button
            className="p-4 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all shadow-md"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}