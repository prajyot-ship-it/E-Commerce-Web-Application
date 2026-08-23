import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  increment,
} from 'firebase/firestore';
import { db, cleanForFirestore } from '../lib/firebase';
import { Order, OrderStatus, OrderTimelineEvent, ShippingAddress, CartItem } from '../types';
import { productService } from './productService';

const ORDERS_COLLECTION = 'orders';

// Helper to generate tracking carrier & dates
const CARRIERS = ['FedEx Express', 'DHL Express', 'UPS Ground', 'Nexus Priority Express'];

export const orderService = {
  // Generate random order number like NX-92841
  generateOrderNumber(): string {
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `NX-${rand}`;
  },

  // Generate tracking number like TRK-849204US
  generateTrackingNumber(): string {
    const code = Math.floor(10000000 + Math.random() * 90000000);
    return `TRK-${code}US`;
  },

  // Create a new order
  async createOrder(params: {
    userId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: ShippingAddress;
    items: CartItem[];
    subtotal: number;
    discount: number;
    shippingFee: number;
    tax: number;
    total: number;
    paymentMethod: 'card' | 'paypal' | 'apple_pay' | 'cod' | 'test_pay';
    couponCode?: string;
  }): Promise<Order> {
    const orderId = 'ord-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const orderNumber = this.generateOrderNumber();
    const trackingNumber = this.generateTrackingNumber();
    const now = new Date();
    const carrier = CARRIERS[Math.floor(Math.random() * CARRIERS.length)];

    // Estimated delivery 3 to 5 days from now
    const estDate = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    const estDeliveryStr = estDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const initialTimeline: OrderTimelineEvent[] = [
      {
        status: 'pending',
        title: 'Order Confirmed & Placed',
        description: `Order ${orderNumber} received. Payment verified via ${params.paymentMethod.toUpperCase()}.`,
        location: `${params.shippingAddress.city}, ${params.shippingAddress.state}`,
        timestamp: now.toISOString(),
      },
      {
        status: 'processing',
        title: 'Processing at Fulfillment Hub',
        description: 'Items gathered, safety-inspected, and packed in eco-friendly packaging.',
        location: 'Silicon Valley Logistics Hub, CA',
        timestamp: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
      },
    ];

    const orderData: Order = {
      id: orderId,
      orderNumber,
      userId: params.userId || 'guest',
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      shippingAddress: params.shippingAddress,
      items: params.items.map((item) => ({
        productId: item.product.id,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.images[0] || '',
        category: item.product.category,
      })),
      subtotal: params.subtotal,
      discount: params.discount,
      shippingFee: params.shippingFee,
      tax: params.tax,
      total: params.total,
      status: 'processing',
      paymentMethod: params.paymentMethod,
      paymentStatus: 'paid',
      trackingNumber,
      carrier,
      estimatedDelivery: estDeliveryStr,
      timeline: initialTimeline,
      couponCode: params.couponCode || '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // Save order in Firestore with sanitized data (no undefined fields)
    try {
      const sanitizedOrder = cleanForFirestore(orderData);
      await setDoc(doc(db, ORDERS_COLLECTION, orderId), sanitizedOrder);

      // Decrement stock for purchased products
      for (const item of params.items) {
        try {
          const prodRef = doc(db, 'products', item.product.id);
          await updateDoc(prodRef, {
            stock: increment(-item.quantity),
          });
        } catch (e) {
          console.warn('Could not decrement stock in Firestore:', e);
        }
      }
    } catch (error) {
      console.error('Error saving order to Firestore:', error);
      // Still store in localStorage for offline resiliency
      const localOrders = JSON.parse(localStorage.getItem('nexus_local_orders') || '[]');
      localOrders.unshift(orderData);
      localStorage.setItem('nexus_local_orders', JSON.stringify(localOrders));
    }

    return orderData;
  },

  // Subscribe to user orders in real time
  subscribeToUserOrders(userId: string, callback: (orders: Order[]) => void) {
    try {
      const q = query(
        collection(db, ORDERS_COLLECTION),
        where('userId', '==', userId)
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const orders: Order[] = [];
          snapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() } as Order);
          });
          // Sort newest first
          orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          callback(orders);
        },
        (error) => {
          console.warn('User orders snapshot error, falling back:', error);
          const localOrders: Order[] = JSON.parse(localStorage.getItem('nexus_local_orders') || '[]');
          const filtered = localOrders.filter((o) => o.userId === userId || userId === 'guest');
          callback(filtered);
        }
      );
    } catch (err) {
      console.error('Failed to subscribe to user orders:', err);
      const localOrders: Order[] = JSON.parse(localStorage.getItem('nexus_local_orders') || '[]');
      callback(localOrders);
      return () => {};
    }
  },

  // Subscribe to all orders (Admin role)
  subscribeToAllOrders(callback: (orders: Order[]) => void) {
    try {
      const q = query(collection(db, ORDERS_COLLECTION));
      return onSnapshot(
        q,
        (snapshot) => {
          const orders: Order[] = [];
          snapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() } as Order);
          });
          orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          callback(orders);
        },
        (error) => {
          console.warn('All orders snapshot error:', error);
          const localOrders: Order[] = JSON.parse(localStorage.getItem('nexus_local_orders') || '[]');
          callback(localOrders);
        }
      );
    } catch (err) {
      console.error('Failed to subscribe to all orders:', err);
      const localOrders: Order[] = JSON.parse(localStorage.getItem('nexus_local_orders') || '[]');
      callback(localOrders);
      return () => {};
    }
  },

  // Search single order by Order ID, Order Number, or Tracking Number
  async findOrder(queryStr: string): Promise<Order | null> {
    const clean = queryStr.trim();
    if (!clean) return null;

    try {
      // 1. Direct doc ID
      const docRef = doc(db, ORDERS_COLLECTION, clean);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Order;
      }

      // 2. Query by orderNumber
      const qNum = query(collection(db, ORDERS_COLLECTION), where('orderNumber', '==', clean.toUpperCase()));
      const snapNum = await getDocs(qNum);
      if (!snapNum.empty) {
        const d = snapNum.docs[0];
        return { id: d.id, ...d.data() } as Order;
      }

      // 3. Query by trackingNumber
      const qTrk = query(collection(db, ORDERS_COLLECTION), where('trackingNumber', '==', clean.toUpperCase()));
      const snapTrk = await getDocs(qTrk);
      if (!snapTrk.empty) {
        const d = snapTrk.docs[0];
        return { id: d.id, ...d.data() } as Order;
      }

      // Check localStorage fallback
      const localOrders: Order[] = JSON.parse(localStorage.getItem('nexus_local_orders') || '[]');
      const found = localOrders.find(
        (o) =>
          o.id === clean ||
          o.orderNumber.toUpperCase() === clean.toUpperCase() ||
          o.trackingNumber.toUpperCase() === clean.toUpperCase()
      );
      return found || null;
    } catch (error) {
      console.warn('Error querying order:', error);
      const localOrders: Order[] = JSON.parse(localStorage.getItem('nexus_local_orders') || '[]');
      const found = localOrders.find(
        (o) =>
          o.id === clean ||
          o.orderNumber.toUpperCase() === clean.toUpperCase() ||
          o.trackingNumber.toUpperCase() === clean.toUpperCase()
      );
      return found || null;
    }
  },

  // Update order status with new timeline event (Admin or simulation)
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    description?: string,
    location?: string
  ): Promise<void> {
    try {
      const docRef = doc(db, ORDERS_COLLECTION, orderId);
      const snap = await getDoc(docRef);

      const statusTitles: Record<OrderStatus, string> = {
        pending: 'Order Placed',
        processing: 'Processing in Warehouse',
        shipped: 'Shipped & In Transit',
        out_for_delivery: 'Out for Final Delivery',
        delivered: 'Delivered Safely to Recipient',
        cancelled: 'Order Cancelled',
      };

      const defaultDescriptions: Record<OrderStatus, string> = {
        pending: 'Order received and awaiting warehouse dispatch.',
        processing: 'Items are being assembled and packaged with care.',
        shipped: 'Carrier has picked up package and is en route.',
        out_for_delivery: 'Courier driver is in your area and will deliver today.',
        delivered: 'Package handed directly to customer / placed in secure mailbox.',
        cancelled: 'Order was cancelled and refund has been initiated.',
      };

      const defaultLocations: Record<OrderStatus, string> = {
        pending: 'Online Storefront',
        processing: 'Central Fulfillment Facility, CA',
        shipped: 'Regional Transit Center, NV',
        out_for_delivery: 'Local Delivery Facility',
        delivered: 'Front Door / Porch',
        cancelled: 'Order Management Center',
      };

      const newEvent: OrderTimelineEvent = {
        status: newStatus,
        title: statusTitles[newStatus],
        description: description || defaultDescriptions[newStatus],
        location: location || defaultLocations[newStatus],
        timestamp: new Date().toISOString(),
      };

      if (snap.exists()) {
        const orderData = snap.data() as Order;
        const currentTimeline = orderData.timeline || [];
        const updatedTimeline = [...currentTimeline, newEvent];

        await updateDoc(docRef, {
          status: newStatus,
          timeline: updatedTimeline,
          updatedAt: new Date().toISOString(),
        });
      }

      // Also update localStorage if present
      const localOrders: Order[] = JSON.parse(localStorage.getItem('nexus_local_orders') || '[]');
      const idx = localOrders.findIndex((o) => o.id === orderId);
      if (idx !== -1) {
        localOrders[idx].status = newStatus;
        localOrders[idx].timeline = [...(localOrders[idx].timeline || []), newEvent];
        localOrders[idx].updatedAt = new Date().toISOString();
        localStorage.setItem('nexus_local_orders', JSON.stringify(localOrders));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },
};
