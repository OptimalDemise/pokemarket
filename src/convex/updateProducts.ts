"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Update product prices with realistic market fluctuations
export const updateProductPrices = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      // Get all products
      const products = await ctx.runQuery(internal.products._getAllProducts);
      
      if (!products || products.length === 0) {
        console.log("No products to update");
        return { success: true, updated: 0 };
      }

      let updateCount = 0;

      for (const product of products) {
        // Simulate realistic price fluctuations (±5%)
        const fluctuation = 0.95 + Math.random() * 0.1;
        const newPrice = parseFloat((product.currentPrice * fluctuation).toFixed(2));

        // Update the product with new price
        await ctx.runMutation(internal.products._upsertProduct, {
          name: product.name,
          productType: product.productType,
          setName: product.setName,
          imageUrl: product.imageUrl,
          currentPrice: newPrice,
        });

        updateCount++;
      }

      console.log(`Updated ${updateCount} product prices`);
      return { success: true, updated: updateCount };
    } catch (error) {
      console.error("Error updating product prices:", error);
      return { success: false, updated: 0, error: String(error) };
    }
  },
});
