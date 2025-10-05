import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all products with their latest price changes
export const getAllProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    
    // Calculate price changes for each product
    const productsWithChanges = await Promise.all(
      products.map(async (product) => {
        const history = await ctx.db
          .query("productPriceHistory")
          .withIndex("by_product", (q) => q.eq("productId", product._id))
          .order("desc")
          .take(2);

        let percentChange = 0;
        if (history.length >= 2) {
          const current = history[0].price;
          const previous = history[1].price;
          percentChange = ((current - previous) / previous) * 100;
        }

        return {
          ...product,
          percentChange,
        };
      })
    );

    return productsWithChanges;
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

      // Add price history entry
      await ctx.db.insert("productPriceHistory", {
        productId: existingProduct._id,
        price: args.currentPrice,
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
