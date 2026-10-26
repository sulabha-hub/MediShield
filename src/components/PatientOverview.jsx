import React, { useMemo } from "react";
import { Clock, ShieldCheck, Thermometer, Droplets, CheckCircle2, AlertTriangle, ChevronRight, Cpu, Pill, Phone, Mic, Activity, FileCheck2, Sparkles } from "lucide-react";

export default function PatientOverview({
  patient,
  medications,
  history,
  temp,
  humidity,
  onNavigateTab,
  onOpenDispense,
  onTakeDose,
  onOpenSwallowModal
}) {
  const nextDose = useMemo(() => {
    const pendingDoses = history.filter(h => h.status === "pending");
    return pendingDoses.length > 0 ? pendingDoses[0] : null;
  }, [history]);

  const todayDoses = useMemo(() => {
    return history.filter(h => h.date?.toLowerCase().includes("today"));
  }, [history]);

  const stats = useMemo(() => {
    const confirmed = history.filter(h => h.status === "confirmed").length;
    const taken = history.filter(h => h.status === "taken").length;
    const missed = history.filter(h => h.status === "missed").length;
    const total = confirmed + taken + missed;
    const rate = total > 0 ? Math.round(((confirmed + taken) / total) * 100) : 100;
    return { rate, completed: confirmed + taken, total };
  }, [history]);

  const targetMed = useMemo(() => {
    if (!nextDose) return medications[0] || null;
    return medications.find(m => m.id === nextDose.medId) || medications[0] || null;
  }, [nextDose, medications]);

  return (
    <div className="patient-overview-container">
      {/* Hero: Next Due Medication Banner */}
      <div className="patient-hero-card">
        <div className="hero-left-col">
          <div className="hero-status-pill">
            <span className="live-pulse-cyan" />
            <Clock size={14} />
            <span>NEXT DOSE</span>
          </div>

          {nextDose ? (
            <>
              <h2 className="hero-med-title">
                {nextDose.medName} <span className="hero-med-strength">{nextDose.dose}</span>
              </h2>
              <p className="hero-timing-text">
                <b>{nextDose.scheduledTime}</b> today • Slot {nextDose.slot || 1}
              </p>
              {targetMed?.instructions && (
                <div className="hero-instruction-chip">
                  {targetMed.instructions}
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="hero-med-title">All Doses Complete</h2>
              <p className="hero-timing-text">Next medication cycle starts tomorrow morning.</p>
            </>
          )}

          <div className="hero-cta-buttons">
            {nextDose && (
              <>
                <button
                  type="button"
                  className="btn-hero-dispense"
                  onClick={() => onOpenDispense(targetMed)}
                >
                  <Cpu size={18} /> Dispense Now
                </button>
                <button
                  type="button"
                  className="btn-hero-taken"
                  onClick={() => onTakeDose(nextDose.id)}
                >
                  <CheckCircle2 size={17} /> Mark Taken
                </button>
                {onOpenSwallowModal && (
                  <button
                    type="button"
                    className="btn-hero-swallow"
                    onClick={() => onOpenSwallowModal(nextDose)}
                    title="Acoustic Swallowing Ingestion Validator"
                    style={{
                      background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                      color: "#ffffff",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      padding: "10px 18px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: "700"
                    }}
                  >
                    <Mic size={16} /> Verify Ingestion
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              className="btn-hero-schedules"
              onClick={() => onNavigateTab("Schedules")}
            >
              All Schedules <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Carousel Visual */}
        <div className="hero-right-widget">
          <div className="hardware-carousel-ring">
            <div className="ring-center-core">
              <Pill size={30} color="#0ea5e9" />
              <span className="core-slot-num">Slot {nextDose?.slot || 1}</span>
            </div>
            {[1, 2, 3, 4].map(s => {
              const hasMed = medications.find(m => m.slot === s && !m.paused);
              const isCurrent = (nextDose?.slot || 1) === s;
              return (
                <div
                  key={s}
                  className={`carousel-slot-pip pip-${s} ${isCurrent ? "current" : hasMed ? "loaded" : "empty"}`}
                  title={`Slot ${s}: ${hasMed ? hasMed.name : "Empty"}`}
                >
                  <span>S{s}</span>
                </div>
              );
            })}
          </div>
          <div className="dispenser-ready-tag">
            <ShieldCheck size={13} /> Dispenser Ready
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="patient-quick-metrics-grid">
        <div className="p-stat-card">
          <div className="p-stat-top">
            <span className="p-stat-title">ADHERENCE</span>
            <div className="p-stat-icon-wrap text-emerald">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="p-stat-big text-emerald">{stats.rate}%</div>
          <div className="p-stat-sub">
            {stats.completed} of {stats.total} taken
          </div>
        </div>

        <div className="p-stat-card" onClick={() => onNavigateTab("Device")} style={{ cursor: "pointer" }}>
          <div className="p-stat-top">
            <span className="p-stat-title">TEMPERATURE</span>
            <div className="p-stat-icon-wrap text-sky">
              <Thermometer size={18} />
            </div>
          </div>
          <div className="p-stat-big text-sky">{temp}°C</div>
          <div className="p-stat-sub">
            {temp > 28 ? "⚠️ High" : "Optimal (18–25°C)"}
          </div>
        </div>

        <div className="p-stat-card" onClick={() => onNavigateTab("Device")} style={{ cursor: "pointer" }}>
          <div className="p-stat-top">
            <span className="p-stat-title">HUMIDITY</span>
            <div className="p-stat-icon-wrap text-teal">
              <Droplets size={18} />
            </div>
          </div>
          <div className="p-stat-big text-teal">{humidity}% RH</div>
          <div className="p-stat-sub">
            {humidity > 60 ? "⚠️ High" : "Safe (<60%)"}
          </div>
        </div>

        <div className="p-stat-card" onClick={() => onNavigateTab("Schedules")} style={{ cursor: "pointer" }}>
          <div className="p-stat-top">
            <span className="p-stat-title">MEDICATIONS</span>
            <div className="p-stat-icon-wrap text-purple">
              <Pill size={18} />
            </div>
          </div>
          <div className="p-stat-big text-purple">
            {medications.filter(m => !m.paused).length} Active
          </div>
          <div className="p-stat-sub">
            {medications.filter(m => m.paused).length} paused
          </div>
        </div>
      </div>

      {/* Frontier Novelty Features Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", margin: "4px 0 10px 0" }}>
        <div
          onClick={() => onNavigateTab("Bio-Intelligence")}
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
            border: "1px solid #bae6fd",
            borderRadius: "var(--radius-lg)",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
            transition: "all 0.2s ease"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#0284c7", background: "#e0f2fe", padding: "2px 8px", borderRadius: "9999px" }}>NOVELTY ENGINE</span>
                <b style={{ fontSize: "15px", color: "var(--text-main)" }}>Bio-Intelligence Simulator</b>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                In-Silico PK/PD Plasma Curves & Arrhenius Chemical Potency Twin
              </p>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: "#0284c7" }} />
        </div>

        <div
          onClick={() => onNavigateTab("Trust & Audit")}
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)",
            border: "1px solid #a7f3d0",
            borderRadius: "var(--radius-lg)",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
            transition: "all 0.2s ease"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#dcfce7", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileCheck2 size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#059669", background: "#dcfce7", padding: "2px 8px", borderRadius: "9999px" }}>AIR-GAPPED TRUST</span>
                <b style={{ fontSize: "15px", color: "var(--text-main)" }}>Optical Fountain & Escrow</b>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                Animated QR video fountain & ZK-SNARK privacy credentials
              </p>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: "#059669" }} />
        </div>
      </div>

      {/* Main Grid: Today's Timeline + Contacts */}
      <div className="patient-content-grid">
        {/* Left: Today's Schedule */}
        <div className="p-panel today-timeline-panel">
          <div className="panel-header-between">
            <div>
              <h3 className="panel-title">Today's Schedule</h3>
            </div>
            <button
              type="button"
              className="btn-header-link"
              onClick={() => onNavigateTab("Dose History")}
            >
              History <ChevronRight size={14} />
            </button>
          </div>

          <div className="today-doses-list">
            {todayDoses.length === 0 ? (
              <p className="empty-subtext">No doses scheduled for today.</p>
            ) : (
              todayDoses.map(dose => (
                <div key={dose.id} className={`timeline-dose-row status-${dose.status}`}>
                  <div className="timeline-time-col">
                    <span className="timeline-time-badge">{dose.scheduledTime}</span>
                    <span className="timeline-slot-pill">Slot {dose.slot || 1}</span>
                  </div>

                  <div className="timeline-med-col">
                    <b className="timeline-med-name">{dose.medName}</b>
                    <span className="timeline-med-dose">{dose.dose}</span>
                  </div>

                  <div className="timeline-status-col">
                    {dose.status === "confirmed" && (
                      <span className="dose-status-badge badge-confirmed">
                        <ShieldCheck size={12} /> Confirmed
                      </span>
                    )}
                    {dose.status === "taken" && (
                      <span className="dose-status-badge badge-taken">
                        <CheckCircle2 size={12} /> Taken
                      </span>
                    )}
                    {dose.status === "pending" && (
                      <div className="pending-actions-wrap">
                        <span className="dose-status-badge badge-pending">Pending</span>
                        <button
                          type="button"
                          className="btn-take-now-sm"
                          onClick={() => onTakeDose(dose.id)}
                        >
                          Take
                        </button>
                      </div>
                    )}
                    {dose.status === "missed" && (
                      <span className="dose-status-badge badge-missed">
                        <AlertTriangle size={12} /> Missed
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Doctor Notes & Contacts */}
        <div className="patient-right-column">
          <div className="p-panel doctor-instruction-card">
            <div className="panel-header-between">
              <h3 className="panel-title">Doctor's Guidance</h3>
              <span className="doctor-badge-tiny">Apollo Clinic</span>
            </div>
            <p className="doctor-notes-quote">
              "{patient.doctorNotes || "Take all medications on schedule with plenty of water."}"
            </p>
            <div className="physician-signature-row">
              <div className="doc-avatar">Dr</div>
              <div>
                <b>{patient.primaryPhysician}</b>
              </div>
            </div>
          </div>

          <div className="p-panel quick-contacts-card">
            <h3 className="panel-title">Quick Contacts</h3>
            <div className="contacts-list">
              <div className="contact-item">
                <div className="contact-icon-box">
                  <Phone size={15} />
                </div>
                <div className="contact-details">
                  <b>Clinic</b>
                  <p>{patient.clinicPhone}</p>
                </div>
                <a href={`tel:${patient.clinicPhone}`} className="contact-call-btn">
                  Call
                </a>
              </div>

              <div className="contact-item">
                <div className="contact-icon-box">
                  <Phone size={15} />
                </div>
                <div className="contact-details">
                  <b>Pharmacy</b>
                  <p>{patient.pharmacyPhone}</p>
                </div>
                <a href={`tel:${patient.pharmacyPhone}`} className="contact-call-btn">
                  Call
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
