"use client";
import { useAdminContext } from "@/components/admin/AdminHOC";
import { useWindowWidth } from "@/lib/hooks";
import properties from "@/lib/properties";
import { Segmented, Space, Spin } from "antd";
import Search from "antd/es/input/Search";
import Title from "antd/es/typography/Title";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
const items: { key: string; label: string; value: string }[] = [
  { key: "admin__products-view", label: "View", value: "view" },
  { key: "admin__products-add", label: "Add", value: "add" },
] as const;
const AdminProductPage = () => {
  const AdminContext = useAdminContext();
  const { loading, setLoading, searchQuery, setSearchQuery, onSearch } =
    AdminContext;
  const searchParams = useSearchParams();
  const windowSize = useWindowWidth();
  const router = useRouter();
  const [tab, setTab] = useState<(typeof items)[number]["label"]>("View");
  const containerRef = useRef(null);
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams();
    params.set("action", value.toLocaleLowerCase());
    router.replace(`?${params.toString()}`);
  };

  useEffect(() => {
    if (!searchParams.get("action")) router.replace("?action=view");
    else {
      const newTab = items.find(
        (item) => item.value === searchParams.get("action")
      )?.label;
      if (newTab) {
        setTab(newTab);
      } else {
        const params = new URLSearchParams(searchParams.toString());
        params.set("action", "view");
        router.replace(`?${params.toString()}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (containerRef.current) {
      setLoading((prev) => ({
        ...prev,
        status: !(prev.categoriesLoaded && prev.productsLoaded),
        pageLoaded: true,
      }));
    }
  }, [tab, setLoading]);

  return (
    <div className="products__container">
      {loading?.pageLoaded ? (
        <Space direction="vertical" style={{ width: "100%" }}>
          <Title level={3}>Products</Title>
          <Segmented
            value={tab}
            onChange={handleTabChange}
            options={items.map((item) => item.label)}
            size={"middle"}
            defaultValue={tab}
            block
          />
          {tab === "View" && (
            <>
              <Search
                placeholder="search categories..."
                onSearch={onSearch}
                size={"middle"}
                autoFocus={windowSize >= properties.breakpoints.laptop.small}
                autoComplete="off"
                value={searchQuery || ""}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
              />
              {/* <ViewAdminCategories /> */}
            </>
          )}
          {/* {tab === "Add" && <AddCategories />} */}
        </Space>
      ) : (
        <Spin fullscreen spinning />
      )}
    </div>
  );
};

export default AdminProductPage;
