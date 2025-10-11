import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

// Get all products with their latest price changes (optimized for high concurrency)
export const getAllProducts = query({
  args: {},
  handler: async (ctx) => {
    try {
      // Collect all products - Convex optimizes this for read-heavy workloads
      const products = await ctx.db.query("products").collect();
      
      // Map with type safety and validation
      return products.map(product => {
        // Ensure all numeric fields have valid defaults
        const percentChange = typeof product.percentChange === 'number' ? product.percentChange : 0;
        const averagePrice = typeof product.averagePrice === 'number' ? product.averagePrice : product.currentPrice;
        const isRecentSale = typeof product.isRecentSale === 'boolean' ? product.isRecentSale : false;
        
        return {
          ...product,
          percentChange,
          averagePrice,
          isRecentSale,
        };
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      // Return empty array instead of throwing to prevent client crashes
      return [];
    }
  },
});

// Get price history for a specific product
export const getProductPriceHistory = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    // Products are no longer tracked - return empty array
    return [];
  },
});

// Add or update a product
export const upsertProduct = mutation({
  args: {
    name: v.string(),
    productType: v.string(),
    setName: v.string(),
    imageUrl: v.optional(v.string()),
    currentPrice: v.number(),
  },
  handler: async (ctx, args) => {
    // Products are no longer tracked - return null
    return null;
  },
});

// Internal version for actions to call (optimized - uses stored values)
export const _getAllProducts = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Products are no longer tracked - return empty array
    return [];
  },
});

// Internal mutation for actions to call (now calculates and stores metrics)
export const _upsertProduct = internalMutation({
  args: {
    name: v.string(),
    productType: v.string(),
    setName: v.string(),
    imageUrl: v.optional(v.string()),
    currentPrice: v.number(),
  },
  handler: async (ctx, args) => {
    // Products are no longer tracked - return null
    return null;
  },
});

// Cleanup old price history (keep last 90 days)
export const cleanupOldProductPriceHistory = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Products are no longer tracked - return 0 deleted
    return { deleted: 0 };
  },
});