import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Create daily snapshots at midnight UTC
crons.daily(
  "create daily snapshots",
  { hourUTC: 0, minuteUTC: 0 },
  internal.dailySnapshots.createDailySnapshots
);

// Update card prices every minute
crons.interval(
  "update card prices",
  { minutes: 1 },
  internal.pokemonTcgApi.updateAllCardsWithRealData
);

// Update product prices every minute
crons.interval(
  "update product prices",
  { minutes: 1 },
  internal.updateProducts.updateProductPrices
);

export default crons;