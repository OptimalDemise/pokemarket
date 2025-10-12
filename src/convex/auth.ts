// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation

import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { emailOtp } from "./auth/emailOtp";
import { MutationCtx } from "./_generated/server";


export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [emailOtp, Anonymous, Password],
  callbacks: {
    async createOrUpdateUser(ctx: MutationCtx, args) {
      // If there's an existing user ID, always use it (account linking)
      if (args.existingUserId) {
        return args.existingUserId;
      }
      
      // Try to find an existing user by email to link accounts
      if (args.profile.email) {
        const existingUser = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", args.profile.email))
          .first();
        
        if (existingUser) {
          // Link the new auth method to the existing user
          return existingUser._id;
        }
      }
      
      // No existing user found, create a new one
      return ctx.db.insert("users", {
        email: args.profile.email,
        name: args.profile.name as string | undefined,
        image: args.profile.image as string | undefined,
        emailVerificationTime: args.profile.emailVerificationTime as number | undefined,
      });
    },
  },
});