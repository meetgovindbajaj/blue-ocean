import { NextRequest, NextResponse } from "next/server";
import { semanticSearchService } from "@/lib/agent";

/**
 * POST /api/v1/agent/search
 * Perform semantic search
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.query || typeof body.query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    const { query, limit = 10, type } = body;

    let results;
    switch (type) {
      case "products":
        results = await semanticSearchService.searchProducts(query, limit);
        break;
      case "categories":
        results = await semanticSearchService.searchCategories(query, limit);
        break;
      case "documentation":
        results = await semanticSearchService.searchDocumentation(query, limit);
        break;
      default:
        results = await semanticSearchService.search(query, limit);
    }

    return NextResponse.json(
      {
        query,
        results,
        count: results.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Semantic search error:", error);
    return NextResponse.json(
      {
        error: "Failed to perform search",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/agent/search/suggestions?q=xxx
 * Get search suggestions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "5");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const suggestions = await semanticSearchService.getSuggestions(query, limit);

    return NextResponse.json(
      {
        query,
        suggestions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting suggestions:", error);
    return NextResponse.json(
      { error: "Failed to get suggestions" },
      { status: 500 }
    );
  }
}
