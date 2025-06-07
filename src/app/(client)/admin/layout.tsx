"use client";
import { Splitter } from "antd";
import { AdminSidebar } from "@/components/admin/sidebar";
import { useState } from "react";
import ResizeAlert from "@/components/admin/resizeAlert";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarWidth, setSidebarWidth] = useState<number>(200);
  const [mainWidth, setMainWidth] = useState<number>(250);
  const handleResize = (sizes: number[]) => {
    setSidebarWidth(sizes[0] ?? 200);
    setMainWidth(sizes[1] ?? 0);
  };
  return (
    <Splitter className="admin" onResize={handleResize}>
      <Splitter.Panel
        defaultSize={60}
        max={200}
        min={60}
        collapsible
        style={{ overflow: "hidden auto" }}
      >
        <AdminSidebar width={sidebarWidth} />
      </Splitter.Panel>
      <Splitter.Panel>
        {mainWidth < 250 ? <ResizeAlert /> : children}
      </Splitter.Panel>
    </Splitter>
  );
}
