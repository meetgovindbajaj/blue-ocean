"use client";
import Link from "next/link";
import IconContainer from "../IconContainer";
import DashboardIcon from "@/images/dashboardIcon.svg";
import CategoryIcon from "@/images/categoryListIcon.svg";
import ProductIcon from "@/images/productListIcon.svg";
import OrderIcon from "@/images/ordersIcon.svg";
import UserIcon from "@/images/usersIcon.svg";
import Image from "next/image";
import { usePathname } from "next/navigation";
import classNames from "classnames";

export const AdminSidebar = ({ width }: { width: number }) => {
  const pathname = usePathname();
  const isTextVisible = width > 150;
  const adminPaths: Record<string, string> = {
    "/admin/dashboard": "dashboard",
    "/admin/categories": "categories",
    "/admin/products": "products",
    "/admin/orders": "orders",
    "/admin/users": "users",
  };
  const activePath: string = adminPaths[pathname];

  return (
    <div className="sidebar__container">
      <Link
        href="/admin/dashboard"
        className={classNames("sidebar__link", {
          active: activePath === "dashboard",
        })}
      >
        <IconContainer>
          <Image src={DashboardIcon} width={16} height={16} alt="" />
        </IconContainer>
        {!!isTextVisible && <span className="sidebar__text">Dashboard</span>}
      </Link>
      <Link
        href="/admin/categories"
        className={classNames("sidebar__link", {
          active: activePath === "categories",
        })}
      >
        <IconContainer>
          <Image src={CategoryIcon} width={16} height={16} alt="" />
        </IconContainer>
        {!!isTextVisible && <span className="sidebar__text">Categories</span>}
      </Link>
      <Link
        href="/admin/products"
        className={classNames("sidebar__link", {
          active: activePath === "products",
        })}
      >
        <IconContainer>
          <Image src={ProductIcon} width={16} height={16} alt="" />
        </IconContainer>
        {!!isTextVisible && <span className="sidebar__text">Products</span>}
      </Link>
      <Link
        href="/admin/orders"
        className={classNames("sidebar__link", {
          active: activePath === "orders",
        })}
      >
        <IconContainer>
          <Image src={OrderIcon} width={16} height={16} alt="" />
        </IconContainer>
        {!!isTextVisible && <span className="sidebar__text">Orders</span>}
      </Link>
      <Link
        href="/admin/users"
        className={classNames("sidebar__link", {
          active: activePath === "users",
        })}
      >
        <IconContainer>
          <Image src={UserIcon} width={16} height={16} alt="" />
        </IconContainer>
        {!!isTextVisible && <span className="sidebar__text">Users</span>}
      </Link>
    </div>
  );
};
