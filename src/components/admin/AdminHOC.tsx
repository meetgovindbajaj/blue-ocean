"use client";

import { SearchProps } from "antd/es/input";
import Fuse from "fuse.js";
import { createContext, useContext, useState } from "react";

interface IProps {
  categories: ICategory[];
  setCategoriesList: React.Dispatch<React.SetStateAction<ICategory[]>>;
  products: IProduct[];
  setProductsList: React.Dispatch<React.SetStateAction<IProduct[]>>;
  loading: {
    status: boolean;
    pageLoaded: boolean;
    categoriesLoaded: boolean;
    productsLoaded: boolean;
  };
  setLoading: React.Dispatch<
    React.SetStateAction<{
      status: boolean;
      pageLoaded: boolean;
      categoriesLoaded: boolean;
      productsLoaded: boolean;
    }>
  >;
}

interface ISearch {
  categories__search__input: { value: string | null };
  products__search__input: { value: string | null };
}

interface IFuctionProps extends IProps {
  children: React.ReactNode;
}

interface IContextProps extends IProps {
  categoryFuse?: Fuse<ICategory>;
  findCategoryById: (id: string) => ICategory | null;
  productFuse?: Fuse<IProduct>;
  findProductById: (id: string) => IProduct | null;
  searchQuery: ISearch;
  setSearchQuery: React.Dispatch<React.SetStateAction<ISearch>>;
  onSearch: SearchProps["onSearch"];
  onChange: SearchProps["onChange"];
}

const initialSearch: ISearch = {
  categories__search__input: { value: null },
  products__search__input: { value: null },
} as const;

const initialContext: IContextProps = {
  categories: [],
  categoryFuse: undefined,
  findCategoryById: (_id: string) => null,
  products: [],
  productFuse: undefined,
  findProductById: (_id: string) => null,
  loading: {
    status: false,
    pageLoaded: false,
    categoriesLoaded: false,
    productsLoaded: false,
  },
  setLoading: () => {},
  setCategoriesList: () => {},
  setProductsList: () => {},
  setSearchQuery: () => {},
  onSearch: () => {},
  onChange: () => {},
  searchQuery: initialSearch,
} as const;

export const AdminContext = createContext<IContextProps>(initialContext);

export default function AdminDataProvider({
  children,
  categories,
  setCategoriesList,
  products,
  setProductsList,
  loading,
  setLoading,
}: IFuctionProps) {
  const [searchQuery, setSearchQuery] = useState<ISearch>(initialSearch);
  const onSearch: SearchProps["onSearch"] = (value, e, info) => {
    if (e && e.target) {
      if (info?.source && info.source === "input") {
        const name = (e.target as HTMLInputElement).name;
        handleSearch(name, value as string);
      } else if (info?.source && info.source === "clear") {
        const name = (e.target as HTMLInputElement).name;
        handleSearch(name, "");
      }
    }
  };

  const onChange: SearchProps["onChange"] = (e) => {
    const value = e.target.value;
    const name = e.target.name;
    handleSearch(name, value);
  };

  const handleSearch = (name: string, value: string) => {
    if (!name) {
      console.warn("Name is missing in handleSearch");
      return;
    }
    switch (name) {
      case "categories__search__input":
        setSearchQuery((prev) => ({
          ...prev,
          categories__search__input: { value },
        }));
        break;
      case "products__search__input":
        setSearchQuery((prev) => ({
          ...prev,
          products__search__input: { value },
        }));
        break;
      default:
        console.warn("Unknown search input name:", name);
        return;
    }
  };

  const categoryFuse: Fuse<ICategory> = new Fuse(categories, {
    keys: ["name", "slug"],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true,
    useExtendedSearch: true,
  });

  const productFuse: Fuse<IProduct> = new Fuse(products, {
    keys: ["name", "slug", "description"],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true,
    useExtendedSearch: true,
  });

  const categoryFuseById: Fuse<ICategory> = new Fuse(categories, {
    keys: ["id"],
    minMatchCharLength: 24,
    threshold: 0,
  });

  const productFuseById: Fuse<IProduct> = new Fuse(products, {
    keys: ["id"],
    minMatchCharLength: 24,
    threshold: 0,
  });

  const findCategoryById = (id: string): ICategory | null => {
    const result = categoryFuseById.search(id);
    return result.length > 0 ? result[0].item : null;
  };
  const findProductById = (id: string): IProduct | null => {
    const result = productFuseById.search(id);
    return result.length > 0 ? result[0].item : null;
  };

  const filteredCategories: ICategory[] = searchQuery.categories__search__input
    .value
    ? categoryFuse
        ?.search(searchQuery.categories__search__input.value ?? "")
        .map((result) => result.item || []) || []
    : categories || [];

  const filteredProducts: IProduct[] = searchQuery.products__search__input.value
    ? productFuse
        ?.search(searchQuery.products__search__input.value ?? "")
        .map((result) => result.item || []) || []
    : products || [];
  return (
    <AdminContext.Provider
      value={{
        categories: filteredCategories,
        categoryFuse,
        findCategoryById,
        products: filteredProducts,
        productFuse,
        findProductById,
        loading,
        setLoading,
        setCategoriesList,
        setProductsList,
        searchQuery,
        setSearchQuery,
        onSearch,
        onChange,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminContext() {
  return useContext(AdminContext);
}
