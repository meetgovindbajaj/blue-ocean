"use client";

import Navbar from "./Navbar";
import "@/styles/header.scss";

export default function Header({ _categories }: { _categories: ICategory[] }) {
  return (
    <>
      <Navbar categories={_categories} />
    </>
  );
}
