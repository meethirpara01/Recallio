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
        image: {
            type: String
        },
        extractedText: {
            type: String
        },
        status: {
            type: String,
            enum: ["pending", "processing", "processed", "failed", "deleted"],
            default: "pending"
        },
        contentQuality: {
            type: String,
            enum: ["good", "partial", "failed"],
        },
        retryCount: { type: Number, default: 0 },
        errorMessage: { type: String },
        tags: [String],
        relatedItems: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "SavedItem"
            }
        ],
        embedding: {
            type: [Number],
        },
        lastProcessedAt: Date,
    },
    { timestamps: true }
);

SavedItemSchema.index({ userId: 1, createdAt: -1 });
SavedItemSchema.index(
    { userId: 1, normalizedUrl: 1 },
    { unique: true }
);

const ItemModel = mongoose.model("SavedItem", SavedItemSchema);
export default ItemModel;