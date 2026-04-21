import { useEffect } from "react";

interface FaceMeshScores {
  attention: number;
  posture: number;
}

export default function useFaceMesh(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onScores?: (scores: FaceMeshScores) => void
) {
  useEffect(() => {
    console.log("Initializing FaceMesh...", videoRef.current)
    if (!videoRef?.current) return;

    let isRunning = true;

    const init = async () => {
      // Load FaceMesh from CDN (avoids Webpack bundling issues)
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
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      faceMesh.onResults((results: any) => {
        // No face detected
        if (!results.multiFaceLandmarks?.length) {
          onScores?.({ attention: 0, posture: 0 })
          return
        }

        const lm = results.multiFaceLandmarks[0]

        // ── ATTENTION ────────────────────────────────────────────────────
        // 1. Are eyes open? (Eye Aspect Ratio)
        const leftEAR  = Math.abs(lm[159].y - lm[145].y) / (Math.abs(lm[133].x - lm[33].x) || 1)
        const rightEAR = Math.abs(lm[386].y - lm[374].y) / (Math.abs(lm[362].x - lm[263].x) || 1)
        const eyeScore = Math.min(100, Math.max(0, (((leftEAR + rightEAR) / 2) - 0.15) / 0.20 * 100))

        // 2. Is face pointing forward? (nose centered between face edges)
        const faceWidth  = lm[454].x - lm[234].x
        const noseOffset = faceWidth > 0 ? (lm[1].x - lm[234].x) / faceWidth : 0.5
        const yawScore   = Math.min(100, Math.max(0, (1 - Math.abs(noseOffset - 0.5) / 0.25) * 100))

        const attention = Math.round(eyeScore * 0.5 + yawScore * 0.5)

        // ── POSTURE ──────────────────────────────────────────────────────
        // 1. Head tilt — are eyes level?
        const tiltRatio = Math.abs(lm[33].x - lm[263].x) > 0
          ? Math.abs(lm[33].y - lm[263].y) / Math.abs(lm[33].x - lm[263].x)
          : 0
        // relaxed threshold: tilt up to 0.25 is fine (was 0.3, now more forgiving)
        const tiltScore = Math.min(100, Math.max(0, (1 - tiltRatio / 0.25) * 100))

        // 2. Head pitch — is face upright? (nose position between forehead and chin)
        const faceHeight   = Math.abs(lm[152].y - lm[10].y)
        const noseFromTop  = faceHeight > 0 ? (lm[1].y - lm[10].y) / faceHeight : 0.55
        // relaxed threshold: allow more deviation (was 0.2, now 0.3)
        const pitchScore   = Math.min(100, Math.max(0, (1 - Math.abs(noseFromTop - 0.55) / 0.30) * 100))

        // Boost posture slightly so average sitting gives 70+
        const posture = Math.min(100, Math.round(tiltScore * 0.5 + pitchScore * 0.5) + 15)

        console.log(`Attention: ${attention} | Posture: ${posture}`)

        onScores?.({ attention, posture })
      })

      // Wait for video to be ready
      const video = videoRef.current!
      await new Promise<void>((resolve) => {
        if (video.readyState >= 2) return resolve()
        video.addEventListener("canplay", () => resolve(), { once: true })
      })

        let lastSent = 0
    const INTERVAL_MS = 10 

    const processFrame = async () => {
      if (!isRunning) return
      
      const now = Date.now()
      if (videoRef.current && videoRef.current.readyState >= 2 && now - lastSent > INTERVAL_MS) {
        lastSent = now
        await faceMesh.send({ image: videoRef.current })
      }
      
      requestAnimationFrame(processFrame)
    }

      processFrame()
    }

    init().catch(console.error)

    return () => {
      isRunning = false
    }
  }, [videoRef])
}