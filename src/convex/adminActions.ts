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
    expiresInDays: v.optional(v.number()), // Optional: number of days until expiration
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

    // Calculate expiration timestamp if provided
    let planExpiresAt: number | undefined = undefined;
    if (args.expiresInDays !== undefined && args.expiresInDays > 0) {
      planExpiresAt = Date.now() + (args.expiresInDays * 24 * 60 * 60 * 1000);
    }

    // Update the user's plan
    await ctx.db.patch(user._id, {
      plan: args.plan,
      planExpiresAt: planExpiresAt,
    });

    return { 
      success: true, 
      message: `User ${args.email} plan updated to ${args.plan}${planExpiresAt ? ` (expires in ${args.expiresInDays} days)` : ' (lifetime)'}`,
      userId: user._id,
      expiresAt: planExpiresAt
    };
  },
});