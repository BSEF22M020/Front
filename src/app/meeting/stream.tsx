"use client"

import { useEffect, useRef, useState, ReactNode } from "react"
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk"
import { StreamChat } from "stream-chat"
import { Chat } from "stream-chat-react"
import "stream-chat-react/dist/css/v2/index.css"

export const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_KEY

interface Props {
  children: ReactNode
  userId: string
  meetingId: string
  onLeave: () => void
  onCameraOff: () => void
  onCameraOn: () => void
  onEnd: () => Promise<void>
}

export default function StreamVideoWrapper({
  children,
  userId,
  meetingId,
  onLeave,
  onCameraOff,
  onCameraOn,
  onEnd
}: Props) {
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null)
  const [chatClient, setChatClient] = useState<StreamChat | null>(null)
  const [userIdNumber, setUserIdNumber] = useState<number | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  const initializedRef = useRef(false)
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const cameraOnRef = useRef(true)

  useEffect(() => {
    if (!userId) return
    if (initializedRef.current) return
    initializedRef.current = true

    const init = async () => {
      const appToken = localStorage.getItem("token")
      if (!appToken) return

      const gqlRes = await fetch("https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${appToken}`
        },
        body: JSON.stringify({
          query: `{ getUserbyId { id name ImagePath role } }`
        })
      })

      const gqlJson = await gqlRes.json()
      if (gqlJson.errors) {
        console.error("getUserbyId errors", gqlJson.errors)
        return
      }
      const user = gqlJson.data.getUserbyId

      const meetingRes = await fetch("https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${appToken}`
        },
        body: JSON.stringify({
          query: `{ getMeetingById(id: ${meetingId}) { id hostId } }`
        })
      })

      const meetingJson = await meetingRes.json()
      if (meetingJson.errors) {
        console.error("getMeetingById errors", meetingJson.errors)
        return
      }
      const meeting = meetingJson.data.getMeetingById

      const role: string = meeting.hostId === user.id ? "Host" : "User"
      user.role = role
      setUserIdNumber(user.id)
      setUserRole(role)

      const joinRes = await fetch("https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/api/JoinMeeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${appToken}`
        },
        body: JSON.stringify({ data: user, meetingId })
      })

      if (!joinRes.ok) {
        console.error("JoinMeeting failed")
        return
      }

      const payload = await joinRes.json()
      if (!payload?.token) {
        console.error("Stream token missing", payload)
        return
      }

      const vClient = new StreamVideoClient({
        apiKey: String(STREAM_API_KEY)
      })
      await vClient.connectUser(
        {
          id: String(user.id),
          name: user.name,
          image: user.ImagePath
        },
        payload.token
      )

      const cClient = new StreamChat(String(STREAM_API_KEY))
      await cClient.connectUser(
        {
          id: String(user.id),
          name: user.name,
          image: user.ImagePath
        },
        payload.token
      )

      setVideoClient(vClient)
      setChatClient(cClient)

      startMetricsLoop(appToken, user.id)
    }

    init().catch((err) => {
      console.error("init error", err)
    })

    return () => {
      stopMetricsLoop()
      chatClient?.disconnectUser().catch(() => {})
      videoClient?.disconnectUser().catch(() => {})
    }
  }, [userId, meetingId])

  const startMetricsLoop = (token: string, id: number) => {
    if (metricsIntervalRef.current) return

    metricsIntervalRef.current = setInterval(async () => {
      if (!cameraOnRef.current) return

      const attention = Math.random()
      const gaze = Math.random()
      const face = Math.random()

      try {
        await fetch("https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/api/metrics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            meetingId,
            userId: id,
            attention,
            gaze,
            face,
            window: 5
          })
        })
      } catch (err) {
        console.error("Metrics update failed", err)
      }
    }, 5000)
  }

  const stopMetricsLoop = () => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current)
      metricsIntervalRef.current = null
    }
  }

  useEffect(() => {
    const handleLeave = async () => {
      if (!userIdNumber) return
      const token = localStorage.getItem("token")

      if (userRole === "Host") {
        try {
          await fetch("https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/api/end", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ meetingId })
          })
        } catch (err) {
          console.error("End meeting API call failed", err)
        }
        stopMetricsLoop()
        await onEnd()
      } else {
        try {
          await fetch("https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/api/leave", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              meetingId,
              userId: userIdNumber
            })
          })
        } catch (err) {
          console.error("Leave API call failed", err)
        }
        stopMetricsLoop()
        onLeave()
      }
    }

    const handleCameraOff = async () => {
      if (!userIdNumber) return
      cameraOnRef.current = false
      const token = localStorage.getItem("token")
      try {
        await fetch("https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/api/camera-off", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            meetingId,
            userId: userIdNumber
          })
        })
      } catch (err) {
        console.error("Camera off API call failed", err)
      }
      onCameraOff()
    }

    const handleCameraOn = async () => {
      if (!userIdNumber) return
      cameraOnRef.current = true
      const token = localStorage.getItem("token")
      try {
        await fetch("https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/api/camera-on", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            meetingId,
            userId: userIdNumber
          })
        })
      } catch (err) {
        console.error("Camera on API call failed", err)
      }
      onCameraOn()
    }

    const handleEnd = async () => {
      const token = localStorage.getItem("token")
      try {
        await fetch("https://handsome-demetria-goodmeet-eb9fb43d.koyeb.app/api/end", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ meetingId })
        })
      } catch (err) {
        console.error("End meeting API call failed", err)
      }
      stopMetricsLoop()
      await onEnd()
    }

    if (typeof window !== "undefined") {
      ;(window as any).__meetingHandlers = {
        leave: handleLeave,
        cameraOff: handleCameraOff,
        cameraOn: handleCameraOn,
        end: handleEnd
      }
    }
  }, [userIdNumber, userRole, meetingId, onLeave, onCameraOff, onCameraOn, onEnd])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      cameraOnRef.current = detail.cameraOn
    }
    window.addEventListener("camera-state", handler)
    return () => window.removeEventListener("camera-state", handler)
  }, [])

  if (!videoClient || !chatClient) {
    return <div className="h-screen flex items-center justify-center">Connecting…</div>
  }

  return (
    <Chat client={chatClient} theme="messaging light">
      <StreamVideo client={videoClient}>{children}</StreamVideo>
    </Chat>
  )
}
