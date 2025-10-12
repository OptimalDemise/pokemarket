import { internalMutation } from "./_generated/server";

/**
 * Internal mutation to delete all product data from the database
 * This will free up storage space by removing unused product records
 */
export const deleteAllProducts = internalMutation({
  args: {},
  handler: async (ctx) => {
    try {
      // Get all products
      const products = await ctx.db.query("products").collect();
      
      // Delete each product
      let deletedCount = 0;
      for (const product of products) {
        await ctx.db.delete(product._id);
        deletedCount++;
      }
      
      console.log(`Deleted ${deletedCount} products from database`);
      return { success: true, deletedCount };
    } catch (error) {
      console.error("Error deleting products:", error);
      throw error;
    }
  },
});
