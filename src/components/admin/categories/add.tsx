"use client";
import {
  createSlug,
  extractFileIdFromUrl,
  extractFolderIdFromUrl,
} from "@/lib/functions";
import { useWindowWidth } from "@/lib/hooks";
import properties from "@/lib/properties";
import { Button, Form, Image, Input, Radio, Select, Space } from "antd";
import Search from "antd/es/input/Search";
import TextArea from "antd/es/input/TextArea";
import { ChangeEvent, useId, useState } from "react";

interface IForm {
  name: string;
  description: string;
  slug: string;
  parent?: string;
  imageUrlFetch: string;
  imageUrl: string;
}

const AddCategories = ({
  categories,
  loading,
}: {
  categories: ICategory[];
  loading: {
    status: boolean;
    pageLoaded: boolean;
    categoriesLoaded: boolean;
    productsLoaded: boolean;
  };
}) => {
  const [form] = Form.useForm();
  const uniqueId = useId();
  const windowSize = useWindowWidth();
  const [imageUrlType, setImageUrlType] = useState<"image" | "folder">("image");
  const [imageUrlSearching, setImageUrlSearching] = useState<boolean>(false);
  const [imageList, setImageList] = useState<IGoogleImageResponse[]>([]);
  const [imageSize] = useState<number>(
    windowSize < properties.breakpoints.tablet.default ? 100 : 200
  );

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const slug = createSlug(value);

    form.setFieldsValue({ slug });
  };

  const handleImageUrl = async (value: string) => {
    const urlType = imageUrlType === "image" ? "Image" : "Folder";
    if (value.trim() === "") {
      form.setFields([
        { name: "imageUrl", errors: [`${urlType} URL cannot be empty!`] },
      ]);
      return;
    } else if (!value.startsWith("https://")) {
      form.setFields([
        { name: "imageUrl", errors: [`Please enter a valid ${urlType} URL!`] },
      ]);
      return;
    }
    setImageUrlSearching(true);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    try {
      if (imageUrlType === "image") {
        const imageId = extractFileIdFromUrl(value);
        // Simulate an API call to check the image URL
        const response = await fetch(`${baseUrl}/api/v1/image/${imageId}?i=1`);
        if (!response.ok) {
          throw new Error("Image URL is not valid");
        } else {
          form.setFields([
            {
              name: "imageUrl",
              errors: undefined,
            },
          ]);
        }
        const data: IGoogleImageResponse = await response.json();
        setImageList([data]);
      } else {
        const folderId = extractFolderIdFromUrl(value);
        // Simulate an API call to check the image URL
        const response = await fetch(
          `${baseUrl}/api/v1/google-drive/${folderId}`
        );
        if (!response.ok) {
          throw new Error("Image URL is not valid");
        } else {
          form.setFields([
            {
              name: "imageUrl",
              errors: undefined,
            },
          ]);
        }
        const data: IGoogleImageResponse[] = await response.json();
        setImageList(data);
      }
    } catch (error) {
      console.error("Error checking image URL:", error);
      form.setFields([
        {
          name: "imageUrl",
          errors: [`Invalid ${imageUrlType} URL! Please try again.`],
        },
      ]);
    } finally {
      setImageUrlSearching(false);
    }
  };

  const getRules = (fieldName: string) => {
    return [
      {
        required: true,
        message: `Please enter the ${fieldName}!`,
      },
    ];
  };

  const handleSubmit = async (values: IForm) => {
    const imageData = imageList.find(
      (image: IGoogleImageResponse) => image.id === values.imageUrl
    );
    let image: IGoogleImage | null = null;
    if (imageData && Object.keys(imageData).length > 0)
      image = {
        name: imageData.name,
        id: imageData.id,
        url: imageData.webViewLink,
        thumbnailUrl: imageData.thumbnailLink,
        isThumbnail: true,
        downloadUrl: imageData.webContentLink,
        height: imageData.imageMediaMetadata.height,
        width: imageData.imageMediaMetadata.width,
        size: imageData.size ? parseInt(imageData.size) : 0,
      };
    const payload = {
      name: values.name,
      slug: values.slug,
      description: values.description,
      parent: values.parent || null,
      image: image || null,
    };
    try {
      const response = await fetch("/api/v1/category/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Failed to add category");
      }
      const data = await response.json();
      handleReset();
      console.log("Category added successfully:", data);
    } catch (error) {
      console.error("Error adding category:", error);
      form.setFields([
        {
          name: "name",
          errors: ["Failed to add category. Please try again."],
        },
      ]);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setImageList([]);
    setImageUrlSearching(false);
    setImageUrlType("image");
  };

  return (
    <Form
      form={form}
      layout="vertical"
      scrollToFirstError={{ behavior: "smooth", block: "end", focus: true }}
      style={{ paddingBlock: 32 }}
      initialValues={{ requiredMarkValue: "optional" }}
      requiredMark="optional"
      onFinish={handleSubmit}
      onReset={handleReset}
    >
      <Form.Item name="name" label="Name" rules={getRules("category name")}>
        <Input
          autoComplete="off"
          placeholder="type category name..."
          allowClear
          autoFocus
          onChange={handleNameChange}
        />
      </Form.Item>
      <Form.Item name="slug" label="slug" hidden>
        <Input />
      </Form.Item>
      <Form.Item
        name="description"
        label="Description"
        rules={getRules("category description")}
      >
        <TextArea
          rows={3}
          placeholder="type category description..."
          allowClear
          showCount
          maxLength={200}
        />
      </Form.Item>
      <Form.Item name="parent" label="Parent Category">
        <Select
          loading={loading.categoriesLoaded}
          showSearch
          placeholder="Choose parent category..."
          options={categories.map((category: ICategory) => ({
            label: category.name,
            value: category.id,
            key: category.slug + uniqueId,
          }))}
        />
      </Form.Item>
      <Form.Item
        label="Cover Image Url"
        name="imageUrlFetch"
        rules={getRules("cover image url")}
      >
        <Search
          disabled={imageUrlSearching}
          enterButton={imageUrlSearching ? "Checking..." : "Check"}
          placeholder={`type google drive ${imageUrlType} url...`}
          addonBefore={
            <Select
              defaultValue={imageUrlType}
              onChange={setImageUrlType}
              disabled={imageUrlSearching}
            >
              <Select.Option value="image">Image</Select.Option>
              <Select.Option value="folder">Folder</Select.Option>
            </Select>
          }
          onSearch={handleImageUrl}
          autoComplete="off"
          allowClear
          loading={imageUrlSearching}
        />
      </Form.Item>
      {imageList.length > 0 && (
        <Form.Item
          label="Cover Image Options (Choose one)"
          name="imageUrl"
          rules={[{ required: true, message: "Please select a cover image!" }]}
        >
          <Radio.Group
            block
            options={imageList.map((image: IGoogleImageResponse) => ({
              value: image.id,
              key: uniqueId,
              label: (
                <Image
                  key={image.id}
                  src={`/api/v1/image/${image.id}?w=${imageSize}&h=${imageSize}&format=webp&q=50`}
                  preview={{
                    src: `/api/v1/image/${image.id}?format=webp`,
                    mask: image.name,
                  }}
                  placeholder={
                    <Image
                      preview={false}
                      src={`/api/v1/image/${image.id}?w=${imageSize}&h=${imageSize}&format=webp&t=1&q=10`}
                      width={imageSize}
                      height={imageSize}
                      alt="Loading..."
                    />
                  }
                  alt={image.name}
                  width={imageSize}
                  height={imageSize}
                  rootClassName="categories__image"
                  fallback="/api/v1/image/fallback.webp?d=0&w=${imageSize}&h=${imageSize}&grayscale=1&q=50"
                />
              ),
            }))}
          />
        </Form.Item>
      )}
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            Add
          </Button>
          <Button htmlType="reset">reset</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default AddCategories;
