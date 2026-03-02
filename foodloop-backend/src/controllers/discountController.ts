import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import { db } from '../config/firebase';
import { DiscountEngine, Product } from '../services/discountEngine';

/**
 * Safely parse a Firestore product document into a Product object.
 * Returns null if essential fields (expiryDate, originalPrice) are missing or invalid.
 */
function safeParseProduct(id: string, data: Record<string, any>): Product | null {
  // Parse expiry date — handle both Firestore Timestamps and "YYYY-MM-DD" strings
  let expiryDate: Date | null = null;
  if (data.expiryDate && typeof data.expiryDate.toDate === 'function') {
    expiryDate = data.expiryDate.toDate();
  } else if (typeof data.expiryDate === 'string') {
    expiryDate = new Date(data.expiryDate);
  }

  const originalPrice = Number(data.originalPrice);

  // Skip documents with bad/missing essential data
  if (!expiryDate || isNaN(expiryDate.getTime()) || !originalPrice || originalPrice <= 0) {
    return null;
  }

  return {
    id,
    storeId: data.storeId || '',
    name: data.name || 'Unknown',
    category: data.category || 'General',
    expiryDate,
    originalPrice,
    currentPrice: Number(data.currentPrice) || originalPrice,
    isDiscounted: Boolean(data.isDiscounted),
    quantity: Number(data.quantity) || 1,
    lastUpdated: data.lastUpdated?.toDate?.() || new Date(),
  };
}

export class DiscountController {
  /**
   * Calculate discounts for all products (preview — does NOT persist)
   */
  static async calculateDiscounts(req: AuthRequest, res: Response) {
    try {
      const storeId = req.user?.uid;

      if (!storeId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const snapshot = await db
        .collection('products')
        .where('storeId', '==', storeId)
        .get();

      const products: Product[] = [];
      snapshot.forEach(doc => {
        const product = safeParseProduct(doc.id, doc.data());
        if (product) products.push(product);
      });

      const productsWithDiscounts = DiscountEngine.batchCalculateDiscounts(products);
      const sortedProducts = DiscountEngine.sortByPriority(productsWithDiscounts);

      const categorized = {
        urgent: sortedProducts.filter(p => p.discount.priority === 'URGENT'),
        warning: sortedProducts.filter(p => p.discount.priority === 'WARNING'),
        caution: sortedProducts.filter(p => p.discount.priority === 'CAUTION'),
        normal: sortedProducts.filter(p => p.discount.priority === 'NORMAL'),
      };

      res.json({
        success: true,
        message: 'Discounts calculated successfully',
        data: {
          totalProducts: products.length,
          breakdown: {
            urgent: categorized.urgent.length,
            warning: categorized.warning.length,
            caution: categorized.caution.length,
            normal: categorized.normal.length,
          },
          estimatedRevenue: DiscountEngine.estimateRevenueRecovery(sortedProducts),
          estimatedWaste: DiscountEngine.estimateWaste(products),
          topUrgentItems: categorized.urgent.slice(0, 5).map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            daysLeft: DiscountEngine.calculateDaysToExpiry(p.expiryDate),
            originalPrice: p.originalPrice,
            discountedPrice: p.discount.finalPrice,
            discount: p.discount.discountPercent,
            quantity: p.quantity,
            reason: p.discount.reason,
          })),
        },
      });
    } catch (error) {
      console.error('Error calculating discounts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate discounts',
      });
    }
  }

  /**
   * Apply calculated discounts to Firestore
   */
  static async applyDiscounts(req: AuthRequest, res: Response) {
    try {
      const storeId = req.user?.uid;

      if (!storeId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const snapshot = await db
        .collection('products')
        .where('storeId', '==', storeId)
        .get();

      const products: Product[] = [];
      snapshot.forEach(doc => {
        const product = safeParseProduct(doc.id, doc.data());
        if (product) products.push(product);
      });

      const productsWithDiscounts = DiscountEngine.batchCalculateDiscounts(products);

      const batch = db.batch();
      let appliedCount = 0;

      productsWithDiscounts.forEach(product => {
        if (product.discount.discountPercent > 0) {
          const docRef = db.collection('products').doc(product.id);
          batch.update(docRef, {
            originalPrice: product.originalPrice,
            currentPrice: product.discount.finalPrice,
            isDiscounted: true,
            discountPercent: product.discount.discountPercent,
            lastUpdated: new Date(),
          });
          appliedCount++;
        }
      });

      if (appliedCount === 0) {
        return res.json({
          success: true,
          message: 'No discounts applicable',
          appliedCount: 0,
          data: { appliedCount: 0, remainingProducts: products.length },
        });
      }

      await batch.commit();

      res.json({
        success: true,
        message: `Discounts applied to ${appliedCount} products`,
        appliedCount,
        data: {
          appliedCount,
          remainingProducts: products.length - appliedCount,
        },
      });
    } catch (error) {
      console.error('Error applying discounts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to apply discounts',
      });
    }
  }

  /**
   * Get discount summary
   */
  static async getDiscountSummary(req: AuthRequest, res: Response) {
    try {
      const storeId = req.user?.uid;

      if (!storeId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const snapshot = await db
        .collection('products')
        .where('storeId', '==', storeId)
        .get();

      const products: Product[] = [];
      snapshot.forEach(doc => {
        const product = safeParseProduct(doc.id, doc.data());
        if (product) products.push(product);
      });

      const discountedProducts = DiscountEngine.batchCalculateDiscounts(products);
      const sortedProducts = DiscountEngine.sortByPriority(discountedProducts);

      const summary = {
        totalProducts: products.length,
        urgentItems: sortedProducts.filter(p => p.discount.priority === 'URGENT').length,
        warningItems: sortedProducts.filter(p => p.discount.priority === 'WARNING').length,
        cautionItems: sortedProducts.filter(p => p.discount.priority === 'CAUTION').length,
        normalItems: sortedProducts.filter(p => p.discount.priority === 'NORMAL').length,
        totalDiscountValue: discountedProducts.reduce(
          (sum, p) => sum + ((p.originalPrice - p.discount.finalPrice) * p.quantity),
          0
        ),
        estimatedRevenue: DiscountEngine.estimateRevenueRecovery(sortedProducts),
        estimatedWaste: DiscountEngine.estimateWaste(products),
        percentageDiscounted: products.length > 0
          ? Math.round(
              (discountedProducts.filter(p => p.discount.discountPercent > 0).length / products.length) * 100
            )
          : 0,
      };

      res.json({ success: true, data: summary });
    } catch (error) {
      console.error('Error fetching discount summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch summary',
      });
    }
  }
}
