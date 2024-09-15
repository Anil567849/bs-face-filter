"use client"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera } from "lucide-react"
import * as faceapi from 'face-api.js'

export default function CameraButton() {
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const loadModels = useCallback(async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
  }, [])

  const detectFaces = useCallback(async () => {

    if (!videoRef.current || !canvasRef.current) return;

    // Create canvas overlay to draw face landmarks
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video) {
      video.addEventListener('loadedmetadata', () => {
    
        const displaySize = { width: video.clientWidth, height: video.clientHeight };

        faceapi.matchDimensions(canvas, displaySize);

        // Define the previous landmarks so we can compare and avoid clearing unnecessarily
        let previousLandmarks: any = null;

        try {
          setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            const context = canvas.getContext('2d');

            // If no detections, skip drawing
            if (!resizedDetections.length) return;

            // Extract face landmarks from the first detection
            const detection = resizedDetections[0];
            const landmarks = detection.landmarks;
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();
            
            // Check if landmarks have changed to avoid flickering
            if (JSON.stringify(previousLandmarks) !== JSON.stringify({ leftEye, rightEye })) {
              // Clear previous drawings only when necessary
              context?.clearRect(0, 0, canvas.width, canvas.height);

              const lensSrc = '/glass-1.png';

              // Draw lenses on the canvas
              drawLens(context, leftEye, rightEye, lensSrc);

              previousLandmarks = { leftEye, rightEye };
            }
          }, 1000);

        } catch (error) {
          console.log({ error });
        }
        
      });
    }else{
      alert("no video")
    }

  }, []);

  const drawLens = (context: any, leftEyeCoordinates: any, rightEyeCoordinates: any, accessorySrc: string) => {

      const img = new Image();
      img.src = accessorySrc;

      img.onload = () => {
      const leftEyeCenter = {
        x: (leftEyeCoordinates[0].x + leftEyeCoordinates[3].x) / 2,
        y: (leftEyeCoordinates[1].y + leftEyeCoordinates[4].y) / 2
      };
      const rightEyeCenter = {
        x: (rightEyeCoordinates[0].x + rightEyeCoordinates[3].x) / 2,
        y: (rightEyeCoordinates[1].y + rightEyeCoordinates[4].y) / 2
      };

      const eyeDistance = Math.sqrt(
        (rightEyeCenter.x - leftEyeCenter.x) ** 2 + (rightEyeCenter.y - leftEyeCenter.y) ** 2
      );

      // Define a scaling factor if needed
      const scalingFactor = 2.4; 

      // Adjust the size of the accessory image
      const accessoryWidth = eyeDistance * scalingFactor;
      const accessoryHeight = accessoryWidth * (img.height / img.width);
      
      // Calculate the top-left position to center the accessory image
      const accessoryX = (leftEyeCenter.x + rightEyeCenter.x) / 2 - accessoryWidth / 2;
      const accessoryY = (leftEyeCenter.y + rightEyeCenter.y) / 2 - accessoryHeight / 2.5;

      // Draw the combined accessory image on the canvas
      context.drawImage(img, accessoryX, accessoryY, accessoryWidth, accessoryHeight);
      
    }
  };
  
  const openCamera = useCallback(async () => {
    setIsCameraOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        detectFaces();
      }
      streamRef.current = stream
    } catch (err) {
      closeCamera();
      console.error("Error accessing the camera:", err)
      alert("Unable to access the camera. Please make sure you have given permission.")
    }
  }, [])

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    setIsCameraOpen(false)
  }, [])

  useEffect(() => {
    loadModels()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [loadModels])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
      <Button
        onClick={openCamera}
        className="px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 ease-in-out transform hover:scale-105 cursor-pointer"
      >
        <Camera className="w-6 h-6 mr-2" />
        Open Camera
      </Button>

      {isCameraOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl w-[90vw] md:w-[50vw]">

            <div className="p-4 bg-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Camera</h2>
              <Button
                onClick={closeCamera}
                variant="ghost"
                className="text-gray-600 hover:text-gray-800 cursor-pointer"
              >
                Close
              </Button>
            </div>

            <div className="p-4 h-full w-full">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="rounded-3xl shadow-xl"
                  style={{height: "100%", width: "100%"}}
                />
                {/* Canvas for drawing face landmarks and lenses */}
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 rounded-3xl"
                />
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  )
}