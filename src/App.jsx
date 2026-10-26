import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ShieldCheck,
  Pill,
  Clock,
  Calendar,
  Thermometer,
  Droplets,
  Wifi,
  WifiOff,
  User,
  Stethoscope,
  Bell,
  Cpu,
  Plus,
  Home,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Volume2,
  Activity,
  FileCheck2,
  Mic,
  Sparkles,
  X,
  Info,
  Trash2,
  ArrowRight
} from "lucide-react";

import {
  initialPatient,
  initialMedications,
  initialDoseHistory,
  initialTelemetry,
  initialDeviceConfig
} from "./data/initialData";

import PatientOverview from "./components/PatientOverview";
import MedicationManager from "./components/MedicationManager";
import DeviceStatusWidget from "./components/DeviceStatusWidget";
import DoseHistoryView from "./components/DoseHistoryView";
import DoctorDashboard from "./components/DoctorDashboard";
import MedicationModal from "./components/MedicationModal";
import DispenseModal from "./components/DispenseModal";
import BioIntelligenceView from "./components/BioIntelligenceView";
import DecentralizedAuditView from "./components/DecentralizedAuditView";
import SwallowValidatorModal from "./components/SwallowValidatorModal";
import HabituationSynthesizerModal from "./components/HabituationSynthesizerModal";

export default function App() {
  // Role switcher: "patient" or "doctor"
  const [view, setView] = useState("patient");

  // Patient navigation tabs: "Overview" | "Bio-Intelligence" | "Schedules" | "Trust & Audit" | "Device" | "Dose History"
  const [activeTab, setActiveTab] = useState("Overview");

  // Persistent States
  const [patient, setPatient] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ms-patient-v2")) || initialPatient;
    } catch {
      return initialPatient;
    }
  });

  const [medications, setMedications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ms-meds-v2")) || initialMedications;
    } catch {
      return initialMedications;
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ms-history-v2")) || initialDoseHistory;
    } catch {
      return initialDoseHistory;
    }
  });

  const [telemetryData, setTelemetryData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ms-telemetry-v2")) || initialTelemetry;
    } catch {
      return initialTelemetry;
    }
  });

  const [deviceConfig, setDeviceConfig] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ms-device-v2")) || initialDeviceConfig;
    } catch {
      return initialDeviceConfig;
    }
  });

  // Environmental Telemetry
  const [temp, setTemp] = useState(22.8);
  const [humidity, setHumidity] = useState(51);
  const [isHardwareMode, setIsHardwareMode] = useState(false);
  const [esp32Connected, setEsp32Connected] = useState(true);

  // Modals
  const [medModalOpen, setMedModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState(null);
  const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
  const [dispenseTargetMed, setDispenseTargetMed] = useState(null);
  const [swallowModalOpen, setSwallowModalOpen] = useState(false);
  const [swallowTargetDose, setSwallowTargetDose] = useState(null);
  const [habituationModalOpen, setHabituationModalOpen] = useState(false);

  // Toast notification system
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  // Notification center popover
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dismissedNotifIds, setDismissedNotifIds] = useState([]);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clinicalNotifications = useMemo(() => {
    const list = [];

    // 1. Missed Doses
    const missedDoses = history.filter(h => h.status === "missed");
    missedDoses.forEach((h, idx) => {
      list.push({
        id: `missed-${h.id || idx}`,
        type: "critical",
        title: `Missed Dose: ${h.medName} (${h.scheduledTime || "08:00 AM"})`,
        desc: "Plasma concentration falling below Minimum Effective Concentration (MEC).",
        actionLabel: "Catch-Up Advisor",
        onAction: () => {
          setView("patient");
          setActiveTab("Bio-Intelligence");
          setNotificationsOpen(false);
        }
      });
    });

    // 2. Storage Telemetry (ESP32 DHT22)
    if (temp > 28 || temp < 15 || humidity > 65) {
      list.push({
        id: "telemetry-excursion",
        type: "warning",
        title: `Climate Warning: ${temp}°C / ${humidity}% RH`,
        desc: "Arrhenius degradation predicts accelerated kinetic loss if temperature exceeds 25°C.",
        actionLabel: "View Degradation Twin",
        onAction: () => {
          setView("patient");
          setActiveTab("Bio-Intelligence");
          setNotificationsOpen(false);
        }
      });
    } else {
      list.push({
        id: "telemetry-optimal",
        type: "info",
        title: `Storage Climate: ${temp}°C / ${humidity}% RH`,
        desc: "LittleFS environmental ledger confirms USP <659> room temperature compliance.",
        actionLabel: "Device Telemetry",
        onAction: () => {
          setView("patient");
          setActiveTab("Device");
          setNotificationsOpen(false);
        }
      });
    }

    // 3. Acoustic Swallowing Validator
    list.push({
      id: "acoustic-sensor",
      type: "sensor",
      title: "Epiglottic Acoustic Validator Ready",
      desc: "Web Audio API FFT filter tuned for 800Hz-2kHz epiglottic transit acoustics.",
      actionLabel: "Test Swallow Mic",
      onAction: () => {
        handleOpenSwallowModal();
        setNotificationsOpen(false);
      }
    });

    // 4. Anti-Habituation Pitch Synthesizer
    list.push({
      id: "habituation-synthesizer",
      type: "feature",
      title: "Anti-Habituation Synthesizer Armed",
      desc: "Shepard-Risset glissando active to prevent alarm desensitization.",
      actionLabel: "Test Audio Pitch",
      onAction: () => {
        setHabituationModalOpen(true);
        setNotificationsOpen(false);
      }
    });

    return list.filter(item => !dismissedNotifIds.includes(item.id));
  }, [history, temp, humidity, dismissedNotifIds]);

  // Sync with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("ms-patient-v2", JSON.stringify(patient));
    } catch {}
  }, [patient]);

  useEffect(() => {
    try {
      localStorage.setItem("ms-meds-v2", JSON.stringify(medications));
    } catch {}
  }, [medications]);

  useEffect(() => {
    try {
      localStorage.setItem("ms-history-v2", JSON.stringify(history));
    } catch {}
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem("ms-telemetry-v2", JSON.stringify(telemetryData));
    } catch {}
  }, [telemetryData]);

  // Hardware polling effect (ESP32 REST API)
  useEffect(() => {
    if (!isHardwareMode) return;
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`http://${deviceConfig.ip}/api/status`, {
          signal: AbortSignal.timeout(3000)
        });
        const data = await res.json();
        if (data.temperature) setTemp(data.temperature);
        if (data.humidity) setHumidity(data.humidity);
        setEsp32Connected(true);
      } catch (err) {
        setEsp32Connected(false);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [isHardwareMode, deviceConfig.ip]);

  // --- Handlers ---
  const handleOpenAddMedication = () => {
    setEditingMedication(null);
    setMedModalOpen(true);
  };

  const handleOpenEditMedication = (med) => {
    setEditingMedication(med);
    setMedModalOpen(true);
  };

  const handleSaveMedication = (savedMed) => {
    if (editingMedication) {
      // Edit existing
      setMedications(prev => prev.map(m => (m.id === savedMed.id ? savedMed : m)));
      showToast(`Updated schedule for "${savedMed.name}"`, "success");
    } else {
      // Add new
      setMedications(prev => [savedMed, ...prev]);

      // Add upcoming pending dose to history
      if (savedMed.doses && savedMed.doses.length > 0) {
        const firstDose = savedMed.doses[0];
        const newHist = {
          id: `hist-${Date.now()}`,
          medId: savedMed.id,
          medName: savedMed.name,
          dose: savedMed.dose,
          amount: firstDose.amount || 1,
          scheduledTime: firstDose.time,
          scheduledDateTime: new Date().toISOString(),
          date: "Today, 22 Oct",
          status: "pending",
          verificationMethod: "Awaiting Schedule",
          confirmedAt: null,
          slot: savedMed.slot || 1,
          notes: `Scheduled ${firstDose.label || "dose"}`
        };
        setHistory(h => [newHist, ...h]);
      }
      showToast(`Added new medication schedule for "${savedMed.name}"`, "success");
    }
  };

  const handleTogglePause = (medId) => {
    setMedications(prev =>
      prev.map(m => {
        if (m.id === medId) {
          const newPaused = !m.paused;
          showToast(
            newPaused ? `Paused schedule for "${m.name}"` : `Resumed schedule for "${m.name}"`,
            newPaused ? "warning" : "success"
          );
          return {
            ...m,
            paused: newPaused,
            pausedReason: newPaused ? "Paused by user/doctor" : ""
          };
        }
        return m;
      })
    );
  };

  const handleDeleteMedication = (medId) => {
    const med = medications.find(m => m.id === medId);
    setMedications(prev => prev.filter(m => m.id !== medId));
    // Also remove pending doses for this medication from history
    setHistory(prev => prev.filter(h => !(h.medId === medId && h.status === "pending")));
    showToast(`Removed schedule for "${med ? med.name : "medication"}"`, "warning");
  };

  const handleTakeDose = (historyId, customNotes = "") => {
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setHistory(prev =>
      prev.map(h => {
        if (h.id === historyId) {
          return {
            ...h,
            status: "taken",
            confirmedAt: nowTime,
            verificationMethod: "Patient App Intake",
            notes: customNotes || "Marked taken by patient"
          };
        }
        return h;
      })
    );
    showToast("Dose marked as taken! Great adherence.", "success");
  };

  const handleOpenDispenseModal = (targetMed) => {
    const med = targetMed || medications[0];
    setDispenseTargetMed(med);
    setDispenseModalOpen(true);
  };

  const handleConfirmDispense = (dispensedMed) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 1. Decrement medication inventory stock
    setMedications(prev =>
      prev.map(m => (m.id === dispensedMed.id ? { ...m, qty: Math.max(0, m.qty - 1) } : m))
    );

    // 2. Add or update dose history with "confirmed" IR drop status
    const pendingMatch = history.find(h => h.medId === dispensedMed.id && h.status === "pending");
    if (pendingMatch) {
      setHistory(prev =>
        prev.map(h => {
          if (h.id === pendingMatch.id) {
            return {
              ...h,
              status: "confirmed",
              confirmedAt: nowTime,
              verificationMethod: `IR Sensor (Slot ${dispensedMed.slot || 1} Drop Verified)`,
              notes: "Dispensed via ESP32 carousel and verified by optical beam"
            };
          }
          return h;
        })
      );
    } else {
      const newDoseRecord = {
        id: `hist-${Date.now()}`,
        medId: dispensedMed.id,
        medName: dispensedMed.name,
        dose: dispensedMed.dose,
        amount: 1,
        scheduledTime: nowTime,
        scheduledDateTime: new Date().toISOString(),
        date: "Today, 22 Oct",
        status: "confirmed",
        verificationMethod: `IR Sensor (Slot ${dispensedMed.slot || 1} Drop Verified)`,
        confirmedAt: nowTime,
        slot: dispensedMed.slot || 1,
        notes: "Dispensed and confirmed by hardware optical sensor"
      };
      setHistory(h => [newDoseRecord, ...h]);
    }

    showToast(`Pill dispensed from Slot ${dispensedMed.slot || 1} and verified!`, "success");
  };

  const handleUpdatePatientNotes = (notes) => {
    setPatient(prev => ({ ...prev, doctorNotes: notes }));
    showToast("Doctor directives updated for patient", "success");
  };

  // Novelty Handlers
  const handleOpenSwallowModal = (targetDose) => {
    const dose = targetDose || history.find(h => h.status === "pending") || history[0];
    setSwallowTargetDose(dose);
    setSwallowModalOpen(true);
  };

  const handleVerifiedIngestion = (verifiedDose) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setHistory(prev =>
      prev.map(h => {
        if (h.id === verifiedDose.id) {
          return {
            ...h,
            status: "confirmed",
            confirmedAt: nowTime,
            verificationMethod: "Acoustic Deglutition (1.2 kHz Pharyngeal Burst)",
            notes: "Biomechanically verified swallow via Web Audio API"
          };
        }
        return h;
      })
    );
    showToast("Pharyngeal swallowing verified biomechanically! Dose confirmed.", "success");
  };

  return (
    <div className="medishield-app-layout">
      {/* Toast Alert */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.type === "success" && <CheckCircle2 size={18} />}
          {toast.type === "warning" && <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-brand-box">
          <div className="brand-logo-icon">
            <ShieldCheck size={26} />
          </div>
          <div className="brand-text">
            <h2>MediShield</h2>
            <span>Smart IoT Dispenser</span>
          </div>
        </div>

        {/* Global Role Switcher */}
        <div className="role-switch-container">
          <button
            type="button"
            className={`role-btn ${view === "patient" ? "active" : ""}`}
            onClick={() => setView("patient")}
          >
            <User size={15} />
            <span>Patient</span>
          </button>
          <button
            type="button"
            className={`role-btn ${view === "doctor" ? "active" : ""}`}
            onClick={() => setView("doctor")}
          >
            <Stethoscope size={15} />
            <span>Doctor</span>
          </button>
        </div>

        {/* Navigation Section */}
        {view === "patient" ? (
          <nav className="sidebar-nav">
            <span className="nav-group-label">PATIENT PORTAL</span>
            {[
              { id: "Overview", label: "Dashboard", icon: Home },
              { id: "Bio-Intelligence", label: "Bio-Intelligence", icon: Activity, badge: "AI" },
              { id: "Schedules", label: "Pill Schedules", icon: Pill, badge: medications.length },
              { id: "Trust & Audit", label: "Trust & Audit", icon: FileCheck2, badge: "Air-Gap" },
              { id: "Device", label: "ESP32 & Sensors", icon: Thermometer },
              { id: "Dose History", label: "Dose History", icon: Clock, badge: history.filter(h => h.status === "pending").length }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-link-btn ${isActive ? "active" : ""}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="nav-badge-count">{item.badge}</span>
                  )}
                  <ChevronRight size={14} className="nav-arrow" />
                </button>
              );
            })}
          </nav>
        ) : (
          <nav className="sidebar-nav">
            <span className="nav-group-label">CLINICAL PORTAL</span>
            <div className="doctor-sidebar-profile-box">
              <div className="doc-avatar-badge">Dr</div>
              <div className="doc-info-col">
                <b>Dr. Arvind Sharma</b>
                <small>Internal Medicine</small>
                <span className="physician-verified-tag">License #MED-4829</span>
              </div>
            </div>

            <div className="sidebar-patient-card">
              <span className="sp-label">ACTIVE PATIENT:</span>
              <b>{patient.name}</b>
              <small>ID: {patient.patientId}</small>
            </div>
          </nav>
        )}

        {/* Sidebar Bottom: ESP32 Hardware Status Card */}
        <div className="sidebar-device-status-box">
          <div className="device-status-header">
            <span className={`status-dot-pulse ${esp32Connected ? "online" : "offline"}`} />
            <div>
              <b>ESP32-S3 Core</b>
              <small>{isHardwareMode ? "Live Hardware" : "Interactive Demo"}</small>
            </div>
          </div>

          <div className="device-quick-stats">
            <span className="mini-stat-pill">
              <Thermometer size={12} /> {temp}°C
            </span>
            <span className="mini-stat-pill">
              <Droplets size={12} /> {humidity}% RH
            </span>
          </div>

          <button
            type="button"
            className="btn-sidebar-dispense"
            onClick={() => handleOpenDispenseModal(medications[0])}
          >
            <Cpu size={14} /> Test Dispenser
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-main-viewport">
        {/* Top Header Bar */}
        <header className="main-topbar">
          <div className="topbar-left">
            <div className="topbar-breadcrumb">
              {view === "doctor" ? "DOCTOR PORTAL" : "PATIENT VIEW"}
            </div>
            <h1 className="topbar-title">
              {view === "doctor"
                ? `Dr. Sharma • ${patient.name}`
                : activeTab === "Overview"
                ? "Overview"
                : activeTab === "Bio-Intelligence"
                ? "Clinical Bio-Intelligence"
                : activeTab === "Schedules"
                ? "Pill Schedules"
                : activeTab === "Trust & Audit"
                ? "Decentralized Trust & Audit"
                : activeTab === "Device"
                ? "ESP32 & Sensors"
                : "Dose History"}
            </h1>
          </div>

          <div className="topbar-right">
            {/* Connection badge */}
            <div className={`topbar-conn-badge ${esp32Connected ? "connected" : "disconnected"}`}>
              {esp32Connected ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isHardwareMode ? (esp32Connected ? "ESP32 CONNECTED" : "ESP32 OFFLINE") : "SIMULATION ACTIVE"}</span>
            </div>

            {/* Quick Novelty Verification Tools */}
            {view === "patient" && (
              <>
                <button
                  type="button"
                  className="topbar-icon-btn"
                  onClick={() => handleOpenSwallowModal()}
                  title="Acoustic Swallowing Ingestion Validator (Web Audio API)"
                  style={{ color: "#0284c7" }}
                >
                  <Mic size={18} />
                </button>

                <button
                  type="button"
                  className="topbar-icon-btn"
                  onClick={() => setHabituationModalOpen(true)}
                  title="Anti-Habituation Pitch Synthesizer (Shepard-Risset)"
                  style={{ color: "#10b981" }}
                >
                  <Sparkles size={18} />
                </button>
              </>
            )}

            {/* Notification / Bell Dropdown */}
            <div className="topbar-notification-wrap" ref={notifRef}>
              <button
                type="button"
                className={`topbar-icon-btn ${notificationsOpen ? "active" : ""}`}
                onClick={() => setNotificationsOpen(prev => !prev)}
                title="Clinical Notifications & Hardware Alerts"
                aria-label="Clinical Notifications"
              >
                <Bell size={18} />
                {clinicalNotifications.length > 0 && (
                  <span className="bell-badge-count">
                    {clinicalNotifications.length}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="notification-dropdown-panel">
                  <div className="notif-dropdown-header">
                    <div className="ndh-left">
                      <Bell size={16} className="text-primary" />
                      <b>Clinical Notifications</b>
                      <span className="ndh-count-chip">{clinicalNotifications.length} Active</span>
                    </div>
                    {clinicalNotifications.length > 0 && (
                      <button
                        type="button"
                        className="btn-notif-clear-all"
                        onClick={() => setDismissedNotifIds(clinicalNotifications.map(n => n.id))}
                        title="Dismiss all alerts"
                      >
                        <Trash2 size={13} />
                        <span>Dismiss All</span>
                      </button>
                    )}
                  </div>

                  <div className="notif-dropdown-body">
                    {clinicalNotifications.length === 0 ? (
                      <div className="notif-empty-state">
                        <CheckCircle2 size={36} className="text-emerald" />
                        <p>All clinical notifications acknowledged.</p>
                        <small>MediShield hardware sentinel is actively monitoring ESP32 LittleFS and DHT22 sensors.</small>
                      </div>
                    ) : (
                      clinicalNotifications.map((notif) => (
                        <div key={notif.id} className={`notif-card-item notif-${notif.type}`}>
                          <div className="nci-icon-col">
                            {notif.type === "critical" && <AlertTriangle size={18} className="text-rose" />}
                            {notif.type === "warning" && <AlertTriangle size={18} className="text-amber" />}
                            {notif.type === "info" && <Info size={18} className="text-primary" />}
                            {notif.type === "sensor" && <Mic size={18} className="text-cyan" />}
                            {notif.type === "feature" && <Sparkles size={18} className="text-emerald" />}
                          </div>
                          <div className="nci-content-col">
                            <div className="nci-top-row">
                              <b>{notif.title}</b>
                              <button
                                type="button"
                                className="btn-dismiss-single"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDismissedNotifIds(prev => [...prev, notif.id]);
                                }}
                                title="Dismiss"
                              >
                                <X size={13} />
                              </button>
                            </div>
                            <p>{notif.desc}</p>
                            {notif.actionLabel && (
                              <button
                                type="button"
                                className="btn-notif-action"
                                onClick={notif.onAction}
                              >
                                <span>{notif.actionLabel}</span>
                                <ArrowRight size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="notif-dropdown-footer">
                    <div className="ndf-status">
                      <span className="ndf-dot" />
                      <small>ESP32-WROOM-32 Sentinel Online</small>
                    </div>
                    <button
                      type="button"
                      className="btn-ndf-history"
                      onClick={() => {
                        setView("patient");
                        setActiveTab("Dose History");
                        setNotificationsOpen(false);
                      }}
                    >
                      <span>Full Dose Log</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Button */}
            {view === "patient" && (
              <button
                type="button"
                className="btn-topbar-action"
                onClick={handleOpenAddMedication}
              >
                <Plus size={16} /> Add Medication
              </button>
            )}

            {/* User Profile Avatar */}
            <div className="topbar-user-avatar" title={view === "doctor" ? "Dr. Arvind Sharma" : patient.name}>
              {view === "doctor" ? "DR" : "RR"}
            </div>
          </div>
        </header>

        {/* View Routing */}
        <main className="main-scroll-content">
          {view === "doctor" ? (
            <DoctorDashboard
              patient={patient}
              medications={medications}
              history={history}
              temp={temp}
              humidity={humidity}
              onUpdatePatientNotes={handleUpdatePatientNotes}
              onAddPrescription={handleOpenAddMedication}
              onEditPrescription={handleOpenEditMedication}
              onTogglePausePrescription={handleTogglePause}
            />
          ) : (
            <>
              {activeTab === "Overview" && (
                <PatientOverview
                  patient={patient}
                  medications={medications}
                  history={history}
                  temp={temp}
                  humidity={humidity}
                  onNavigateTab={setActiveTab}
                  onOpenDispense={handleOpenDispenseModal}
                  onTakeDose={handleTakeDose}
                  onAddMedication={handleOpenAddMedication}
                  onOpenSwallowModal={handleOpenSwallowModal}
                />
              )}

              {activeTab === "Bio-Intelligence" && (
                <BioIntelligenceView
                  medications={medications}
                  history={history}
                  temp={temp}
                  humidity={humidity}
                  onNavigateTab={setActiveTab}
                />
              )}

              {activeTab === "Schedules" && (
                <MedicationManager
                  medications={medications}
                  onAddMedication={handleOpenAddMedication}
                  onEditMedication={handleOpenEditMedication}
                  onTogglePause={handleTogglePause}
                  onDeleteMedication={handleDeleteMedication}
                  onDispenseMedication={handleOpenDispenseModal}
                />
              )}

              {activeTab === "Trust & Audit" && (
                <DecentralizedAuditView
                  history={history}
                  medications={medications}
                  patient={patient}
                  deviceConfig={deviceConfig}
                  temp={temp}
                  humidity={humidity}
                  onShowToast={showToast}
                />
              )}

              {activeTab === "Device" && (
                <DeviceStatusWidget
                  deviceConfig={deviceConfig}
                  temp={temp}
                  humidity={humidity}
                  isHardwareMode={isHardwareMode}
                  onToggleHardwareMode={() => {
                    setIsHardwareMode(!isHardwareMode);
                    showToast(
                      !isHardwareMode
                        ? "Switched to Live ESP32 Hardware Polling mode"
                        : "Switched to Interactive Simulation mode",
                      "info"
                    );
                  }}
                  onSimulateTempChange={(newTemp) => {
                    setTemp(newTemp);
                    showToast(`Simulated temperature changed to ${newTemp}°C`, "info");
                  }}
                  onSimulateHumidityChange={(newHum) => {
                    setHumidity(newHum);
                    showToast(`Simulated humidity changed to ${newHum}% RH`, "info");
                  }}
                  onTestDispense={handleOpenDispenseModal}
                  onTestBuzzer={() => showToast("ESP32 Piezo Buzzer triggered! 🔔", "info")}
                  onOpenHabituationModal={() => setHabituationModalOpen(true)}
                  onNavigateTab={setActiveTab}
                  medications={medications}
                  telemetryData={telemetryData}
                />
              )}

              {activeTab === "Dose History" && (
                <DoseHistoryView
                  history={history}
                  onTakeDose={handleTakeDose}
                  onDispenseModalOpen={handleOpenDispenseModal}
                  onOpenSwallowModal={handleOpenSwallowModal}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Add / Edit Medication Modal */}
      <MedicationModal
        isOpen={medModalOpen}
        onClose={() => {
          setMedModalOpen(false);
          setEditingMedication(null);
        }}
        onSave={handleSaveMedication}
        initialData={editingMedication}
      />

      {/* Interactive ESP32 Dispense Modal */}
      <DispenseModal
        isOpen={dispenseModalOpen}
        onClose={() => {
          setDispenseModalOpen(false);
          setDispenseTargetMed(null);
        }}
        medication={dispenseTargetMed}
        onConfirmDispense={handleConfirmDispense}
        esp32Connected={esp32Connected}
      />

      {/* Acoustic Pharyngeal Deglutition Ingestion Modal */}
      <SwallowValidatorModal
        isOpen={swallowModalOpen}
        onClose={() => {
          setSwallowModalOpen(false);
          setSwallowTargetDose(null);
        }}
        targetDose={swallowTargetDose}
        onVerifiedIngestion={handleVerifiedIngestion}
      />

      {/* Psychoacoustic Anti-Habituation Synthesizer Modal */}
      <HabituationSynthesizerModal
        isOpen={habituationModalOpen}
        onClose={() => setHabituationModalOpen(false)}
        history={history}
        onTestBuzzer={() => showToast("ESP32 Piezo Buzzer triggered! 🔔", "info")}
      />
    </div>
  );
}