import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Update user profile information (username) - with validation
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

    // Validate name if provided
    if (args.name !== undefined) {
      const trimmedName = args.name.trim();
      
      // Check length constraints
      if (trimmedName.length > 0 && trimmedName.length > 100) {
        throw new Error("Name must be 100 characters or less");
      }
      
      // Sanitize: remove any potentially harmful characters
      const sanitizedName = trimmedName.replace(/[<>]/g, '');
      
      await ctx.db.patch(userId, {
        name: sanitizedName || undefined,
      });
    } else {
      await ctx.db.patch(userId, {
        name: undefined,
      });
    }

    return { success: true };
  },
});

/**
 * Update user profile picture - with validation
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

    // Validate storageId format (basic check)
    if (!args.storageId || args.storageId.trim().length === 0) {
      throw new Error("Invalid storage ID");
    }

    try {
      // Get the URL for the uploaded image
      const imageUrl = await ctx.storage.getUrl(args.storageId as any);

      if (!imageUrl) {
        throw new Error("Failed to retrieve image URL");
      }

      await ctx.db.patch(userId, {
        image: imageUrl,
      });

      return { success: true, imageUrl };
    } catch (error) {
      console.error("Error updating profile picture:", error);
      throw new Error("Failed to update profile picture");
    }
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
