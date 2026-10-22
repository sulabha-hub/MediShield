import React, { useState, useMemo } from "react";
import { Plus, Search, Edit3, Trash2, Pause, Play, Clock, Calendar, AlertTriangle, Pill, Cpu } from "lucide-react";

export default function MedicationManager({
  medications,
  onAddMedication,
  onEditMedication,
  onTogglePause,
  onDeleteMedication,
  onDispenseMedication
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const filteredMeds = useMemo(() => {
    return medications.filter(med => {
      if (statusFilter === "active" && med.paused) return false;
      if (statusFilter === "paused" && !med.paused) return false;
      if (statusFilter === "low_stock" && med.qty > med.minQty) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = med.name.toLowerCase().includes(q);
        const matchDose = med.dose.toLowerCase().includes(q);
        if (!matchName && !matchDose) return false;
      }
      return true;
    });
  }, [medications, statusFilter, searchQuery]);

  const formatRepeatText = (med) => {
    if (med.repeatType === "daily") return "Daily";
    if (med.repeatType === "specific_days") return med.repeatDays?.join(", ") || "Custom";
    if (med.repeatType === "interval") return `Every ${med.intervalDays || 1}d`;
    if (med.repeatType === "prn") return "PRN (As needed)";
    return "Daily";
  };

  const handleDeleteClick = (id) => {
    if (deleteConfirmId === id) {
      onDeleteMedication(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
    }
  };

  return (
    <div className="medication-manager-page">
      {/* Header */}
      <div className="manager-header-row">
        <div>
          <h2 className="page-heading">Pill Schedules</h2>
          <p className="page-subheading">Manage daily dose timings, repeats, and chamber slots</p>
        </div>
        <button
          type="button"
          className="btn-primary-add"
          onClick={onAddMedication}
        >
          <Plus size={18} /> Add Schedule
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="med-filter-bar">
        <div className="filter-pill-tabs">
          {[
            { id: "all", label: "All", count: medications.length },
            { id: "active", label: "Active", count: medications.filter(m => !m.paused).length },
            { id: "paused", label: "Paused", count: medications.filter(m => m.paused).length },
            { id: "low_stock", label: "Low Stock", count: medications.filter(m => m.qty <= m.minQty).length }
          ].map(tab => (
            <button
              key={tab.id}
              className={`filter-pill-btn ${statusFilter === tab.id ? "active" : ""}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              <span>{tab.label}</span>
              <span className="pill-count">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="search-box-pill">
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search pills..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn-mini" onClick={() => setSearchQuery("")}>
              ×
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      {filteredMeds.length === 0 ? (
        <div className="empty-meds-card">
          <Pill size={36} color="#94a3b8" />
          <h4>No schedules match filter</h4>
        </div>
      ) : (
        <div className="medication-cards-grid">
          {filteredMeds.map(med => {
            const isLowStock = med.qty <= med.minQty;
            const isPaused = med.paused;

            return (
              <div
                key={med.id}
                className={`med-schedule-card ${isPaused ? "card-paused" : ""}`}
              >
                {/* Top: Icon + Slot + Status */}
                <div className="card-top-row">
                  <div
                    className="med-avatar-badge"
                    style={{ backgroundColor: (med.color || "#0ea5e9") + "20", color: med.color || "#0ea5e9" }}
                  >
                    <Pill size={20} />
                  </div>

                  <div className="badge-group-right">
                    <span className="slot-badge">Slot {med.slot || 1}</span>
                    <span className={`schedule-status-badge ${isPaused ? "badge-paused" : "badge-active"}`}>
                      {isPaused ? "Paused" : "Active"}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="med-info-block">
                  <h3 className="med-name-title">{med.name}</h3>
                  <div className="med-strength-row">
                    <span className="med-dose-tag">{med.dose}</span>
                    <span className="med-form-tag">{med.form || "Tablet"}</span>
                  </div>

                  {med.instructions && (
                    <p className="med-instructions-quote">{med.instructions}</p>
                  )}
                </div>

                {/* Dose timings */}
                <div className="repeat-timing-block">
                  <div className="repeat-frequency-row">
                    <div className="rf-left">
                      <Calendar size={14} color="#0ea5e9" />
                      <span>{formatRepeatText(med)}</span>
                    </div>
                    <span className="doses-per-day-badge">
                      {med.doses?.length || 1} {med.doses?.length === 1 ? "dose/day" : "doses/day"}
                    </span>
                  </div>

                  <div className="card-doses-list">
                    {med.doses &&
                      med.doses.map((d, i) => (
                        <div className="dose-pill-chip" key={d.id || i}>
                          <Clock size={12} />
                          <span className="dose-chip-time">{d.time}</span>
                          <span className="dose-chip-label">{d.label || `Dose ${i + 1}`}</span>
                          <span className="dose-chip-qty">({d.amount || 1}x)</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Stock info */}
                <div className="card-meta-metrics">
                  <div className="stock-metric-row">
                    <div className="stock-label-between">
                      <span>Stock</span>
                      <b>{med.qty} pills</b>
                    </div>
                    <div className="stock-track">
                      <div
                        className={`stock-fill ${isLowStock ? "stock-fill-low" : ""}`}
                        style={{ width: `${Math.min(100, (med.qty / 40) * 100)}%` }}
                      />
                    </div>
                    {isLowStock && (
                      <div className="low-stock-alert-pill">
                        <AlertTriangle size={12} /> Low stock (≤ {med.minQty})
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="card-action-bar">
                  <button
                    type="button"
                    className={`btn-card-toggle ${isPaused ? "btn-resume" : "btn-pause"}`}
                    onClick={() => onTogglePause(med.id)}
                  >
                    {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    <span>{isPaused ? "Resume" : "Pause"}</span>
                  </button>

                  <button
                    type="button"
                    className="btn-card-icon"
                    onClick={() => onEditMedication(med)}
                    title="Edit"
                  >
                    <Edit3 size={15} />
                  </button>

                  <button
                    type="button"
                    className="btn-card-dispense"
                    onClick={() => onDispenseMedication(med)}
                    title="Dispense"
                  >
                    <Cpu size={14} /> Dispense
                  </button>

                  <button
                    type="button"
                    className={`btn-card-delete ${deleteConfirmId === med.id ? "confirming" : ""}`}
                    onClick={() => handleDeleteClick(med.id)}
                  >
                    <Trash2 size={15} />
                    {deleteConfirmId === med.id && <span className="del-text">Sure?</span>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
