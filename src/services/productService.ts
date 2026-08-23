import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Review } from '../types';
import { SAMPLE_PRODUCTS, SAMPLE_REVIEWS } from '../data/sampleProducts';

const PRODUCTS_COLLECTION = 'products';
const REVIEWS_COLLECTION = 'reviews';

export const productService = {
  // Subscribe to real-time products updates
  subscribeToProducts(callback: (products: Product[]) => void) {
    try {
      const q = query(collection(db, PRODUCTS_COLLECTION));
      return onSnapshot(
        q,
        async (snapshot) => {
          if (snapshot.empty) {
            // Auto seed if empty
            await this.seedInitialCatalog(true);
            return;
          }
          const products: Product[] = [];
          snapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() } as Product);
          });
          callback(products);
        },
        (error) => {
          console.warn('Firestore snapshot listener error, using fallback:', error);
          callback(SAMPLE_PRODUCTS);
        }
      );
    } catch (err) {
      console.error('Error in subscribeToProducts:', err);
      callback(SAMPLE_PRODUCTS);
      return () => {};
    }
  },

  // Get all products once
  async getProducts(): Promise<Product[]> {
    try {
      const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
      if (snapshot.empty) {
        await this.seedInitialCatalog(true);
        return SAMPLE_PRODUCTS;
      }
      const products: Product[] = [];
      snapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() } as Product);
      });
      return products;
    } catch (error) {
      console.warn('Could not fetch from Firestore, returning local data:', error);
      return SAMPLE_PRODUCTS;
    }
  },

  // Get product by ID
  async getProductById(id: string): Promise<Product | null> {
    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Product;
      }
      // Check fallback
      const found = SAMPLE_PRODUCTS.find((p) => p.id === id);
      return found || null;
    } catch (error) {
      console.warn('Error getting product by id:', error);
      const found = SAMPLE_PRODUCTS.find((p) => p.id === id);
      return found || null;
    }
  },

  // Create new product
  async addProduct(product: Omit<Product, 'id'>): Promise<string> {
    const docId = 'prod-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const newProduct: Product = {
      ...product,
      id: docId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, PRODUCTS_COLLECTION, docId), newProduct);
      return docId;
    } catch (error) {
      console.error('Failed to add product to Firestore:', error);
      throw error;
    }
  },

  // Update product details or stock
  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to update product in Firestore:', error);
      throw error;
    }
  },

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  },

  // Seed sample products into Firestore
  async seedInitialCatalog(force = false): Promise<void> {
    try {
      if (!force) {
        const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
        if (!snapshot.empty) return;
      }

      for (const item of SAMPLE_PRODUCTS) {
        await setDoc(doc(db, PRODUCTS_COLLECTION, item.id), item);
      }

      // Also seed sample reviews
      for (const [prodId, reviews] of Object.entries(SAMPLE_REVIEWS)) {
        for (const rev of reviews) {
          await setDoc(doc(db, REVIEWS_COLLECTION, rev.id), rev);
        }
      }
      console.log('Sample catalog seeded into Firestore successfully');
    } catch (error) {
      console.error('Error seeding sample catalog:', error);
    }
  },

  // Subscribe to real-time reviews for a specific product
  subscribeToProductReviews(productId: string, callback: (reviews: Review[]) => void) {
    try {
      const q = query(
        collection(db, REVIEWS_COLLECTION),
        where('productId', '==', productId)
      );
      return onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            const localSaved = localStorage.getItem(`nexus_reviews_${productId}`);
            if (localSaved) {
              try {
                callback(JSON.parse(localSaved));
                return;
              } catch (e) {
                console.error(e);
              }
            }
            callback(SAMPLE_REVIEWS[productId] || []);
            return;
          }
          const reviews: Review[] = [];
          snapshot.forEach((doc) => {
            reviews.push({ id: doc.id, ...doc.data() } as Review);
          });
          // Sort most recent first
          reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          callback(reviews);
        },
        (error) => {
          console.warn('Firestore reviews snapshot error, using fallback:', error);
          const localSaved = localStorage.getItem(`nexus_reviews_${productId}`);
          if (localSaved) {
            try {
              callback(JSON.parse(localSaved));
              return;
            } catch (e) {
              console.error(e);
            }
          }
          callback(SAMPLE_REVIEWS[productId] || []);
        }
      );
    } catch (err) {
      console.error('Error in subscribeToProductReviews:', err);
      callback(SAMPLE_REVIEWS[productId] || []);
      return () => {};
    }
  },

  // Reviews
  async getProductReviews(productId: string): Promise<Review[]> {
    try {
      const q = query(
        collection(db, REVIEWS_COLLECTION),
        where('productId', '==', productId)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        const localSaved = localStorage.getItem(`nexus_reviews_${productId}`);
        if (localSaved) {
          try {
            return JSON.parse(localSaved);
          } catch (e) {
            console.error(e);
          }
        }
        return SAMPLE_REVIEWS[productId] || [];
      }
      const reviews: Review[] = [];
      snapshot.forEach((doc) => reviews.push({ id: doc.id, ...doc.data() } as Review));
      reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return reviews;
    } catch (error) {
      console.warn('Error fetching reviews:', error);
      const localSaved = localStorage.getItem(`nexus_reviews_${productId}`);
      if (localSaved) {
        try {
          return JSON.parse(localSaved);
        } catch (e) {
          console.error(e);
        }
      }
      return SAMPLE_REVIEWS[productId] || [];
    }
  },

  async addReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const revId = 'rev-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newRev: Review = {
      ...review,
      id: revId,
      createdAt: new Date().toISOString(),
      helpfulCount: 0,
      helpfulUserIds: [],
    };

    try {
      await setDoc(doc(db, REVIEWS_COLLECTION, revId), newRev);

      // Save to local cache as fallback
      const existingReviews = await this.getProductReviews(review.productId);
      const updatedList = [newRev, ...existingReviews.filter((r) => r.id !== revId)];
      localStorage.setItem(`nexus_reviews_${review.productId}`, JSON.stringify(updatedList));

      // Recalculate and update product rating in Firestore
      try {
        const totalRating = updatedList.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = Number((totalRating / Math.max(1, updatedList.length)).toFixed(1));
        const prodRef = doc(db, PRODUCTS_COLLECTION, review.productId);
        await updateDoc(prodRef, {
          rating: avgRating,
          ratingCount: updatedList.length,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Could not update parent product rating in Firestore:', err);
      }

      return newRev;
    } catch (error) {
      console.error('Error adding review to Firestore, saving locally:', error);
      const existingReviews = await this.getProductReviews(review.productId);
      const updatedList = [newRev, ...existingReviews];
      localStorage.setItem(`nexus_reviews_${review.productId}`, JSON.stringify(updatedList));
      return newRev;
    }
  },

  async toggleReviewHelpful(reviewId: string, productId: string, userId: string): Promise<boolean> {
    try {
      const revRef = doc(db, REVIEWS_COLLECTION, reviewId);
      const snap = await getDoc(revRef);
      if (snap.exists()) {
        const data = snap.data() as Review;
        const helpfulUserIds = data.helpfulUserIds || [];
        const hasVoted = helpfulUserIds.includes(userId);
        const newHelpfulUserIds = hasVoted
          ? helpfulUserIds.filter((id) => id !== userId)
          : [...helpfulUserIds, userId];
        const newCount = newHelpfulUserIds.length;

        await updateDoc(revRef, {
          helpfulCount: newCount,
          helpfulUserIds: newHelpfulUserIds,
        });
        return !hasVoted;
      }
    } catch (err) {
      console.warn('Error toggling helpful vote in Firestore:', err);
    }
    return true;
  },
};
