export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  images: Array<{ url: string; altText?: string }>;
  variants: IShopifyVariant[];
}

export interface IShopifyVariant {
  id: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  inventoryQuantity: number;
}

export interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
}

export interface IFormData {
  title: string;
  status: "Active" | "Draft";
  placement: "product" | "cart" | "home";
  targetType: string;
  selectedCollection: string;
  selectedProducts: string[];
  selectedVariant: string;
  selectedProduct: string;
  selectedProductData: string;
  selectedVariantData: string;
  heading: string;
  description: string;
  imageUrl: string;
  showImage: boolean;
  showPrice: boolean;
  preCheck: boolean;
  backgroundColor: string;
  price: string;
  borderColor: string;
  backgroundColorActive: string;
  padding: number;
  borderRadius: number;
  imageSize: number;
  checkboxBackgroundColor: string;
  checkboxBorderColor: string;
  checkboxActiveColor: string;
  checkboxSize: number;
  fontSize: number;
  fontColor: string;
  fontWeight: string;
}
