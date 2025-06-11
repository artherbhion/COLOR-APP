import React, { useState, useRef } from "react";
import axios from "axios";
import CameraCapture from "./components/CameraCapture";
import "./App.css";

function App() {
  const [referenceColor, setReferenceColor] = useState("#ff0000");
  const [capturedImage, setCapturedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [fileUpload, setFileUpload] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const cameraRef = useRef(null);

  const handleSubmit = async () => {
    if (!capturedImage && !fileUpload) {
      alert("Please capture or upload an image.");
      return;
    }
  
    const formData = new FormData();
  
    // Convert color
    const rgb = hexToRgb(referenceColor);
    formData.append("reference_r", rgb.r);
    formData.append("reference_g", rgb.g);
    formData.append("reference_b", rgb.b);
  
    // Handle image source
    if (capturedImage) {
      const blob = dataURLtoFile(capturedImage, "capture.jpg");
      formData.append("file", blob);
    } else {
      const file = fileUpload;
      formData.append("file", file, file.name);
    }
  
    try {
      const res = await axios.post("http://localhost:8000/analyze", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(res.data);
    } catch (error) {
      console.error("AXIOS ERROR:", error);
      alert("Network Error: " + error.message);
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Please upload smaller file.");
      return;
    }
    
    setCapturedImage(null);
    setFileUpload(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setFilePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCapture = (imageData) => {
    setCapturedImage(imageData);
    setFileUpload(null);
    setFilePreview(null);
    if (cameraRef.current) {
      cameraRef.current.pauseCamera();
    }
  };

  const toggleCamera = () => {
    setShowCamera(!showCamera);
    if (!showCamera) {
      setFileUpload(null);
      setFilePreview(null);
    } else {
      setCapturedImage(null);
    }
  };

  const hexToRgb = (hex) => {
    const bigint = parseInt(hex.slice(1), 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  };

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

  return (
    <div className="container">
      <h2>🎨 Color Analyzer Web App</h2>

      <div className="color-picker-container">
  <label className="color-picker-label">Reference Color:</label>
  <input 
    type="color" 
    value={referenceColor} 
    onChange={(e) => setReferenceColor(e.target.value)} 
  />
  <span className="color-value">{referenceColor}</span>
</div>
      <p>Reference Color: {referenceColor}</p>

      <div className="upload-container">
        <h3>🖼️ Upload Image:</h3>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {filePreview && (
          <div className="image-preview">
            <h4>Upload Preview:</h4>
            <img src={filePreview} alt="Upload preview" style={{ maxWidth: "100%", maxHeight: "300px" }} />
          </div>
        )}
        <button onClick={toggleCamera} className="toggle-camera-btn">
          {showCamera ? "Hide Camera" : "Use Camera Instead"}
        </button>
      </div>

      {showCamera && (
        <div className="webcam-container">
          <h3>📸 Capture from Camera:</h3>
          <CameraCapture 
            ref={cameraRef}
            setCapturedImage={handleCapture} 
          />
          {capturedImage && (
            <div className="image-preview">
              <h4>Captured Image:</h4>
              <img src={capturedImage} alt="Captured preview" style={{ maxWidth: "100%", maxHeight: "300px" }} />
              <button onClick={() => cameraRef.current.resumeCamera()}>Retake</button>
            </div>
          )}
        </div>
      )}

      <button onClick={handleSubmit}>Analyze</button>

      {result && (
        <div className="result">
          <h3>Results:</h3>
          <p>ΔE: {result.delta_e.toFixed(2)}</p>
          <p>Accuracy: {result.accuracy.toFixed(2)}%</p>
          <p>Prediction: {result.prediction}</p>
          <p>Hue Diff: {result.features.hue_diff.toFixed(2)}</p>
          <p>Saturation Diff: {result.features.sat_diff.toFixed(2)}</p>
          <p>Brightness Diff: {result.features.bright_diff.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}

export default App;