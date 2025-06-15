"use client";
import { message, Spin, Splitter } from "antd";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Suspense, useEffect, useState } from "react";
import ResizeAlert from "@/components/admin/resizeAlert";
import properties from "@/lib/properties";
import { useWindowWidth } from "@/lib/hooks";
import { MessageInstance } from "antd/es/message/interface";
import { getAllData } from "@/lib/api";
import AdminDataProvider from "@/components/admin/AdminHOC";

export let popupMessage: MessageInstance | undefined = undefined;

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const windowWidth = useWindowWidth();
  const [sidebarWidth, setSidebarWidth] = useState<number>(50);
  const [messageApi, contextHolder] = message.useMessage();
  const [categoriesList, setCategoriesList] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState({
    status: true,
    pageLoaded: false,
    categoriesLoaded: false,
    productsLoaded: false,
  });
  const handleResize = (sizes: number[]) => {
    setSidebarWidth(sizes[0] ?? 50);
  };
  popupMessage = messageApi;
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
