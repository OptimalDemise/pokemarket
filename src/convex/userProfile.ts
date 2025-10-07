import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Update user profile information (username)
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(userId, {
      name: args.name,
    });

    return { success: true };
  },
});

/**
 * Update user profile picture
 */
export const updateProfilePicture = mutation({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the URL for the uploaded image
    const imageUrl = await ctx.storage.getUrl(args.storageId as any);

    await ctx.db.patch(userId, {
      image: imageUrl || undefined,
    });

    return { success: true, imageUrl };
  },
});

/**
 * Generate upload URL for profile picture
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.storage.generateUploadUrl();
  },
});
