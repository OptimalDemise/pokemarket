import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
      plan: v.optional(v.string()), // user's subscription plan: "Basic", "Pro", or "Enterprise"
      preferredCurrency: v.optional(v.string()), // user's preferred display currency: "USD", "GBP", "EUR", or "CNY" (Pro feature)
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Pokemon cards table - tracks individual cards
    cards: defineTable({
      name: v.string(),
      setName: v.string(),
      cardNumber: v.string(),
      rarity: v.string(), // "Holo Rare", "Ultra Rare", "Secret Rare", etc.
      imageUrl: v.optional(v.string()),
      tcgplayerUrl: v.optional(v.string()),
      currentPrice: v.number(),
      lastUpdated: v.number(),
      // Cached calculated values
      percentChange: v.optional(v.number()),
      overallPercentChange: v.optional(v.number()),
      averagePrice: v.optional(v.number()),
      isRecentSale: v.optional(v.boolean()),
    })
      .index("by_name", ["name"])
      .index("by_set", ["setName"])
      .index("by_rarity", ["rarity"])
      .index("by_last_updated", ["lastUpdated"]),

    // Price history for cards
    cardPriceHistory: defineTable({
      cardId: v.id("cards"),
      price: v.number(),
      timestamp: v.number(),
    }).index("by_card", ["cardId"]),

    // Products table - booster boxes, bundles, etc.
    products: defineTable({
      name: v.string(),
      productType: v.string(), // "Booster Box", "Booster Bundle", "Elite Trainer Box", etc.
      setName: v.string(),
      imageUrl: v.optional(v.string()),
      currentPrice: v.number(),
      lastUpdated: v.number(),
      // Cached calculated values
      percentChange: v.optional(v.number()),
      averagePrice: v.optional(v.number()),
      isRecentSale: v.optional(v.boolean()),
    })
      .index("by_type", ["productType"])
      .index("by_set", ["setName"]),

    // Daily snapshots for tracking day-over-day changes
    dailySnapshots: defineTable({
      itemId: v.string(), // card or product ID
      itemType: v.string(), // "card" or "product"
      itemName: v.string(),
      price: v.number(),
      yesterdayPrice: v.optional(v.number()),
      dailyPercentChange: v.optional(v.number()),
      snapshotDate: v.string(), // YYYY-MM-DD format
      timestamp: v.number(),
    })
      .index("by_item_and_date", ["itemId", "snapshotDate"])
      .index("by_date", ["snapshotDate"]),

    bigMoversCache: defineTable({
      cardId: v.id("cards"),
      percentChange: v.number(),
      hourPeriodStart: v.number(), // Timestamp of when this hour period started
      rank: v.number(), // Position in top 20 (1-20)
    })
      .index("by_hour_period", ["hourPeriodStart"])
      .index("by_card_and_period", ["cardId", "hourPeriodStart"]),

    // User favorites/watchlist
    favorites: defineTable({
      userId: v.id("users"),
      cardId: v.id("cards"),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_card", ["cardId"])
      .index("by_user_and_card", ["userId", "cardId"]),

    // Update logs for tracking website changes
    updateLogs: defineTable({
      title: v.string(),
      description: v.string(),
      category: v.optional(v.string()), // "Feature", "Bug Fix", "Improvement", etc.
      timestamp: v.number(),
    }),
  },
  {
    schemaValidation: false,
  },
);

export default schema;