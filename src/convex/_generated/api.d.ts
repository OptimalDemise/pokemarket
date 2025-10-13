/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as adminActions from "../adminActions.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth from "../auth.js";
import type * as cards from "../cards.js";
import type * as cleanupPriceHistory from "../cleanupPriceHistory.js";
import type * as cleanupPriceHistoryAll from "../cleanupPriceHistoryAll.js";
import type * as crons from "../crons.js";
import type * as dailySnapshots from "../dailySnapshots.js";
import type * as favorites from "../favorites.js";
import type * as http from "../http.js";
import type * as maintenance from "../maintenance.js";
import type * as maintenanceJobs from "../maintenanceJobs.js";
import type * as pokemonTcgApi from "../pokemonTcgApi.js";
import type * as products from "../products.js";
import type * as seedData from "../seedData.js";
import type * as updateLogs from "../updateLogs.js";
import type * as updateProducts from "../updateProducts.js";
import type * as updateProgress from "../updateProgress.js";
import type * as userProfile from "../userProfile.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  adminActions: typeof adminActions;
  "auth/emailOtp": typeof auth_emailOtp;
  auth: typeof auth;
  cards: typeof cards;
  cleanupPriceHistory: typeof cleanupPriceHistory;
  cleanupPriceHistoryAll: typeof cleanupPriceHistoryAll;
  crons: typeof crons;
  dailySnapshots: typeof dailySnapshots;
  favorites: typeof favorites;
  http: typeof http;
  maintenance: typeof maintenance;
  maintenanceJobs: typeof maintenanceJobs;
  pokemonTcgApi: typeof pokemonTcgApi;
  products: typeof products;
  seedData: typeof seedData;
  updateLogs: typeof updateLogs;
  updateProducts: typeof updateProducts;
  updateProgress: typeof updateProgress;
  userProfile: typeof userProfile;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
