export enum ICampaignStatus {
  Active = "Active",
  Draft = "Draft",
}

export enum ICampaignTargetType {
  all = "all",
  product = "product",
  collection = "collection",
}

export enum ICampaignPlacement {
  product = "product",
  cart = "cart",
  home = "home",
}

export interface ICampaign {
  _id?: string;
  shop: string;
  title: string;
  status: ICampaignStatus;
  targetType: ICampaignTargetType;
  placement: ICampaignPlacement;

  selectedCollections?: string[] | null;
  targetProducts?: string[];

  selectedVariantId?: string | null;
  selectedProductHandle?: string | null;

  heading?: string | null;
  description?: string | null;
  showImage: boolean;

  showPrice: boolean;
  preCheck: boolean;
  showVariantSelector: boolean;

  backgroundColor: string;
  borderColor: string;
  backgroundColorActive: string;
  padding: number;
  borderRadius: number;
  imageSize: number;

  metadata?: string | null;

  createdAt: Date;
  updatedAt: Date;
}
