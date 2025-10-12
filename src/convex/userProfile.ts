import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Update user profile information (username) - with validation
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    preferredCurrency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const updateData: any = {};

    // Validate name if provided
    if (args.name !== undefined) {
      const trimmedName = args.name.trim();
      
      // Check length constraints
      if (trimmedName.length > 0 && trimmedName.length > 50) {
        throw new Error("Name must be 50 characters or less");
      }
      
      // Sanitize: remove any potentially harmful characters
      const sanitizedName = trimmedName.replace(/[<>]/g, '');
      
      updateData.name = sanitizedName || undefined;
    }

    // Validate and update preferred currency if provided
    if (args.preferredCurrency !== undefined) {
      const validCurrencies = ["USD", "GBP", "EUR", "CNY", "JPY"];
      if (!validCurrencies.includes(args.preferredCurrency)) {
        throw new Error("Invalid currency. Must be USD, GBP, EUR, CNY, or JPY");
      }
      
      // Check if user has Pro or Enterprise plan (USD is always allowed)
      const user = await ctx.db.get(userId);
      if (args.preferredCurrency !== "USD" && (!user || (user.plan !== "Pro" && user.plan !== "Enterprise"))) {
        throw new Error("Preferred currency is a Pro feature. Please upgrade your plan.");
      }
      
      // Always save the preferred currency, including USD
      updateData.preferredCurrency = args.preferredCurrency;
    }

    await ctx.db.patch(userId, updateData);

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

/**
 * Check if user has a password set
 */
export const hasPassword = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    // Check if user has password-related auth account
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId).eq("provider", "password"))
      .first();
    
    return { hasPassword: !!accounts };
  },
});

/**
 * Validate password strength
 */
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Calculate password strength
 */
export const calculatePasswordStrength = mutation({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    let strength = 0;
    
    if (args.password.length >= 8) strength++;
    if (args.password.length >= 12) strength++;
    if (/[A-Z]/.test(args.password)) strength++;
    if (/[a-z]/.test(args.password)) strength++;
    if (/[0-9]/.test(args.password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(args.password)) strength++;
    
    if (strength <= 2) return "weak";
    if (strength <= 4) return "medium";
    return "strong";
  },
});