import Fuse from "fuse.js";
import type { IFuseOptions, FuseResult } from "fuse.js";
import { SearchResult } from "@/types/agent";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";

interface SearchableItem {
  id: string;
  type: "product" | "category" | "documentation";
  title: string;
  description: string;
  content?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Semantic search service using Fuse.js for fuzzy matching
 */
export class SemanticSearchService {
  private productIndex: Fuse<SearchableItem> | null = null;
  private categoryIndex: Fuse<SearchableItem> | null = null;
  private documentationIndex: Fuse<SearchableItem> | null = null;

  private readonly fuseOptions: IFuseOptions<SearchableItem> = {
    keys: [
      { name: "title", weight: 0.4 },
      { name: "description", weight: 0.3 },
      { name: "content", weight: 0.2 },
      { name: "tags", weight: 0.1 },
    ],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
  };

  /**
   * Initialize search indices
   */
  async initialize(): Promise<void> {
    try {
      await dbConnect();

      // Load products
      const products = await Product.find({ isActive: true })
        .select("id name description slug category")
        .lean();

      const productItems: SearchableItem[] = products.map((product) => ({
        id: product.id,
        type: "product" as const,
        title: product.name,
        description: product.description || "",
        content: `${product.name} ${product.description || ""}`,
        metadata: {
          slug: product.slug,
          categoryId: product.category,
        },
      }));

      this.productIndex = new Fuse(productItems, this.fuseOptions);

      // Load categories
      const categories = await Category.find({ isActive: true })
        .select("id name description slug")
        .lean();

      const categoryItems: SearchableItem[] = categories.map((category) => ({
        id: category.id,
        type: "category" as const,
        title: category.name,
        description: category.description || "",
        content: `${category.name} ${category.description || ""}`,
        metadata: {
          slug: category.slug,
        },
      }));

      this.categoryIndex = new Fuse(categoryItems, this.fuseOptions);

      // Documentation items (static for now)
      const documentationItems: SearchableItem[] = [
        {
          id: "doc-1",
          type: "documentation",
          title: "Product API",
          description: "API endpoints for product management",
          content: "Create, read, update, and delete products",
          tags: ["api", "products", "rest"],
        },
        {
          id: "doc-2",
          type: "documentation",
          title: "Category Management",
          description: "How to manage product categories",
          content: "Organize products into hierarchical categories",
          tags: ["categories", "organization"],
        },
        {
          id: "doc-3",
          type: "documentation",
          title: "Search Functionality",
          description: "Using the search features",
          content: "Semantic search and filtering capabilities",
          tags: ["search", "filter", "query"],
        },
      ];

      this.documentationIndex = new Fuse(documentationItems, this.fuseOptions);
    } catch (error) {
      console.error("Error initializing search service:", error);
      throw error;
    }
  }

  /**
   * Search across all indices
   */
  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    if (!this.productIndex || !this.categoryIndex || !this.documentationIndex) {
      await this.initialize();
    }

    const results: SearchResult[] = [];

    // Search products
    const productResults =
      this.productIndex?.search(query, { limit: limit / 2 }) || [];
    results.push(...this.mapResults(productResults, "product"));

    // Search categories
    const categoryResults =
      this.categoryIndex?.search(query, { limit: limit / 4 }) || [];
    results.push(...this.mapResults(categoryResults, "category"));

    // Search documentation
    const docResults =
      this.documentationIndex?.search(query, { limit: limit / 4 }) || [];
    results.push(...this.mapResults(docResults, "documentation"));

    // Sort by score and limit
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Search only products
   */
  async searchProducts(
    query: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    if (!this.productIndex) {
      await this.initialize();
    }

    const results = this.productIndex?.search(query, { limit }) || [];
    return this.mapResults(results, "product");
  }

  /**
   * Search only categories
   */
  async searchCategories(
    query: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    if (!this.categoryIndex) {
      await this.initialize();
    }

    const results = this.categoryIndex?.search(query, { limit }) || [];
    return this.mapResults(results, "category");
  }

  /**
   * Search documentation
   */
  async searchDocumentation(
    query: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    if (!this.documentationIndex) {
      await this.initialize();
    }

    const results = this.documentationIndex?.search(query, { limit }) || [];
    return this.mapResults(results, "documentation");
  }

  /**
   * Map Fuse.js results to SearchResult format
   */
  private mapResults(
    fuseResults: FuseResult<SearchableItem>[],
    type: "product" | "category" | "documentation"
  ): SearchResult[] {
    return fuseResults.map((result) => ({
      id: result.item.id,
      type: result.item.type || type,
      title: result.item.title,
      description: result.item.description,
      score: 1 - (result.score || 0), // Convert to 0-1 where 1 is best match
      metadata: result.item.metadata,
    }));
  }

  /**
   * Refresh indices with new data
   */
  async refresh(): Promise<void> {
    await this.initialize();
  }

  /**
   * Get suggestions based on partial query
   */
  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    const results = await this.search(query, limit);
    return results.map((r) => r.title);
  }
}

// Singleton instance
export const semanticSearchService = new SemanticSearchService();
