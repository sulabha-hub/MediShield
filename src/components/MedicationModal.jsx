import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Clock, Calendar, AlertTriangle, ShieldCheck, Pill, Check } from "lucide-react";

const PRESET_COLORS = [
  { name: "Sky Blue", value: "#0ea5e9" },
  { name: "Emerald", value: "#10b981" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Rose", value: "#ec4899" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Indigo", value: "#6366f1" }
];

const PRESET_SHAPES = ["capsule", "round", "oval", "oblong"];
const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MedicationModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    name: "",
    dose: "",
    form: "Tablet",
    slot: 1,
    color: "#0ea5e9",
    shape: "capsule",
    instructions: "",
    repeatType: "daily",
    repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    intervalDays: 1,
    paused: false,
    pausedReason: "",
    doses: [{ id: "d-1", time: "08:00", label: "Morning", amount: 1 }],
    qty: 30,
    minQty: 5,
    expiry: "2027-06-30",
    tempMin: 15,
    tempMax: 25,
    rhMax: 60,
    chamberExposureHours: 0
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        doses: initialData.doses && initialData.doses.length > 0
          ? initialData.doses
          : [{ id: "d-1", time: "08:00", label: "Morning", amount: 1 }]
      });
    } else {
      setFormData({
        name: "",
        dose: "",
        form: "Tablet",
        slot: 1,
        color: "#0ea5e9",
        shape: "capsule",
        instructions: "",
        repeatType: "daily",
        repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        intervalDays: 1,
        paused: false,
        pausedReason: "",
        doses: [{ id: `d-${Date.now()}-1`, time: "08:00", label: "Morning (Breakfast)", amount: 1 }],
        qty: 30,
        minQty: 5,
        expiry: "2027-06-30",
        tempMin: 15,
        tempMax: 25,
        rhMax: 60,
        chamberExposureHours: 0
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddDoseTime = () => {
    const defaultLabels = ["Morning", "Afternoon", "Evening", "Bedtime", "Post-meal"];
    const count = formData.doses.length;
    const nextLabel = count < defaultLabels.length ? defaultLabels[count] : `Dose ${count + 1}`;
    const nextTime = count === 1 ? "20:00" : count === 2 ? "13:00" : "18:00";
    setFormData(prev => ({
      ...prev,
      doses: [...prev.doses, { id: `d-${Date.now()}`, time: nextTime, label: nextLabel, amount: 1 }]
    }));
  };

  const handleRemoveDoseTime = (id) => {
    if (formData.doses.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      doses: prev.doses.filter(d => d.id !== id)
    }));
  };

  const handleDoseChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      doses: prev.doses.map(d => d.id === id ? { ...d, [field]: value } : d)
    }));
  };

  const toggleDay = (day) => {
    setFormData(prev => {
      const exists = prev.repeatDays.includes(day);
      let updated;
      if (exists) {
        updated = prev.repeatDays.filter(d => d !== day);
        if (updated.length === 0) updated = [day]; // Keep at least one
      } else {
        updated = [...prev.repeatDays, day];
      }
      return { ...prev, repeatDays: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave({
      ...formData,
      id: formData.id || `med-${Date.now()}`,
      qty: Number(formData.qty) || 0,
      minQty: Number(formData.minQty) || 0,
      tempMin: Number(formData.tempMin) || 15,
      tempMax: Number(formData.tempMax) || 25,
      rhMax: Number(formData.rhMax) || 60,
      slot: Number(formData.slot) || 1
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ backgroundColor: formData.color + "22", color: formData.color }}>
              <Pill size={22} />
            </div>
            <div>
              <h3>{initialData ? "Edit Medication Schedule" : "Add Medication Schedule"}</h3>
              <p>Configure dosage, ESP32 dispenser slot, repeat schedule & dose times</p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body-scroll">
          {/* Basic Info */}
          <div className="form-section">
            <h4 className="section-title">Medication Information</h4>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Medicine Name <span className="req">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metformin HCl, Lisinopril"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Dosage Strength <span className="req">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500 mg, 10 mg, 1 tablet"
                  value={formData.dose}
                  onChange={e => setFormData({ ...formData, dose: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Form</label>
                <select
                  value={formData.form}
                  onChange={e => setFormData({ ...formData, form: e.target.value })}
                  className="input-field"
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Softgel">Softgel</option>
                  <option value="Syrup">Syrup / Drops</option>
                  <option value="Inhaler">Inhaler</option>
                </select>
              </div>

              <div className="form-group">
                <label>Dispenser Compartment (Hardware Slot)</label>
                <select
                  value={formData.slot}
                  onChange={e => setFormData({ ...formData, slot: Number(e.target.value) })}
                  className="input-field"
                >
                  <option value={1}>Chamber Slot 1 (Servo Carousel A)</option>
                  <option value={2}>Chamber Slot 2 (Servo Carousel B)</option>
                  <option value={3}>Chamber Slot 3 (Servo Carousel C)</option>
                  <option value={4}>Chamber Slot 4 (Servo Carousel D)</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "12px" }}>
              <label>Special Instructions / Clinical Guidance</label>
              <input
                type="text"
                placeholder="e.g. Take with food; Avoid milk or grapefruit"
                value={formData.instructions}
                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                className="input-field"
              />
            </div>

            {/* Pill Visual Styling */}
            <div className="pill-appearance-row" style={{ marginTop: "14px" }}>
              <div className="color-picker-group">
                <label className="sub-label">Pill Tag Color</label>
                <div className="color-swatches">
                  {PRESET_COLORS.map(c => (
                    <button
                      type="button"
                      key={c.value}
                      className={`color-dot ${formData.color === c.value ? "selected" : ""}`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setFormData({ ...formData, color: c.value })}
                      title={c.name}
                    >
                      {formData.color === c.value && <Check size={12} color="#fff" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="shape-picker-group">
                <label className="sub-label">Shape Indicator</label>
                <div className="shape-pills">
                  {PRESET_SHAPES.map(s => (
                    <button
                      type="button"
                      key={s}
                      className={`shape-chip ${formData.shape === s ? "active" : ""}`}
                      onClick={() => setFormData({ ...formData, shape: s })}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Repeat Schedule */}
          <div className="form-section">
            <h4 className="section-title">
              <Calendar size={16} /> Repeat Schedule
            </h4>

            <div className="schedule-type-selector">
              {[
                { id: "daily", label: "Every Day (Daily)" },
                { id: "specific_days", label: "Specific Days of Week" },
                { id: "interval", label: "Interval (Every X Days)" },
                { id: "prn", label: "As Needed (PRN)" }
              ].map(st => (
                <label key={st.id} className={`schedule-type-card ${formData.repeatType === st.id ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="repeatType"
                    value={st.id}
                    checked={formData.repeatType === st.id}
                    onChange={() => setFormData({ ...formData, repeatType: st.id })}
                  />
                  <span>{st.label}</span>
                </label>
              ))}
            </div>

            {formData.repeatType === "specific_days" && (
              <div className="days-selector-wrap">
                <label className="sub-label">Select Repeat Days</label>
                <div className="days-chip-row">
                  {DAYS_OF_WEEK.map(d => {
                    const isSelected = formData.repeatDays.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        className={`day-btn ${isSelected ? "active" : ""}`}
                        onClick={() => toggleDay(d)}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {formData.repeatType === "interval" && (
              <div className="form-group" style={{ marginTop: "12px", maxWidth: "260px" }}>
                <label>Repeat Every</label>
                <div className="input-suffix-wrap">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.intervalDays}
                    onChange={e => setFormData({ ...formData, intervalDays: Number(e.target.value) || 1 })}
                    className="input-field"
                  />
                  <span className="input-suffix">Days</span>
                </div>
              </div>
            )}
          </div>

          {/* Multiple Doses Per Day */}
          <div className="form-section highlight-box">
            <div className="section-head-between">
              <div>
                <h4 className="section-title">
                  <Clock size={16} /> Multiple Doses Per Day
                </h4>
                <p className="section-subtitle">Add custom times and quantities for each scheduled dose cycle</p>
              </div>
              <button
                type="button"
                className="btn-add-dose"
                onClick={handleAddDoseTime}
              >
                <Plus size={15} /> Add Dose Time
              </button>
            </div>

            <div className="doses-list">
              {formData.doses.map((d, index) => (
                <div className="dose-time-row" key={d.id || index}>
                  <div className="dose-index-badge">{index + 1}</div>
                  <div className="dose-field time-field">
                    <label>Time</label>
                    <input
                      type="time"
                      required
                      value={d.time}
                      onChange={e => handleDoseChange(d.id, "time", e.target.value)}
                      className="input-field time-input"
                    />
                  </div>

                  <div className="dose-field label-field">
                    <label>Meal / Dose Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. Morning (Breakfast)"
                      value={d.label}
                      onChange={e => handleDoseChange(d.id, "label", e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div className="dose-field qty-field">
                    <label>Dose Qty</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={d.amount}
                      onChange={e => handleDoseChange(d.id, "amount", Number(e.target.value) || 1)}
                      className="input-field"
                    />
                  </div>

                  <div className="dose-action-field">
                    <button
                      type="button"
                      disabled={formData.doses.length <= 1}
                      className="btn-remove-dose"
                      onClick={() => handleRemoveDoseTime(d.id)}
                      title="Remove this dose"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hardware & Storage Safety Thresholds */}
          <div className="form-section">
            <h4 className="section-title">
              <ShieldCheck size={16} /> ESP32 Storage & Stock Telemetry
            </h4>
            <div className="form-grid-3">
              <div className="form-group">
                <label>Current Stock (Pills)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.qty}
                  onChange={e => setFormData({ ...formData, qty: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Low-Stock Alert Level</label>
                <input
                  type="number"
                  min="1"
                  value={formData.minQty}
                  onChange={e => setFormData({ ...formData, minQty: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiry}
                  onChange={e => setFormData({ ...formData, expiry: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="form-grid-3" style={{ marginTop: "12px" }}>
              <div className="form-group">
                <label>Min Safe Temp (°C)</label>
                <input
                  type="number"
                  value={formData.tempMin}
                  onChange={e => setFormData({ ...formData, tempMin: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Max Safe Temp (°C)</label>
                <input
                  type="number"
                  value={formData.tempMax}
                  onChange={e => setFormData({ ...formData, tempMax: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Max Safe Humidity (%RH)</label>
                <input
                  type="number"
                  value={formData.rhMax}
                  onChange={e => setFormData({ ...formData, rhMax: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Pause Schedule Toggle */}
          <div className="pause-schedule-section">
            <div className="pause-toggle-wrap">
              <input
                type="checkbox"
                id="pauseToggle"
                checked={formData.paused}
                onChange={e => setFormData({ ...formData, paused: e.target.checked })}
              />
              <label htmlFor="pauseToggle" className="pause-label-text">
                <b>Pause this medication schedule</b>
                <small>Temporarily stops dispense alarms and pending dose queue without deleting the profile</small>
              </label>
            </div>

            {formData.paused && (
              <div className="form-group" style={{ marginTop: "10px" }}>
                <label>Reason for Pausing (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Doctor recommendation, temporary medical hold"
                  value={formData.pausedReason || ""}
                  onChange={e => setFormData({ ...formData, pausedReason: e.target.value })}
                  className="input-field"
                />
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="modal-actions-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save">
              <Check size={16} /> {initialData ? "Save Changes" : "Create Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
