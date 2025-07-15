import { formatDateToWords } from "@/lib/functions";
import {
  Badge,
  Button,
  Image,
  Popconfirm,
  Table,
  TableProps,
  Carousel,
} from "antd";
import {
  ColumnsType,
  ExpandableConfig,
  TableRowSelection,
} from "antd/es/table/interface";
import React, { useEffect, useState } from "react";
import { useAdminContext } from "../../AdminHOC";
import NextImage from "next/image";
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  StopOutlined,
} from "@ant-design/icons";

interface IProps {
  handleEdit: (product: IProduct) => void;
  handleDelete: (product: IProduct) => Promise<void>;
  handleStatus: (product: IProduct) => Promise<void>;
  handleBulkDelete: (selectedRows: IProduct[]) => Promise<void>;
  handleBulkStatus: (selectedRows: IProduct[]) => Promise<void>;
}

interface DataType {
  key: number;
  prodId: string;
  title: string;
  description: string;
  category: string;
  images: IGoogleImage[];
  prices: {
    wholesale: number;
    retail: number;
    discount: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const defaultExpandable: ExpandableConfig<DataType> = {
  expandedRowRender: (record: DataType) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {record.images && record.images.length > 1 ? (
        <div style={{ width: "200px", margin: "0", height: "150px" }}>
          <Carousel autoplay autoplaySpeed={3000} dots={true}>
            {record.images.map((image) => (
              <div key={image.id}>
                <Image
                  src={`/api/v1/image/${image.id}?w=200&h=150&format=webp`}
                  alt={image.name || ""}
                  width={200}
                  height={150}
                  style={{
                    objectFit: "cover",
                    borderRadius: "8px",
                    display: "block",
                    margin: "0 auto",
                  }}
                  loading="lazy"
                  preview={{
                    mask: "Preview",
                    scaleStep: 1,
                  }}
                  placeholder={
                    <NextImage
                      src={`/api/v1/image/${image.id}?h=150&format=webp&q=10&t=1&grayscale=1`}
                      alt={image.name || ""}
                      loading="lazy"
                      fill
                    />
                  }
                />
              </div>
            ))}
          </Carousel>
        </div>
      ) : (
        <Image
          src={`/api/v1/image/${record.images?.[0]?.id}?w=200&h=150&format=webp`}
          alt={record.images?.[0]?.name || ""}
          width={200}
          height={150}
          style={{ objectFit: "cover", borderRadius: "8px" }}
          loading="lazy"
          preview={{
            mask: "Preview",
            scaleStep: 1,
          }}
          placeholder={
            <NextImage
              src={`/api/v1/image/${record.images?.[0]?.id}?h=150&format=webp&q=10&t=1&grayscale=1`}
              alt={record.images?.[0]?.name || ""}
              loading="lazy"
              fill
            />
          }
        />
      )}
      <h5 style={{ margin: 0, fontWeight: "bold" }}>
        Description: {record.description}
      </h5>
      <div>
        <strong>Prices:</strong>
        <div>Retail: ${record.prices.retail}</div>
        <div>Wholesale: ${record.prices.wholesale}</div>
        {record.prices.discount > 0 && (
          <div style={{ color: "#f50" }}>
            Discount: {record.prices.discount}%
          </div>
        )}
      </div>
      <h5>
        Created At:{" "}
        <span style={{ color: "gray", fontWeight: "normal" }}>
          {formatDateToWords(record.createdAt)}
        </span>
      </h5>
      <h5>
        Updated At:{" "}
        <span style={{ color: "gray", fontWeight: "normal" }}>
          {formatDateToWords(record.updatedAt)}
        </span>
      </h5>
    </div>
  ),
};

const scroll: { x?: number | string; y?: number | string } = {
  x: "max(max-content, 100%)",
};

const ListView = ({
  handleEdit,
  handleDelete,
  handleStatus,
  handleBulkDelete,
  handleBulkStatus,
}: IProps) => {
  const { products, loading } = useAdminContext();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [showCreatedAt, setShowCreatedAt] = useState(false);
  const [showUpdatedAt, setShowUpdatedAt] = useState(false);
  const [showStatus, setShowStatus] = useState(true);
  const [showSelected, _setShowSelected] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [selectedProducts, setSelectedProducts] = useState<IProduct[]>([]);

  const tableProps: TableProps<DataType> = {
    bordered: true,
    size: "large",
    expandable: defaultExpandable,
    scroll,
    onRow(record, rowIndex) {
      return {
        onDoubleClick: (event) => {
          console.log("Row double clicked:", record, rowIndex, event);
          const prod = products.find((p) => p.id === record.prodId);
          if (prod) {
            handleEdit(prod);
          }
        },
      };
    },
  };

  const columns: ColumnsType<DataType> = [
    {
      title: "Image",
      dataIndex: "images",
      key: "images",
      width: 100,
      render: (images: IGoogleImage[]) => (
        <Image
          src={`/api/v1/image/${images?.[0]?.id}?w=60&h=60&format=webp`}
          alt={images?.[0]?.name || ""}
          width={60}
          height={60}
          style={{ objectFit: "cover", borderRadius: "4px" }}
          loading="lazy"
          preview={{
            mask: "Preview",
            scaleStep: 1,
          }}
          placeholder={
            <NextImage
              src={`/api/v1/image/${images?.[0]?.id}?h=60&format=webp&q=10&t=1&grayscale=1`}
              alt={images?.[0]?.name || ""}
              loading="lazy"
              fill
            />
          }
        />
      ),
    },
    {
      title: "Name",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      fixed: "left",
      width: 160,
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      ellipsis: true,
      width: 200,
      sorter: (a, b) => a.category.localeCompare(b.category),
    },
    {
      title: "Retail Price",
      dataIndex: ["prices", "retail"],
      key: "retailPrice",
      width: 160,
      render: (price: number) => `$${price}`,
      sorter: (a, b) => a.prices.retail - b.prices.retail,
    },
    {
      title: "Wholesale Price",
      dataIndex: ["prices", "wholesale"],
      key: "wholesalePrice",
      width: 160,
      render: (price: number) => `$${price}`,
      sorter: (a, b) => a.prices.wholesale - b.prices.wholesale,
    },
    ...(showStatus
      ? [
          {
            title: "Status",
            dataIndex: "isActive",
            key: "isActive",
            width: 120,
            render: (isActive: boolean) => (
              <Badge
                status="processing"
                text={isActive ? "Active" : "Inactive"}
                style={{ color: isActive ? "green" : "red" }}
                color={isActive ? "green" : "red"}
                data-status={isActive ? "active" : "inactive"}
                rootClassName="badge-status"
              />
            ),
            filters: [
              { text: "Active", value: true },
              { text: "Inactive", value: false },
            ],
            onFilter: (value: boolean | React.Key, record: DataType) =>
              record.isActive === value,
          },
        ]
      : []),
    ...(showCreatedAt
      ? [
          {
            title: "Created At",
            dataIndex: "createdAt",
            key: "createdAt",
            ellipsis: true,
            width: 100,
            render: (date: string) => formatDateToWords(date),
            sorter: (a: DataType, b: DataType) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          },
        ]
      : []),
    ...(showUpdatedAt
      ? [
          {
            title: "Updated At",
            dataIndex: "updatedAt",
            key: "updatedAt",
            ellipsis: true,
            width: 100,
            render: (date: string) => formatDateToWords(date),
            sorter: (a: DataType, b: DataType) =>
              new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
          },
        ]
      : []),
    {
      title: "Actions",
      key: "actions",
      width: 120,
      //   fixed: "right",
      render: (_, record) => {
        const product = products.find((p) => p.id === record.prodId);
        if (!product) return null;

        return (
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(product)}
              style={{ color: "#0097a7" }}
              size="small"
            />
            <Button
              type="text"
              icon={product.isActive ? <StopOutlined /> : <CheckOutlined />}
              onClick={() => handleStatus(product)}
              style={{ color: product.isActive ? "red" : "green" }}
              size="small"
            />
            <Popconfirm
              title="Delete the product"
              description="Are you sure to delete this product?"
              onConfirm={() => handleDelete(product)}
              okText="Delete"
              okType="danger"
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                style={{ color: "red" }}
                size="small"
              />
            </Popconfirm>
          </div>
        );
      },
    },
    Table.EXPAND_COLUMN,
  ];

  const rowSelection: TableRowSelection<DataType> = {
    selectedRowKeys: selectedProducts.map((prod) => prod.id),
    onChange: (_selectedRowKeys, selectedRows) => {
      const selected = selectedRows
        .map((row) => products.find((p) => p.id === row.prodId))
        .filter((p): p is IProduct => p !== undefined);
      setSelectedProducts(selected);
    },
    getCheckboxProps: (record: DataType) => ({
      disabled: false,
      name: record.title,
    }),
  };

  useEffect(() => {
    if (loading.status) return;
    if (!products || products.length === 0) return;
    const data: DataType[] = products.map((product, index) => ({
      key: index,
      prodId: product.id,
      title: product.name,
      description: product.description,
      category: product.category?.name || "No category",
      images: product.images,
      prices: product.prices,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));
    setTableData(data);
  }, [products, loading.status]);

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span>Show:</span>
            <Button
              type={showStatus ? "primary" : "default"}
              size="small"
              onClick={() => setShowStatus(!showStatus)}
              icon={showStatus ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            >
              Status
            </Button>
            <Button
              type={showCreatedAt ? "primary" : "default"}
              size="small"
              onClick={() => setShowCreatedAt(!showCreatedAt)}
              icon={showCreatedAt ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            >
              Created At
            </Button>
            <Button
              type={showUpdatedAt ? "primary" : "default"}
              size="small"
              onClick={() => setShowUpdatedAt(!showUpdatedAt)}
              icon={showUpdatedAt ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            >
              Updated At
            </Button>
          </div>
        </div>

        {selectedProducts.length > 0 && (
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "#f0f2f5",
              borderRadius: "4px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{selectedProducts.length} items selected</span>
            <div style={{ display: "flex", gap: "8px" }}>
              {selectedProducts.length === 1 && (
                <Button
                  color="default"
                  onClick={() => handleEdit(selectedProducts[0])}
                  variant="outlined"
                  size="small"
                  icon={<EditOutlined />}
                >
                  Edit
                </Button>
              )}
              {selectedProducts.length === 1 && (
                <>
                  <Button
                    color={selectedProducts[0].isActive ? "orange" : "green"}
                    onClick={() => {
                      handleStatus(selectedProducts[0]);
                      setSelectedProducts((prev) =>
                        prev.map((prod) =>
                          prod.id === selectedProducts[0].id
                            ? { ...prod, isActive: !prod.isActive }
                            : prod
                        )
                      );
                    }}
                    variant="outlined"
                    size="small"
                    icon={
                      selectedProducts[0].isActive ? (
                        <StopOutlined />
                      ) : (
                        <CheckOutlined />
                      )
                    }
                  >
                    {selectedProducts[0].isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Popconfirm
                    key="delete"
                    title="Delete the product"
                    description="Are you sure to delete this product?"
                    onConfirm={() => {
                      handleDelete(selectedProducts[0]);
                      setSelectedProducts([]);
                    }}
                    okText="Delete"
                    okType="danger"
                  >
                    <Button
                      color="danger"
                      variant="outlined"
                      size="small"
                      icon={<DeleteOutlined />}
                    >
                      Delete
                    </Button>
                  </Popconfirm>
                </>
              )}
              {selectedProducts.length > 1 && (
                <>
                  <Button
                    color="orange"
                    onClick={() => {
                      handleBulkStatus(selectedProducts);
                      setSelectedProducts([]);
                    }}
                    variant="outlined"
                    size="small"
                    icon={<StopOutlined />}
                  >
                    Toggle Status
                  </Button>
                  <Popconfirm
                    key="bulkDelete"
                    title="Delete selected products"
                    description="Are you sure to delete all selected products?"
                    onConfirm={() => {
                      handleBulkDelete(selectedProducts);
                      setSelectedProducts([]);
                    }}
                    okText="Delete All"
                    okType="danger"
                  >
                    <Button
                      color="danger"
                      variant="outlined"
                      size="small"
                      icon={<DeleteOutlined />}
                    >
                      Delete All
                    </Button>
                  </Popconfirm>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <Table
        {...tableProps}
        columns={columns}
        dataSource={tableData}
        rowSelection={showSelected ? rowSelection : undefined}
        loading={!loading.productsLoaded}
        pagination={{
          position: ["bottomCenter"],
          pageSize,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => {
            return `Showing ${range[0]}-${range[1]} of ${total} products`;
          },
          onShowSizeChange(_current, size) {
            setPageSize(size);
          },
        }}
        rowKey="key"
        sticky
      />
    </>
  );
};

export default ListView;
