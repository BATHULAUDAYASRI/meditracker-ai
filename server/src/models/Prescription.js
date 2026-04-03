import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    name: String,
    dosage: String,
    timing: String,
    durationDays: Number,
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    fileName: String,
    fileUrl: String,
    extractedText: String,
    medications: [medicationSchema],
    aiSummary: String,
    suggestedNextCheckup: Date,
  },
  { timestamps: true }
);

export const Prescription = mongoose.model("Prescription", prescriptionSchema);

