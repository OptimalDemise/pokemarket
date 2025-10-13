import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Check if maintenance mode is active
export const isMaintenanceActive = query({
  args: {},
  handler: async (ctx) => {
    const maintenance = await ctx.db
      .query("maintenanceMode")
      .order("desc")
      .first();
    
    if (!maintenance) {
      return { isActive: false, message: "" };
    }
    
    return {
      isActive: maintenance.isActive,
      message: maintenance.message || "System maintenance in progress",
      startTime: maintenance.startTime,
      endTime: maintenance.endTime,
    };
  },
});

// Enable maintenance mode (internal only)
export const enableMaintenance = internalMutation({
  args: {
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("maintenanceMode").first();
    
    const maintenanceData = {
      isActive: true,
      startTime: Date.now(),
      endTime: undefined,
      message: args.message || "Performing weekly maintenance. We'll be back shortly!",
    };
    
    if (existing) {
      await ctx.db.patch(existing._id, maintenanceData);
    } else {
      await ctx.db.insert("maintenanceMode", maintenanceData);
    }
    
    console.log("Maintenance mode enabled");
  },
});

// Disable maintenance mode (internal only)
export const disableMaintenance = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("maintenanceMode").first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        isActive: false,
        endTime: Date.now(),
      });
    }
    
    console.log("Maintenance mode disabled");
  },
});
