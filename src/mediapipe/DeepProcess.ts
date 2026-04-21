import { useEffect, useRef } from "react";

export default function useDeepProcess(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  apiUrl: string
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const faceBoxRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null)

  useEffect(() => {
    if (!videoRef?.current) return

    let isRunning = true

    const canvas = document.createElement("canvas")
    canvas.width = 200
    canvas.height = 200
    canvasRef.current = canvas

    const init = async () => {
      await new Promise<void>((resolve, reject) => {
        if ((window as any).FaceMesh) return resolve()
        const script = document.createElement("script")
        script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"
        script.onload = () => resolve()
        script.onerror = () => reject(new Error("Failed to load FaceMesh script"))
        document.head.appendChild(script)
      })

      const FaceMesh = (window as any).FaceMesh

      const faceMesh = new FaceMesh({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      })

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false, 
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      
      faceMesh.onResults((results: any) => {
        if (!results.multiFaceLandmarks?.length) {
          faceBoxRef.current = null
          return
        }

        const lm = results.multiFaceLandmarks[0]
        const video = videoRef.current!

       
        let minX = 1, minY = 1, maxX = 0, maxY = 0
        for (const point of lm) {
          if (point.x < minX) minX = point.x
          if (point.y < minY) minY = point.y
          if (point.x > maxX) maxX = point.x
          if (point.y > maxY) maxY = point.y
        }

        const padding = 0.20
        const w = (maxX - minX) * (1 + padding * 2)
        const h = (maxY - minY) * (1 + padding * 2)
        const x = Math.max(0, minX - (maxX - minX) * padding)
        const y = Math.max(0, minY - (maxY - minY) * padding)

         
        faceBoxRef.current = {
          x: x * video.videoWidth,
          y: y * video.videoHeight,
          w: w * video.videoWidth,
          h: h * video.videoHeight,
        }
      })

       
      const video = videoRef.current!
      await new Promise<void>((resolve) => {
        if (video.readyState >= 2) return resolve()
        video.addEventListener("canplay", () => resolve(), { once: true })
      })

     
      let lastSent = 0
      const detectFrame = async () => {
        if (!isRunning) return
        const now = Date.now()
        if (video.readyState >= 2 && now - lastSent > 500) {
          lastSent = now
          await faceMesh.send({ image: video })
        }
        requestAnimationFrame(detectFrame)
      }
      detectFrame()

     
      startRecording()
 
      intervalRef.current = setInterval(() => {
        stopAndSend()
        startRecording()
      }, 20000)
    }

    const startRecording = () => {
      const canvas = canvasRef.current!
      const video = videoRef.current!

      // Draw cropped face onto canvas at 10fps
      const drawInterval = setInterval(() => {
        if (!isRunning) { clearInterval(drawInterval); return }
        const ctx = canvas.getContext("2d")!
        const box = faceBoxRef.current

        if (box && video.readyState >= 2) {
          // Draw cropped face region scaled to canvas size
          ctx.drawImage(
            video,
            box.x, box.y, box.w, box.h,   // source: face crop
            0, 0, canvas.width, canvas.height  // dest: full canvas
          )
        } else if (video.readyState >= 2) {
          // No face detected — draw full video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        }
      }, 100) // 10fps

      // Record the canvas stream
      const stream = canvas.captureStream(10)
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.start(100)
      mediaRecorderRef.current = recorder
    }

    const stopAndSend = () => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === "inactive") return

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" })
        chunksRef.current = []

        // Send to API
        try {
          const formData = new FormData()
          formData.append("video", blob, "face.webm")

          await fetch(apiUrl, {
            method: "POST",
            body: formData,
          })

          console.log("Face video sent to API")
        } catch (err) {
          console.error("Failed to send face video:", err)
        }
      }

      recorder.stop()
    }

    init().catch(console.error)

    return () => {
      isRunning = false
      if (intervalRef.current) clearInterval(intervalRef.current)
      stopAndSend()
    }
  }, [videoRef, apiUrl])
}