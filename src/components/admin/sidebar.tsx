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

const sideLinks = [
  {
    href: "/admin/dashboard",
    icon: DashboardIcon,
    text: "Dashboard",
    key: "admin__dashboard__sidebar",
  },
  {
    href: "/admin/categories",
    icon: CategoryIcon,
    text: "Categories",
    key: "admin__categories__sidebar",
  },
  {
    href: "/admin/products",
    icon: ProductIcon,
    text: "Products",
    key: "admin__products__sidebar",
  },
  {
    href: "/admin/orders",
    icon: OrderIcon,
    text: "Orders",
    key: "admin__orders__sidebar",
  },
  {
    href: "/admin/users",
    icon: UserIcon,
    text: "Users",
    key: "admin__users__sidebar",
  },
] as const;

const adminPaths: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/categories": "Categories",
  "/admin/products": "Products",
  "/admin/orders": "Orders",
  "/admin/users": "Users",
} as const;

export const AdminSidebar = ({ width }: { width: number }) => {
  const pathname = usePathname();
  const isTextVisible = width > 150;
  const activePath: string = adminPaths[pathname] || "";

  return (
    <div className="sidebar__container">
      {sideLinks.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className={classNames("sidebar__link", {
            active: activePath === link.text,
          })}
        >
          <IconContainer>
            <Image src={link.icon} width={16} height={16} alt="" />
          </IconContainer>
          {!!isTextVisible && (
            <span className="sidebar__text">{link.text}</span>
          )}
        </Link>
      ))}
    </div>
  );
};
