import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Create daily snapshots at midnight UTC
crons.daily(
  "create daily snapshots",
  { hourUTC: 0, minuteUTC: 0 },
  internal.dailySnapshots.createDailySnapshots
);

// Update card prices every 10 minutes (for live updates)
crons.interval(
  "update card prices",
  { minutes: 10 },
  internal.pokemonTcgApi.updateAllCardsWithRealData
);

// Update product prices every minute
crons.interval(
  "update product prices",
  { minutes: 1 },
  internal.updateProducts.updateProductPrices
);

// Update big movers cache every 5 minutes
crons.interval(
  "update big movers cache",
  { minutes: 5 },
  internal.cards.updateBigMoversCache,
  {}
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

crons.weekly(
  "cleanup redundant price history",
  { dayOfWeek: "sunday", hourUTC: 3, minuteUTC: 0 },
  internal.cleanupPriceHistoryAll.cleanupAllRedundantPriceHistory,
  {}
);

export default crons;