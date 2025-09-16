import type { ICampaign } from "app/types/campaigns";
import Campaigns from "../models/campaign";

export const getCampaigns = async (
  where: any,
  sort: any = { updatedAt: -1 },
) => {
  try {
    const campaigns = await Campaigns.find(where).sort(sort).exec();
    return campaigns || [];
  } catch (error: any) {
    console.error("Error fetching campaigns:", error.message);
    throw new Error(`Failed to fetch campaigns: ${error.message}`);
  }
};

export const getCampaignsByStatus = async (status: string) => {
  try {
    const campaigns = await Campaigns.find({ status }).exec();
    return campaigns;
  } catch (error) {
    console.error("Error fetching campaigns by status:", error);
    throw new Error("Failed to fetch campaigns");
  }
};

export const getActiveCampaignsByShop = async (shop: string) => {
  try {
    const campaigns = await Campaigns.find({ shop, status: "Active" }).exec();
    return campaigns;
  } catch (error) {
    console.error("Error fetching active campaigns by shop:", error);
    throw new Error("Failed to fetch active campaigns");
  }
};

export const countCampaigns = async (where: any) => {
  try {
    const count = await Campaigns.countDocuments(where).exec();
    return count;
  } catch (error) {
    console.error("Error counting campaigns:", error);
    throw new Error("Failed to count campaigns");
  }
};

export const createCampaign = async (campaignData: Partial<ICampaign>) => {
  try {
    const campaign = new Campaigns(campaignData);
    await campaign.save();
    return campaign;
  } catch (error) {
    console.error("Error creating campaign:", error);
    throw new Error("Failed to create campaign");
  }
};

export const updateCampaignById = async (id: string, data: any) => {
  try {
    const campaign = await Campaigns.findByIdAndUpdate(id, data, {
      new: true,
    }).exec();
    return campaign;
  } catch (error) {
    console.error("Error updating campaign:", error);
    throw new Error("Failed to update campaign");
  }
};

export const deleteCampaignById = async (id: string) => {
  try {
    const campaign = await Campaigns.findByIdAndDelete(id).exec();
    return campaign;
  } catch (error) {
    console.error("Error deleting campaign:", error);
    throw new Error("Failed to delete campaign");
  }
};

export const getCampaignById = async (id: string, shop: string) => {
  try {
    const campaign = await Campaigns.findOne({ _id: id, shop }).exec();
    return campaign ? campaign.toObject() : null;
  } catch (error) {
    console.error("Error fetching campaign by ID:", error);
    throw new Error("Failed to fetch campaign");
  }
};

export const deleteCampaignByShop = async (shop: string) => {
  try {
    const result = await Campaigns.deleteMany({ shop }).exec();
    return result.deletedCount;
  } catch (error) {
    console.error("Error deleting campaigns by shop:", error);
    throw new Error("Failed to delete campaigns");
  }
};

export const getCampaignsWithPagination = async (
  where: any,
  page: number = 1,
  limit: number = 10,
) => {
  try {
    const campaigns = await Campaigns.find(where)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ updatedAt: -1 })
      .exec();
    const total = await Campaigns.countDocuments(where).exec();
    return { campaigns, total };
  } catch (error) {
    console.error("Error fetching campaigns with pagination:", error);
    throw new Error("Failed to fetch campaigns");
  }
};

export const updateCampaignStatusByShop = async (
  shop: string,
  status: string,
) => {
  try {
    const result = await Campaigns.updateMany({ shop }, { status }).exec();
    return result.modifiedCount;
  } catch (error) {
    console.error("Error updating campaign status by shop:", error);
    throw new Error("Failed to update campaign status");
  }
};
