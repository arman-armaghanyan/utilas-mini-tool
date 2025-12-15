import mongoose from "mongoose";

const DescriptionBlockSchema = new mongoose.Schema({
  image: { type: String, required: true },
  text: { type: String, required: true },
  orientation: {
    type: String,
    enum: ["left", "right"],
    required: true,
  },
});

const miniToolSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: [DescriptionBlockSchema],
      required: true,
      trim: true,
    },
    thumbnail: {
      type: String,
      required: true,
      trim: true,
    },
    iframeSlug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    iframeHtml: {
      type: String,
    },
    reactAppUrl: {
      type: String,
      trim: true,
    },
    reactAppBlobUrl: {
      type: String,
      trim: true,
    },
    appType: {
      type: String,
      default: 'html',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Note: id and iframeSlug already have unique: true which creates indexes automatically
// No need for explicit index() calls

// Ensure virtuals are included in JSON output
miniToolSchema.set('toJSON', { virtuals: true });
miniToolSchema.set('toObject', { virtuals: true });

const MiniToolDB = mongoose.models.MiniTool || mongoose.model("MiniTool", miniToolSchema);

export default MiniToolDB;

