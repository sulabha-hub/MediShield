// Seed data for MediShield Smart IoT Medicine Dispenser

export const initialPatient = {
  id: "P-8842",
  name: "Rakshitha Rao",
  age: 58,
  gender: "Female",
  bloodGroup: "O+",
  patientId: "MED-2026-8842",
  primaryPhysician: "Dr. Arvind Sharma, MD (Internal Medicine)",
  clinicPhone: "+91 98450 12345",
  pharmacyPhone: "+91 80 2345 6789",
  conditions: ["Type 2 Diabetes Mellitus", "Essential Hypertension", "Mild Hyperlipidemia"],
  allergies: ["Penicillin", "Sulfa drugs"],
  emergencyContact: {
    name: "Suresh Rao (Spouse)",
    relation: "Spouse",
    phone: "+91 98450 67890"
  },
  doctorNotes: "Ensure Metformin is taken with or immediately after meals. Monitor blood pressure twice weekly. If morning dizziness occurs, withhold evening Lisinopril and contact clinic immediately."
};

export const initialMedications = [
  {
    id: "med-1",
    name: "Metformin HCl",
    dose: "500 mg",
    form: "Tablet",
    slot: 1,
    color: "#0ea5e9", // Sky blue
    shape: "oval",
    instructions: "Take with meals to minimize gastrointestinal discomfort",
    repeatType: "daily", // daily | specific_days | interval | prn
    repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    intervalDays: 1,
    paused: false,
    pausedReason: "",
    doses: [
      { id: "d-1", time: "08:00", label: "Morning (Breakfast)", amount: 1 },
      { id: "d-2", time: "20:30", label: "Night (Dinner)", amount: 1 }
    ],
    qty: 48,
    minQty: 10,
    expiry: "2027-08-15",
    tempMin: 15,
    tempMax: 25,
    rhMax: 60,
    chamberExposureHours: 0.8,
    prescribedBy: "Dr. Arvind Sharma"
  },
  {
    id: "med-2",
    name: "Lisinopril",
    dose: "10 mg",
    form: "Tablet",
    slot: 2,
    color: "#ec4899", // Pink
    shape: "round",
    instructions: "Take once daily in the morning with a full glass of water",
    repeatType: "daily",
    repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    intervalDays: 1,
    paused: false,
    pausedReason: "",
    doses: [
      { id: "d-3", time: "09:00", label: "Morning (Post-meal)", amount: 1 }
    ],
    qty: 22,
    minQty: 7,
    expiry: "2027-03-30",
    tempMin: 15,
    tempMax: 30,
    rhMax: 65,
    chamberExposureHours: 0.0,
    prescribedBy: "Dr. Arvind Sharma"
  },
  {
    id: "med-3",
    name: "Atorvastatin Calcium",
    dose: "20 mg",
    form: "Film-coated tablet",
    slot: 3,
    color: "#8b5cf6", // Purple
    shape: "capsule",
    instructions: "Take at bedtime. Avoid grapefruit and grapefruit juice",
    repeatType: "daily",
    repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    intervalDays: 1,
    paused: false,
    pausedReason: "",
    doses: [
      { id: "d-4", time: "21:30", label: "Bedtime", amount: 1 }
    ],
    qty: 18,
    minQty: 8,
    expiry: "2026-12-31",
    tempMin: 15,
    tempMax: 28,
    rhMax: 60,
    chamberExposureHours: 1.2,
    prescribedBy: "Dr. Arvind Sharma"
  },
  {
    id: "med-4",
    name: "Vitamin D3 (Cholecalciferol)",
    dose: "60,000 IU",
    form: "Softgel",
    slot: 4,
    color: "#f59e0b", // Amber
    shape: "round",
    instructions: "Weekly booster dose. Take on Sunday morning with milk",
    repeatType: "specific_days",
    repeatDays: ["Sun"],
    intervalDays: 7,
    paused: false,
    pausedReason: "",
    doses: [
      { id: "d-5", time: "10:00", label: "Sunday Morning", amount: 1 }
    ],
    qty: 5,
    minQty: 2,
    expiry: "2026-11-15",
    tempMin: 15,
    tempMax: 25,
    rhMax: 55,
    chamberExposureHours: 2.5,
    prescribedBy: "Dr. Arvind Sharma"
  },
  {
    id: "med-5",
    name: "Pantoprazole Gastro-Resistant",
    dose: "40 mg",
    form: "Tablet",
    slot: 1,
    color: "#10b981", // Emerald
    shape: "oval",
    instructions: "Take 30 minutes before morning breakfast with plain water",
    repeatType: "daily",
    repeatDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    intervalDays: 1,
    paused: true,
    pausedReason: "Course completed - On hold pending doctor follow-up",
    doses: [
      { id: "d-6", time: "07:30", label: "Early Morning (Empty Stomach)", amount: 1 }
    ],
    qty: 14,
    minQty: 5,
    expiry: "2027-05-20",
    tempMin: 15,
    tempMax: 30,
    rhMax: 65,
    chamberExposureHours: 0.0,
    prescribedBy: "Dr. Arvind Sharma"
  }
];

export const initialDoseHistory = [
  {
    id: "hist-101",
    medId: "med-1",
    medName: "Metformin HCl",
    dose: "500 mg",
    amount: 1,
    scheduledTime: "08:00 AM",
    scheduledDateTime: "2026-10-22T08:00:00",
    date: "Today, 22 Oct",
    status: "confirmed", // "confirmed" | "taken" | "pending" | "missed"
    verificationMethod: "IR Sensor (Slot 1 Drop Verified)",
    confirmedAt: "08:02 AM",
    slot: 1,
    notes: "Dispensed and confirmed fallen into cup via optical beam"
  },
  {
    id: "hist-102",
    medId: "med-2",
    medName: "Lisinopril",
    dose: "10 mg",
    amount: 1,
    scheduledTime: "09:00 AM",
    scheduledDateTime: "2026-10-22T09:00:00",
    date: "Today, 22 Oct",
    status: "taken",
    verificationMethod: "Patient App & RFID Tag",
    confirmedAt: "09:05 AM",
    slot: 2,
    notes: "Patient scanned RFID tag and took dose"
  },
  {
    id: "hist-103",
    medId: "med-1",
    medName: "Metformin HCl",
    dose: "500 mg",
    amount: 1,
    scheduledTime: "08:30 PM",
    scheduledDateTime: "2026-10-22T20:30:00",
    date: "Today, 22 Oct",
    status: "pending",
    verificationMethod: "Awaiting Schedule",
    confirmedAt: null,
    slot: 1,
    notes: "Scheduled for tonight after dinner"
  },
  {
    id: "hist-104",
    medId: "med-3",
    medName: "Atorvastatin Calcium",
    dose: "20 mg",
    amount: 1,
    scheduledTime: "09:30 PM",
    scheduledDateTime: "2026-10-22T21:30:00",
    date: "Today, 22 Oct",
    status: "pending",
    verificationMethod: "Awaiting Schedule",
    confirmedAt: null,
    slot: 3,
    notes: "Scheduled for bedtime"
  },
  {
    id: "hist-105",
    medId: "med-3",
    medName: "Atorvastatin Calcium",
    dose: "20 mg",
    amount: 1,
    scheduledTime: "09:30 PM",
    scheduledDateTime: "2026-10-21T21:30:00",
    date: "Yesterday, 21 Oct",
    status: "confirmed",
    verificationMethod: "IR Sensor (Slot 3 Drop Verified)",
    confirmedAt: "09:31 PM",
    slot: 3,
    notes: "Hardware dispensed automatically at bedtime schedule"
  },
  {
    id: "hist-106",
    medId: "med-1",
    medName: "Metformin HCl",
    dose: "500 mg",
    amount: 1,
    scheduledTime: "08:30 PM",
    scheduledDateTime: "2026-10-21T20:30:00",
    date: "Yesterday, 21 Oct",
    status: "taken",
    verificationMethod: "Manual Dispense Button",
    confirmedAt: "08:35 PM",
    slot: 1,
    notes: "Patient pressed physical front dispense button"
  },
  {
    id: "hist-107",
    medId: "med-2",
    medName: "Lisinopril",
    dose: "10 mg",
    amount: 1,
    scheduledTime: "09:00 AM",
    scheduledDateTime: "2026-10-21T09:00:00",
    date: "Yesterday, 21 Oct",
    status: "confirmed",
    verificationMethod: "IR Sensor (Slot 2 Drop Verified)",
    confirmedAt: "09:03 AM",
    slot: 2,
    notes: "Dispenser cycle complete, IR beam triggered"
  },
  {
    id: "hist-108",
    medId: "med-1",
    medName: "Metformin HCl",
    dose: "500 mg",
    amount: 1,
    scheduledTime: "08:00 AM",
    scheduledDateTime: "2026-10-21T08:00:00",
    date: "Yesterday, 21 Oct",
    status: "missed",
    verificationMethod: "Expired Grace Window",
    confirmedAt: null,
    slot: 1,
    notes: "Dose window exceeded by 90 minutes. Alert sent to caregiver"
  },
  {
    id: "hist-109",
    medId: "med-4",
    medName: "Vitamin D3 (Cholecalciferol)",
    dose: "60,000 IU",
    amount: 1,
    scheduledTime: "10:00 AM",
    scheduledDateTime: "2026-10-18T10:00:00",
    date: "18 Oct 2026",
    status: "confirmed",
    verificationMethod: "IR Sensor (Slot 4 Drop Verified)",
    confirmedAt: "10:04 AM",
    slot: 4,
    notes: "Weekly booster dispensed successfully"
  },
  {
    id: "hist-110",
    medId: "med-1",
    medName: "Metformin HCl",
    dose: "500 mg",
    amount: 1,
    scheduledTime: "08:30 PM",
    scheduledDateTime: "2026-10-20T20:30:00",
    date: "20 Oct 2026",
    status: "taken",
    verificationMethod: "Patient App Confirm",
    confirmedAt: "08:42 PM",
    slot: 1,
    notes: "Confirmed taken via mobile dashboard"
  }
];

export const initialTelemetry = [
  { time: "06:00", temp: 22.1, humidity: 48, status: "optimal" },
  { time: "08:00", temp: 22.8, humidity: 50, status: "optimal" },
  { time: "10:00", temp: 23.5, humidity: 52, status: "optimal" },
  { time: "12:00", temp: 24.2, humidity: 53, status: "optimal" },
  { time: "14:00", temp: 24.9, humidity: 55, status: "optimal" },
  { time: "16:00", temp: 24.1, humidity: 54, status: "optimal" },
  { time: "18:00", temp: 23.4, humidity: 51, status: "optimal" }
];

export const initialDeviceConfig = {
  ip: "192.168.1.105",
  port: 80,
  firmware: "v2.4.1 (ESP32-S3 FreeRTOS)",
  board: "ESP32-WROOM-32 IoT Dispenser",
  mac: "24:6F:28:B4:9C:12",
  wifiSsid: "MediShield_IoT_Secure",
  rssi: -58, // dBm
  slotsTotal: 4,
  irSensorsActive: 4,
  servoCalibrated: true,
  lastPing: "Just now"
};
