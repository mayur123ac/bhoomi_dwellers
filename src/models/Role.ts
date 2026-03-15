import mongoose, { Schema, models } from "mongoose";

const roleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const Role = models.Role || mongoose.model("Role", roleSchema);
export default Role;