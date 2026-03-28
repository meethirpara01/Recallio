import mongoose from "mongoose";

const SavedItemSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        url: {
            type: String,
            required: true
        },
        normalizedUrl: {
            type: String,
            required: true
        },
        domain: {
            type: String,
            required: true
        },
        title: {
            type: String
        },
        description: {
            type: String
        },
        extractedText: {
            type: String
        },
        status: {
            type: String,
            enum: ["PENDING", "PROCESSING", "PROCESSED", "FAILED", "DELETED"],
            default: "PENDING"
        },
        contentQuality: {
            type: String,
            enum: ["good", "partial", "failed"],
        },
        retryCount: { type: Number, default: 0 },
        errorMessage: { type: String },
    },
    { timestamps: true }
);

SavedItemSchema.index({ userId: 1, createdAt: -1 });
SavedItemSchema.index(
    { userId: 1, normalizedUrl: 1 },
    { unique: true }
);

const SavedItem = mongoose.model("SavedItem", SavedItemSchema);
export default SavedItem;