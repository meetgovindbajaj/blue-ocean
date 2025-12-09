import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { trackEvent, getClientIp } from "@/lib/analytics";
import { EventType, EntityType } from "@/models/Analytics";

export const dynamic = "force-dynamic";

// Track analytics events
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      eventType,
      entityType,
      entityId,
      entitySlug,
      entityName,
      sessionId,
      userId,
      metadata = {},
    } = body;

    if (!eventType || !entityType) {
      return NextResponse.json(
        { success: false, error: "eventType and entityType are required" },
        { status: 400 }
      );
    }

    // Get IP and user agent
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "";
    const referer = request.headers.get("referer") || "";

    // Track the event
    const event = await trackEvent({
      eventType: eventType as EventType,
      entityType: entityType as EntityType,
      entityId,
      entitySlug,
      entityName,
      sessionId,
      userId,
      ip,
      metadata: {
        ...metadata,
        userAgent,
        referrer: referer,
      },
    });

    return NextResponse.json({
      success: true,
      eventId: event?.id,
    });
  } catch (error) {
    console.error("Analytics track error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to track event" },
      { status: 500 }
    );
  }
}

// Batch track multiple events
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { events } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { success: false, error: "events array is required" },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "";

    const results = await Promise.all(
      events.map((event: any) =>
        trackEvent({
          eventType: event.eventType as EventType,
          entityType: event.entityType as EntityType,
          entityId: event.entityId,
          entitySlug: event.entitySlug,
          entityName: event.entityName,
          sessionId: event.sessionId,
          userId: event.userId,
          ip,
          metadata: {
            ...event.metadata,
            userAgent,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      count: results.filter(Boolean).length,
    });
  } catch (error) {
    console.error("Analytics batch track error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to track events" },
      { status: 500 }
    );
  }
}
