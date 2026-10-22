import React, { useState, useMemo } from "react";
import { Stethoscope, User, ShieldCheck, AlertTriangle, Pill, Thermometer, Plus, Edit3, Pause, Play, FileText, Printer, Check } from "lucide-react";
import { ResponsiveContainer, CartesianGrid, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function DoctorDashboard({
  patient,
  medications,
  history,
  temp,
  humidity,
  onUpdatePatientNotes,
  onAddPrescription,
  onEditPrescription,
  onTogglePausePrescription
}) {
  const [activeDocTab, setActiveDocTab] = useState("overview");
  const [notesInput, setNotesInput] = useState(patient.doctorNotes || "");
  const [notesSaved, setNotesSaved] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const stats = useMemo(() => {
    const total = history.length;
    const confirmed = history.filter(h => h.status === "confirmed").length;
    const taken = history.filter(h => h.status === "taken").length;
    const missed = history.filter(h => h.status === "missed").length;
    const pastCompleted = confirmed + taken;
    const pastTotal = pastCompleted + missed;
    const adherenceRate = pastTotal > 0 ? Math.round((pastCompleted / pastTotal) * 100) : 100;

    return { total, confirmed, taken, missed, adherenceRate };
  }, [history]);

  const missedDoses = useMemo(() => {
    return history.filter(h => h.status === "missed");
  }, [history]);

  const handleSaveNotes = (e) => {
    e.preventDefault();
    onUpdatePatientNotes(notesInput);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2500);
  };

  const chartData = [
    { day: "16 Oct", taken: 3, missed: 0 },
    { day: "17 Oct", taken: 4, missed: 0 },
    { day: "18 Oct", taken: 3, missed: 0 },
    { day: "19 Oct", taken: 4, missed: 0 },
    { day: "20 Oct", taken: 3, missed: 0 },
    { day: "21 Oct", taken: 3, missed: 1 },
    { day: "22 Oct", taken: 2, missed: 0 }
  ];

  return (
    <div className="doctor-portal-wrapper">
      {/* Patient Header */}
      <div className="doctor-patient-banner">
        <div className="patient-avatar-box">
          <User size={28} />
        </div>

        <div className="patient-main-meta">
          <div className="patient-top-name-row">
            <h2>{patient.name}</h2>
            <span className="patient-id-badge">{patient.patientId}</span>
            <span className="status-clinical-tag">Active Monitoring</span>
          </div>

          <div className="patient-demographics">
            <span>{patient.age} yrs</span>
            <span>•</span>
            <span>{patient.gender}</span>
            <span>•</span>
            <span>Blood Group: {patient.bloodGroup}</span>
          </div>

          <div className="patient-medical-tags">
            <div className="tag-group">
              <span className="tag-label">Conditions:</span>
              {patient.conditions.map((c, i) => (
                <span key={i} className="condition-chip">{c}</span>
              ))}
            </div>

            <div className="tag-group">
              <span className="tag-label text-rose">Allergies:</span>
              {patient.allergies.map((a, i) => (
                <span key={i} className="allergy-chip">{a}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="doctor-banner-actions">
          <button
            type="button"
            className="btn-print-report"
            onClick={() => setShowReportModal(true)}
          >
            <Printer size={15} /> Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="doctor-subnav-tabs">
        {[
          { id: "overview", label: "Overview", icon: ShieldCheck },
          { id: "prescriptions", label: "Prescriptions", icon: Pill },
          { id: "env_audit", label: "Hardware Audit", icon: Thermometer },
          { id: "notes", label: "Clinical Notes", icon: FileText }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`doc-subnav-btn ${activeDocTab === t.id ? "active" : ""}`}
              onClick={() => setActiveDocTab(t.id)}
            >
              <Icon size={16} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeDocTab === "overview" && (
        <div className="doc-tab-content">
          <div className="doc-kpis-grid">
            <div className="doc-kpi-card">
              <span className="kpi-label">ADHERENCE RATE</span>
              <div className="kpi-value text-emerald">{stats.adherenceRate}%</div>
            </div>

            <div className="doc-kpi-card">
              <span className="kpi-label">CONFIRMED (IR DROP)</span>
              <div className="kpi-value text-sky">{stats.confirmed}</div>
            </div>

            <div className="doc-kpi-card">
              <span className="kpi-label">PATIENT REPORTED</span>
              <div className="kpi-value text-purple">{stats.taken}</div>
            </div>

            <div className={`doc-kpi-card ${stats.missed > 0 ? "kpi-alert-rose" : ""}`}>
              <span className="kpi-label">MISSED DOSES</span>
              <div className="kpi-value text-rose">{stats.missed}</div>
            </div>
          </div>

          {missedDoses.length > 0 && (
            <div className="clinical-alert-box">
              <AlertTriangle size={20} color="#e11d48" />
              <div className="alert-text-content">
                <h4>Adherence Alert: {missedDoses.length} Missed Dose</h4>
                <p>
                  Patient missed {missedDoses.map(m => `${m.medName} (${m.date})`).join(", ")}.
                </p>
              </div>
            </div>
          )}

          <div className="doc-charts-grid">
            <div className="p-panel chart-panel">
              <div className="panel-header-between">
                <div>
                  <h3 className="panel-title">7-Day Adherence Trend</h3>
                </div>
                <div className="chart-legend-row">
                  <span className="legend-item"><span className="legend-dot taken-dot" /> Taken</span>
                  <span className="legend-item"><span className="legend-dot missed-dot" /> Missed</span>
                </div>
              </div>

              <div style={{ height: "220px", width: "100%", marginTop: "14px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                    <Bar dataKey="taken" fill="#10b981" radius={[4, 4, 0, 0]} name="Taken" />
                    <Bar dataKey="missed" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Missed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-panel reg-summary-panel">
              <div className="panel-header-between">
                <h3 className="panel-title">Active Regimen</h3>
                <span className="pill-count-badge">{medications.length} Profiles</span>
              </div>

              <div className="doc-meds-quicklist">
                {medications.map(m => (
                  <div key={m.id} className="doc-med-row">
                    <div className="doc-med-avatar" style={{ backgroundColor: m.color + "20", color: m.color }}>
                      <Pill size={16} />
                    </div>
                    <div className="doc-med-info">
                      <b>{m.name}</b>
                      <small>{m.dose} • Slot {m.slot}</small>
                    </div>
                    <div className="doc-med-status">
                      <span className={`schedule-status-badge ${m.paused ? "badge-paused" : "badge-active"}`}>
                        {m.paused ? "Paused" : "Active"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Prescriptions */}
      {activeDocTab === "prescriptions" && (
        <div className="doc-tab-content">
          <div className="section-head-between" style={{ marginBottom: "16px" }}>
            <div>
              <h3>Prescriptions & Regimen</h3>
            </div>
            <button
              type="button"
              className="btn-primary-add"
              onClick={onAddPrescription}
            >
              <Plus size={16} /> Prescribe
            </button>
          </div>

          <div className="table-responsive p-panel">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Slot</th>
                  <th>Schedule</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medications.map(m => (
                  <tr key={m.id}>
                    <td>
                      <b>{m.name}</b>
                      <small>{m.dose}</small>
                    </td>
                    <td>
                      <span className="slot-badge-mini">Slot {m.slot || 1}</span>
                    </td>
                    <td>
                      <div className="doc-schedule-cell">
                        <span className="repeat-type-pill">{m.repeatType}</span>
                        <small>{m.doses?.map(d => d.time).join(", ")}</small>
                      </div>
                    </td>
                    <td>{m.qty} pills</td>
                    <td>
                      <span className={`schedule-status-badge ${m.paused ? "badge-paused" : "badge-active"}`}>
                        {m.paused ? "Paused" : "Active"}
                      </span>
                    </td>
                    <td>
                      <div className="doc-actions-cell">
                        <button
                          type="button"
                          className={`btn-pause-pill ${m.paused ? "btn-resume" : "btn-pause"}`}
                          onClick={() => onTogglePausePrescription(m.id)}
                        >
                          {m.paused ? <Play size={13} /> : <Pause size={13} />}
                          <span>{m.paused ? "Resume" : "Pause"}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-edit-pill"
                          onClick={() => onEditPrescription(m)}
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Hardware Audit */}
      {activeDocTab === "env_audit" && (
        <div className="doc-tab-content">
          <div className="section-head-between" style={{ marginBottom: "16px" }}>
            <div>
              <h3>Hardware & Storage Audit</h3>
            </div>
            <div className="telemetry-pill-now">
              <span>Current: <b>{temp}°C</b> / <b>{humidity}% RH</b></span>
            </div>
          </div>

          <div className="doc-audit-grid">
            <div className="p-panel">
              <h4 className="panel-title">Storage Environment Compliance</h4>

              <div className="table-responsive" style={{ marginTop: "14px" }}>
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Safe Range</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map(m => {
                      const isTempExceeded = temp > m.tempMax || temp < m.tempMin;
                      const isHumExceeded = humidity > m.rhMax;
                      const hasExcursion = isTempExceeded || isHumExceeded;

                      return (
                        <tr key={m.id}>
                          <td><b>{m.name}</b></td>
                          <td>{m.tempMin}°C–{m.tempMax}°C, ≤{m.rhMax}%</td>
                          <td>
                            <span className={`status-pill ${hasExcursion ? "status-excursion" : "status-safe"}`}>
                              {hasExcursion ? "Excursion" : "Safe"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-panel">
              <h4 className="panel-title">Recent Dispense Events</h4>
              <div className="verification-audit-list">
                {history.slice(0, 5).map(h => (
                  <div key={h.id} className="audit-event-row">
                    <div className="audit-time">{h.date} • {h.scheduledTime}</div>
                    <div className="audit-detail">
                      <b>{h.medName}</b>
                    </div>
                    <div className="audit-status">
                      <span className={`dose-status-badge badge-${h.status}`}>{h.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Directives */}
      {activeDocTab === "notes" && (
        <div className="doc-tab-content">
          <div className="p-panel" style={{ maxWidth: "800px" }}>
            <h3 className="panel-title">Clinical Notes for Patient</h3>

            <form onSubmit={handleSaveNotes} style={{ marginTop: "18px" }}>
              <div className="form-group">
                <textarea
                  rows={5}
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                  className="input-field textarea-field"
                  placeholder="Enter medical instructions for patient..."
                />
              </div>

              <div className="notes-action-row">
                {notesSaved && (
                  <span className="save-success-tag">
                    <Check size={14} /> Saved and broadcast to patient!
                  </span>
                )}
                <button type="submit" className="btn-save" style={{ marginLeft: "auto" }}>
                  <Check size={16} /> Save Directives
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clinical Report Modal */}
      {showReportModal && (
        <div className="modal-backdrop" onClick={() => setShowReportModal(false)}>
          <div className="modal-container report-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="report-header">
              <div className="report-brand">
                <Stethoscope size={24} color="#0ea5e9" />
                <div>
                  <h3>Clinical Adherence Summary</h3>
                  <p>{patient.name} ({patient.patientId})</p>
                </div>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowReportModal(false)}
              >
                ×
              </button>
            </div>

            <div className="report-body">
              <div className="report-metrics-row">
                <div className="rep-stat">
                  <span>Adherence:</span>
                  <b>{stats.adherenceRate}%</b>
                </div>
                <div className="rep-stat">
                  <span>Confirmed:</span>
                  <b>{stats.confirmed}</b>
                </div>
                <div className="rep-stat">
                  <span>Missed:</span>
                  <b>{stats.missed}</b>
                </div>
                <div className="rep-stat">
                  <span>Chamber:</span>
                  <b>{temp}°C / {humidity}%</b>
                </div>
              </div>

              <div className="report-section">
                <h4>Prescribed Regimen</h4>
                <ul>
                  {medications.map(m => (
                    <li key={m.id}>
                      <b>{m.name}</b> {m.dose} • Slot {m.slot} ({m.paused ? "Paused" : "Active"})
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="report-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowReportModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={() => window.print()}
              >
                <Printer size={16} /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
