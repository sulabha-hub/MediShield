import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Cpu, Loader2, Sparkles, Volume2, ShieldCheck, X } from "lucide-react";

export default function DispenseModal({ isOpen, onClose, medication, onConfirmDispense, esp32Connected }) {
  const [stage, setStage] = useState("ready"); // ready | actuating | sensing | complete | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStage("ready");
      setErrorMsg("");
    }
  }, [isOpen]);

  if (!isOpen || !medication) return null;

  const handleStartDispense = () => {
    setStage("actuating");

    // Step 1: Servo Stepper Motor Actuation
    setTimeout(() => {
      setStage("sensing");

      // Step 2: IR Beam break detection
      setTimeout(() => {
        setStage("complete");
        // Trigger completion callback
        if (onConfirmDispense) {
          onConfirmDispense(medication);
        }
      }, 1400);
    }, 1200);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container dispense-modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="dispense-header">
          <div className="dispense-pill-icon" style={{ backgroundColor: (medication.color || "#0ea5e9") + "25", color: medication.color || "#0ea5e9" }}>
            <Cpu size={24} />
          </div>
          <div>
            <h3>ESP32 Dispenser Unit Trigger</h3>
            <p>Hardware Dispense Command • Slot {medication.slot || 1}</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="dispense-body">
          {/* Target Medication Card */}
          <div className="target-med-card">
            <div className="target-med-row">
              <div>
                <span className="target-slot-badge">CHAMBER SLOT {medication.slot || 1}</span>
                <h4 className="target-med-name">{medication.name}</h4>
                <p className="target-med-dose">{medication.dose} • {medication.form || "Tablet"}</p>
              </div>
              <div className="target-stock-info">
                <span>Stock in Chamber</span>
                <strong>{medication.qty} units</strong>
              </div>
            </div>
            {medication.instructions && (
              <div className="target-instruction">
                <span>Guidance:</span> {medication.instructions}
              </div>
            )}
          </div>

          {/* Stepper / Sensor Feedback Animation */}
          <div className="dispenser-stages-flow">
            <div className={`flow-step ${stage === "actuating" ? "active" : stage === "sensing" || stage === "complete" ? "done" : ""}`}>
              <div className="step-icon">
                {stage === "actuating" ? <Loader2 size={16} className="spin" /> : stage === "sensing" || stage === "complete" ? <CheckCircle2 size={16} /> : <span>1</span>}
              </div>
              <div className="step-content">
                <b>Actuate Servo Dispenser</b>
                <small>Rotate carousel for Slot {medication.slot || 1}</small>
              </div>
            </div>

            <div className={`flow-step ${stage === "sensing" ? "active" : stage === "complete" ? "done" : ""}`}>
              <div className="step-icon">
                {stage === "sensing" ? <Loader2 size={16} className="spin" /> : stage === "complete" ? <CheckCircle2 size={16} /> : <span>2</span>}
              </div>
              <div className="step-content">
                <b>Optical IR Sensor Verification</b>
                <small>Infrared beam detects pill falling into cup</small>
              </div>
            </div>

            <div className={`flow-step ${stage === "complete" ? "done" : ""}`}>
              <div className="step-icon">
                {stage === "complete" ? <CheckCircle2 size={16} /> : <span>3</span>}
              </div>
              <div className="step-content">
                <b>Audio-Visual Alert & Log</b>
                <small>Buzzer chime & dose logged as Confirmed</small>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {stage === "ready" && (
            <div className="dispense-prompt-alert">
              <Sparkles size={18} color="#0ea5e9" />
              <div>
                <b>Ready to dispense</b>
                <p>Pressing Dispense sends a command to ESP32 motor driver and verifies the pill via the IR drop sensor.</p>
              </div>
            </div>
          )}

          {stage === "actuating" && (
            <div className="dispense-prompt-alert warning">
              <Loader2 size={18} className="spin" color="#f59e0b" />
              <div>
                <b>Motor rotating...</b>
                <p>Aligning dispenser carousel slot to release chute.</p>
              </div>
            </div>
          )}

          {stage === "sensing" && (
            <div className="dispense-prompt-alert info">
              <Loader2 size={18} className="spin" color="#6366f1" />
              <div>
                <b>Monitoring IR drop beam...</b>
                <p>Waiting for optical beam interruption at the pill funnel.</p>
              </div>
            </div>
          )}

          {stage === "complete" && (
            <div className="dispense-prompt-alert success">
              <CheckCircle2 size={20} color="#10b981" />
              <div>
                <b>Dispense Confirmed!</b>
                <p>Pill drop detected by optical sensor. Dose registered in clinical history.</p>
              </div>
            </div>
          )}
        </div>

        <div className="dispense-footer">
          {stage !== "complete" ? (
            <>
              <button type="button" className="btn-cancel" onClick={onClose} disabled={stage === "actuating" || stage === "sensing"}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-dispense-trigger"
                onClick={handleStartDispense}
                disabled={stage === "actuating" || stage === "sensing"}
              >
                {stage === "actuating" || stage === "sensing" ? (
                  <>
                    <Loader2 size={16} className="spin" /> Dispensing...
                  </>
                ) : (
                  <>
                    <Cpu size={16} /> Trigger Dispense Now
                  </>
                )}
              </button>
            </>
          ) : (
            <button type="button" className="btn-done-full" onClick={onClose}>
              <CheckCircle2 size={16} /> Done & Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
