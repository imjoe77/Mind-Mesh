import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import User from "@/app/models/User";
import connectDB from "@/db/connectDB";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user }) {
      try {
        await connectDB();

        // One-time: drop stale indexes that no longer match the schema
        if (!authOptions._indexesSynced) {
          const staleIndexes = ["usn_1", "username_1"];
          for (const idx of staleIndexes) {
            try {
              await User.collection.dropIndex(idx);
              console.log(`Dropped stale ${idx} index`);
            } catch (_) {
              // Index doesn't exist — that's fine
            }
          }
          authOptions._indexesSynced = true;
        }

        const email = user.email.toLowerCase();

        // Use upsert to avoid race conditions and duplicate key errors
        await User.findOneAndUpdate(
          { email },
          {
            $setOnInsert: {
              name: user.name,
              email,
              profilePicture: user.image,
            },
          },
          { upsert: true, returnDocument: "after" }
        );

        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        // This is called on sign in
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: user.email.toLowerCase() });
          if (dbUser) {
            token.id = dbUser._id.toString();
          }
        } catch (error) {
          console.error("JWT callback error:", error);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id;
      } else {
        // Fallback for safety
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: session.user.email });
          if (dbUser) {
            session.user.id = dbUser._id.toString();
          }
        } catch (error) {
          console.error("Session callback error:", error);
        }
      }
      return session;
    },
  },
};
