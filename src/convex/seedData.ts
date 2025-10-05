import { mutation } from "./_generated/server";

// Seed initial data for testing
export const seedInitialData = mutation({
  args: {},
  handler: async (ctx) => {
    // Sample cards data
    const cards = [
      {
        name: "Charizard ex",
        setName: "Obsidian Flames",
        cardNumber: "125",
        rarity: "Ultra Rare",
        currentPrice: 89.99,
      },
      {
        name: "Pikachu VMAX",
        setName: "Vivid Voltage",
        cardNumber: "188",
        rarity: "Secret Rare",
        currentPrice: 145.50,
      },
      {
        name: "Mewtwo V",
        setName: "Pokemon GO",
        cardNumber: "030",
        rarity: "Holo Rare",
        currentPrice: 12.75,
      },
      {
        name: "Lugia V",
        setName: "Silver Tempest",
        cardNumber: "186",
        rarity: "Ultra Rare",
        currentPrice: 34.99,
      },
      {
        name: "Umbreon VMAX",
        setName: "Evolving Skies",
        cardNumber: "215",
        rarity: "Secret Rare",
        currentPrice: 278.00,
      },
    ];

    const now = Date.now();

    for (const card of cards) {
      const cardId = await ctx.db.insert("cards", {
        ...card,
        lastUpdated: now,
      });

      // Add initial price history
      await ctx.db.insert("cardPriceHistory", {
        cardId,
        price: card.currentPrice,
        timestamp: now,
      });

      // Add a previous price for change calculation
      await ctx.db.insert("cardPriceHistory", {
        cardId,
        price: card.currentPrice * (0.95 + Math.random() * 0.1),
        timestamp: now - 3600000, // 1 hour ago
      });
    }

    // Sample products data
    const products = [
      {
        name: "Obsidian Flames Booster Box",
        productType: "Booster Box",
        setName: "Obsidian Flames",
        currentPrice: 119.99,
      },
      {
        name: "Paldea Evolved Booster Bundle",
        productType: "Booster Bundle",
        setName: "Paldea Evolved",
        currentPrice: 24.99,
      },
      {
        name: "151 Elite Trainer Box",
        productType: "Elite Trainer Box",
        setName: "151",
        currentPrice: 64.99,
      },
      {
        name: "Scarlet & Violet Booster Box",
        productType: "Booster Box",
        setName: "Scarlet & Violet",
        currentPrice: 109.99,
      },
    ];

    for (const product of products) {
      const productId = await ctx.db.insert("products", {
        ...product,
        lastUpdated: now,
      });

      // Add initial price history
      await ctx.db.insert("productPriceHistory", {
        productId,
        price: product.currentPrice,
        timestamp: now,
      });

      // Add a previous price for change calculation
      await ctx.db.insert("productPriceHistory", {
        productId,
        price: product.currentPrice * (0.92 + Math.random() * 0.16),
        timestamp: now - 3600000,
      });
    }

    return { success: true, message: "Data seeded successfully" };
  },
});
