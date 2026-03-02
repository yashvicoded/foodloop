import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import { db } from '../config/firebase';
import { DiscountEngine, Product } from '../services/discountEngine';

export class AnalyticsController {

  /**
   * Get comprehensive analytics dashboard
   */
  static async getDashboard(req: AuthRequest, res: Response) {
    try {
      const storeId = req.user?.uid;

      if (!storeId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      // Fetch products
      const productsSnapshot = await db
        .collection('products')
        .where('storeId', '==', storeId)
        .get();

      const products: Product[] = [];

      productsSnapshot.forEach(doc => {
        const data = doc.data();
        let expiryDate: Date | null = null;
        if (data.expiryDate && typeof data.expiryDate.toDate === 'function') {
          expiryDate = data.expiryDate.toDate();
        } else if (typeof data.expiryDate === 'string') {
          expiryDate = new Date(data.expiryDate);
        }

        const originalPrice = Number(data.originalPrice);
        if (expiryDate && !isNaN(expiryDate.getTime()) && originalPrice > 0) {
          products.push({
            id: doc.id,
            storeId: data.storeId || '',
            name: data.name || 'Unknown',
            category: data.category || 'General',
            expiryDate,
            originalPrice,
            currentPrice: Number(data.currentPrice) || originalPrice,
            isDiscounted: Boolean(data.isDiscounted),
            quantity: Number(data.quantity) || 1,
            lastUpdated: data.lastUpdated?.toDate?.() || new Date(),
          });
        }
      });

      // Fetch donations
      const donationsSnapshot = await db
        .collection('donations')
        .where('storeId', '==', storeId)
        .get();

      const donations: any[] = [];

      donationsSnapshot.forEach(doc => {
        const data = doc.data();

        // Use createdAt (the actual Firestore field) — donatedAt does NOT exist
        let createdAt: Date | null = null;
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt?._seconds) {
          createdAt = new Date(data.createdAt._seconds * 1000);
        } else if (data.createdAt) {
          createdAt = new Date(data.createdAt);
        }

        donations.push({
          id: doc.id,
          ...data,
          createdAt,
          quantity: Number(data.quantity) || 1,
          donatedValue: Number(data.donatedValue) || 0,
        });
      });

      // Calculate metrics
      const discountedProducts =
        DiscountEngine.batchCalculateDiscounts(products);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const thisWeekDonations = donations.filter(
        d => d.createdAt && d.createdAt > weekAgo
      );

      const dashboard = {
        inventory: {
          total: products.length,
          discounted: discountedProducts.filter(
            p => p.discount.discountPercent > 0
          ).length,
          urgent: discountedProducts.filter(
            p => p.discount.priority === 'URGENT'
          ).length,
          warning: discountedProducts.filter(
            p => p.discount.priority === 'WARNING'
          ).length,
          caution: discountedProducts.filter(
            p => p.discount.priority === 'CAUTION'
          ).length,
        },
        donations: {
          totalValue: donations.reduce(
            (sum, d) => sum + (d.donatedValue || 0),
            0
          ),
          thisWeek: thisWeekDonations.length,
          thisWeekValue: thisWeekDonations.reduce(
            (sum, d) => sum + (d.donatedValue || 0),
            0
          ),
          total: donations.length,
          totalQuantity: donations.reduce(
            (sum, d) => sum + (d.quantity || 0),
            0
          ),
        },
        revenue: {
          recovered:
            DiscountEngine.estimateRevenueRecovery(discountedProducts),
          potential:
            DiscountEngine.estimateWaste(products),
        },
        freshness: {
          fresh: discountedProducts.filter(
            p =>
              DiscountEngine.calculateDaysToExpiry(p.expiryDate) > 6
          ).length,
          warning: discountedProducts.filter(
            p =>
              DiscountEngine.calculateDaysToExpiry(p.expiryDate) > 2 &&
              DiscountEngine.calculateDaysToExpiry(p.expiryDate) <= 6
          ).length,
          urgent: discountedProducts.filter(
            p =>
              DiscountEngine.calculateDaysToExpiry(p.expiryDate) <= 2
          ).length,
        },
      };

      res.json({
        success: true,
        data: dashboard,
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics',
      });
    }
  }

  /**
   * Get waste prevention report
   */
  static async getWasteReport(req: AuthRequest, res: Response) {
    try {
      const storeId = req.user?.uid;

      if (!storeId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const donationsSnapshot = await db
        .collection('donations')
        .where('storeId', '==', storeId)
        .get();

      const donations: any[] = [];

      donationsSnapshot.forEach(doc => {
        const data = doc.data();

        let createdAt: Date | null = null;
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt?._seconds) {
          createdAt = new Date(data.createdAt._seconds * 1000);
        } else if (data.createdAt) {
          createdAt = new Date(data.createdAt);
        }

        donations.push({
          id: doc.id,
          ...data,
          createdAt,
          quantity: Number(data.quantity) || 1,
          donatedValue: Number(data.donatedValue) || 0,
        });
      });

      const report = {
        totalDonated: donations.length,
        totalValue: donations.reduce(
          (sum, d) => sum + (d.donatedValue || 0),
          0
        ),
        averageValuePerDonation:
          donations.length > 0
            ? donations.reduce(
                (sum, d) => sum + (d.donatedValue || 0),
                0
              ) / donations.length
            : 0,
        byWeek: this.groupDonationsByWeek(donations),
      };

      res.json({
        success: true,
        data: report,
      });

    } catch (error) {
      console.error('Error fetching waste report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch waste report',
      });
    }
  }

  /**
   * Get inventory trends
   */
  static async getInventoryTrends(req: AuthRequest, res: Response) {
    try {
      const storeId = req.user?.uid;

      if (!storeId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const productsSnapshot = await db
        .collection('products')
        .where('storeId', '==', storeId)
        .get();

      const products: Product[] = [];

      productsSnapshot.forEach(doc => {
        const data = doc.data();
        let expiryDate: Date | null = null;
        if (data.expiryDate && typeof data.expiryDate.toDate === 'function') {
          expiryDate = data.expiryDate.toDate();
        } else if (typeof data.expiryDate === 'string') {
          expiryDate = new Date(data.expiryDate);
        }

        const originalPrice = Number(data.originalPrice);
        if (expiryDate && !isNaN(expiryDate.getTime()) && originalPrice > 0) {
          products.push({
            id: doc.id,
            storeId: data.storeId || '',
            name: data.name || 'Unknown',
            category: data.category || 'General',
            expiryDate,
            originalPrice,
            currentPrice: Number(data.currentPrice) || originalPrice,
            isDiscounted: Boolean(data.isDiscounted),
            quantity: Number(data.quantity) || 1,
            lastUpdated: data.lastUpdated?.toDate?.() || new Date(),
          });
        }
      });

      const discountedProducts =
        DiscountEngine.batchCalculateDiscounts(products);

      res.json({
        success: true,
        data: {
          totalProducts: products.length,
          discountedProducts: discountedProducts.filter(
            p => p.discount.discountPercent > 0
          ).length,
        },
      });

    } catch (error) {
      console.error('Error fetching inventory trends:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch inventory trends',
      });
    }
  }

  private static groupDonationsByWeek(donations: any[]) {
    const weeks: {
      [key: string]: { count: number; value: number };
    } = {};

    donations.forEach(d => {
      if (!d.createdAt) return;

      const date = new Date(d.createdAt);
      if (isNaN(date.getTime())) return;

      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeks[weekKey]) {
        weeks[weekKey] = { count: 0, value: 0 };
      }

      weeks[weekKey].count++;
      weeks[weekKey].value += d.donatedValue || 0;
    });

    return weeks;
  }
}