import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Create daily snapshots at midnight UTC
crons.daily(
  "create daily snapshots",
  { hourUTC: 0, minuteUTC: 0 },
  internal.dailySnapshots.createDailySnapshots
);

// Update card prices every hour
crons.interval(
  "update card prices",
  { hours: 1 },
  internal.pokemonTcgApi.updateAllCardsWithRealData
);

// Update product prices every minute
crons.interval(
  "update product prices",
  { minutes: 1 },
  internal.updateProducts.updateProductPrices
);

// Cleanup old price history weekly (Sundays at 2 AM UTC)
crons.weekly(
  "cleanup old card price history",
  { hourUTC: 2, minuteUTC: 0, dayOfWeek: "sunday" },
  internal.cards.cleanupOldPriceHistory
);

crons.weekly(
  "cleanup old product price history",
  { hourUTC: 2, minuteUTC: 15, dayOfWeek: "sunday" },
  internal.products.cleanupOldProductPriceHistory
);

// Cleanup old daily snapshots monthly (1st of month at 3 AM UTC)
crons.monthly(
  "cleanup old daily snapshots",
  { hourUTC: 3, minuteUTC: 0, day: 1 },
  internal.dailySnapshots.cleanupOldSnapshots
);

export default crons;