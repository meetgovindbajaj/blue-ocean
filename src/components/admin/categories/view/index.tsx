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
const ViewCategories = () => {
  const AdminContext = useAdminContext();
  const { setCategoriesList, loading, setLoading } = AdminContext;

  const [actionType, setActionType] = useState<
    (typeof actionTypes)[number]["label"]
  >(actionTypes[0].label);
  const router = useRouter();
  const handleEdit = (category: ICategory) => {
    if (!category || !category.id) return;
    const params = new URLSearchParams(window.location.search);
    params.set("action", "add");
    params.set("type", "edit");
    params.set("id", category.id);
    router.replace(`?${params.toString()}`);
  };

  const handleDelete = async (category: ICategory) => {
    if (!category || !category.id) return;
    setLoading((prev) => ({ ...prev, categoriesLoaded: false }));
    try {
      const response = await fetch(`/api/v1/category/delete/${category.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        popupMessage?.open({
          type: "success",
          content: "Category deleted successfully.",
        });
        setCategoriesList((prevCategories) =>
          prevCategories.filter((cat) => cat.id !== category.id)
        );
      } else {
        const errorData = await response.json();
        popupMessage?.open({
          type: "error",
          content: errorData.message || "Failed to delete category.",
        });
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      popupMessage?.open({
        type: "error",
        content: "Failed to delete category. Please try again.",
      });
    } finally {
      setLoading((prev) => ({
        ...prev,
        categoriesLoaded: true,
      }));
    }
  };

  const handleStatus = async (category: ICategory) => {
    if (!category || !category.id) return;
    setLoading((prev) => ({ ...prev, categoriesLoaded: false }));
    try {
      const payload = {
        isActive: !category.isActive,
      };
      const response = await fetch(`/api/v1/category/update/${category.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        popupMessage?.open({
          type: "success",
          content: "Category status updated successfully.",
        });
        setCategoriesList((prevCategories) =>
          prevCategories.map((cat) =>
            cat.id === category.id ? { ...cat, isActive: !cat.isActive } : cat
          )
        );
      } else {
        const errorData = await response.json();
        popupMessage?.open({
          type: "error",
          content: errorData.message || "Failed to update category.",
        });
      }
    } catch (error) {
      console.error("Error updating category:", error);
      popupMessage?.open({
        type: "error",
        content: "Failed to update category. Please try again.",
      });
    } finally {
      setLoading((prev) => ({
        ...prev,
        categoriesLoaded: true,
      }));
    }
  };

  const handleBulkDelete = async (selectedCategories: ICategory[]) => {
    if (selectedCategories.length === 0) return;
    setLoading((prev) => ({ ...prev, categoriesLoaded: false }));
    try {
      const response = await fetch("/api/v1/category/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: selectedCategories.map((cat) => cat.id),
        }),
      });
      if (response.ok) {
        popupMessage?.open({
          type: "success",
          content: "Selected categories deleted successfully.",
        });
        setCategoriesList((prevCategories) =>
          prevCategories.filter(
            (cat) => !selectedCategories.some((c) => c.id === cat.id)
          )
        );
      } else {
        const errorData = await response.json();
        popupMessage?.open({
          type: "error",
          content: errorData.message || "Failed to delete categories.",
        });
      }
    } catch (error) {
      console.error("Error deleting categories:", error);
      popupMessage?.open({
        type: "error",
        content: "Failed to delete categories. Please try again.",
      });
    } finally {
      setLoading((prev) => ({
        ...prev,
        categoriesLoaded: true,
      }));
    }
  };

  const handleBulkStatus = async (selectedCategories: ICategory[]) => {
    if (selectedCategories.length === 0) return;
    setLoading((prev) => ({ ...prev, categoriesLoaded: false }));
    try {
      const payload = selectedCategories.map((cat) => ({
        id: cat.id,
        isActive: !cat.isActive,
      }));
      const response = await fetch("/api/v1/category/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categories: payload }),
      });
      if (response.ok) {
        popupMessage?.open({
          type: "success",
          content: "Selected categories status updated successfully.",
        });
        setCategoriesList((prevCategories) =>
          prevCategories.map((cat) =>
            selectedCategories.some((c) => c.id === cat.id)
              ? { ...cat, isActive: !cat.isActive }
              : cat
          )
        );
      } else {
        const errorData = await response.json();
        popupMessage?.open({
          type: "error",
          content: errorData.message || "Failed to update categories.",
        });
      }
    } catch (error) {
      console.error("Error updating categories:", error);
      popupMessage?.open({
        type: "error",
        content: "Failed to update categories. Please try again.",
      });
    } finally {
      setLoading((prev) => ({
        ...prev,
        categoriesLoaded: true,
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

export default ViewCategories;
