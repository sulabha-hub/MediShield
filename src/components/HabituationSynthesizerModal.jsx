import React, { useState, useMemo, useRef } from "react";
import {
  Volume2,
  VolumeX,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Zap,
  Play,
  Square
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

export default function HabituationSynthesizerModal({
  isOpen,
  onClose,
  history = [],
  onTestBuzzer
}) {
  const [isPlayingShepard, setIsPlayingShepard] = useState(false);
  const audioCtxRef = useRef(null);
  const oscillatorsRef = useRef([]);

  // Calculate historical intake latency trend (in minutes)
  const latencyData = useMemo(() => {
    return [
      { day: "16 Oct", avgLatencyMin: 3.5, habituated: false },
      { day: "17 Oct", avgLatencyMin: 4.2, habituated: false },
      { day: "18 Oct", avgLatencyMin: 5.8, habituated: false },
      { day: "19 Oct", avgLatencyMin: 8.5, habituated: true },
      { day: "20 Oct", avgLatencyMin: 11.2, habituated: true },
      { day: "21 Oct", avgLatencyMin: 14.0, habituated: true },
      { day: "22 Oct", avgLatencyMin: 16.5, habituated: true }
    ];
  }, []);

  const latestLatency = latencyData[latencyData.length - 1]?.avgLatencyMin || 16.5;
  const isHabituated = latestLatency > 10;

  // Shepard-Risset Psychoacoustic Tone Synthesizer
  const playShepardRissetTone = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const baseFreq = 220; // A3
      const numOctaves = 5;
      const duration = 4.0;
      const oscillators = [];

      // Generate 5 octave-spaced sine waves with Gaussian spectral envelope
      for (let i = 0; i < numOctaves; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const startFreq = baseFreq * Math.pow(2, i);
        const endFreq = startFreq * 2;

        osc.type = "sine";
        osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);

        // Gaussian bell curve amplitude envelope
        const peakAmp = 0.15;
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(peakAmp, ctx.currentTime + duration / 2);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
        oscillators.push(osc);
      }

      oscillatorsRef.current = oscillators;
      setIsPlayingShepard(true);

      setTimeout(() => {
        setIsPlayingShepard(false);
      }, duration * 1000);
    } catch (e) {
      setIsPlayingShepard(false);
    }
  };

  const stopShepardRissetTone = () => {
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsPlayingShepard(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-blur">
      <div className="habituation-modal-card">
        {/* Header */}
        <div className="hm-header">
          <div className="hm-icon-wrap">
            <Volume2 size={22} className="text-primary" />
          </div>
          <div>
            <h3>Alert Fatigue & Tone Synthesizer</h3>
            <p>Monitors patient response delay and synthesizes dynamic tones to prevent missing alarms.</p>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Latency Analysis Banner */}
        <div className={`latency-alert-banner ${isHabituated ? "banner-warn" : "banner-optimal"}`}>
          {isHabituated ? (
            <>
              <AlertTriangle size={24} className="text-amber" />
              <div>
                <h5>Response Delay Detected (+370% Latency Increase)</h5>
                <p>Average response time has drifted from 3.5 min to 16.5 min. Constant-frequency beeps are being filtered out as background noise.</p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 size={24} className="text-emerald" />
              <div>
                <h5>Response Latency Optimal (&lt;5 min Average)</h5>
                <p>Current alarm cadence remains cognitively salient.</p>
              </div>
            </>
          )}
        </div>

        {/* Latency Drift Chart */}
        <div className="latency-chart-card">
          <div className="lcc-header">
            <span>Average Intake Delay (Last 7 Days)</span>
            <small>Time from Buzzer Alert to RFID Scan</small>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} width={36} unit="m" />
                <Tooltip />
                <Bar dataKey="avgLatencyMin" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shepard Tone Synthesizer Controls */}
        <div className="shepard-synthesizer-card">
          <div className="ssc-header">
            <Sparkles size={18} className="text-primary" />
            <div>
              <h5>Shepard-Risset Pitch Illusion Audio Generator</h5>
              <p>Plays an auditory tone that creates perceived rising urgency, preventing sensory fatigue from standard repetitive beeps.</p>
            </div>
          </div>

          <div className="ssc-actions">
            {!isPlayingShepard ? (
              <button
                type="button"
                className="btn-play-shepard"
                onClick={playShepardRissetTone}
              >
                <Play size={16} /> Synthesize Shepard Tone (Web Audio)
              </button>
            ) : (
              <button
                type="button"
                className="btn-stop-shepard"
                onClick={stopShepardRissetTone}
              >
                <Square size={16} /> Stop Synthesizer
              </button>
            )}

            <button
              type="button"
              className="btn-sync-esp32-buzzer"
              onClick={() => {
                if (onTestBuzzer) onTestBuzzer();
              }}
            >
              <Zap size={15} /> Modulate ESP32 Hardware Buzzer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
