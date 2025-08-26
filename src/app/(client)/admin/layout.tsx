"use client";
import { message, Spin, Splitter } from "antd";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Suspense, useEffect, useState } from "react";
import ResizeAlert from "@/components/admin/resizeAlert";
import properties from "@/lib/properties";
import { useWindowWidth } from "@/lib/hooks";
import { getAllData } from "@/lib/api";
import AdminDataProvider from "@/components/admin/AdminHOC";
import { setPopupMessage } from "@/lib/messageUtils";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const windowWidth = useWindowWidth();
  const [sidebarWidth, setSidebarWidth] = useState<number>(50);
  const [messageApi, contextHolder] = message.useMessage();
  const [categoriesList, setCategoriesList] = useState<ICategory[]>([]);
  const [productList, setProductList] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState({
    status: true,
    pageLoaded: false,
    categoriesLoaded: false,
    productsLoaded: false,
  });
  const handleResize = (sizes: number[]) => {
    setSidebarWidth(sizes[0] ?? 50);
  };
  setPopupMessage(messageApi);
  const showResizeAlert =
    (windowWidth < properties.breakpoints.mobile.medium && sidebarWidth > 70) ||
    (windowWidth >= properties.breakpoints.mobile.medium &&
      windowWidth < properties.breakpoints.mobile.large &&
      sidebarWidth > 100);

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
        console.log({ response });

        if (response.status !== 200) {
          console.error("Failed to fetch categories:", response.error);
          return;
        }
        if (response.categories && response.categories.length > 0) {
          setCategoriesList(response.categories);
        }
        if (response.products && response.products.length > 0) {
          setProductList(response.products);
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
    <>
      {contextHolder}
      <Splitter className="admin" onResize={handleResize}>
        <Splitter.Panel
          defaultSize={50}
          max={200}
          min={50}
          collapsible
          style={{ overflow: "hidden auto" }}
        >
          <AdminSidebar width={sidebarWidth} />
        </Splitter.Panel>
        <Splitter.Panel>
          {showResizeAlert ? (
            <ResizeAlert />
          ) : (
            <Suspense fallback={<Spin fullscreen spinning size="large" />}>
              <AdminDataProvider
                categories={categoriesList}
                setCategoriesList={setCategoriesList}
                products={productList}
                setProductsList={setProductList}
                loading={loading}
                setLoading={setLoading}
              >
                {children}
              </AdminDataProvider>
            </Suspense>
          )}
        </Splitter.Panel>
      </Splitter>
    </>
  );
}
