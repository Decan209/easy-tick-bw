import type { ICampaign } from "app/types/campaigns";
import {
  ICampaignPlacement,
  ICampaignStatus,
  ICampaignTargetType,
} from "app/types/campaigns";
import mongoose, { Schema } from "mongoose";

const CampaignSchema: Schema = new Schema(
  {
    shop: { type: String, required: true },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(ICampaignStatus),
      default: ICampaignStatus.Draft,
    },

    targetType: {
      type: String,
      enum: Object.values(ICampaignTargetType),
      default: ICampaignTargetType.all,
    },

    placement: {
      type: String,
      enum: Object.values(ICampaignPlacement),
      default: ICampaignPlacement.product,
    },

    selectedCollections: [String],
    targetProducts: [String],

    selectedVariantId: { type: String, default: null },
    selectedProductId: { type: String, default: null },

    selectedProductData: { type: String, default: null },
    selectedVariantData: { type: String, default: null },

    heading: { type: String, default: null },
    description: { type: String },
    imageUrl: { type: String, default: null },
    showImage: { type: Boolean, default: true },

    price: { type: String, default: null },
    showPrice: { type: Boolean, default: true },
    preCheck: { type: Boolean, default: false },

    backgroundColor: { type: String, default: "#FFFFFF" },
    borderColor: { type: String, default: "#E1E3E5" },
    backgroundColorActive: { type: String, default: "#0066CC" },
    padding: { type: Number, default: 16, min: 0, max: 100 },
    borderRadius: { type: Number, default: 8, min: 0, max: 100 },
    imageSize: { type: Number, default: 50, min: 20, max: 100 },

    images: [String],
    shopifyDescription: { type: String, default: null },

    metadata: { type: String, default: null },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    index: { shop: 1, status: 1 },
  },
);

CampaignSchema.index({ shop: 1, status: 1 });
CampaignSchema.index({ shop: 1, targetType: 1 });

export default mongoose.models.campaigns ||
  mongoose.model<ICampaign>("campaigns", CampaignSchema);
