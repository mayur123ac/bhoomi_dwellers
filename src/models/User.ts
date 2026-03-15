import mongoose, { Schema, models } from "mongoose";

// 🔥 THE NUCLEAR OPTION: Force Mongoose to drop the old cached schema
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Notice how there is NO enum here anymore
    role: { 
      type: String, 
      required: true, 
      default: "Employee" 
    },
    isActive: { type: Boolean, default: true }, 
  },
  { timestamps: true } 
);

const User = mongoose.model("User", userSchema);
export default User;