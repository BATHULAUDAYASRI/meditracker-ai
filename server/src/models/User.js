import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["patient", "doctor"], required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, default: "" },
    authProvider: { type: String, enum: ["email", "google"], default: "email" },
    phone: { type: String, default: "" },
    preferredLanguage: { type: String, default: "en" },
    doctorProfile: {
      clinicName: { type: String, default: "" },
      specialization: { type: String, default: "" },
    },
    patientProfile: {
      age: Number,
      weightKg: Number,
      heightCm: Number,
      bmi: Number,
      bmiCategory: String,
      smoke: Boolean,
      drink: Boolean,
      diabetes: Boolean,
      pastMedicalHistory: String,
      healthRiskFlags: [String],
      checkupVisits: [
        {
          visitedAt: Date,
          doctorName: String,
          notes: String,
          nextVisit: Date,
        },
      ],
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);

