"use client";
import { popupMessage } from "@/lib/messageUtils";
import {
  createSlug,
  extractFileIdFromUrl,
  extractFolderIdFromUrl,
} from "@/lib/functions";
import { useWindowWidth } from "@/lib/hooks";
import properties from "@/lib/properties";
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
} from "antd";
import Search from "antd/es/input/Search";
import TextArea from "antd/es/input/TextArea";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useId, useState } from "react";
import { useAdminContext } from "./AdminHOC";
import FormItem from "antd/es/form/FormItem";
import { Group } from "antd/es/radio";

interface IForm {
  name: string;
  description: string;
  slug: string;
  category?: string; // Changed from parent to category for products
  parent?: string; // Keep for categories
  imageUrlFetch: string;
  imageUrl: string;
  // Product-specific fields
  retailPrice?: number;
  wholesalePrice?: number;
  discount?: number;
  length?: number;
  width?: number;
  height?: number;
  fixedSize?: boolean;
  unit?: "cm" | "mm" | "in" | "ft";
}

interface IProps {
  page: "product" | "category";
}

const AddItems = ({ page }: IProps) => {
  const {
    categories,
    categoryFuse,
    findCategoryById,
    setCategoriesList,
    products,
    productFuse,
    findProductById,
    setProductsList,
    loading,
  } = useAdminContext();
  console.log(products, productFuse, findProductById, setProductsList);

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

  const _populateForm = (item: ICategory | IProduct) => {
    let payload: IForm | undefined = undefined;
    switch (page) {
      case "category":
        const category = item as ICategory;
        payload = {
          name: category.name,
          slug: category.slug,
          description: category.description,
          parent: category.parent?.id ?? undefined,
          imageUrlFetch: category.image?.url || "",
          imageUrl: category.image?.id || "",
        };
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
        break;
      case "product":
        const product = item as IProduct;
        payload = {
          name: product.name,
          slug: product.slug,
          description: product.description,
          category: product.category?.id ?? undefined,
          imageUrlFetch: product.images?.[0]?.url || "",
          imageUrl: product.images?.[0]?.id || "",
          retailPrice: product.prices?.retail || 0,
          wholesalePrice: product.prices?.wholesale || 0,
          discount: product.prices?.discount || 0,
          length: product.size?.length || 0,
          width: product.size?.width || 0,
          height: product.size?.height || 0,
          fixedSize: product.size?.fixedSize || false,
          unit: product.size?.unit || "cm",
        };
        setImageList(
          product.images
            ? product.images.map((image) => ({
                id: image.id,
                name: image.name,
                webViewLink: image.url,
                thumbnailLink: image.thumbnailUrl,
                webContentLink: image.downloadUrl,
                imageMediaMetadata: {
                  width: image.width,
                  height: image.height,
                  rotation: 0,
                },
                size: image.size?.toString() ?? "0",
                mimeType: "image/webp",
              }))
            : []
        );
        break;
    }
    setIsReset(false);
    form.setFieldsValue(payload);
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

    const payload: {
      name: string;
      slug: string;
      description: string;
      parent?: string | null;
      image?: IGoogleImage | null;
      category?: string | null;
      images?: IGoogleImage[];
      prices?: {
        retail: number;
        wholesale: number;
        discount: number;
      };
      size?: {
        length: number;
        width: number;
        height: number;
        fixedSize: boolean;
        unit: string;
      };
      isActive?: boolean;
    } = {
      name: values.name,
      slug: values.slug,
      description: values.description,
    };

    if (page === "category") {
      payload.parent = values.parent || null;
      payload.image = image || null;
    } else if (page === "product") {
      // For products, we need to handle multiple images
      const images = imageList.map((img) => ({
        id: img.id,
        name: img.name,
        url: img.webViewLink,
        thumbnailUrl: img.thumbnailLink,
        isThumbnail: img.id === values.imageUrl, // Mark the selected one as thumbnail
        downloadUrl: img.webContentLink,
        height: img.imageMediaMetadata.height,
        width: img.imageMediaMetadata.width,
        size: img.size ? parseInt(img.size) : 0,
      }));

      payload.category = values.category || null;
      payload.images = images;
      payload.prices = {
        retail: values.retailPrice || 0,
        wholesale: values.wholesalePrice || 0,
        discount: values.discount || 0,
      };
      payload.size = {
        length: values.length || 0,
        width: values.width || 0,
        height: values.height || 0,
        fixedSize: values.fixedSize || false,
        unit: values.unit || "cm",
      };
      payload.isActive = true;
    }

    try {
      setSending(true);
      let url = `/api/v1/${page}/create`;
      let method = "POST";
      if (editMode) {
        url = `/api/v1/${page}/update/${actionId}`;
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
        throw new Error(`Failed to ${editMode ? "update" : "add"} ${page}`);
      }
      const data: ICategory | IProduct = await response.json();
      handleReset();
      if (editMode) {
        popupMessage?.open({
          type: "success",
          content: `${
            page.charAt(0).toUpperCase() + page.slice(1)
          } updated successfully!`,
        });
        if (page === "category") {
          setCategoriesList((prevCategories) =>
            prevCategories.map((category) =>
              category.id === data.id ? (data as ICategory) : category
            )
          );
        } else {
          setProductsList((prevProducts) =>
            prevProducts.map((product) =>
              product.id === data.id ? (data as IProduct) : product
            )
          );
        }
        const params = new URLSearchParams();
        params.set("action", "view");
        router.replace(`?${params.toString()}`);
      } else {
        popupMessage?.open({
          type: "success",
          content: `${
            page.charAt(0).toUpperCase() + page.slice(1)
          } added successfully!`,
        });
        if (page === "category") {
          setCategoriesList((prevCategories) => [
            ...prevCategories,
            data as ICategory,
          ]);
        } else {
          setProductsList((prevProducts) => [
            ...prevProducts,
            data as IProduct,
          ]);
        }
      }
    } catch (error) {
      console.error(
        `Error ${editMode ? "updating" : "adding"} ${page}:`,
        error
      );
      form.setFields([
        {
          name: "name",
          errors: [
            `Failed to ${
              editMode ? "update" : "add"
            } ${page}. Please try again.`,
          ],
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
    if (page === "category") {
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
    } else if (page === "product") {
      const product =
        findProductById(actionId || "") ??
        products.find((prod) => prod.id === actionId) ??
        null;

      if (editMode) {
        if (isReset) {
          handleClearFields();
          return;
        }

        if (product && Object.keys(product).length > 0) {
          _populateForm(product);
        } else {
          popupMessage?.open({
            type: "error",
            content: "Product not found!",
          });
          setEditMode(false);
        }
      } else {
        handleClearFields();
      }
    }
  };

  useEffect(() => {
    if (page === "category" && categories.length > 0) {
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
          handleReset();
        } else {
          setEditMode(true);
        }
      }
      if (isReset) {
        handleClearFields();
      }
    } else if (page === "product" && products.length > 0) {
      const product =
        findProductById(actionId || "") ??
        products.find((prod) => prod.id === actionId) ??
        null;
      if (editMode && !isReset) {
        if (product && Object.keys(product).length > 0) {
          _populateForm(product);
        } else {
          popupMessage?.open({
            type: "error",
            content: "Product not found!",
          });
          setEditMode(false);
        }
      } else if (!editMode && actionType === "edit" && !isReset) {
        if (!product || Object.keys(product).length === 0) {
          popupMessage?.open({
            type: "error",
            content: "Product not found!",
          });
          handleReset();
        } else {
          setEditMode(true);
        }
      }
      if (isReset) {
        handleClearFields();
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, isReset, categories, products, page]);

  return (
    <Form
      form={form}
      layout="vertical"
      scrollToFirstError={{ behavior: "smooth", block: "end", focus: true }}
      style={{ paddingBlock: 32 }}
      initialValues={{
        requiredMarkValue: "optional",
        unit: "cm",
        fixedSize: false,
        discount: 0,
        retailPrice: 0,
        wholesalePrice: 0,
        length: 0,
        width: 0,
        height: 0,
      }}
      requiredMark="optional"
      onFinish={handleSubmit}
      onReset={handleReset}
    >
      <FormItem name="name" label="Name" rules={getRules(`${page} name`)}>
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
        rules={getRules(`${page} description`)}
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
      <FormItem
        name="parent"
        label="Parent Category"
        hidden={page === "product"}
      >
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
        name="category"
        label="Category"
        hidden={page === "category"}
        rules={page === "product" ? getRules("category") : []}
      >
        <Select
          disabled={sending}
          loading={!loading.categoriesLoaded}
          placeholder="Choose product category..."
          options={categories.map((category: ICategory) => ({
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
      {page === "product" && (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <FormItem
                name="retailPrice"
                label="Retail Price ($)"
                rules={getRules("retail price")}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  placeholder="99.99"
                  style={{ width: "100%" }}
                  disabled={sending}
                />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem name="wholesalePrice" label="Wholesale Price ($)">
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  placeholder="79.99"
                  style={{ width: "100%" }}
                  disabled={sending}
                />
              </FormItem>
            </Col>
          </Row>
          <FormItem name="discount" label="Discount Percentage (%)">
            <InputNumber
              min={0}
              max={100}
              step={1}
              placeholder="10"
              style={{ width: "100%" }}
              disabled={sending}
            />
          </FormItem>
          <FormItem
            name="fixedSize"
            label="Product Dimensions"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Fixed Size"
              unCheckedChildren="Variable Size"
              disabled={sending}
            />
          </FormItem>
          <Row gutter={16}>
            <Col span={6}>
              <FormItem name="length" label="Length">
                <InputNumber
                  min={0}
                  step={0.1}
                  precision={1}
                  placeholder="30.0"
                  style={{ width: "100%" }}
                  disabled={sending}
                />
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem name="width" label="Width">
                <InputNumber
                  min={0}
                  step={0.1}
                  precision={1}
                  placeholder="20.0"
                  style={{ width: "100%" }}
                  disabled={sending}
                />
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem name="height" label="Height">
                <InputNumber
                  min={0}
                  step={0.1}
                  precision={1}
                  placeholder="15.0"
                  style={{ width: "100%" }}
                  disabled={sending}
                />
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem name="unit" label="Unit">
                <Select
                  disabled={sending}
                  placeholder="Unit"
                  options={[
                    { label: "cm", value: "cm" },
                    { label: "mm", value: "mm" },
                    { label: "in", value: "in" },
                    { label: "ft", value: "ft" },
                  ]}
                />
              </FormItem>
            </Col>
          </Row>
        </>
      )}
      <FormItem
        label={(page === "category" ? "Cover" : "") + "Image Url"}
        name="imageUrlFetch"
        rules={getRules(`${page === "category" ? "cover" : ""} image url`)}
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
          label={`${page === "category" ? "Cover " : ""}Image Options (Choose ${
            page === "product" ? "thumbnail" : "one"
          })`}
          name="imageUrl"
          rules={[
            {
              required: true,
              message: `Please select a ${
                page === "category" ? "cover" : "thumbnail"
              } image!`,
            },
          ]}
        >
          {page === "category" ? (
            <Group
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
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: "16px",
                padding: "16px 0",
              }}
            >
              {imageList.map((image: IGoogleImageResponse, index) => (
                <div
                  key={image.id}
                  style={{
                    border: "2px solid #d9d9d9",
                    borderRadius: "8px",
                    padding: "12px",
                    textAlign: "center",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    background: "#fafafa",
                  }}
                  onClick={() => form.setFieldsValue({ imageUrl: image.id })}
                >
                  <Image
                    src={`/api/v1/image/${image.id}?w=120&h=120&format=webp`}
                    loading="lazy"
                    alt={image.name}
                    width={120}
                    height={120}
                    style={{
                      borderRadius: "4px",
                      marginBottom: "8px",
                      objectFit: "cover",
                      display: "block",
                      width: "100%",
                    }}
                    rel="noreferrer noopener"
                  />
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      fontWeight: "500",
                      marginBottom: "4px",
                    }}
                  >
                    {index === 0 ? "🏷️ Primary" : `📷 Image ${index + 1}`}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#999",
                      wordBreak: "break-all",
                    }}
                  >
                    {image.name.length > 20
                      ? `${image.name.substring(0, 20)}...`
                      : image.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </FormItem>
      )}
      {imageList.length > 0 && page === "product" && (
        <FormItem name="imageUrl" hidden>
          <Group
            disabled={sending || imageUrlSearching}
            options={imageList.map((image: IGoogleImageResponse) => ({
              value: image.id,
              key: image.id + uniqueId,
              label: image.name,
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

export default AddItems;
