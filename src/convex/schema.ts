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
    })
      .index("by_name", ["name"])
      .index("by_set", ["setName"])
      .index("by_rarity", ["rarity"]),

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
    })
      .index("by_type", ["productType"])
      .index("by_set", ["setName"]),

    // Price history for products
    productPriceHistory: defineTable({
      productId: v.id("products"),
      price: v.number(),
      timestamp: v.number(),
    }).index("by_product", ["productId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;