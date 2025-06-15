"use client";

import { SearchProps } from "antd/es/input";
import Fuse from "fuse.js";
import { createContext, useContext, useState } from "react";

interface IProps {
  categories: ICategory[];
  setCategoriesList: React.Dispatch<React.SetStateAction<ICategory[]>>;
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

interface IFuctionProps extends IProps {
  children: React.ReactNode;
}

interface IContextProps extends IProps {
  fuse?: Fuse<ICategory>;
  findById: (id: string) => ICategory | null;
  searchQuery: string | null;
  setSearchQuery: React.Dispatch<React.SetStateAction<string | null>>;
  onSearch: SearchProps["onSearch"];
}

const initialContext: IContextProps = {
  categories: [],
  fuse: undefined,
  findById: (_id: string) => null,
  loading: {
    status: false,
    pageLoaded: false,
    categoriesLoaded: false,
    productsLoaded: false,
  },
  setLoading: () => {},
  setCategoriesList: () => {},
  setSearchQuery: () => {},
  onSearch: () => {},
  searchQuery: null,
};

export const AdminContext = createContext<IContextProps>(initialContext);

export default function AdminDataProvider({
  children,
  categories,
  setCategoriesList,
  loading,
  setLoading,
}: IFuctionProps) {
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const onSearch: SearchProps["onSearch"] = (value, _e, info) => {
    if (info?.source && info.source === "input") {
      setSearchQuery(() => value);
    } else if (info?.source && info.source === "clear") {
      setSearchQuery(() => null);
    }
  };
  const fuse: Fuse<ICategory> = new Fuse(categories, {
    keys: ["name", "slug"],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true,
    useExtendedSearch: true,
  });

  const fuseById: Fuse<ICategory> = new Fuse(categories, {
    keys: ["id"],
    minMatchCharLength: 24,
    threshold: 0,
  });
  const findById = (id: string): ICategory | null => {
    const result = fuseById.search(id);
    return result.length > 0 ? result[0].item : null;
  };

  const filteredCategories: ICategory[] = searchQuery
    ? fuse?.search(searchQuery).map((result) => result.item || []) || []
    : categories || [];
  return (
    <AdminContext.Provider
      value={{
        categories: filteredCategories,
        fuse,
        findById,
        loading,
        setLoading,
        setCategoriesList,
        searchQuery,
        setSearchQuery,
        onSearch,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminContext() {
  return useContext(AdminContext);
}
