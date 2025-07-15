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
  Carousel,
  Dropdown,
  Image,
  List,
  MenuProps,
  Pagination,
  Popconfirm,
  Popover,
} from "antd";
import Meta from "antd/es/card/Meta";
import React, { useState, useEffect } from "react";
import { useAdminContext } from "../../AdminHOC";

interface IProps {
  handleEdit: (product: IProduct) => void;
  handleDelete: (product: IProduct) => Promise<void>;
  handleStatus: (product: IProduct) => Promise<void>;
}

const GridView = ({ handleEdit, handleDelete, handleStatus }: IProps) => {
  const { products, loading } = useAdminContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [paginatedProducts, setPaginatedProducts] = useState<IProduct[]>([]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setPaginatedProducts(products.slice(startIndex, endIndex));
  }, [products, currentPage, pageSize]);

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1);
    }
  };

  return (
    <>
      <List
        grid={{
          gutter: [16, 16],
          xs: 1,
          sm: 2,
          md: 3,
          lg: 4,
          xl: 4,
          xxl: 6,
        }}
        style={{ width: "100%", minHeight: "400px" }}
        dataSource={paginatedProducts}
        renderItem={(item: IProduct) => (
          <List.Item>
            <Card
              key={item.id}
              title={
                <Popover content={item.name} title="Product Name">
                  <span
                    style={{
                      display: "block",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "200px",
                    }}
                  >
                    {item.name}
                  </span>
                </Popover>
              }
              style={{ width: "100%", overflow: "hidden" }}
              size="small"
              cover={
                item.images && item.images.length > 1 ? (
                  <Carousel autoplay autoplaySpeed={3000} arrows infinite>
                    {item.images.map((image, index) => (
                      <div key={image.id || index}>
                        <Image
                          src={`/api/v1/image/${image.id}?w=250&h=180&format=webp`}
                          alt={image.name || `Product image ${index + 1}`}
                          width="100%"
                          height={180}
                          style={{ objectFit: "cover" }}
                          loading="lazy"
                          preview={{
                            mask: "Preview",
                            scaleStep: 1,
                          }}
                        />
                      </div>
                    ))}
                  </Carousel>
                ) : (
                  <Image
                    src={`/api/v1/image/${item.images?.[0]?.id}?w=250&h=180&format=webp`}
                    alt={item.images?.[0]?.name || "Product image"}
                    width="100%"
                    height={180}
                    style={{ objectFit: "cover" }}
                    loading="lazy"
                    preview={{
                      mask: "Preview",
                      scaleStep: 1,
                    }}
                    fallback="/images/fallback.webp"
                  />
                )
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
                  title="Delete the product"
                  description="Are you sure to delete this product?"
                  onConfirm={() => handleDelete(item)}
                  okText="Delete"
                  okType="danger"
                >
                  <DeleteOutlined style={{ color: "red" }} />
                </Popconfirm>,
                <Dropdown
                  key="more"
                  menu={{
                    items: [
                      {
                        label: "View",
                        icon: <ExportOutlined />,
                        key: "view",
                        onClick: () =>
                          window.open(`/product/${item.slug}`, "_blank"),
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
                    ] as MenuProps["items"],
                  }}
                  trigger={["click"]}
                >
                  <EllipsisOutlined />
                </Dropdown>,
              ]}
            >
              <Meta
                description={
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginBottom: "8px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.description}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#333",
                        fontWeight: "500",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>
                          Retail:{" "}
                          <strong style={{ color: "#52c41a" }}>
                            ${item.prices.retail}
                          </strong>
                        </span>
                        {item.prices.discount > 0 && (
                          <span
                            style={{
                              background: "#ff4d4f",
                              color: "white",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "10px",
                            }}
                          >
                            -{item.prices.discount}%
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: "4px" }}>
                        Wholesale:{" "}
                        <strong style={{ color: "#1890ff" }}>
                          ${item.prices.wholesale}
                        </strong>
                      </div>
                      {item.category && (
                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "11px",
                            color: "#666",
                            background: "#f0f0f0",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            display: "inline-block",
                          }}
                        >
                          📂 {item.category.name}
                        </div>
                      )}
                    </div>
                  </div>
                }
              />
              <Popover
                content={
                  <div style={{ maxWidth: "300px" }}>
                    <h4>{item.name}</h4>
                    <p>{item.description}</p>
                    <div>
                      <strong>Prices:</strong>
                      <br />
                      Retail: ${item.prices.retail}
                      <br />
                      Wholesale: ${item.prices.wholesale}
                      {item.prices.discount > 0 && (
                        <>
                          <br />
                          Discount: {item.prices.discount}%
                        </>
                      )}
                    </div>
                    {item.size && (
                      <div style={{ marginTop: "8px" }}>
                        <strong>Dimensions:</strong>
                        <br />
                        {item.size.length} x {item.size.width} x{" "}
                        {item.size.height} {item.size.unit}
                        {item.size.fixedSize && " (Fixed Size)"}
                      </div>
                    )}
                  </div>
                }
                title="Product Details"
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
                  variant="link"
                >
                  View Details
                </Button>
              </Popover>
            </Card>
          </List.Item>
        )}
        loading={!loading.productsLoaded}
        locale={{
          emptyText: loading.productsLoaded
            ? "No products found"
            : "Loading...",
        }}
      />

      <div
        style={{
          marginTop: "24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={products.length}
          showSizeChanger
          showQuickJumper
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} products`
          }
          onChange={handlePageChange}
          onShowSizeChange={handlePageChange}
          pageSizeOptions={["8", "12", "24", "48"]}
          size="default"
        />
      </div>
    </>
  );
};

export default GridView;
