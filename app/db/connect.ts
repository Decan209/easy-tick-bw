import mongoose from "mongoose";

const uri = process.env.DATABASE_URL || "mongodb://localhost:27017/tick-one";
export const connectToDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
