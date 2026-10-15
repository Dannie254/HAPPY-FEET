export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  level: number;
  path: string;
  image?: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  children?: Category[];
}

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Variant {
  _id: string;
  sku: string;
  attributes: Array<{ name: string; value: string; displayName?: string }>;
  price: number;
  compareAtPrice?: number;
  stock: number;
  availableStock: number;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  images: string[];
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  subcategoryId?: string;
  brand?: string;
  gender?: 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS';
  tags: string[];
  images: ProductImage[];
  basePrice: number;
  compareAtPrice?: number;
  currency: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'OUT_OF_STOCK';
  featured: boolean;
  variants?: Variant[];
  variantsCount?: number;
  minVariantPrice?: number;
  maxVariantPrice?: number;
}

export interface SearchFilters {
  categoryId?: string;
  subcategoryId?: string;
  brand?: string;
  gender?: 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS';
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  inStock?: boolean;
  featured?: boolean;
}

export interface SearchParams {
  q?: string;
  categoryId?: string;
  subcategoryId?: string;
  brand?: string;
  gender?: 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS';
  minPrice?: number;
  maxPrice?: number;
  tags?: string;
  inStock?: boolean;
  featured?: boolean;
  page?: number;
  limit?: number;
  sort?:
    | 'relevance'
    | 'price_asc'
    | 'price_desc'
    | 'newest'
    | 'oldest'
    | 'popular'
    | 'name_asc'
    | 'name_desc';
  isActive?: boolean;
  level?: number;
}

export interface AutocompleteSuggestion {
  type: 'product' | 'category' | 'query';
  text: string;
  id?: string;
  slug?: string;
  image?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  product: Pick<Product, '_id' | 'name' | 'slug' | 'images' | 'basePrice' | 'compareAtPrice'>;
  variant: Pick<Variant, '_id' | 'sku' | 'attributes' | 'price' | 'compareAtPrice' | 'availableStock' | 'stock' | 'status' | 'images'>;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';
  emailVerified: boolean;
  phone?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  items: Array<{
    productId: string;
    variantId: string;
    name: string;
    sku: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  shippingAddress: Address;
  billingAddress?: Address;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CheckoutData {
  email: string;
  phone: string;
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: 'mpesa';
  notes?: string;
}
