"use client";
import AddCategories from "@/components/admin/categories/add";
import ViewCategories from "@/components/admin/categories/view";
import { getAllData } from "@/lib/api";
import { useWindowWidth } from "@/lib/hooks";
import properties from "@/lib/properties";
import { Alert, Segmented, Space, Spin, Typography } from "antd";
import Search, { SearchProps } from "antd/es/input/Search";
import Fuse from "fuse.js";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
const items: { key: string; label: string; value: string }[] = [
  { key: "admin__category-edit", label: "Edit", value: "edit" },
  { key: "admin__category-preview", label: "Preview", value: "preview" },
  { key: "admin__category-delete", label: "Delete", value: "delete" },
  { key: "admin__category-add", label: "Add", value: "add" },
] as const;

const AdminCategoryPage = () => {
  const searchParams = useSearchParams();
  const windowSize = useWindowWidth();
  const router = useRouter();
  const [tab, setTab] = useState<(typeof items)[number]["label"]>("Edit");
  const [searchQuery, setSearchQuery] = useState<string | null>(
    searchParams.get("q")
  );
  const containerRef = useRef(null);
  const [categoriesList, setCategoriesList] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState({
    status: true,
    pageLoaded: false,
    categoriesLoaded: false,
    productsLoaded: false,
  });

  const fuse = new Fuse(categoriesList, {
    keys: ["name", "slug", "description"],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true,
    useExtendedSearch: true,
  });

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("action", value.toLocaleLowerCase());
    router.replace(`?${params.toString()}`);
  };
  const onSearch: SearchProps["onSearch"] = (value, _e, info) => {
    if (info?.source && info.source === "input") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("q", value);
      router.replace(`?${params.toString()}`);
    } else if (info?.source && info.source === "clear") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("q");
      router.replace(`?${params.toString()}`);
    }
  };

  useEffect(() => {
    if (!searchParams.get("action")) router.replace("?action=edit");
    else
      setTab(
        items.find((item) => item.value === searchParams.get("action"))
          ?.label || "Edit"
      );

    if (searchParams.get("q")) setSearchQuery(searchParams.get("q"));
    else setSearchQuery(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (containerRef.current) {
      setLoading((prev) => ({
        ...prev,
        status: prev.categoriesLoaded && prev.productsLoaded,
        pageLoaded: true,
      }));
    }
  }, [tab]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading((prev) => ({
        ...prev,
        status: true,
        categoriesLoaded: false,
        productsLoaded: false,
      }));
      let err = false;
      try {
        const response: IGetData = await getAllData();
        if (response.status !== 200) {
          console.error("Failed to fetch categories:", response.error);
          return;
        } else if (response.categories && response.categories.length > 0) {
          setCategoriesList(response.categories);
        }
      } catch (error) {
        err = true;
        console.error("Error fetching categories:", error);
      } finally {
        setLoading((prev) => ({
          ...prev,
          status: false,
          categoriesLoaded: !err,
          productsLoaded: !err,
        }));
      }
    };
    fetchData();
  }, []);

  return (
    <div className="categories__container" ref={containerRef}>
      {loading.pageLoaded ? (
        <Space direction="vertical" style={{ width: "100%" }}>
          <Alert
            message="Admin Categories"
            description={
              <>
                <p className="mb-4">This page is under construction.</p>
                <p className="mb-4">
                  Please check back later for the admin categories management
                  features.
                </p>
                <p className="mb-4">
                  If you have any questions or need assistance, please contact
                  support.
                </p>
              </>
            }
            type="warning"
          />
          <Typography.Title level={3}>Categories</Typography.Title>
          {tab !== "Add" && (
            <Search
              placeholder="search categories..."
              allowClear
              onSearch={onSearch}
              size={"large"}
              autoFocus={windowSize >= properties.breakpoints.laptop.small}
              autoComplete="off"
              defaultValue={searchQuery || ""}
            />
          )}

          <Segmented
            value={tab}
            onChange={handleTabChange}
            options={items.map((item) => item.label)}
            size={"large"}
            defaultValue={tab}
            block
          />
          {(tab === "Edit" || tab === "Preview" || tab === "Delete") && (
            <ViewCategories
              action={tab}
              loading={loading}
              categories={
                !searchQuery
                  ? categoriesList
                  : fuse.search(searchQuery).map((result) => result.item || [])
              }
            />
          )}
          {tab === "Add" && (
            <AddCategories
              categories={categoriesList}
              loading={loading}
              setCategoriesList={setCategoriesList}
            />
          )}
        </Space>
      ) : (
        <Spin fullscreen spinning />
      )}
    </div>
  );
};

export default AdminCategoryPage;
