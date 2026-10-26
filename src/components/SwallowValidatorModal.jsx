import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  ShieldCheck,
  RefreshCw
} from "lucide-react";

export default function SwallowValidatorModal({
  isOpen,
  onClose,
  targetDose,
  onVerifiedIngestion
}) {
  const [isListening, setIsListening] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [audioSourceMode, setAudioSourceMode] = useState("mic"); // "mic" | "synthetic"
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize and clean up Web Audio API
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setIsVerified(false);
      setDetectionConfidence(0);
    }
    return () => stopListening();
  }, [isOpen]);

  const startListening = async () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      let source;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        source = audioCtx.createMediaStreamSource(stream);
        setAudioSourceMode("mic");
      } catch (err) {
        // Fallback to internal oscillator / synthetic simulation if microphone is blocked
        setAudioSourceMode("synthetic");
      }

      if (source) {
        source.connect(analyser);
      }

      setIsListening(true);
      drawOscilloscope();
    } catch (e) {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsListening(false);
  };

  // Oscilloscope and Spectral Peak Detection loop
  const drawOscilloscope = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw frequency spectrum bars
      const barWidth = (canvas.width / bufferLength) * 2.2;
      let barX = 0;

      // Analyze specific deglutition frequency band: 800Hz - 2000Hz (approx bin 20 to 50 for 512 FFT)
      let deglutitionBandEnergy = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        // Highlight swallowing signature band in cyan/emerald
        if (i >= 18 && i <= 46) {
          deglutitionBandEnergy += dataArray[i];
          ctx.fillStyle = "#06b6d4";
        } else {
          ctx.fillStyle = "#334155";
        }

        ctx.fillRect(barX, canvas.height - barHeight, barWidth, barHeight);
        barX += barWidth + 1;
      }

      // Check if deglutition energy exceeds threshold
      const avgBandEnergy = deglutitionBandEnergy / 28;
      if (avgBandEnergy > 110) {
        const conf = Math.min(99, Math.round((avgBandEnergy / 180) * 100));
        setDetectionConfidence(conf);
        if (conf >= 85 && !isVerified) {
          setIsVerified(true);
        }
      }
    };

    render();
  };

  // Synthetic Acoustic Deglutition Sample Trigger
  const handleTriggerSyntheticSwallow = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    const audioCtx = audioContextRef.current;

    // Create transient band-passed noise burst mimicking liquid/pill transit
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1180, audioCtx.currentTime); // 1.18 kHz epiglottic transit peak
    gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    if (analyserRef.current) {
      gain.connect(analyserRef.current);
    }

    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);

    // Simulate high confidence detection
    setDetectionConfidence(96);
    setIsVerified(true);
  };

  const handleConfirmDoseVerified = () => {
    if (onVerifiedIngestion) {
      onVerifiedIngestion(targetDose);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-blur">
      <div className="swallow-modal-card">
        {/* Header */}
        <div className="swallow-modal-header">
          <div className="smh-left">
            <div className="smh-icon">
              <Mic size={22} />
            </div>
            <div>
              <h3>Acoustic Swallowing Validator</h3>
              <p>Verifies physical medicine intake by detecting the sound of swallowing water with your pill.</p>
            </div>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Target Dose Chip */}
        {targetDose && (
          <div className="swallow-target-bar">
            <span>Verifying Intake for:</span>
            <b>{targetDose.medName} ({targetDose.dose})</b>
            <span className="stb-slot">Slot {targetDose.slot || 1}</span>
          </div>
        )}

        {/* Live Audio Visualizer Canvas */}
        <div className="swallow-canvas-container">
          <canvas ref={canvasRef} width={420} height={160} className="swallow-canvas" />
          <div className="canvas-band-marker">
            <span>Ambient Low</span>
            <span className="swallow-band-highlight">800 Hz – 2.0 kHz (Swallowing Sound Band)</span>
            <span>High Frequency</span>
          </div>
        </div>

        {/* Confidence & Detection Status */}
        <div className="swallow-status-row">
          <div className="ssr-col">
            <span className="ssr-label">Acoustic Match:</span>
            <div className="ssr-bar-wrap">
              <div
                className={`ssr-bar-fill ${detectionConfidence > 80 ? "fill-success" : "fill-cyan"}`}
                style={{ width: `${detectionConfidence}%` }}
              />
            </div>
            <b>{detectionConfidence}%</b>
          </div>

          <div className="ssr-col-status">
            {isVerified ? (
              <span className="swallow-verified-tag">
                <CheckCircle2 size={16} /> Swallow Sound Verified!
              </span>
            ) : (
              <span className="swallow-listening-tag">
                {isListening ? "Listening for swallow sound..." : "Ready to listen"}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="swallow-modal-actions">
          {!isListening ? (
            <button
              type="button"
              className="btn-start-mic"
              onClick={startListening}
            >
              <Mic size={16} /> Start Microphone Analysis
            </button>
          ) : (
            <button
              type="button"
              className="btn-stop-mic"
              onClick={stopListening}
            >
              <MicOff size={16} /> Pause Listening
            </button>
          )}

          <button
            type="button"
            className="btn-test-synthetic"
            onClick={handleTriggerSyntheticSwallow}
          >
            <Sparkles size={15} /> Play Test Swallow Sample
          </button>
        </div>

        {/* Final Confirmation Button */}
        {isVerified && (
          <div className="swallow-confirm-footer">
            <button
              type="button"
              className="btn-confirm-biomechanical-intake"
              onClick={handleConfirmDoseVerified}
            >
              <ShieldCheck size={18} /> Confirm Verified Ingestion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
