import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  ExportOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Dropdown,
  Image,
  List,
  Menu,
  MenuProps,
  Popconfirm,
  Popover,
} from "antd";
import Meta from "antd/es/card/Meta";
import NextImage from "next/image";
import React from "react";
import { useAdminContext } from "../../AdminHOC";
interface IProps {
  handleEdit: (category: ICategory) => void;
  handleDelete: (category: ICategory) => Promise<void>;
  handleStatus: (category: ICategory) => Promise<void>;
}
const GridView = ({ handleEdit, handleDelete, handleStatus }: IProps) => {
  const { categories, loading } = useAdminContext();
  return (
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
              size="small"
              cover={
                <Image
                  src={`/api/v1/image/${item.image?.id}?w=200&h=150&format=webp`}
                  alt={item.image?.name || ""}
                  width={"100%"}
                  height={150}
                  style={{ objectFit: "cover" }}
                  loading="lazy"
                  preview={{
                    mask: "Preview",
                    scaleStep: 1,
                  }}
                  placeholder={
                    <NextImage
                      src={`/api/v1/image/${item.image?.id}?h=150&format=webp&q=10&t=1&grayscale=1`}
                      alt={item.image?.name || ""}
                      loading="lazy"
                      fill
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
                    return <Menu items={items} />;
                  }}
                  trigger={["click"]}
                >
                  <EllipsisOutlined />
                </Dropdown>,
              ]}
            >
              <Meta description={item.description} />
              <Popover
                content={item.description}
                title={item.name}
                trigger="click"
              >
                <Button
                  type="link"
                  style={{
                    marginTop: "8px",
                    padding: "0",
                    fontSize: "10px",
                    color: "#0097a7",
                  }}
                  size="small"
                  onClick={() => {}}
                  variant="link"
                >
                  Read more
                </Button>
              </Popover>
            </Card>
          </List.Item>
        )}
        loading={!loading.categoriesLoaded}
      />
    </>
  );
};

export default GridView;
