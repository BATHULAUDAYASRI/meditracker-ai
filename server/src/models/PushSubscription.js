import mongoose from "mongoose";

const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subscription: { type: Object, required: true },
  },
  { timestamps: true }
);

export const PushSubscription = mongoose.model("PushSubscription", pushSubscriptionSchema);

