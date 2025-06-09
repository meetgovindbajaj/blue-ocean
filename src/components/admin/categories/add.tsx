"use client";
import { popupMessage } from "@/app/(client)/admin/layout";
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
import Fuse from "fuse.js";
import { ReadonlyURLSearchParams, useRouter } from "next/navigation";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useId,
  useState,
} from "react";

interface IForm {
  name: string;
  description: string;
  slug: string;
  parent?: string;
  imageUrlFetch: string;
  imageUrl: string;
}

interface IProps {
  categories: ICategory[];
  loading: {
    status: boolean;
    pageLoaded: boolean;
    categoriesLoaded: boolean;
    productsLoaded: boolean;
  };
  setCategoriesList: Dispatch<SetStateAction<ICategory[]>>;
  fuse: Fuse<ICategory>;
  fuseById: Fuse<ICategory>;
  searchParams: ReadonlyURLSearchParams;
  editMode: boolean;
  setEditMode: Dispatch<SetStateAction<boolean>>;
}

const AddCategories = ({
  categories,
  loading,
  setCategoriesList,
  fuse,
  fuseById,
  editMode,
  setEditMode,
  searchParams,
}: IProps) => {
  const [actionType, setActionType] = useState<"edit" | null>(
    searchParams.get("type") === "edit" ? "edit" : null
  );
  const [actionId, setActionId] = useState<string | null>(
    searchParams.get("id") || null
  );
  const router = useRouter();
  const [form] = Form.useForm();
  const uniqueId = useId();
  const windowSize = useWindowWidth();
  const [imageUrlType, setImageUrlType] = useState<"image" | "folder">("image");
  const [imageUrlSearching, setImageUrlSearching] = useState<boolean>(false);
  const [imageList, setImageList] = useState<IGoogleImageResponse[]>([]);
  const [imageSize] = useState<number>(
    windowSize < properties.breakpoints.tablet.default ? 100 : 200
  );
  const [sending, setSending] = useState(false);

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
      setSending(true);
      let url = "/api/v1/category/create";
      let method = "POST";
      if (actionType === "edit" && actionId && editMode) {
        url = `/api/v1/category/update/${actionId}`;
        method = "PATCH";
      }
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Failed to add category");
      }
      const data: ICategory = await response.json();
      handleReset();
      if (actionType === "edit" && actionId && editMode) {
        popupMessage?.open({
          type: "success",
          content: "Category updated successfully!",
        });
        setCategoriesList((prevCategories) =>
          prevCategories.map((category) =>
            category.id === data.id ? data : category
          )
        );
        const params = new URLSearchParams();
        params.set("action", "view");
        router.replace(`?${params.toString()}`);
      } else {
        popupMessage?.open({
          type: "success",
          content: "Category added successfully!",
        });
        setCategoriesList((prevCategories) => [...prevCategories, data]);
      }
    } catch (error) {
      console.error("Error adding category:", error);
      form.setFields([
        {
          name: "name",
          errors: ["Failed to add category. Please try again."],
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setImageList([]);
    setImageUrlSearching(false);
    setImageUrlType("image");
  };

  useEffect(() => {
    if (actionType === "edit" && actionId && categories.length > 0) {
      setEditMode(true);
      const category = fuseById.search(actionId)[0]?.item;
      if (category) {
        form.setFieldsValue({
          name: category.name,
          slug: category.slug,
          description: category.description,
          parent: category.parent ? category.parent.id : undefined,
          imageUrlFetch: "",
          imageUrl: category.image?.id,
        });
        setImageList(
          category.image
            ? [
                {
                  id: category.image.id,
                  name: category.image.name,
                  webViewLink: category.image.url,
                  thumbnailLink: category.image.thumbnailUrl,
                  webContentLink: category.image.downloadUrl,
                  imageMediaMetadata: {
                    width: category.image.width,
                    height: category.image.height,
                    rotation: 0,
                  },
                  size: category.image.size.toString(),
                  mimeType: "image/webp", // Assuming JPEG, adjust as needed
                },
              ]
            : []
        );
      } else {
        const params = new URLSearchParams();
        params.set("action", "add");
        router.replace(`?${params.toString()}`);
        setEditMode(false);
        setActionType(null);
        setActionId(null);
        handleReset();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, actionId, actionType]);

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
          autoFocus={windowSize >= properties.breakpoints.laptop.small}
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
          loading={!loading.categoriesLoaded}
          placeholder="Choose parent category..."
          options={categories.map((category: ICategory) => ({
            label: category.name,
            value: category.id,
            key: category.slug + uniqueId,
          }))}
          allowClear
          showSearch
          filterOption={(input, option) => {
            const result = fuse
              .search(input)
              .some((category) => category.item.id === option?.value);
            return result;
          }}
        />
      </Form.Item>
      <Form.Item
        label="Cover Image Url"
        name="imageUrlFetch"
        rules={editMode ? undefined : getRules("cover image url")}
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
            // block
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
          <Button type="primary" htmlType="submit" loading={sending}>
            {actionType
              ? sending
                ? "Updating..."
                : "Update"
              : sending
              ? "Adding..."
              : "Add"}
          </Button>
          <Button htmlType="reset">reset</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default AddCategories;
