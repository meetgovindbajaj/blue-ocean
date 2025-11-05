import { NextRequest, NextResponse } from "next/server";
import { agentService } from "@/lib/agent";
import { AgentRequest } from "@/types/agent";

/**
 * POST /api/v1/agent/chat
 * Handle agent chat requests
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    const agentRequest: AgentRequest = {
      message: body.message,
      conversationId: body.conversationId,
      userId: body.userId,
      context: body.context,
    };

    // Process request through agent service
    const response = await agentService.processRequest(agentRequest);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Agent chat error:", error);
    return NextResponse.json(
      {
        error: "Failed to process agent request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/agent/chat?conversationId=xxx
 * Get conversation history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    const history = await agentService.getConversationHistory(conversationId);

    return NextResponse.json(
      {
        conversationId,
        messages: history,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching conversation history:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation history" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/agent/chat?conversationId=xxx
 * Clear conversation
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    const deleted = await agentService.clearConversation(conversationId);

    return NextResponse.json(
      {
        success: deleted,
        message: deleted
          ? "Conversation cleared successfully"
          : "Conversation not found",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error clearing conversation:", error);
    return NextResponse.json(
      { error: "Failed to clear conversation" },
      { status: 500 }
    );
  }
}
