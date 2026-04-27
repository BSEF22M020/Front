"use client" 
import { useRef } from "react"
import useDeepProcess from '@/mediapipe/DeepProcess'
import { API_PREFIX } from "@/constants/api"

export default function TestDeepProcess() {
  const videoRef = useRef<HTMLVideoElement>(null)

  const { start, stop } = useDeepProcess(videoRef, `${API_PREFIX}/api/upload`, {
    userId: 1,
    meetingId: 1,
    durationSeconds: 10,
    framesPerSecond: 6,
    cropSize: 224,
  })

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    if (videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.play()
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>DeepProcess Test</h2>
      <button onClick={startCamera}>Start Camera</button>
      <button onClick={start}>Start Analysis</button>  {/* 👈 */}
      <button onClick={stop}>Stop</button>             {/* 👈 */}
      <br /><br />
      <video
        ref={videoRef}
        width={400}
        height={300}
        style={{ border: "1px solid black" }}
        muted
        playsInline
      />
      <p>Check console for send logs</p>
    </div>
  )
}