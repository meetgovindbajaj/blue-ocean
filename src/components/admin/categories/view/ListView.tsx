import { formatDateToWords } from "@/lib/functions";
import { Badge, Button, Image, Popconfirm, Table, TableProps } from "antd";
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
  handleEdit: (category: ICategory) => void;
  handleDelete: (category: ICategory) => Promise<void>;
  handleStatus: (category: ICategory) => Promise<void>;
  handleBulkDelete: (selectedRows: ICategory[]) => Promise<void>;
  handleBulkStatus: (selectedRows: ICategory[]) => Promise<void>;
}

interface DataType {
  key: number;
  catId: string;
  title: string;
  description: string;
  image: IGoogleImage;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const defaultExpandable: ExpandableConfig<DataType> = {
  expandedRowRender: (record: DataType) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Image
        src={`/api/v1/image/${record.image?.id}?w=200&h=150&format=webp`}
        alt={record.image?.name || ""}
        width={200}
        height={150}
        style={{
          objectFit: "cover",
          borderRadius: "10px",
          border: "4px solid #ddd",
        }}
        loading="lazy"
        preview={{
          mask: "Preview",
          scaleStep: 1,
        }}
        placeholder={
          <NextImage
            src={`/api/v1/image/${record.image?.id}?h=150&format=webp&q=10&t=1&grayscale=1`}
            alt={record.image?.name || ""}
            loading="lazy"
            fill
          />
        }
      />

      <h3>{record.title}</h3>
      <p style={{ fontSize: "14px" }}>{record.description}</p>
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
  const { categories, loading } = useAdminContext();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [showCreatedAt, setShowCreatedAt] = useState(false);
  const [showUpdatedAt, setShowUpdatedAt] = useState(false);
  const [showStatus, setShowStatus] = useState(true);
  const [showSelected, setShowSelected] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [selectedCategories, setSelectedCategories] = useState<ICategory[]>([]);

  const tableProps: TableProps<DataType> = {
    bordered: true,
    size: "large",
    expandable: defaultExpandable,
    scroll,
    onRow(record, rowIndex) {
      return {
        onDoubleClick: (event) => {
          console.log("Row double clicked:", record, rowIndex, event);
          const cat = {
            id: record.catId,
            name: record.title,
            isActive: record.isActive,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
          } as ICategory;
          handleEdit(cat);
        },
      };
    },
  };

  const tableColumns: ColumnsType<DataType> = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      fixed: "left",
      width: 120,
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 110,
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
      onFilter: (value, record) => record.isActive === value,
      sorter: (a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1),
      hidden: !showStatus,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 100,
      render: (text) => formatDateToWords(text),
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      hidden: !showCreatedAt,
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 100,
      render: (text) => formatDateToWords(text),
      sorter: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      hidden: !showUpdatedAt,
    },
    Table.EXPAND_COLUMN,
  ];

  useEffect(() => {
    if (loading.status) return;
    if (!categories || categories.length === 0) return;
    const data: DataType[] = categories.map((category, index) => ({
      key: index,
      catId: category.id,
      title: category.name,
      description: category.description || "No description",
      image: category.image || {
        id: "",
        name: "",
        url: "",
        thumbnailUrl: "",
        isThumbnail: false,
        downloadUrl: "",
        size: 0,
        width: 0,
        height: 0,
      },
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));
    setTableData(data);
  }, [categories, loading.status]);

  const rowSelection: TableRowSelection<DataType> = {
    onChange: (_selectedRowKeys, selectedRows) => {
      const newSelectedCategories = selectedRows.map(
        (row) =>
          ({
            id: row.catId,
            name: row.title,
            isActive: row.isActive,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          } as ICategory)
      );
      setSelectedCategories(newSelectedCategories);
    },
  };

  return (
    <Table<DataType>
      {...tableProps}
      pagination={{
        position: ["bottomCenter"],
        pageSize,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => {
          return `Showing ${range[0]}-${range[1]} of ${total} items`;
        },
        onShowSizeChange(_current, size) {
          setPageSize(size);
        },
      }}
      rowKey="key"
      sticky
      columns={tableColumns}
      dataSource={tableData}
      rowSelection={showSelected ? rowSelection : undefined}
      loading={!loading.categoriesLoaded}
      summary={
        selectedCategories.length !== 1 && selectedCategories.length <= 1
          ? undefined
          : () => (
              <Table.Summary fixed="top">
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={12}>
                    <div
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                    >
                      {selectedCategories.length === 1 && (
                        <Button
                          color="default"
                          onClick={() => handleEdit(selectedCategories[0])}
                          variant="outlined"
                          size="small"
                          icon={<EditOutlined />}
                        >
                          Edit
                        </Button>
                      )}
                      {selectedCategories.length === 1 && (
                        <>
                          <Button
                            color={
                              selectedCategories[0].isActive
                                ? "orange"
                                : "green"
                            }
                            onClick={() => {
                              handleStatus(selectedCategories[0]);
                              setSelectedCategories((prev) =>
                                prev.map((cat) =>
                                  cat.id === selectedCategories[0].id
                                    ? { ...cat, isActive: !cat.isActive }
                                    : cat
                                )
                              );
                            }}
                            variant="outlined"
                            size="small"
                            icon={
                              selectedCategories[0].isActive ? (
                                <StopOutlined />
                              ) : (
                                <CheckOutlined />
                              )
                            }
                          >
                            {selectedCategories[0].isActive
                              ? "Deactivate"
                              : "Activate"}
                          </Button>
                          <Popconfirm
                            key="delete"
                            title="Delete the category"
                            description="Are you sure to delete this category?"
                            onConfirm={() => {
                              handleDelete(selectedCategories[0]);
                              setSelectedCategories((prev) =>
                                prev.filter(
                                  (cat) => cat.id !== selectedCategories[0].id
                                )
                              );
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
                      {selectedCategories.length > 1 && (
                        <>
                          <Button
                            color="default"
                            onClick={() => handleBulkStatus(selectedCategories)}
                            variant="outlined"
                            size="small"
                          >
                            Toggle All Status
                          </Button>
                          <Popconfirm
                            key="delete"
                            title={`Delete these categories (${selectedCategories.length} selected)`}
                            description="Are you sure to delete all selected categories?"
                            onConfirm={() => {
                              handleBulkDelete(selectedCategories);
                              setSelectedCategories((prev) =>
                                prev.filter(
                                  (cat) => !selectedCategories.includes(cat)
                                )
                              );
                            }}
                            okText="Delete"
                            okType="danger"
                          >
                            <Button
                              color="danger"
                              variant="outlined"
                              size="small"
                            >
                              Delete All Selected
                            </Button>
                          </Popconfirm>
                        </>
                      )}
                    </div>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )
      }
      title={() => {
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <Button
              onClick={() => setShowSelected((prev) => !prev)}
              variant="outlined"
              size="small"
              icon={showSelected ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            >
              Selected
            </Button>
            <Button
              onClick={() => setShowStatus((prev) => !prev)}
              variant="outlined"
              size="small"
              icon={showStatus ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            >
              Status
            </Button>
            <Button
              onClick={() => setShowCreatedAt((prev) => !prev)}
              variant="outlined"
              size="small"
              icon={showCreatedAt ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            >
              Created At
            </Button>
            <Button
              onClick={() => setShowUpdatedAt((prev) => !prev)}
              variant="outlined"
              size="small"
              icon={showUpdatedAt ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            >
              Updated At
            </Button>
          </div>
        );
      }}
    />
  );
};

export default ListView;
