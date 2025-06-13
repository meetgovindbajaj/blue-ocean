"use client";
import { message, Spin, Splitter } from "antd";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Suspense, useState } from "react";
import ResizeAlert from "@/components/admin/resizeAlert";
import properties from "@/lib/properties";
import { useWindowWidth } from "@/lib/hooks";
import { MessageInstance } from "antd/es/message/interface";

export let popupMessage: MessageInstance | undefined = undefined;

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const windowWidth = useWindowWidth();
  const [sidebarWidth, setSidebarWidth] = useState<number>(50);
  const [messageApi, contextHolder] = message.useMessage();
  const handleResize = (sizes: number[]) => {
    setSidebarWidth(sizes[0] ?? 50);
  };
  popupMessage = messageApi;
  const showResizeAlert =
    (windowWidth < properties.breakpoints.mobile.medium && sidebarWidth > 70) ||
    (windowWidth >= properties.breakpoints.mobile.medium &&
      windowWidth < properties.breakpoints.mobile.large &&
      sidebarWidth > 100);

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
              {children}
            </Suspense>
          )}
        </Splitter.Panel>
      </Splitter>
    </>
  );
}
