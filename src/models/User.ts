import mongoose, { Schema } from "mongoose";

if (mongoose.models.User) {
  delete mongoose.models.User;
}

const userSchema = new Schema(
  {
    name:     { type: String, required: true },
    username: { type: String, required: true, unique: true }, // 🔥 NEW
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:     { type: String, required: true, default: "Employee" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;