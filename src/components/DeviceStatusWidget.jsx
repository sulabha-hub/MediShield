import React, { useState } from "react";
import { Wifi, Thermometer, Droplets, RefreshCw, Cpu, ShieldCheck, AlertTriangle, Sliders, Volume2, Sparkles, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function DeviceStatusWidget({
  deviceConfig,
  temp,
  humidity,
  isHardwareMode,
  onToggleHardwareMode,
  onSimulateTempChange,
  onSimulateHumidityChange,
  onTestDispense,
  onTestBuzzer,
  onOpenHabituationModal,
  onNavigateTab,
  medications = [],
  telemetryData = []
}) {
  const [deviceIp] = useState(deviceConfig.ip || "192.168.1.105");
  const [unitFahrenheit, setUnitFahrenheit] = useState(false);
  const [buzzerActive, setBuzzerActive] = useState(false);

  const breachedMeds = medications.filter(m => !m.paused && (temp > m.tempMax || temp < m.tempMin || humidity > m.rhMax));
  const isEnvSafe = breachedMeds.length === 0;

  const displayTemp = unitFahrenheit
    ? (temp * 1.8 + 32).toFixed(1) + "°F"
    : `${temp}°C`;

  const handleBuzzerClick = () => {
    setBuzzerActive(true);
    if (onTestBuzzer) onTestBuzzer();
    setTimeout(() => setBuzzerActive(false), 2000);
  };

  return (
    <div className="device-telemetry-container">
      {/* Device Banner */}
      <div className="device-hero-banner">
        <div className="device-identity-col">
          <div className="device-chip-badge">
            <span className="pulse-dot-green" />
            <Cpu size={15} />
            <span>ESP32-S3 CORE</span>
          </div>
          <h3 className="device-title">Dispenser Hardware & Telemetry</h3>
          <div className="device-meta-pills">
            <span className="meta-pill">IP: {deviceIp}</span>
            <span className="meta-pill">Wi-Fi: {deviceConfig.rssi || -58} dBm</span>
            <span className="meta-pill">{deviceConfig.firmware || "v2.4.1"}</span>
          </div>
        </div>

        <div className="device-mode-switch-card">
          <button
            type="button"
            className={`btn-mode-toggle ${isHardwareMode ? "hardware-active" : "demo-active"}`}
            onClick={onToggleHardwareMode}
          >
            {isHardwareMode ? <Wifi size={16} /> : <Sliders size={16} />}
            <span>{isHardwareMode ? "Hardware Polling" : "Demo Mode"}</span>
          </button>
        </div>
      </div>

      {/* Gauges */}
      <div className="telemetry-gauges-grid">
        {/* Temperature */}
        <div className={`gauge-card ${temp > 28 ? "gauge-warn" : "gauge-optimal"}`}>
          <div className="gauge-header">
            <div className="gauge-icon-wrap temp-icon">
              <Thermometer size={20} />
            </div>
            <div className="gauge-title-col">
              <span className="gauge-label">TEMPERATURE</span>
            </div>
            <button
              className="unit-toggle-btn"
              onClick={() => setUnitFahrenheit(!unitFahrenheit)}
            >
              {unitFahrenheit ? "°F" : "°C"}
            </button>
          </div>

          <div className="gauge-value-display">
            <span className="gauge-big-num">{displayTemp}</span>
            <span className={`gauge-status-tag ${temp > 28 ? "tag-warn" : temp < 15 ? "tag-warn" : "tag-optimal"}`}>
              {temp > 28 ? "High" : temp < 15 ? "Low" : "Optimal"}
            </span>
          </div>

          <div className="gauge-footer-info">
            <span>Target: 15°C – 25°C</span>
          </div>
        </div>

        {/* Humidity */}
        <div className={`gauge-card ${humidity > 60 ? "gauge-warn" : "gauge-optimal"}`}>
          <div className="gauge-header">
            <div className="gauge-icon-wrap humidity-icon">
              <Droplets size={20} />
            </div>
            <div className="gauge-title-col">
              <span className="gauge-label">HUMIDITY</span>
            </div>
          </div>

          <div className="gauge-value-display">
            <span className="gauge-big-num">{humidity}%</span>
            <span className={`gauge-status-tag ${humidity > 60 ? "tag-warn" : "tag-optimal"}`}>
              {humidity > 60 ? "High" : "Safe"}
            </span>
          </div>

          <div className="gauge-footer-info">
            <span>Target: ≤ 60% RH</span>
          </div>
        </div>

        {/* Storage Safety */}
        <div className={`gauge-card ${!isEnvSafe ? "gauge-warn" : "gauge-safe"}`}>
          <div className="gauge-header">
            <div className="gauge-icon-wrap shield-icon">
              {isEnvSafe ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div className="gauge-title-col">
              <span className="gauge-label">CHAMBER SAFETY</span>
            </div>
          </div>

          <div className="gauge-value-display">
            <span className="gauge-big-num">{isEnvSafe ? "100%" : "Alert"}</span>
            <span className={`gauge-status-tag ${isEnvSafe ? "tag-optimal" : "tag-warn"}`}>
              {isEnvSafe ? "Safe" : "Breach"}
            </span>
          </div>

          <div className="gauge-footer-info">
            <span>{isEnvSafe ? "All slots optimal" : `${breachedMeds.length} slot breached`}</span>
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="hardware-testbench-panel">
        <div className="testbench-head">
          <div className="head-text">
            <h4>
              <Cpu size={18} /> Test & Simulation Controls
            </h4>
          </div>
        </div>

        <div className="testbench-actions-grid">
          <div className="action-control-card">
            <div className="action-icon">
              <RefreshCw size={18} />
            </div>
            <div className="action-info">
              <b>Test Dispenser</b>
              <small>Cycles servo carousel for Slot 1</small>
            </div>
            <button
              type="button"
              className="btn-tb-action"
              onClick={() => onTestDispense && onTestDispense(medications[0])}
            >
              Trigger
            </button>
          </div>

          <div className="action-control-card">
            <div className="action-icon">
              <Volume2 size={18} />
            </div>
            <div className="action-info">
              <b>Test Buzzer</b>
              <small>Simulates alert chime</small>
            </div>
            <button
              type="button"
              className={`btn-tb-action ${buzzerActive ? "btn-active-buzzer" : ""}`}
              onClick={handleBuzzerClick}
            >
              {buzzerActive ? "Beeping" : "Sound"}
            </button>
          </div>

          {onOpenHabituationModal && (
            <div className="action-control-card">
              <div className="action-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
                <Sparkles size={18} />
              </div>
              <div className="action-info">
                <b>Anti-Habituation</b>
                <small>Shepard-Risset sound engine</small>
              </div>
              <button
                type="button"
                className="btn-tb-action"
                style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}
                onClick={onOpenHabituationModal}
              >
                Synthesize
              </button>
            </div>
          )}

          <div className="action-control-card">
            <div className="action-icon temp-color">
              <Thermometer size={18} />
            </div>
            <div className="action-info">
              <b>Temperature Test</b>
            </div>
            <div className="btn-group-tight">
              <button
                type="button"
                className="btn-tb-sm"
                onClick={() => onSimulateTempChange && onSimulateTempChange(32.5)}
              >
                Spike (32.5°C)
              </button>
              <button
                type="button"
                className="btn-tb-sm-sec"
                onClick={() => onSimulateTempChange && onSimulateTempChange(22.4)}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="action-control-card">
            <div className="action-icon humidity-color">
              <Droplets size={18} />
            </div>
            <div className="action-info">
              <b>Humidity Test</b>
            </div>
            <div className="btn-group-tight">
              <button
                type="button"
                className="btn-tb-sm"
                onClick={() => onSimulateHumidityChange && onSimulateHumidityChange(72)}
              >
                Spike (72%)
              </button>
              <button
                type="button"
                className="btn-tb-sm-sec"
                onClick={() => onSimulateHumidityChange && onSimulateHumidityChange(48)}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Chart */}
      <div className="telemetry-chart-panel">
        <div className="chart-panel-header">
          <div>
            <h4>Telemetry History</h4>
          </div>
          <div className="chart-legend-row">
            <span className="legend-item">
              <span className="legend-dot temp-dot" /> Temp (°C)
            </span>
            <span className="legend-item">
              <span className="legend-dot humidity-dot" /> Humidity (%)
            </span>
          </div>
        </div>

        <div className="chart-render-wrap">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={telemetryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 80]} stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }}
              />
              <Area type="monotone" dataKey="temp" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#tempGrad)" name="Temp (°C)" />
              <Area type="monotone" dataKey="humidity" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#humGrad)" name="RH (%)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
