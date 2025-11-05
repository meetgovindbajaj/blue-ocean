import { NextResponse } from "next/server";
import {
  DEFAULT_AGENT_CONFIG,
  CAPABILITY_DESCRIPTIONS,
} from "@/lib/agent";

/**
 * GET /api/v1/agent/config
 * Get agent configuration and capabilities
 */
export async function GET() {
  try {
    return NextResponse.json(
      {
        name: DEFAULT_AGENT_CONFIG.name,
        version: DEFAULT_AGENT_CONFIG.version,
        capabilities: DEFAULT_AGENT_CONFIG.capabilities.map((cap) => ({
          name: cap,
          description: CAPABILITY_DESCRIPTIONS[cap],
        })),
        maxContextLength: DEFAULT_AGENT_CONFIG.maxContextLength,
        maxResponseLength: DEFAULT_AGENT_CONFIG.maxResponseLength,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching agent config:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent configuration" },
      { status: 500 }
    );
  }
}
