import { HomeOutlined } from "@ant-design/icons";
import { Breadcrumb } from "antd";
import React from "react";
interface ICategoryData extends ICategory {
  breadcrumbs: {
    id: string;
    name: string;
    url: string;
    slug: string;
  }[];
  subCategories: {
    id: string;
    name: string;
    slug: string;
    url: string;
  }[];
}
interface IProps {
  params: Promise<{ id: string }>;
}
const CategoryPage = async ({ params }: IProps) => {
  try {
    const { id } = await params;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/v1/category/${id}`
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch category data");
    }
    const categoryData: ICategoryData = await response.json();
    // console.log({ categoryData });

    if (!categoryData) {
      throw new Error("Category data is empty or undefined");
    }
    const productsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/v1/products?category=${categoryData.id}`
    );
    const _productsData = await productsResponse.json();
    // console.log({ productsData });
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/v1/stats`, {
      method: "POST",
      body: JSON.stringify({ type: "category", refId: categoryData.id }),
    });
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/v1/stats?type=category`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!res.ok) {
      throw new Error("Failed to fetch category stats");
    }
    const _statsData = await res.json();
    // console.log("Category Stats Data:", statsData);

    return (
      <div>
        <Breadcrumb
          items={categoryData?.breadcrumbs?.map(
            (
              item: { id: string; name: string; url: string; slug: string },
              i: number
            ) => ({
              title: item.name === "Home" ? <HomeOutlined /> : item.name,
              key: item.id,
              href:
                i !== categoryData.breadcrumbs.length - 1
                  ? item.url
                  : undefined,
            })
          )}
        />
        <h3>{categoryData.name}</h3>
        <p>{categoryData.description}</p>
        {categoryData.subCategories.length > 0 && (
          <>
            <h4>Subcategories:</h4>
            <ul>
              {categoryData.subCategories.map((subCategory) => (
                <li key={subCategory.id} style={{ listStyleType: "none" }}>
                  <a href={subCategory.url}>{subCategory.name}</a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error fetching category data:", error);
    return (
      <div>
        <h1>Error</h1>
        <p>
          {error instanceof Error
            ? error.message
            : "An unknown error occurred."}
        </p>
      </div>
    );
  }
};

export default CategoryPage;
