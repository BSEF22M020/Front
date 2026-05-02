import { useRef } from "react"

interface DeepProcessOptions {
  userId: number
  meetingId?: number
  durationSeconds?: number  // default 10
  framesPerSecond?: number  // default 6
  cropSize?: number         // default 224
}

export default function useDeepProcess(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  apiUrl: string,
  options: DeepProcessOptions
) {
  const {
    userId,
    meetingId,
    durationSeconds = 10,
    framesPerSecond = 6,
    cropSize        = 224,
  } = options

  const isRunningRef  = useRef(false)
  const faceBoxRef    = useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  const faceMeshRef   = useRef<any>(null)
  const faceMeshReady = useRef(false)

  // ── Load FaceMesh once ───────────────────────────────────────────────────
  const initFaceMesh = async () => {
    if (faceMeshRef.current) return

    await new Promise<void>((resolve, reject) => {
      if ((window as any).FaceMesh) return resolve()
      const script   = document.createElement("script")
      script.src     = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"
      script.onload  = () => resolve()
      script.onerror = () => reject(new Error("Failed to load FaceMesh"))
      document.head.appendChild(script)
    })

    const faceMesh = new (window as any).FaceMesh({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    })

    faceMesh.setOptions({
      maxNumFaces           : 1,
      refineLandmarks       : false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence : 0.5,
    })

    faceMesh.onResults((results: any) => {
      if (!results.multiFaceLandmarks?.length) {
        faceBoxRef.current = null
        return
      }
      const lm    = results.multiFaceLandmarks[0]
      const video = videoRef.current!

      let minX = 1, minY = 1, maxX = 0, maxY = 0
      for (const p of lm) {
        if (p.x < minX) minX = p.x
        if (p.y < minY) minY = p.y
        if (p.x > maxX) maxX = p.x
        if (p.y > maxY) maxY = p.y
      }

      const pad = 0.20
      faceBoxRef.current = {
        x: Math.max(0, minX - (maxX - minX) * pad) * video.videoWidth,
        y: Math.max(0, minY - (maxY - minY) * pad) * video.videoHeight,
        w: (maxX - minX) * (1 + pad * 2)           * video.videoWidth,
        h: (maxY - minY) * (1 + pad * 2)           * video.videoHeight,
      }
    })

    faceMeshRef.current   = faceMesh
    faceMeshReady.current = true

    const video = videoRef.current!
    const detectLoop = async () => {
      if (!faceMeshReady.current) return
      if (video.readyState >= 2) {
        await faceMesh.send({ image: video })
      }
      setTimeout(detectLoop, 500)
    }
    detectLoop()
  }

  // ── Capture exactly one cropped frame as Blob ────────────────────────────
  const captureFrame = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const box = faceBoxRef.current
      if (box) {
        ctx.drawImage(video, box.x, box.y, box.w, box.h, 0, 0, cropSize, cropSize)
      } else {
        ctx.drawImage(video, 0, 0, cropSize, cropSize)
      }
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Failed to capture frame"))
      }, "image/jpeg", 0.85)
    })
  }

  // ── Main ─────────────────────────────────────────────────────────────────
  const start = async () => {
    if (isRunningRef.current) return
    if (!videoRef.current) return

    isRunningRef.current = true
    await initFaceMesh()

    const video  = videoRef.current
    const canvas = document.createElement("canvas")
    canvas.width  = cropSize
    canvas.height = cropSize
    const ctx = canvas.getContext("2d")!

    const frames: Blob[] = []

    console.log(`[DeepProcess] Starting: ${framesPerSecond} frames/sec for ${durationSeconds}s = ${framesPerSecond * durationSeconds} frames`)

    // Every second → burst capture framesPerSecond frames → wait rest of second
    for (let sec = 0; sec < durationSeconds; sec++) {
      if (!isRunningRef.current) break

      // Burst: capture framesPerSecond frames as fast as possible
      for (let f = 0; f < framesPerSecond; f++) {
        if (!isRunningRef.current) break
        const frame = await captureFrame(canvas, ctx, video)
        frames.push(frame)
        console.log(`[DeepProcess] Frame ${frames.length}/${framesPerSecond * durationSeconds}`)
      }

      // Wait rest of the second before next burst
      if (sec < durationSeconds - 1) {
        await new Promise((r) => setTimeout(r, 1000))
      }
    }

    console.log(`[DeepProcess] Captured ${frames.length} frames, sending...`)

    // Send all frames as multipart form
    const formData = new FormData()
    formData.append("user_id",    String(userId))
    formData.append("meeting_id", String(meetingId || 0))

    frames.forEach((blob, i) => {
      formData.append("frames", blob, `frame_${String(i).padStart(4, "0")}.jpg`)
    })

    try {
      const res  = await fetch(apiUrl, {
        method: "POST",
        body  : formData,
      })
      const data = await res.json()
      console.log("[DeepProcess] Done:", data)
    } catch (err) {
      console.error("[DeepProcess] Send failed:", err)
    }

    isRunningRef.current = false
  }

  const stop = () => {
    isRunningRef.current = false
  }

  return { start, stop }
}