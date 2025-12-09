import { clerkClient } from "@clerk/express";

export const auth = async (req, res, next) => {
  try {
    const { userId, has } = await req.auth();
    const hasPremiumPlan = await has({ plan: "premium" });

    const user = await clerkClient.users.getUser(userId);

    // Determine plan
    req.plan = hasPremiumPlan ? "premium" : "free";

    // Initialize credits if they don't exist
    if (!user.privateMetadata?.credits) {
      const defaultCredits = hasPremiumPlan
        ? { resumeReview: 20, article: 50, blogTitle: 50, image: 20, removal: 30 }
        : { resumeReview: 2, article: 5, blogTitle: 5, image: 2, removal: 3 };

      await clerkClient.users.updateUser(userId, {
        privateMetadata: {
          credits: defaultCredits,
        },
      });

      req.credits = defaultCredits;
    } else {
      req.credits = user.privateMetadata.credits;
    }

    next();
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
