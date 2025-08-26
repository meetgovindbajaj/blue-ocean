// Check if we're on the server side
// const isServerSide = typeof window === "undefined";
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : "http://localhost:3000";
export async function getAllData(): Promise<IGetData> {
  // if (isServerSide) {
  // Server-side logic
  try {
    const productsApi = `${baseUrl}/api/v1/products`;
    const categoryApi = `${baseUrl}/api/v1/category`;
    const response = await Promise.allSettled([
      fetch(productsApi),
      fetch(categoryApi),
    ]);
    const [productsResult, categoryResult] = response;
    if (
      productsResult.status === "fulfilled" &&
      categoryResult.status === "fulfilled"
    ) {
      const productsData = await productsResult.value.json();
      const categoriesData = await categoryResult.value.json();
      console.log({ productsData, categoriesData });

      return {
        products: productsData.success ? productsData.products : [],
        categories: categoriesData.success ? categoriesData.categories : [],
        status: 200,
        message: "Data fetched successfully",
        error: undefined,
      };
    } else {
      return {
        status: 500,
        message: "Failed to fetch data",
        error: "One or more requests failed",
      };
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      status: 500,
      message: "An error occurred while fetching data.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
  // } else {
  //   // Client-side logic
  //   return {
  //     status: 403,
  //     error: "Forbidden",
  //     message: "This function can only be called on the server side.",
  //   };
  // }
}
