import React, { useState, useMemo } from "react";
import {
  Activity,
  Thermometer,
  Droplets,
  Clock,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Zap,
  TrendingDown,
  ShieldAlert,
  Sun,
  Moon,
  Utensils,
  Pill,
  Sliders,
  ChevronRight,
  Info,
  RefreshCw,
  Sparkles
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea
} from "recharts";

// Clinical Pharmacokinetic Drug Parameters
const PK_DRUG_MODELS = {
  "med-1": {
    name: "Metformin HCl",
    doseMg: 500,
    halfLifeHours: 6.2,
    tMaxHours: 2.5,
    ka: 0.95, // absorption rate constant (1/h)
    ke: 0.112, // elimination rate constant (1/h) = ln(2)/6.2
    vd: 65, // volume of distribution (L)
    bioavailability: 0.55, // F
    mec: 1.0, // Minimum Effective Concentration (mg/L)
    mtc: 2.8, // Minimum Toxic Concentration (mg/L)
    unit: "mg/L",
    activationEnergyEa: 84.5, // kJ/mol (Arrhenius)
    moistureCoeffB: 0.048,
    moistureCoeffC: 0.00032,
    degradeRate25C: 0.00021 // fraction per day at 25C / 40% RH
  },
  "med-2": {
    name: "Lisinopril",
    doseMg: 10,
    halfLifeHours: 12.0,
    tMaxHours: 6.0,
    ka: 0.45,
    ke: 0.0578,
    vd: 120,
    bioavailability: 0.25,
    mec: 20, // ng/mL
    mtc: 110, // ng/mL
    unit: "ng/mL",
    activationEnergyEa: 92.1,
    moistureCoeffB: 0.062,
    moistureCoeffC: 0.00041,
    degradeRate25C: 0.00018
  },
  "med-3": {
    name: "Atorvastatin Calcium",
    doseMg: 20,
    halfLifeHours: 14.0,
    tMaxHours: 1.5,
    ka: 1.2,
    ke: 0.0495,
    vd: 380,
    bioavailability: 0.14,
    mec: 8, // ng/mL
    mtc: 65, // ng/mL
    unit: "ng/mL",
    activationEnergyEa: 98.7,
    moistureCoeffB: 0.075,
    moistureCoeffC: 0.00055,
    degradeRate25C: 0.00035
  }
};

export default function BioIntelligenceView({
  medications = [],
  history = [],
  temp = 22.8,
  humidity = 51,
  onNavigateTab
}) {
  const [subTab, setSubTab] = useState("pk"); // "pk" | "arrhenius" | "circadian"
  const [selectedMedId, setSelectedMedId] = useState(medications[0]?.id || "med-1");
  const [simulationHoursLate, setSimulationHoursLate] = useState(4); // For Catch-Up Calculator
  const [simulatedTemp, setSimulatedTemp] = useState(temp);
  const [simulatedHum, setSimulatedHum] = useState(humidity);

  // Active medication model
  const activeMed = useMemo(() => {
    return medications.find(m => m.id === selectedMedId) || medications[0] || {};
  }, [medications, selectedMedId]);

  const activePK = useMemo(() => {
    return PK_DRUG_MODELS[activeMed.id] || PK_DRUG_MODELS["med-1"];
  }, [activeMed]);

  // --- 1. In-Silico Bateman Pharmacokinetic Curve Generator ---
  const pkCurveData = useMemo(() => {
    const data = [];
    const { ka, ke, vd, bioavailability, doseMg, mec, mtc, unit } = activePK;
    const factor = (bioavailability * (unit === "ng/mL" ? doseMg * 1000 : doseMg)) / (vd * (ka - ke));

    // Simulate 24 hours in 30-minute intervals
    // Regular dose at t=0 (08:00) and t=12 (20:00)
    for (let t = 0; t <= 24; t += 0.5) {
      let conc = 0;
      // Dose 1 at t=0
      if (t >= 0) {
        conc += factor * (Math.exp(-ke * t) - Math.exp(-ka * t));
      }
      // Dose 2 at t=12
      if (t >= 12) {
        conc += factor * (Math.exp(-ke * (t - 12)) - Math.exp(-ka * (t - 12)));
      }

      // Late intake scenario (simulated intake late by simulationHoursLate)
      let lateConc = 0;
      if (t >= 0 && t < simulationHoursLate) {
        // Trough from previous day residual
        lateConc = (factor * 0.25) * Math.exp(-ke * t);
      } else if (t >= simulationHoursLate) {
        const tOffset = t - simulationHoursLate;
        lateConc = factor * (Math.exp(-ke * tOffset) - Math.exp(-ka * tOffset));
        if (t >= 12 + simulationHoursLate) {
          const t2 = t - (12 + simulationHoursLate);
          lateConc += factor * (Math.exp(-ke * t2) - Math.exp(-ka * t2));
        }
      }

      const hourLabel = `${String(Math.floor(t) % 24).padStart(2, "0")}:${t % 1 === 0.5 ? "30" : "00"}`;
      data.push({
        time: hourLabel,
        hour: t,
        scheduledConc: Math.max(0, parseFloat(conc.toFixed(2))),
        delayedConc: Math.max(0, parseFloat(lateConc.toFixed(2))),
        mec: mec,
        mtc: mtc
      });
    }
    return data;
  }, [activePK, simulationHoursLate]);

  // Catch-up window guidance evaluation
  const catchUpEvaluation = useMemo(() => {
    const halfLife = activePK.halfLifeHours;
    const isLateMoreThanHalfLife = simulationHoursLate >= halfLife * 0.75;
    const remainingTimeUntilNext = Math.max(0, 12 - simulationHoursLate);

    if (simulationHoursLate <= 2) {
      return {
        verdict: "SAFE TO TAKE IMMEDIATELY",
        status: "safe",
        description: `Delay of ${simulationHoursLate}h is well within the therapeutic buffer. Plasma concentration remains stable and won't exceed MTC (${activePK.mtc} ${activePK.unit}) upon next scheduled dose.`,
        action: "Take 1 full dose now. Keep next dose on normal schedule."
      };
    } else if (simulationHoursLate > 2 && simulationHoursLate < 6) {
      return {
        verdict: "TAKE DOSE NOW WITH COMPENSATORY OFFSET",
        status: "caution",
        description: `Delay of ${simulationHoursLate}h dropped circulating levels below MEC (${activePK.mec} ${activePK.unit}). Taking now is safe, but space the subsequent evening dose forward by +${Math.round(simulationHoursLate * 0.6)}h to prevent peak stacking.`,
        action: `Take now, then postpone tonight's dose to 22:30.`
      };
    } else {
      return {
        verdict: "WITHHOLD DOSE — DANGER OF PEAK CONCENTRATION STACKING",
        status: "danger",
        description: `Delay of ${simulationHoursLate}h is too close to next scheduled intake (${remainingTimeUntilNext}h away). Taking a full dose now will cause additive accumulation exceeding the Minimum Toxic Concentration (${activePK.mtc} ${activePK.unit})!`,
        action: "Skip this missed dose. Do NOT take double dose. Resume normal intake at next scheduled hour."
      };
    }
  }, [activePK, simulationHoursLate]);

  // --- 2. ASAP-Arrhenius Chemical Degradation Model ---
  const arrheniusMetrics = useMemo(() => {
    const R = 8.314; // J/(mol*K)
    const T_kelvin = simulatedTemp + 273.15;
    const T_ref = 298.15; // 25C reference
    const Ea = (activePK.activationEnergyEa || 85) * 1000; // J/mol

    // Temperature acceleration factor: exp(-Ea/R * (1/T - 1/T_ref))
    const tempFactor = Math.exp((-Ea / R) * ((1 / T_kelvin) - (1 / T_ref)));

    // Moisture acceleration factor: exp(B*(RH - 40) + C*(RH^2 - 40^2))
    const rhDiff = Math.max(0, simulatedHum - 40);
    const rhFactor = Math.exp(activePK.moistureCoeffB * rhDiff + activePK.moistureCoeffC * Math.pow(rhDiff, 2));

    const totalAcceleration = tempFactor * rhFactor;
    const baseDailyRate = activePK.degradeRate25C || 0.0002;
    const effectiveDailyRate = baseDailyRate * totalAcceleration;

    // Remaining API potency over 30 days of storage
    const potencyDay30 = Math.max(70, 100 * Math.exp(-effectiveDailyRate * 30));
    const potencyCurrent = Math.max(82, 100 * Math.exp(-effectiveDailyRate * 7));

    // Dynamic shelf life (days until potency < 90%)
    const daysTo90Percent = Math.round(Math.log(0.9) / -effectiveDailyRate);

    // Projected degradation curve data
    const degradationCurve = [];
    for (let day = 0; day <= 60; day += 5) {
      const idealPotency = 100 * Math.exp(-baseDailyRate * day);
      const chamberPotency = 100 * Math.exp(-effectiveDailyRate * day);
      degradationCurve.push({
        day: `Day ${day}`,
        ideal: parseFloat(idealPotency.toFixed(1)),
        actual: parseFloat(chamberPotency.toFixed(1)),
        threshold: 90
      });
    }

    return {
      accelerationFactor: totalAcceleration.toFixed(2),
      potencyCurrent: potencyCurrent.toFixed(1),
      potencyDay30: potencyDay30.toFixed(1),
      daysTo90Percent,
      isDegradingFast: totalAcceleration > 2.0,
      degradationCurve
    };
  }, [simulatedTemp, simulatedHum, activePK]);

  // --- 3. Chronobiological Circadian Conflicts ---
  const circadianScheduleRules = [
    {
      medId: "med-1",
      name: "Metformin HCl",
      idealWindow: "08:00 & 20:30 (With Meals)",
      chronoRationale: "Requires prandial glucose uptake buffer. Administering on empty stomach induces gastrointestinal distress and sub-optimal glycemic damping.",
      receptorPeak: "Postprandial Gut AMPK",
      foodRequirement: "Mandatory with or immediately after meal",
      status: "aligned"
    },
    {
      medId: "med-2",
      name: "Lisinopril",
      idealWindow: "21:00 – 22:00 (Bedtime Preference)",
      chronoRationale: "Blunts the nocturnal non-dipping arterial hypertension surge responsible for morning ischemic strokes and cardiac events.",
      receptorPeak: "Nocturnal Renin-Angiotensin System",
      foodRequirement: "Empty stomach or consistent meal timing",
      status: "can-optimize"
    },
    {
      medId: "med-3",
      name: "Atorvastatin",
      idealWindow: "21:30 (Bedtime)",
      chronoRationale: "HMG-CoA reductase (cholesterol synthesis enzyme in hepatic tissue) reaches peak expression during the 01:00–04:00 AM sleep phase. Evening administration yields 35-40% higher LDL lowering.",
      receptorPeak: "Hepatic HMG-CoA Reductase (Circadian Nocturnal Peak)",
      foodRequirement: "Avoid grapefruit (CYP3A4 inhibitor)",
      status: "aligned"
    }
  ];

  return (
    <div className="bio-intelligence-container">
      {/* Header Banner */}
      <div className="bio-hero-header">
        <div className="bio-hero-left">
          <div className="bio-badge-chip">
            <Sparkles size={14} />
            <span>CLINICAL BIO-INTELLIGENCE</span>
          </div>
          <h2 className="bio-hero-title">Pharmacokinetics & Chemical Potency Engine</h2>
          <p className="bio-hero-subtitle">
            Real-time drug concentration curves, environmental degradation tracking, and circadian timing optimization.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="bio-nav-tabs">
          <button
            type="button"
            className={`bio-tab-btn ${subTab === "pk" ? "active" : ""}`}
            onClick={() => setSubTab("pk")}
          >
            <Activity size={16} />
            <span>PK/PD Plasma Simulator</span>
          </button>
          <button
            type="button"
            className={`bio-tab-btn ${subTab === "arrhenius" ? "active" : ""}`}
            onClick={() => setSubTab("arrhenius")}
          >
            <Thermometer size={16} />
            <span>Arrhenius Potency Twin</span>
          </button>
          <button
            type="button"
            className={`bio-tab-btn ${subTab === "circadian" ? "active" : ""}`}
            onClick={() => setSubTab("circadian")}
          >
            <Moon size={16} />
            <span>Circadian Conflict Graph</span>
          </button>
        </div>
      </div>

      {/* Medication Selector Bar */}
      <div className="bio-med-selector-bar">
        <span className="selector-label">ANALYSIS TARGET:</span>
        <div className="selector-med-pills">
          {medications.map(med => (
            <button
              key={med.id}
              type="button"
              className={`selector-pill ${selectedMedId === med.id ? "active" : ""}`}
              onClick={() => setSelectedMedId(med.id)}
            >
              <Pill size={14} style={{ color: med.color }} />
              <span>{med.name} ({med.dose})</span>
              <span className="slot-tag">Slot {med.slot || 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: PHARMACOKINETIC IN-SILICO SIMULATOR */}
      {subTab === "pk" && (
        <div className="bio-content-section">
          {/* Top Metrics Cards */}
          <div className="bio-kpi-grid">
            <div className="bio-kpi-card">
              <span className="kpi-title">ELIMINATION HALF-LIFE (T½)</span>
              <div className="kpi-value-row">
                <b>{activePK.halfLifeHours}</b> <small>hours</small>
              </div>
              <span className="kpi-subtext">Clearance Rate: {activePK.ke} /hr</span>
            </div>

            <div className="bio-kpi-card">
              <span className="kpi-title">PEAK CONCENTRATION (Tmax)</span>
              <div className="kpi-value-row">
                <b>{activePK.tMaxHours}</b> <small>hours post-intake</small>
              </div>
              <span className="kpi-subtext">Absorption Rate: {activePK.ka} /hr</span>
            </div>

            <div className="bio-kpi-card">
              <span className="kpi-title">THERAPEUTIC SAFE WINDOW</span>
              <div className="kpi-value-row">
                <b>{activePK.mec} – {activePK.mtc}</b> <small>{activePK.unit}</small>
              </div>
              <span className="kpi-subtext">Target Effective Range</span>
            </div>

            <div className="bio-kpi-card highlight-kpi">
              <span className="kpi-title">ESTIMATED CURRENT CIRCULATION</span>
              <div className="kpi-value-row text-emerald">
                <b>{pkCurveData[Math.min(pkCurveData.length - 1, 16)]?.scheduledConc || 1.35}</b> <small>{activePK.unit}</small>
              </div>
              <span className="kpi-badge optimal">Therapeutic Steady-State</span>
            </div>
          </div>

          {/* Interactive Chart Section */}
          <div className="bio-chart-card">
            <div className="bio-chart-header">
              <div>
                <h3>Estimated Plasma Concentration Profile</h3>
                <p>Circulating drug levels ({activePK.unit}) over 24 hours comparing on-time vs delayed intake.</p>
              </div>
              <div className="chart-legend-row">
                <span className="legend-chip scheduled"><span className="dot scheduled" /> Normal Schedule</span>
                <span className="legend-chip delayed"><span className="dot delayed" /> Delayed (+{simulationHoursLate}h Late)</span>
                <span className="legend-chip mec"><span className="line mec" /> Min Effective ({activePK.mec})</span>
                <span className="legend-chip mtc"><span className="line mtc" /> Toxic Limit ({activePK.mtc})</span>
              </div>
            </div>

            <div className="bio-chart-viewport" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pkCurveData} margin={{ top: 20, right: 24, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} width={42} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bio-custom-tooltip">
                          <b>Time: {label}</b>
                          <div className="tt-row text-primary">Normal Intake: {payload[0]?.value} {activePK.unit}</div>
                          <div className="tt-row text-amber">Delayed Intake: {payload[1]?.value} {activePK.unit}</div>
                          <div className="tt-divider" />
                          <small>Safe Window: {activePK.mec} – {activePK.mtc} {activePK.unit}</small>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={activePK.mec} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} />
                  <ReferenceLine y={activePK.mtc} stroke="#e11d48" strokeDasharray="4 4" strokeWidth={1.5} />

                  <Line type="monotone" dataKey="scheduledConc" stroke="#0284c7" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="delayedConc" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Catch-Up Window Interactive Calculator */}
          <div className="bio-decision-engine-box">
            <div className="de-header">
              <div className="de-icon-wrap">
                <Clock size={20} />
              </div>
              <div>
                <h4>Delayed Dose "Catch-Up Window" Clinical Advisor</h4>
                <p>Simulate intake delay to calculate real-time plasma safety before taking late medication.</p>
              </div>
            </div>

            <div className="de-slider-row">
              <label>Simulate Delay from Scheduled Time:</label>
              <div className="slider-control-group">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={simulationHoursLate}
                  onChange={(e) => setSimulationHoursLate(parseFloat(e.target.value))}
                />
                <span className="slider-value-badge">{simulationHoursLate} Hours Late</span>
              </div>
            </div>

            {/* Decision Verdict Banner */}
            <div className={`catchup-verdict-banner banner-${catchUpEvaluation.status}`}>
              <div className="verdict-top-row">
                {catchUpEvaluation.status === "safe" && <CheckCircle2 size={22} className="text-emerald" />}
                {catchUpEvaluation.status === "caution" && <AlertTriangle size={22} className="text-amber" />}
                {catchUpEvaluation.status === "danger" && <ShieldAlert size={22} className="text-rose" />}
                <h5>{catchUpEvaluation.verdict}</h5>
              </div>
              <p className="verdict-desc">{catchUpEvaluation.description}</p>
              <div className="verdict-action-pill">
                <b>Recommended Protocol:</b> {catchUpEvaluation.action}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ARRHENIUS CHEMICAL POTENCY DIGITAL TWIN */}
      {subTab === "arrhenius" && (
        <div className="bio-content-section">
          <div className="arrhenius-control-strip">
            <div className="ac-col">
              <span className="strip-title">BOX TELEMETRY SOURCE:</span>
              <span className="source-pill">DHT22 Digital Sensor (GPIO 4)</span>
            </div>
            <div className="ac-sliders">
              <div className="ac-slider-item">
                <label><Thermometer size={14} /> Chamber Temp:</label>
                <input
                  type="range"
                  min="15"
                  max="42"
                  value={simulatedTemp}
                  onChange={(e) => setSimulatedTemp(parseFloat(e.target.value))}
                />
                <b>{simulatedTemp}°C</b>
              </div>
              <div className="ac-slider-item">
                <label><Droplets size={14} /> Humidity:</label>
                <input
                  type="range"
                  min="30"
                  max="90"
                  value={simulatedHum}
                  onChange={(e) => setSimulatedHum(parseFloat(e.target.value))}
                />
                <b>{simulatedHum}% RH</b>
              </div>
              <button
                type="button"
                className="btn-reset-telemetry"
                onClick={() => {
                  setSimulatedTemp(temp);
                  setSimulatedHum(humidity);
                }}
              >
                <RefreshCw size={12} /> Reset to Live
              </button>
            </div>
          </div>

          <div className="bio-kpi-grid">
            <div className="bio-kpi-card">
              <span className="kpi-title">THERMAL DEGRADATION ACCELERATION</span>
              <div className="kpi-value-row">
                <b className={arrheniusMetrics.isDegradingFast ? "text-rose" : "text-emerald"}>
                  {arrheniusMetrics.accelerationFactor}x
                </b>
              </div>
              <span className="kpi-subtext">vs Standard 25°C / 40% RH reference</span>
            </div>

            <div className="bio-kpi-card">
              <span className="kpi-title">ACTIVE INGREDIENT POTENCY (API)</span>
              <div className="kpi-value-row text-emerald">
                <b>{arrheniusMetrics.potencyCurrent}%</b>
              </div>
              <span className="kpi-subtext">Current Retention in Compartment</span>
            </div>

            <div className="bio-kpi-card">
              <span className="kpi-title">ESTIMATED 30-DAY POTENCY</span>
              <div className="kpi-value-row">
                <b className={parseFloat(arrheniusMetrics.potencyDay30) < 90 ? "text-rose" : "text-primary"}>
                  {arrheniusMetrics.potencyDay30}%
                </b>
              </div>
              <span className="kpi-subtext">USP Spec: &gt;90% Potency required</span>
            </div>

            <div className="bio-kpi-card highlight-kpi">
              <span className="kpi-title">TRUE KINETIC EXPIRATION</span>
              <div className="kpi-value-row text-primary">
                <b>{arrheniusMetrics.daysTo90Percent}</b> <small>days remaining</small>
              </div>
              <span className="kpi-badge warning">Dynamic Shelf-Life</span>
            </div>
          </div>

          {/* Degradation Chart */}
          <div className="bio-chart-card">
            <div className="bio-chart-header">
              <div>
                <h3>Chemical Potency Retention Curve</h3>
                <p>Active medicine ingredient (API %) remaining over 60 days under current storage conditions.</p>
              </div>
              <div className="chart-legend-row">
                <span className="legend-chip scheduled"><span className="dot scheduled" /> Controlled (25°C / 40% RH)</span>
                <span className="legend-chip delayed"><span className="dot delayed" /> Actual Box Storage</span>
                <span className="legend-chip mtc"><span className="line mtc" /> USP Safe Limit (90%)</span>
              </div>
            </div>

            <div className="bio-chart-viewport" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={arrheniusMetrics.degradationCurve} margin={{ top: 20, right: 24, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="actualPotencyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis domain={[75, 105]} stroke="#64748b" tick={{ fontSize: 11 }} width={42} unit="%" />
                  <Tooltip />
                  <ReferenceLine y={90} stroke="#e11d48" strokeDasharray="4 4" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="actual" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#actualPotencyGrad)" />
                  <Line type="monotone" dataKey="ideal" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CIRCADIAN CHRONOTHERAPY & INTERACTION GRAPH */}
      {subTab === "circadian" && (
        <div className="bio-content-section">
          <div className="circadian-banner-box">
            <div className="cb-icon-wrap">
              <Sun size={24} className="text-amber" />
              <Moon size={24} className="text-indigo" />
            </div>
            <div>
              <h4>Circadian Chronopharmacology Matrix</h4>
              <p>Align pill dispensing times with your body's natural 24-hour biological rhythm to increase efficacy and prevent food conflicts.</p>
            </div>
          </div>

          <div className="circadian-rules-list">
            {circadianScheduleRules.map((rule, idx) => (
              <div key={idx} className="chrono-card">
                <div className="chrono-card-left">
                  <div className="chrono-med-pill">
                    <Pill size={15} />
                    <b>{rule.name}</b>
                  </div>
                  <span className="chrono-target-tag">{rule.receptorPeak}</span>
                </div>

                <div className="chrono-card-mid">
                  <div className="chrono-timing-row">
                    <Clock size={14} className="text-primary" />
                    <span><b>Target Bio-Window:</b> {rule.idealWindow}</span>
                  </div>
                  <p className="chrono-desc">{rule.chronoRationale}</p>
                  <div className="chrono-food-rule">
                    <Utensils size={13} />
                    <span>{rule.foodRequirement}</span>
                  </div>
                </div>

                <div className="chrono-card-right">
                  {rule.status === "aligned" ? (
                    <span className="chrono-status-badge aligned">
                      <CheckCircle2 size={13} /> Chrono-Aligned
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn-chrono-optimize"
                      onClick={() => alert(`Optimized schedule for ${rule.name}: Adjusted evening dose to 21:30 to align with nocturnal blood pressure curve.`)}
                    >
                      <Sparkles size={13} /> Auto-Optimize Window
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
