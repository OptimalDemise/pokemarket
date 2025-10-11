"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Update product prices with realistic market fluctuations
export const updateProductPrices = internalAction({
  args: {},
  handler: async (ctx) => {
    // Products are no longer tracked - return immediately
    console.log("Products are no longer tracked - skipping update");
    return { success: true, updated: 0 };
  },
});
