import React, { useState, useMemo } from "react";
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, Search, Filter, Check, Cpu } from "lucide-react";

export default function DoseHistoryView({ history, onTakeDose, onDispenseModalOpen }) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const stats = useMemo(() => {
    const total = history.length;
    const confirmed = history.filter(h => h.status === "confirmed").length;
    const taken = history.filter(h => h.status === "taken").length;
    const pending = history.filter(h => h.status === "pending").length;
    const missed = history.filter(h => h.status === "missed").length;
    const pastCompleted = confirmed + taken;
    const pastTotal = pastCompleted + missed;
    const adherenceRate = pastTotal > 0 ? Math.round((pastCompleted / pastTotal) * 100) : 100;

    return { total, confirmed, taken, pending, missed, adherenceRate };
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      if (filterStatus !== "all" && item.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.medName?.toLowerCase().includes(q);
        const matchDose = item.dose?.toLowerCase().includes(q);
        if (!matchName && !matchDose) return false;
      }
      if (dateFilter === "today") {
        if (!item.date?.toLowerCase().includes("today")) return false;
      }
      return true;
    });
  }, [history, filterStatus, searchQuery, dateFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="dose-status-badge badge-confirmed">
            <ShieldCheck size={13} /> Confirmed
          </span>
        );
      case "taken":
        return (
          <span className="dose-status-badge badge-taken">
            <CheckCircle2 size={13} /> Taken
          </span>
        );
      case "pending":
        return (
          <span className="dose-status-badge badge-pending">
            <Clock size={13} /> Pending
          </span>
        );
      case "missed":
        return (
          <span className="dose-status-badge badge-missed">
            <AlertTriangle size={13} /> Missed
          </span>
        );
      default:
        return <span className="dose-status-badge">{status}</span>;
    }
  };

  return (
    <div className="dose-history-page">
      {/* Scorecards */}
      <div className="adherence-scorecard-grid">
        <div className="adherence-card primary-card">
          <div className="adherence-card-header">
            <span className="scorecard-tag">ADHERENCE</span>
            <ShieldCheck size={18} color="#38bdf8" />
          </div>
          <div className="adherence-score-val">
            <strong>{stats.adherenceRate}%</strong>
          </div>
          <div className="adherence-bar-track">
            <div className="adherence-bar-fill" style={{ width: `${stats.adherenceRate}%` }} />
          </div>
        </div>

        <div className="adherence-card">
          <div className="adherence-card-header">
            <span className="scorecard-tag text-emerald">CONFIRMED</span>
            <Cpu size={16} className="text-emerald" />
          </div>
          <div className="metric-number text-emerald">{stats.confirmed}</div>
          <small className="metric-hint">Optical IR drop</small>
        </div>

        <div className="adherence-card">
          <div className="adherence-card-header">
            <span className="scorecard-tag text-sky">TAKEN</span>
            <CheckCircle2 size={16} className="text-sky" />
          </div>
          <div className="metric-number text-sky">{stats.taken}</div>
          <small className="metric-hint">Patient reported</small>
        </div>

        <div className="adherence-card">
          <div className="adherence-card-header">
            <span className="scorecard-tag text-amber">PENDING</span>
            <Clock size={16} className="text-amber" />
          </div>
          <div className="metric-number text-amber">{stats.pending}</div>
          <small className="metric-hint">Scheduled today</small>
        </div>

        <div className="adherence-card">
          <div className="adherence-card-header">
            <span className="scorecard-tag text-rose">MISSED</span>
            <AlertTriangle size={16} className="text-rose" />
          </div>
          <div className="metric-number text-rose">{stats.missed}</div>
          <small className="metric-hint">Window expired</small>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="history-filter-bar">
        <div className="status-tabs-pill">
          {[
            { id: "all", label: "All", count: stats.total },
            { id: "confirmed", label: "Confirmed", count: stats.confirmed },
            { id: "taken", label: "Taken", count: stats.taken },
            { id: "pending", label: "Pending", count: stats.pending },
            { id: "missed", label: "Missed", count: stats.missed }
          ].map(tab => (
            <button
              key={tab.id}
              className={`status-tab-btn ${filterStatus === tab.id ? "active" : ""}`}
              onClick={() => setFilterStatus(tab.id)}
            >
              <span>{tab.label}</span>
              <span className="tab-count-pill">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="search-and-date-row">
          <div className="search-input-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery("")}>
                ×
              </button>
            )}
          </div>

          <select
            className="date-filter-select"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="history-table-container">
        {filteredHistory.length === 0 ? (
          <div className="empty-history-state">
            <Filter size={32} color="#94a3b8" />
            <h4>No records match filter</h4>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Medication</th>
                  <th>Scheduled</th>
                  <th>Confirmed Time</th>
                  <th>Slot</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(item => (
                  <tr key={item.id} className={`history-row status-${item.status}`}>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>
                      <div className="table-med-col">
                        <b>{item.medName}</b>
                        <small>{item.dose}</small>
                      </div>
                    </td>
                    <td>
                      <div className="table-time-col">
                        <span className="date-text">{item.date}</span>
                        <span className="time-badge">{item.scheduledTime}</span>
                      </div>
                    </td>
                    <td>
                      {item.confirmedAt ? (
                        <span className="confirmed-time-text">
                          <Check size={13} color="#10b981" /> {item.confirmedAt}
                        </span>
                      ) : (
                        <span className="text-muted-dash">—</span>
                      )}
                    </td>
                    <td>
                      <span className="slot-badge-mini">Slot {item.slot || 1}</span>
                    </td>
                    <td>
                      <div className="table-actions-cell">
                        {item.status === "pending" && (
                          <div className="action-button-group">
                            <button
                              type="button"
                              className="btn-action-primary"
                              onClick={() => onDispenseModalOpen && onDispenseModalOpen(item)}
                            >
                              <Cpu size={13} /> Dispense
                            </button>
                            <button
                              type="button"
                              className="btn-action-secondary"
                              onClick={() => onTakeDose && onTakeDose(item.id)}
                            >
                              <Check size={13} /> Take
                            </button>
                          </div>
                        )}
                        {item.status === "missed" && (
                          <button
                            type="button"
                            className="btn-action-secondary"
                            onClick={() => onTakeDose && onTakeDose(item.id, "Logged late intake")}
                          >
                            Log Intake
                          </button>
                        )}
                        {(item.status === "confirmed" || item.status === "taken") && (
                          <span className="history-verified-tag">{item.verificationMethod || "Logged"}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
