import { popupMessage } from "@/app/(client)/admin/layout";
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  ExportOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  Card,
  List,
  Popconfirm,
  Spin,
  Image,
  Badge,
  Popover,
  Dropdown,
  Menu,
  Button,
  MenuProps,
} from "antd";
import Meta from "antd/es/card/Meta";
import NextImage from "next/image";
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
  const handleStatus = async (category: ICategory) => {
    if (!category || !category.id) return;
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
    }
  };
  return loading.categoriesLoaded ? (
    <>
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
              title={<Popover content={item.name}>{item.name}</Popover>}
              style={{ width: "100%", overflow: "hidden" }}
              cover={
                <Image
                  src={`/api/v1/image/${item.image?.id}?&w=200&h=200&format=webp&q=30`}
                  alt={item.image?.name || ""}
                  width={"100%"}
                  height={200}
                  style={{ objectFit: "cover" }}
                  loading="lazy"
                  preview={{
                    src: `/api/v1/image/${item.image?.id}?&format=webp&q=90&o=1`,
                    mask: "Preview Image",
                  }}
                  placeholder={
                    <NextImage
                      src={`/api/v1/image/${item.image?.id}?&w=300&h=200&format=webp&q=10&t=1&grayscale=1`}
                      alt={item.image?.name || ""}
                      width={300}
                      height={200}
                      style={{ objectFit: "cover" }}
                      priority
                    />
                  }
                />
              }
              extra={
                <Badge
                  status="processing"
                  text={item.isActive ? "Active" : "Inactive"}
                  style={{ color: item.isActive ? "green" : "red" }}
                  color={item.isActive ? "green" : "red"}
                  data-status={item.isActive ? "active" : "inactive"}
                  rootClassName="badge-status"
                />
              }
              actions={[
                <EditOutlined
                  key="edit"
                  onClick={() => handleEdit(item)}
                  style={{ color: "#0097a7" }}
                />,
                <Popconfirm
                  key="delete"
                  title="Delete the category"
                  description="Are you sure to delete this category?"
                  onConfirm={() => handleDelete(item)}
                  okText="Delete"
                  okType="danger"
                >
                  <DeleteOutlined style={{ color: "red" }} />
                </Popconfirm>,
                <Dropdown
                  key="more"
                  popupRender={() => {
                    const items: MenuProps["items"] = [
                      {
                        label: "View",
                        icon: <ExportOutlined />,
                        key: "view",
                        onClick: () =>
                          window.open(`/category/${item.slug}`, "_blank"),
                      },
                      {
                        label: item.isActive ? "Deactivate" : "Activate",
                        icon: item.isActive ? (
                          <StopOutlined />
                        ) : (
                          <CheckOutlined />
                        ),
                        key: "status",
                        style: { color: item.isActive ? "red" : "green" },
                        onClick: () => handleStatus(item),
                      },
                    ];
                    return (
                      <Menu items={items}>
                        {/* <Menu.Item
                          key="view"
                          onClick={() =>
                            window.open(`/category/${item.slug}`, "_blank")
                          }
                        >
                          View
                        </Menu.Item>
                        <Menu.Item
                          key="status"
                          onClick={() => handleStatus(item)}
                          style={{ color: item.isActive ? "red" : "green" }}
                        >
                          {item.isActive ? "Deactivate" : "Activate"}
                        </Menu.Item> */}
                      </Menu>
                    );
                  }}
                  trigger={["click"]}
                >
                  <EllipsisOutlined />
                </Dropdown>,
              ]}
            >
              <Popover
                content={item.description}
                title={item.name}
                trigger="click"
              >
                <Meta description={item.description} />

                <Button
                  type="link"
                  style={{
                    marginTop: "8px",
                    padding: "0",
                    fontSize: "12px",
                  }}
                  size="small"
                  onClick={() => {}}
                  variant="link"
                >
                  View more
                </Button>
              </Popover>
            </Card>
          </List.Item>
        )}
      />
    </>
  ) : (
    <Spin fullscreen spinning percent={"auto"} />
  );
};

export default ViewCategories;
