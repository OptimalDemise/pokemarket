import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Weekly maintenance - runs Sunday at 11:55 PM UTC (5 minutes before Monday)
crons.weekly(
  "weekly maintenance",
  { hourUTC: 23, minuteUTC: 55, dayOfWeek: "sunday" },
  internal.maintenanceJobs.runWeeklyMaintenance
);

// Create daily snapshots at midnight UTC - now using action for batching
crons.daily(
  "create daily snapshots",
  { hourUTC: 0, minuteUTC: 0 },
  internal.dailySnapshots.createDailySnapshots
);

// Update card prices every 2 minutes (for live updates)
crons.interval(
  "update card prices",
  { minutes: 2 },
  internal.pokemonTcgApi.updateAllCardsWithRealData
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
  "cleanup redundant price history",
  { dayOfWeek: "monday", hourUTC: 0, minuteUTC: 0 },
  internal.cleanupPriceHistoryAll.cleanupAllRedundantPriceHistory,
  {}
);

// Cleanup old daily snapshots monthly (1st of month at 3 AM UTC)
crons.monthly(
  "cleanup old daily snapshots",
  { hourUTC: 3, minuteUTC: 0, day: 1 },
  internal.dailySnapshots.cleanupOldSnapshots
);

export default crons;