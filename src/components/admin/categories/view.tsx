import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { Card, List, Spin } from "antd";
import Meta from "antd/es/card/Meta";
import Image from "next/image";
import React from "react";

interface IProps {
  categories: ICategory[];
  action: "Edit" | "Preview" | "Delete";
  loading: {
    status: boolean;
    pageLoaded: boolean;
    categoriesLoaded: boolean;
    productsLoaded: boolean;
  };
}

const ViewCategories = ({ categories, action, loading }: IProps) => {
  const actionButton = {
    Edit: <EditOutlined key="edit" />,
    Preview: <ExportOutlined key="preview" />,
    Delete: <DeleteOutlined key="delete" />,
  };
  return loading.categoriesLoaded ? (
    <List
      grid={{
        gutter: 16,
      }}
      style={{ width: "100%" }}
      dataSource={categories}
      renderItem={(item: ICategory) => (
        <List.Item>
          <Card
            key={item.id}
            size="small"
            style={{ width: "min(100% , 300px)" }}
            cover={
              <Image
                src={`/api/v1/image/${item.image?.id}?&w=300&h=200&format=webp&q=50`}
                alt={item.image?.name || ""}
                width={300}
                height={200}
                style={{ objectFit: "cover" }}
                placeholder="blur"
                blurDataURL={`/api/v1/image/${item.image?.id}?w=300&h=200&format=webp&q=10&t=1&grayscale=1`}
              />
            }
            actions={[actionButton[action]]}
            // title={item.name}
            // defaultActiveTabKey="edit"
            // hoverable
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
