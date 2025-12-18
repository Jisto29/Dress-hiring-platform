import { useState, useRef, useEffect } from 'react';
import { FaTimes, FaCamera, FaSync, FaExpand, FaCompress } from 'react-icons/fa';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import '@mediapipe/pose';

function ARTryOn({ product, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detector, setDetector] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user' for front camera, 'environment' for back
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [opacity, setOpacity] = useState(0.8);
  const [overlayScale, setOverlayScale] = useState(1.0);
  const animationFrameRef = useRef(null);

  // Initialize TensorFlow and pose detector
  useEffect(() => {
    const initializePoseDetection = async () => {
      try {
        setIsLoading(true);
        
        // Set TensorFlow backend
        await tf.ready();
        await tf.setBackend('webgl');
        
        // Create detector
        const detectorConfig = {
          runtime: 'tfjs',
          modelType: 'lite',
          enableSmoothing: true,
        };
        
        const poseDetector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig
        );
        
        setDetector(poseDetector);
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing pose detection:', err);
        setError('Failed to initialize AR. Please try again.');
        setIsLoading(false);
      }
    };

    initializePoseDetection();

    return () => {
      if (detector) {
        detector.dispose();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Initialize camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            if (detector) {
              startPoseDetection();
            }
          };
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Unable to access camera. Please check permissions.');
      }
    };

    if (!isLoading && detector) {
      startCamera();
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [facingMode, detector, isLoading]);

  // Pose detection loop
  const startPoseDetection = () => {
    setIsDetecting(true);
    detectPose();
  };

  const detectPose = async () => {
    if (!videoRef.current || !canvasRef.current || !detector) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const detect = async () => {
      if (!video.paused && !video.ended && video.readyState === 4) {
        try {
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Detect pose
          const poses = await detector.estimatePoses(video);

          if (poses && poses.length > 0) {
            const pose = poses[0];
            drawDressOverlay(ctx, pose, canvas.width, canvas.height);
            drawPoseKeypoints(ctx, pose);
          }
        } catch (err) {
          console.error('Error during pose detection:', err);
        }
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  // Draw dress overlay on detected body
  const drawDressOverlay = (ctx, pose, canvasWidth, canvasHeight) => {
    const keypoints = pose.keypoints;
    
    // Get key body points
    const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder');
    const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');
    const leftHip = keypoints.find(kp => kp.name === 'left_hip');
    const rightHip = keypoints.find(kp => kp.name === 'right_hip');
    const leftKnee = keypoints.find(kp => kp.name === 'left_knee');
    const rightKnee = keypoints.find(kp => kp.name === 'right_knee');

    // Check if we have enough confidence in the keypoints
    const minConfidence = 0.3;
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip ||
        leftShoulder.score < minConfidence || rightShoulder.score < minConfidence ||
        leftHip.score < minConfidence || rightHip.score < minConfidence) {
      return;
    }

    // Calculate dress dimensions based on body measurements
    const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    
    const hipWidth = Math.abs(rightHip.x - leftHip.x);
    const hipMidY = (leftHip.y + rightHip.y) / 2;
    
    // Determine dress length
    let dressLength;
    if (leftKnee && rightKnee && leftKnee.score > minConfidence && rightKnee.score > minConfidence) {
      const kneeMidY = (leftKnee.y + rightKnee.y) / 2;
      dressLength = kneeMidY - shoulderMidY;
    } else {
      dressLength = (hipMidY - shoulderMidY) * 2; // Default to twice torso length
    }

    // Draw dress shape with gradient
    ctx.save();
    ctx.globalAlpha = opacity;

    // Create a dress silhouette
    const gradient = ctx.createLinearGradient(
      shoulderMidX, shoulderMidY,
      shoulderMidX, shoulderMidY + dressLength
    );
    
    // Parse product color or use default
    const productColor = getProductColor();
    gradient.addColorStop(0, productColor);
    gradient.addColorStop(1, adjustBrightness(productColor, -20));

    ctx.fillStyle = gradient;

    // Draw dress path
    ctx.beginPath();
    
    // Shoulder line
    ctx.moveTo(leftShoulder.x - shoulderWidth * 0.1, shoulderMidY);
    ctx.lineTo(rightShoulder.x + shoulderWidth * 0.1, shoulderMidY);
    
    // Right side of dress
    const waistY = shoulderMidY + (hipMidY - shoulderMidY) * 0.6;
    const waistWidth = shoulderWidth * 0.9;
    ctx.quadraticCurveTo(
      rightShoulder.x + shoulderWidth * 0.05, waistY,
      shoulderMidX + waistWidth / 2, waistY
    );
    
    // Bottom hem
    const hemWidth = shoulderWidth * overlayScale * 1.2;
    ctx.quadraticCurveTo(
      shoulderMidX + hemWidth / 2, shoulderMidY + dressLength * 0.8,
      shoulderMidX + hemWidth / 2, shoulderMidY + dressLength
    );
    ctx.lineTo(shoulderMidX - hemWidth / 2, shoulderMidY + dressLength);
    
    // Left side of dress
    ctx.quadraticCurveTo(
      shoulderMidX - hemWidth / 2, shoulderMidY + dressLength * 0.8,
      shoulderMidX - waistWidth / 2, waistY
    );
    ctx.quadraticCurveTo(
      leftShoulder.x - shoulderWidth * 0.05, waistY,
      leftShoulder.x - shoulderWidth * 0.1, shoulderMidY
    );
    
    ctx.closePath();
    ctx.fill();

    // Add some detail/texture
    ctx.strokeStyle = adjustBrightness(productColor, -40);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Add product branding/text
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(product.brand || '', shoulderMidX, shoulderMidY + dressLength + 30);

    ctx.restore();
  };

  // Get product color from product data
  const getProductColor = () => {
    if (!product.color) return '#8B4513'; // Default brown
    
    const colorMap = {
      'chocolate': '#8B4513',
      'brown': '#8B4513',
      'black': '#000000',
      'white': '#FFFFFF',
      'red': '#DC143C',
      'blue': '#4169E1',
      'green': '#228B22',
      'pink': '#FF69B4',
      'purple': '#9370DB',
      'yellow': '#FFD700',
      'orange': '#FF8C00',
      'gray': '#808080',
      'grey': '#808080',
      'navy': '#000080',
      'beige': '#F5F5DC'
    };

    const colorLower = product.color.toLowerCase();
    for (const [key, value] of Object.entries(colorMap)) {
      if (colorLower.includes(key)) {
        return value;
      }
    }

    return '#8B4513'; // Default
  };

  // Adjust color brightness
  const adjustBrightness = (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  };

  // Draw pose keypoints for debugging
  const drawPoseKeypoints = (ctx, pose) => {
    const keypoints = pose.keypoints;
    
    keypoints.forEach(keypoint => {
      if (keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#00FF00';
        ctx.fill();
      }
    });
  };

  // Toggle camera
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Capture screenshot
  const captureScreenshot = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    const overlayCanvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    
    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Draw overlay
    ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height);
    
    // Download
    const link = document.createElement('a');
    link.download = `ar-tryon-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md text-center">
          <h3 className="text-xl font-bold text-red-600 mb-4">Error</h3>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black z-50 ${isFullscreen ? '' : 'bg-opacity-95'}`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="text-white">
            <h2 className="text-xl font-bold">AR Try-On</h2>
            <p className="text-sm opacity-80">{product.name || product.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white bg-white bg-opacity-20 hover:bg-opacity-30 p-3 rounded-full transition"
          >
            <FaTimes size={24} />
          </button>
        </div>
      </div>

      {/* Main AR View */}
      <div className="relative w-full h-full flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">Initializing AR...</p>
            </div>
          </div>
        )}

        {/* Video feed */}
        <video
          ref={videoRef}
          className={`${isFullscreen ? 'w-full h-full object-cover' : 'max-w-4xl max-h-[80vh]'} ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          }`}
          playsInline
          muted
        />

        {/* Overlay canvas */}
        <canvas
          ref={canvasRef}
          className={`absolute ${isFullscreen ? 'w-full h-full object-cover' : 'max-w-4xl max-h-[80vh]'} ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          }`}
          style={{ pointerEvents: 'none' }}
        />

        {/* Instructions */}
        {!isLoading && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-6 py-3 rounded-full text-sm">
            Stand back and face the camera to see the dress overlay
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 z-10">
        <div className="max-w-7xl mx-auto">
          {/* Sliders */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-4 bg-white bg-opacity-20 p-3 rounded-lg">
              <label className="text-white text-sm font-medium min-w-[80px]">Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-white text-sm min-w-[40px]">{Math.round(opacity * 100)}%</span>
            </div>

            <div className="flex items-center gap-4 bg-white bg-opacity-20 p-3 rounded-lg">
              <label className="text-white text-sm font-medium min-w-[80px]">Size</label>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.1"
                value={overlayScale}
                onChange={(e) => setOverlayScale(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-white text-sm min-w-[40px]">{Math.round(overlayScale * 100)}%</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleCamera}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-4 rounded-full transition"
              title="Switch Camera"
            >
              <FaSync size={24} />
            </button>

            <button
              onClick={captureScreenshot}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full transition flex items-center gap-2 font-semibold"
              title="Take Screenshot"
            >
              <FaCamera size={24} />
              <span>Capture</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-4 rounded-full transition"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <FaCompress size={24} /> : <FaExpand size={24} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ARTryOn;

