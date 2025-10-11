import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Admin mutation to update a user's plan
 * This should be restricted to admin users in production
 */
export const updateUserPlan = mutation({
  args: {
    email: v.string(),
    plan: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error(`User with email ${args.email} not found`);
    }

    // Update the user's plan
    await ctx.db.patch(user._id, {
      plan: args.plan,
    });

    return { 
      success: true, 
      message: `User ${args.email} plan updated to ${args.plan}`,
      userId: user._id 
    };
  },
});
