"use client";
import { popupMessage } from "@/lib/messageUtils";
import {
  createSlug,
  extractFileIdFromUrl,
  extractFolderIdFromUrl,
} from "@/lib/functions";
import { useWindowWidth } from "@/lib/hooks";
import properties from "@/lib/properties";
import { Button, Form, Input, Select, Space } from "antd";
import Search from "antd/es/input/Search";
import TextArea from "antd/es/input/TextArea";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useId, useState } from "react";
import { useAdminContext } from "../AdminHOC";
import FormItem from "antd/es/form/FormItem";
import { Group } from "antd/es/radio";

interface IForm {
  name: string;
  description: string;
  slug: string;
  parent?: string;
  imageUrlFetch: string;
  imageUrl: string;
}

const AddCategories = () => {
  const {
    categories,
    categoryFuse,
    findCategoryById,
    setCategoriesList,
    loading,
  } = useAdminContext();
  const searchParams = useSearchParams();
  const actionId = searchParams.get("id") || null;
  const actionType = searchParams.get("type") || null;
  const [editMode, setEditMode] = useState<boolean>(
    searchParams.get("action") === "add" ? false : true
  );
  const [isReset, setIsReset] = useState<boolean>(false);
  const router = useRouter();
  const [form] = Form.useForm();
  const uniqueId = useId();
  const windowSize = useWindowWidth();
  const [imageUrlType, setImageUrlType] = useState<"image" | "folder">("image");
  const [imageUrlSearching, setImageUrlSearching] = useState<boolean>(false);
  const [imageList, setImageList] = useState<IGoogleImageResponse[]>([]);
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
        { name: "imageUrlFetch", errors: [`${urlType} URL cannot be empty!`] },
      ]);
      return;
    } else if (!value.startsWith("https://")) {
      form.setFields([
        {
          name: "imageUrlFetch",
          errors: [`Please enter a valid ${urlType} URL!`],
        },
      ]);
      return;
    }
    setImageUrlSearching(true);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    try {
      let firstImage: IGoogleImageResponse | null = null;
      if (imageUrlType === "image") {
        const imageId = extractFileIdFromUrl(value);
        // Simulate an API call to check the image URL
        const response = await fetch(`${baseUrl}/api/v1/image/${imageId}?i=1`);
        if (!response.ok) {
          throw new Error("Image URL is not valid");
        } else {
          form.setFields([
            {
              name: "imageUrlFetch",
              errors: undefined,
            },
          ]);
        }
        const data: IGoogleImageResponse = await response.json();
        setImageList(() => [data]);
        firstImage = data;
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
              name: "imageUrlFetch",
              errors: undefined,
            },
          ]);
        }
        const data: IGoogleImageResponse[] = await response.json();
        setImageList(() => data);
        firstImage = data[0] || null;
      }
      form.setFieldsValue({
        imageUrl: firstImage?.id || "",
      });
    } catch (error) {
      console.error("Error checking image URL:", error);
      form.setFields([
        {
          name: "imageUrlFetch",
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

  const populateFormWithCategory = (category: ICategory) => {
    setIsReset(false);
    form.setFieldsValue({
      name: category.name,
      slug: category.slug,
      description: category.description,
      parent: category.parent?.id ?? undefined,
      imageUrlFetch: category.image?.url || "",
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
              size: category.image.size?.toString() ?? "0",
              mimeType: "image/webp",
            },
          ]
        : []
    );
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
      if (editMode) {
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
      if (editMode) {
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

  const handleClearFields = () => {
    router.replace("?action=add");
    form.resetFields();
    setImageList([]);
    setImageUrlSearching(false);
    setImageUrlType("image");
    setEditMode(false);
  };

  const handleReset = () => {
    const category =
      findCategoryById(actionId || "") ??
      categories.find((cat) => cat.id === actionId) ??
      null;

    if (editMode) {
      if (isReset) {
        handleClearFields();
        return;
      }

      if (category && Object.keys(category).length > 0) {
        populateFormWithCategory(category);
      } else {
        popupMessage?.open({
          type: "error",
          content: "Category not found!",
        });
        setEditMode(false);
      }
    } else {
      handleClearFields();
    }
  };

  useEffect(() => {
    if (categories.length > 0) {
      const category =
        findCategoryById(actionId || "") ??
        categories.find((cat) => cat.id === actionId) ??
        null;
      if (editMode && !isReset) {
        if (category && Object.keys(category).length > 0) {
          populateFormWithCategory(category);
        } else {
          popupMessage?.open({
            type: "error",
            content: "Category not found!",
          });
          setEditMode(false);
        }
      } else if (!editMode && actionType === "edit" && !isReset) {
        if (!category || Object.keys(category).length === 0) {
          popupMessage?.open({
            type: "error",
            content: "Category not found!",
          });
          handleReset(); // Reset instead of loading
        } else {
          setEditMode(true); // trigger re-render to load form
        }
      }
      if (isReset) {
        handleClearFields(); // when switching away from edit
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, isReset, categories]);

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
      <FormItem name="name" label="Name" rules={getRules("category name")}>
        <Input
          autoComplete="off"
          placeholder="Table, Chair..."
          allowClear
          autoFocus={windowSize >= properties.breakpoints.laptop.small}
          onChange={handleNameChange}
          disabled={sending}
        />
      </FormItem>
      <FormItem name="slug" label="slug" hidden>
        <Input />
      </FormItem>
      <FormItem
        name="description"
        label="Description"
        rules={getRules("category description")}
      >
        <TextArea
          rows={3}
          placeholder="Made from high-quality, durable wood..."
          allowClear
          showCount
          maxLength={1000}
          disabled={sending}
        />
      </FormItem>
      <FormItem name="parent" label="Parent Category">
        <Select
          disabled={sending}
          loading={!loading.categoriesLoaded}
          placeholder="Choose parent category..."
          options={(editMode && actionId
            ? categories.filter((cat) => cat.id !== actionId)
            : categories
          ).map((category: ICategory) => ({
            label: category.name,
            value: category.id,
            key: category.slug + uniqueId,
          }))}
          allowClear
          showSearch
          filterOption={(input, option) => {
            if (!categoryFuse || !option) return false;
            return categoryFuse
              .search(input)
              .some((category) => category.item.id === option.value);
          }}
        />
      </FormItem>
      <FormItem
        label="Cover Image Url"
        name="imageUrlFetch"
        rules={getRules("cover image url")}
      >
        <Search
          disabled={imageUrlSearching || sending}
          enterButton={imageUrlSearching ? "Checking..." : "Check"}
          placeholder={`https://drive.google.com/drive/${
            imageUrlType === "folder" ? "folders/1EHAK" : "file/d/18rJd"
          }...`}
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
      </FormItem>
      {imageList.length > 0 && (
        <FormItem
          label="Cover Image Options (Choose one)"
          name="imageUrl"
          rules={[{ required: true, message: "Please select a cover image!" }]}
        >
          <Group
            // block
            disabled={sending || imageUrlSearching}
            options={imageList.map((image: IGoogleImageResponse) => ({
              value: image.id,
              key: uniqueId,
              label: (
                <Image
                  key={image.id}
                  src={`/api/v1/image/${image.id}?w=100&h=100`}
                  loading="lazy"
                  alt={image.name}
                  width={100}
                  height={100}
                  className="categories__image"
                  placeholder="blur"
                  blurDataURL={`/api/v1/image/${image.id}?w=100&h=100&t=1&grayscale=1`}
                  rel="noreferrer noopener"
                />
              ),
            }))}
          />
        </FormItem>
      )}
      <FormItem>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={sending}
            disabled={sending}
          >
            {editMode
              ? sending
                ? "Updating..."
                : "Update"
              : sending
              ? "Adding..."
              : "Add"}
          </Button>
          <Button htmlType="reset" onClick={handleReset}>
            reset
          </Button>
          {editMode && (
            <Button
              type="default"
              onClick={() => {
                setIsReset(true);
              }}
            >
              Cancel
            </Button>
          )}
        </Space>
      </FormItem>
    </Form>
  );
};

export default AddCategories;
