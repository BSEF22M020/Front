'use client';

import { useEffect, useRef, useState, ReactNode, createContext, useContext } from "react"
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk"
import { StreamChat } from "stream-chat"
import { Chat } from "stream-chat-react"
require("stream-chat-react/dist/css/v2/index.css")
import { API_PREFIX } from "@/constants/api";
import { Loader2 } from "lucide-react";

export const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_KEY

interface MeetingDataContextType {
  posture: number;
  attention: number;
  meetingTotalDuration: number;
  meetingStartTime: number;
  userRole: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>
  onScores: (scores: { attention: number; posture: number }) => void
}

const MeetingDataContext = createContext<MeetingDataContextType>({
  posture: 0,
  attention: 0,
  meetingTotalDuration: 0,
  meetingStartTime: 0,
  userRole: null,
  videoRef: { current: null },
  onScores: () => {}
})

export const useMeetingData = () => useContext(MeetingDataContext)

interface Props {
  children: ReactNode
  userId: string
  meetingId: string
}

export default function StreamVideoWrapper({ children, userId, meetingId }: Props) {
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null)
  const [chatClient, setChatClient] = useState<StreamChat | null>(null)
  const [userIdNumber, setUserIdNumber] = useState<number | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [meetingTotalDuration, setMeetingTotalDuration] = useState(0)
  const [meetingStartTime, setMeetingStartTime] = useState(0)

  // FIX 4: posture & attention start at 0 and are updated the moment the first scores arrive
  // (via onScores → scoresRef → metrics loop which ticks every 2 s from the very first render).
  const [posture, setPosture] = useState(0)
  const [attention, setAttention] = useState(0)

  const initializedRef = useRef(false)
  // FIX 4: keep a ref to the auth token so the metrics loop can be started as early as possible
  const tokenRef = useRef<string | null>(null)
  const userIdRef = useRef<number | null>(null)
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const cameraOnRef = useRef(true)
  const videoClientRef = useRef<StreamVideoClient | null>(null)
  const chatClientRef = useRef<StreamChat | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const scoresRef = useRef({ attention: 0, posture: 0 })

  // Called by useFaceMesh on every inference frame; updates the shared ref immediately
  const onScores = (scores: { attention: number; posture: number }) => {
    scoresRef.current = scores
  }

  // ─── Metrics sender (reads from scoresRef) ─────────────────────────────────
  // FIX 4: extracted so we can call it from the interval AND start it before `init` finishes.
  const sendMetrics = async () => {
    if (!cameraOnRef.current) return
    const attentionVal = scoresRef.current.attention
    const postureVal   = scoresRef.current.posture

    // Update the displayed values every tick — this drives the sidebar bars
    setAttention(Math.round(attentionVal))
    setPosture(Math.round(postureVal))

    // Only POST once we have a real user id and token
    const token = tokenRef.current
    const id    = userIdRef.current
    if (!token || !id) return

    try {
      await fetch(`${API_PREFIX}/api/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ meetingId, userId: id, attention: attentionVal, posture: postureVal, window: 1 })
      })
    } catch (err) {
      console.error("Metrics update failed", err)
    }
  }

  const startMetricsLoop = () => {
    if (metricsIntervalRef.current) return
    // Fire once immediately, then every 2 seconds
    sendMetrics()
    metricsIntervalRef.current = setInterval(sendMetrics, 1000)
  }

  const stopMetricsLoop = () => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current)
      metricsIntervalRef.current = null
    }
  }

  // FIX 4: Start the metrics loop (and therefore posture/attention display) as soon as the
  // component mounts — before init() resolves. The loop will set state on every tick
  // so the sidebar bars update the moment FaceMesh begins emitting scores.
  useEffect(() => {
    startMetricsLoop()
    return () => stopMetricsLoop()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!userId || initializedRef.current) return
    initializedRef.current = true

    const init = async () => {
      const appToken = localStorage.getItem("token")
      if (!appToken) return
      tokenRef.current = appToken

      const gqlRes = await fetch(`${API_PREFIX}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${appToken}` },
        body: JSON.stringify({ query: `{ getUserbyId { id name ImagePath role } }` })
      })
      const gqlJson = await gqlRes.json()
      if (gqlJson.errors) { console.error("getUserbyId errors", gqlJson.errors); return }
      const user = gqlJson.data.getUserbyId

      const meetingRes = await fetch(`${API_PREFIX}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${appToken}` },
        body: JSON.stringify({ query: `{ getMeetingById(id: ${meetingId}) { id hostId meetingDuration startTime } }` })
      })
      const meetingJson = await meetingRes.json()
      if (meetingJson.errors) { console.error("getMeetingById errors", meetingJson.errors); return }
      const meeting = meetingJson.data.getMeetingById

      const role: string = meeting.hostId === user.id ? "Host" : "User"
      user.role = role
      userIdRef.current = user.id
      setUserIdNumber(user.id)
      setUserRole(role)
      setMeetingTotalDuration(meeting.meetingDuration)
      setMeetingStartTime(new Date(meeting.startTime).getTime())

      const joinRes = await fetch(`${API_PREFIX}/api/JoinMeeting`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${appToken}` },
        body: JSON.stringify({ data: user, meetingId })
      })
      if (!joinRes.ok) { console.error("JoinMeeting failed"); return }

      const payload = await joinRes.json()
      if (!payload?.token) { console.error("Stream token missing", payload); return }

      const vClient = new StreamVideoClient({ apiKey: String(STREAM_API_KEY) })
      await vClient.connectUser({ id: String(user.id), name: user.name, image: user.ImagePath }, payload.token)

      const cClient = new StreamChat(String(STREAM_API_KEY))
      await cClient.connectUser({ id: String(user.id), name: user.name, image: user.ImagePath }, payload.token)

      await new Promise(resolve => setTimeout(resolve, 1500))
      videoClientRef.current = vClient
      chatClientRef.current = cClient
      setVideoClient(vClient)
      setChatClient(cClient)
      // No need to call startMetricsLoop here — it's already running from the mount effect above
    }

    init().catch((err) => console.error("init error", err))

    return () => {
      chatClientRef.current?.disconnectUser().catch(() => {})
      videoClientRef.current?.disconnectUser().catch(() => {})
    }
  }, [userId, meetingId])

  useEffect(() => {
    const handleLeave = async () => {
      if (!userIdNumber) return
      const token = localStorage.getItem("token")
      if (userRole === "Host") {
        try {
          await fetch(`${API_PREFIX}/api/end`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ meetingId })
          })
        } catch (err) {
          console.error("End meeting API call failed", err)
        }
      } else {
        try {
          await fetch(`${API_PREFIX}/api/leave`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ meetingId, userId: userIdNumber })
          })
        } catch (err) {
          console.error("Leave API call failed", err)
        }
      }
      stopMetricsLoop()
    }

    const handleCameraOff = async () => {
      if (!userIdNumber) return
      cameraOnRef.current = false
      const token = localStorage.getItem("token")
      try {
        await fetch(`${API_PREFIX}/api/camera-off`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ meetingId, userId: userIdNumber })
        })
      } catch (err) {
        console.error("Camera off API call failed", err)
      }
    }

    const handleCameraOn = async () => {
      if (!userIdNumber) return
      cameraOnRef.current = true
      const token = localStorage.getItem("token")
      try {
        await fetch(`${API_PREFIX}/api/camera-on`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ meetingId, userId: userIdNumber })
        })
      } catch (err) {
        console.error("Camera on API call failed", err)
      }
    }

    if (typeof window !== "undefined") {
      ;(window as any).__meetingHandlers = {
        leave: handleLeave,
        cameraOff: handleCameraOff,
        cameraOn: handleCameraOn,
      }
    }
  }, [userIdNumber, userRole, meetingId])

  useEffect(() => {
    const handler = (e: Event) => {
      cameraOnRef.current = (e as CustomEvent).detail.cameraOn
    }
    window.addEventListener("camera-state", handler)
    return () => window.removeEventListener("camera-state", handler)
  }, [])

  if (!videoClient || !chatClient) {
    return (
      <div className="flex items-center justify-center bg-gradient-to-br from-alice-white to-white" style={{ height: '100dvh' }}>
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-royal-blue/10 to-deep-wine/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Loader2 className="w-10 h-10 text-royal-blue animate-spin" />
          </div>
          <p className="text-xl font-semibold text-rich-black mb-2">Connecting to meeting...</p>
          <p className="text-sm text-onyx-gray/60">Setting up your video and chat</p>
        </div>
      </div>
    )
  }

  return (
    <MeetingDataContext.Provider value={{ posture, attention, meetingTotalDuration, meetingStartTime, userRole, videoRef, onScores }}>
      <Chat client={chatClient} theme="messaging light">
        <StreamVideo client={videoClient}>{children}</StreamVideo>
      </Chat>
    </MeetingDataContext.Provider>
  )
}
