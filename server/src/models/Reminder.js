import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    medicineName: String,
    dosage: String,
    /** HH:mm 24h */
    scheduleTime: String,
    /** morning | afternoon | evening | night */
    timeSlot: { type: String, default: "" },
    scheduleLabel: { type: String, default: "custom" },
    enabled: { type: Boolean, default: true },
    nextRunAt: Date,
    lastNotifiedAt: Date,
    adherenceLogs: [
      {
        at: Date,
        status: { type: String, enum: ["taken", "missed", "snoozed"], default: "taken" },
      },
    ],
  },
  { timestamps: true }
);

export const Reminder = mongoose.model("Reminder", reminderSchema);

