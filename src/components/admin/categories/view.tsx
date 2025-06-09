import { popupMessage } from "@/app/(client)/admin/layout";
import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { Card, List, Popconfirm, Spin } from "antd";
import Meta from "antd/es/card/Meta";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

interface IProps {
  categories: ICategory[];
  setCategoriesList: React.Dispatch<React.SetStateAction<ICategory[]>>;
  loading: {
    status: boolean;
    pageLoaded: boolean;
    categoriesLoaded: boolean;
    productsLoaded: boolean;
  };
}

const ViewCategories = ({ categories, loading, setCategoriesList }: IProps) => {
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
    }
  };
  return loading.categoriesLoaded ? (
    <List
      grid={{
        gutter: [16, 16],
        xs: 1,
        sm: 2,
        md: 3,
        lg: 4,
        xl: 5,
        xxl: 6,
      }}
      style={{ width: "100%" }}
      dataSource={categories}
      renderItem={(item: ICategory) => (
        <List.Item>
          <Card
            key={item.id}
            style={{ width: "100%" }}
            cover={
              <Image
                src={`/api/v1/image/${item.image?.id}?&w=200&h=100&format=webp&q=50`}
                alt={item.image?.name || ""}
                width={200}
                height={100}
                style={{ objectFit: "cover" }}
                placeholder="blur"
                blurDataURL={`/api/v1/image/${item.image?.id}?w=200&h=100&format=webp&q=10&t=1&grayscale=1`}
              />
            }
            actions={[
              <EditOutlined key="edit" onClick={() => handleEdit(item)} />,
              <ExportOutlined key="preview" />,
              <Popconfirm
                key="delete"
                title="Delete the category!"
                description="Are you sure to delete this category?"
                onConfirm={() => handleDelete(item)}
                okText="Delete"
              >
                <DeleteOutlined type="danger" />,
              </Popconfirm>,
            ]}
          >
            <Meta title={item.name} description={item.description} />
          </Card>
        </List.Item>
      )}
    />
  ) : (
    <Spin fullscreen spinning percent={"auto"} />
  );
};

export default ViewCategories;
