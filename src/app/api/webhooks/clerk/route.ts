import { NextRequest, NextResponse } from "next/server";

/**
 * Clerk webhook handler — syncs user events to the database.
 * Activate full logic when DATABASE_URL is connected in Phase 2.
 *
 * Clerk Dashboard → Webhooks → Add endpoint:
 *   URL: https://your-domain.com/api/webhooks/clerk
 *   Events: user.created, user.updated, user.deleted
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const eventType = payload.type as string;

    // Log for debugging during development
    console.log(`[Clerk Webhook] Received event: ${eventType}`);

    switch (eventType) {
      case "user.created":
        // TODO: Insert user into database
        console.log("[Clerk Webhook] User created:", payload.data.id);
        break;
      case "user.updated":
        // TODO: Update user in database
        console.log("[Clerk Webhook] User updated:", payload.data.id);
        break;
      case "user.deleted":
        // TODO: Soft-delete user in database
        console.log("[Clerk Webhook] User deleted:", payload.data.id);
        break;
      default:
        console.log(`[Clerk Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Clerk Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
