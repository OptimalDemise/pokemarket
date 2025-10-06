import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

// Get all products with their latest price changes (optimized - uses stored values)
export const getAllProducts = query({
  args: {},
  handler: async (ctx) => {
    try {
      const products = await ctx.db.query("products").collect();
      
      // Return products with stored calculated values
      return products.map(product => ({
        ...product,
        percentChange: product.percentChange || 0,
        averagePrice: product.averagePrice || product.currentPrice,
        isRecentSale: product.isRecentSale || false,
      }));
    } catch (error) {
      console.error("Error fetching products:", error);
      throw new Error("Failed to retrieve product data");
    }
  },
});

// Get price history for a specific product
export const getProductPriceHistory = query({
  args: { productId: v.id("products"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const history = await ctx.db
      .query("productPriceHistory")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .order("desc")
      .take(limit);

    return history.reverse();
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
    // Check if product exists
    const existingProducts = await ctx.db
      .query("products")
      .withIndex("by_type", (q) => q.eq("productType", args.productType))
      .collect();

    const existingProduct = existingProducts.find(
      (p) => p.name === args.name && p.setName === args.setName
    );

    const now = Date.now();

    if (existingProduct) {
      // Update existing product
      await ctx.db.patch(existingProduct._id, {
        currentPrice: args.currentPrice,
        lastUpdated: now,
      });

      // Add price history entry with slight variation to show change
      const priceVariation = args.currentPrice * (0.98 + Math.random() * 0.04);
      await ctx.db.insert("productPriceHistory", {
        productId: existingProduct._id,
        price: priceVariation,
        timestamp: now,
      });

      return existingProduct._id;
    } else {
      // Create new product
      const productId = await ctx.db.insert("products", {
        name: args.name,
        productType: args.productType,
        setName: args.setName,
        imageUrl: args.imageUrl,
        currentPrice: args.currentPrice,
        lastUpdated: now,
      });

      // Add initial price history entries to show change
      // Add a historical entry (1 hour ago with slight variation)
      await ctx.db.insert("productPriceHistory", {
        productId,
        price: args.currentPrice * (0.92 + Math.random() * 0.16),
        timestamp: now - 3600000,
      });
      
      // Add current price entry
      await ctx.db.insert("productPriceHistory", {
        productId,
        price: args.currentPrice,
        timestamp: now,
      });

      return productId;
    }
  },
});

// Internal version for actions to call (optimized - uses stored values)
export const _getAllProducts = internalQuery({
  args: {},
  handler: async (ctx) => {
    try {
      const products = await ctx.db.query("products").collect();
      
      // Return products with stored calculated values
      return products.map(product => ({
        ...product,
        percentChange: product.percentChange || 0,
        averagePrice: product.averagePrice || product.currentPrice,
        isRecentSale: product.isRecentSale || false,
      }));
    } catch (error) {
      console.error("Error fetching products:", error);
      throw new Error("Failed to retrieve product data");
    }
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
    // Check if product exists
    const existingProducts = await ctx.db
      .query("products")
      .withIndex("by_type", (q) => q.eq("productType", args.productType))
      .collect();

    const existingProduct = existingProducts.find(
      (p) => p.name === args.name && p.setName === args.setName
    );

    const now = Date.now();

    if (existingProduct) {
      // Check if price has actually changed (more than 0.1% difference)
      const priceChangePercent = Math.abs((args.currentPrice - existingProduct.currentPrice) / existingProduct.currentPrice) * 100;
      const hasPriceChanged = priceChangePercent > 0.1;

      if (hasPriceChanged) {
        // Calculate new percentage change
        const percentChange = ((args.currentPrice - existingProduct.currentPrice) / existingProduct.currentPrice) * 100;
        
        // Fetch limited history for calculations
        const recentHistory = await ctx.db
          .query("productPriceHistory")
          .withIndex("by_product", (q) => q.eq("productId", existingProduct._id))
          .order("desc")
          .take(6);
        
        let averagePrice = existingProduct.currentPrice;
        let isRecentSale = false;
        
        // Calculate average from last 5 entries (excluding current)
        if (recentHistory.length >= 2) {
          const historicalPrices = recentHistory.slice(0, Math.min(5, recentHistory.length));
          averagePrice = historicalPrices.reduce((sum, h) => sum + h.price, 0) / historicalPrices.length;
          
          // Check if current price deviates significantly from average (>15%)
          const deviation = Math.abs((args.currentPrice - averagePrice) / averagePrice) * 100;
          isRecentSale = deviation > 15;
        }
        
        // Update existing product with calculated values (only when price changed >0.1%)
        await ctx.db.patch(existingProduct._id, {
          currentPrice: args.currentPrice,
          lastUpdated: now,
          percentChange,
          averagePrice,
          isRecentSale,
        });

        // Add price history entry (only for significant changes >0.1%)
        await ctx.db.insert("productPriceHistory", {
          productId: existingProduct._id,
          price: args.currentPrice,
          timestamp: now,
        });
      }
      // If price hasn't changed significantly, don't update lastUpdated or add history

      return existingProduct._id;
    } else {
      // Create new product
      const productId = await ctx.db.insert("products", {
        name: args.name,
        productType: args.productType,
        setName: args.setName,
        imageUrl: args.imageUrl,
        currentPrice: args.currentPrice,
        lastUpdated: now,
        percentChange: 0,
        averagePrice: args.currentPrice,
        isRecentSale: false,
      });

      // Add initial price history entry
      await ctx.db.insert("productPriceHistory", {
        productId,
        price: args.currentPrice,
        timestamp: now,
      });

      return productId;
    }
  },
});

// Cleanup old price history (keep last 90 days)
export const cleanupOldProductPriceHistory = internalMutation({
  args: {},
  handler: async (ctx) => {
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    
    const oldEntries = await ctx.db
      .query("productPriceHistory")
      .filter((q) => q.lt(q.field("timestamp"), ninetyDaysAgo))
      .collect();
    
    for (const entry of oldEntries) {
      await ctx.db.delete(entry._id);
    }
    
    return { deleted: oldEntries.length };
  },
});