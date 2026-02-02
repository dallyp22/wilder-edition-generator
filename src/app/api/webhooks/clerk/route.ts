import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const eventType = payload.type as string;
    const userData = payload.data;

    switch (eventType) {
      case "user.created":
        await db.insert(users).values({
          clerkId: userData.id,
          email: userData.email_addresses?.[0]?.email_address || "",
          firstName: userData.first_name || null,
          lastName: userData.last_name || null,
          role: "member",
        }).onConflictDoNothing();
        console.log("[Clerk Webhook] User created:", userData.id);
        break;

      case "user.updated":
        await db
          .update(users)
          .set({
            email: userData.email_addresses?.[0]?.email_address || "",
            firstName: userData.first_name || null,
            lastName: userData.last_name || null,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, userData.id));
        console.log("[Clerk Webhook] User updated:", userData.id);
        break;

      case "user.deleted":
        await db.delete(users).where(eq(users.clerkId, userData.id));
        console.log("[Clerk Webhook] User deleted:", userData.id);
        break;

      default:
        console.log(`[Clerk Webhook] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Clerk Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
