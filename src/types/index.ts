export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  phone?: string;
  addresses?: ShippingAddress[];
  createdAt?: string;
}

export interface ShippingAddress {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface ProductSpec {
  name: string;
  value: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  rating: number;
  ratingCount: number;
  stock: number;
  images: string[];
  featured?: boolean;
  tags?: string[];
  specs?: ProductSpec[];
  sku?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderTimelineEvent {
  status: OrderStatus;
  title: string;
  description: string;
  location?: string;
  timestamp: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: 'card' | 'paypal' | 'apple_pay' | 'cod' | 'test_pay';
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: string;
  timeline: OrderTimelineEvent[];
  notes?: string;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description: string;
  image: string;
  itemCount?: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userEmail?: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
  helpfulCount?: number;
  helpfulUserIds?: string[];
  recommend?: boolean;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  maxDiscount?: number;
  minOrder: number;
  description: string;
}
