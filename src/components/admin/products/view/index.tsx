"use client";
import { AppstoreOutlined, BarsOutlined } from "@ant-design/icons";
import { Divider, Segmented, Spin } from "antd";
import React, { useState } from "react";
import ListView from "./ListView";
import GridView from "./GridView";
import { popupMessage } from "@/app/(client)/admin/layout";
import { useRouter } from "next/navigation";
import { useAdminContext } from "../../AdminHOC";

const actionTypes: {
  key: string;
  label: string;
  value: string;
  icon: React.JSX.Element;
}[] = [
  { key: "grid", label: "Grid", value: "Grid", icon: <AppstoreOutlined /> },
  { key: "list", label: "List", value: "List", icon: <BarsOutlined /> },
] as const;

const ViewProducts = () => {
  const AdminContext = useAdminContext();
  const { setProductsList, loading, setLoading } = AdminContext;

  const [actionType, setActionType] = useState<
    (typeof actionTypes)[number]["label"]
  >(actionTypes[0].label);
  const router = useRouter();

  const handleEdit = (product: IProduct) => {
    if (!product || !product.id) return;
    const params = new URLSearchParams(window.location.search);
    params.set("action", "add");
    params.set("type", "edit");
    params.set("id", product.id);
    router.replace(`?${params.toString()}`);
  };

  const handleDelete = async (product: IProduct) => {
    if (!product || !product.id) return;
    setLoading((prev) => ({ ...prev, productsLoaded: false }));
    try {
      const response = await fetch(`/api/v1/product/delete/${product.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        popupMessage?.open({
          type: "success",
          content: "Product deleted successfully.",
        });
        setProductsList((prevProducts) =>
          prevProducts.filter((prod) => prod.id !== product.id)
        );
      } else {
        const errorData = await response.json();
        popupMessage?.open({
          type: "error",
          content: errorData.message || "Failed to delete product.",
        });
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      popupMessage?.open({
        type: "error",
        content: "Failed to delete product. Please try again.",
      });
    } finally {
      setLoading((prev) => ({
        ...prev,
        productsLoaded: true,
      }));
    }
  };

  const handleStatus = async (product: IProduct) => {
    if (!product || !product.id) return;
    setLoading((prev) => ({ ...prev, productsLoaded: false }));
    try {
      const payload = {
        isActive: !product.isActive,
      };
      const response = await fetch(`/api/v1/product/update/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        popupMessage?.open({
          type: "success",
          content: "Product status updated successfully.",
        });
        setProductsList((prevProducts) =>
          prevProducts.map((prod) =>
            prod.id === product.id
              ? { ...prod, isActive: !prod.isActive }
              : prod
          )
        );
      } else {
        const errorData = await response.json();
        popupMessage?.open({
          type: "error",
          content: errorData.message || "Failed to update product.",
        });
      }
    } catch (error) {
      console.error("Error updating product:", error);
      popupMessage?.open({
        type: "error",
        content: "Failed to update product. Please try again.",
      });
    } finally {
      setLoading((prev) => ({
        ...prev,
        productsLoaded: true,
      }));
    }
  };

  const handleBulkDelete = async (selectedProducts: IProduct[]) => {
    if (selectedProducts.length === 0) return;
    setLoading((prev) => ({ ...prev, productsLoaded: false }));
    try {
      const response = await fetch("/api/v1/product/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: selectedProducts.map((prod) => prod.id),
        }),
      });
      if (response.ok) {
        popupMessage?.open({
          type: "success",
          content: "Selected products deleted successfully.",
        });
        setProductsList((prevProducts) =>
          prevProducts.filter(
            (prod) => !selectedProducts.some((p) => p.id === prod.id)
          )
        );
      } else {
        const errorData = await response.json();
        popupMessage?.open({
          type: "error",
          content: errorData.message || "Failed to delete products.",
        });
      }
    } catch (error) {
      console.error("Error deleting products:", error);
      popupMessage?.open({
        type: "error",
        content: "Failed to delete products. Please try again.",
      });
    } finally {
      setLoading((prev) => ({
        ...prev,
        productsLoaded: true,
      }));
    }
  };

  const handleBulkStatus = async (selectedProducts: IProduct[]) => {
    if (selectedProducts.length === 0) return;
    setLoading((prev) => ({ ...prev, productsLoaded: false }));
    try {
      const payload = selectedProducts.map((prod) => ({
        id: prod.id,
        isActive: !prod.isActive,
      }));
      const response = await fetch("/api/v1/product/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ products: payload }),
      });
      if (response.ok) {
        popupMessage?.open({
          type: "success",
          content: "Selected products status updated successfully.",
        });
        setProductsList((prevProducts) =>
          prevProducts.map((prod) =>
            selectedProducts.some((p) => p.id === prod.id)
              ? { ...prod, isActive: !prod.isActive }
              : prod
          )
        );
      } else {
        const errorData = await response.json();
        popupMessage?.open({
          type: "error",
          content: errorData.message || "Failed to update products.",
        });
      }
    } catch (error) {
      console.error("Error updating products:", error);
      popupMessage?.open({
        type: "error",
        content: "Failed to update products. Please try again.",
      });
    } finally {
      setLoading((prev) => ({
        ...prev,
        productsLoaded: true,
      }));
    }
  };

  return !loading.status ? (
    <>
      <Segmented
        value={actionType}
        onChange={(value: string) =>
          setActionType(
            actionTypes.find((item) => item.value === value)?.label ||
              actionTypes[0].label
          )
        }
        options={actionTypes}
        size={"middle"}
        defaultValue={actionType}
      />
      <Divider style={{ margin: "8px 0" }} />
      {actionType === "Grid" && (
        <GridView
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleStatus={handleStatus}
        />
      )}
      {actionType === "List" && (
        <ListView
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleStatus={handleStatus}
          handleBulkDelete={handleBulkDelete}
          handleBulkStatus={handleBulkStatus}
        />
      )}
    </>
  ) : (
    <Spin fullscreen spinning percent={"auto"} />
  );
};

export default ViewProducts;
