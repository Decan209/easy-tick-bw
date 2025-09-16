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

  selectedCollectionId?: string | null;
  targetProducts?: string[];

  selectedVariantId?: string | null;
  selectedProductId?: string | null;

  selectedProductData?: string | null;
  selectedVariantData?: string | null;

  heading?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  showImage: boolean;

  price?: string | null;
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
