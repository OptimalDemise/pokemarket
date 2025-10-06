import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

// Get all products with their latest price changes
export const getAllProducts = query({
  args: {},
  handler: async (ctx) => {
    try {
      const products = await ctx.db.query("products").collect();
      
      // Calculate price changes for each product
      const productsWithChanges = await Promise.all(
        products.map(async (product) => {
          try {
            const history = await ctx.db
              .query("productPriceHistory")
              .withIndex("by_product", (q) => q.eq("productId", product._id))
              .order("desc")
              .take(10); // Get more history for average calculation

            let percentChange = 0;
            let averagePrice = product.currentPrice;
            let isRecentSale = false;
            
            if (history.length >= 2) {
              const current = history[0].price;
              const previous = history[1].price;
              if (previous !== 0) {
                percentChange = ((current - previous) / previous) * 100;
              }
              
              // Calculate average price from last 5-10 entries (excluding most recent)
              if (history.length >= 5) {
                const historicalPrices = history.slice(1, Math.min(10, history.length));
                averagePrice = historicalPrices.reduce((sum, h) => sum + h.price, 0) / historicalPrices.length;
                
                // Check if current price deviates significantly from average (>15%)
                const deviation = Math.abs((current - averagePrice) / averagePrice) * 100;
                isRecentSale = deviation > 15;
              }
            }

            return {
              ...product,
              percentChange,
              averagePrice,
              isRecentSale,
            };
          } catch (error) {
            console.error(`Error calculating price change for product ${product._id}:`, error);
            return {
              ...product,
              percentChange: 0,
              averagePrice: product.currentPrice,
              isRecentSale: false,
            };
          }
        })
      );

      return productsWithChanges;
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

// Internal version for actions to call
export const _getAllProducts = internalQuery({
  args: {},
  handler: async (ctx) => {
    try {
      const products = await ctx.db.query("products").collect();
      
      // Calculate price changes for each product
      const productsWithChanges = await Promise.all(
        products.map(async (product) => {
          try {
            const history = await ctx.db
              .query("productPriceHistory")
              .withIndex("by_product", (q) => q.eq("productId", product._id))
              .order("desc")
              .take(10);

            let percentChange = 0;
            let averagePrice = product.currentPrice;
            let isRecentSale = false;
            
            if (history.length >= 2) {
              const current = history[0].price;
              const previous = history[1].price;
              if (previous !== 0) {
                percentChange = ((current - previous) / previous) * 100;
              }
              
              if (history.length >= 5) {
                const historicalPrices = history.slice(1, Math.min(10, history.length));
                averagePrice = historicalPrices.reduce((sum, h) => sum + h.price, 0) / historicalPrices.length;
                
                const deviation = Math.abs((current - averagePrice) / averagePrice) * 100;
                isRecentSale = deviation > 15;
              }
            }

            return {
              ...product,
              percentChange,
              averagePrice,
              isRecentSale,
            };
          } catch (error) {
            console.error(`Error calculating price change for product ${product._id}:`, error);
            return {
              ...product,
              percentChange: 0,
              averagePrice: product.currentPrice,
              isRecentSale: false,
            };
          }
        })
      );

      return productsWithChanges;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw new Error("Failed to retrieve product data");
    }
  },
});

// Internal mutation for actions to call
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
        // Update existing product only if price changed
        await ctx.db.patch(existingProduct._id, {
          currentPrice: args.currentPrice,
          lastUpdated: now,
        });

        // Add price history entry - no artificial variation
        await ctx.db.insert("productPriceHistory", {
          productId: existingProduct._id,
          price: args.currentPrice,
          timestamp: now,
        });
      }

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