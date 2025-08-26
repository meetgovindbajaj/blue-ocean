"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Layout,
  Menu,
  Input,
  Button,
  Avatar,
  Dropdown,
  Badge,
  Space,
  Drawer,
  Typography,
  Divider,
  message,
} from "antd";
import {
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  MenuOutlined,
  LoginOutlined,
  LogoutOutlined,
  ProfileOutlined,
  SettingOutlined,
  HeartOutlined,
  AppstoreOutlined,
  HomeOutlined,
  PhoneOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import type { MenuProps } from "antd";

const { Header } = Layout;
const { Search } = Input;
const { Text } = Typography;

interface AntdHeaderProps {
  categories?: ICategory[];
}

const AntdHeader: React.FC<AntdHeaderProps> = React.memo(
  ({ categories = [] }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const router = useRouter();
    const { user, isAuthenticated, logout, isLoading } = useAuth();
    const { summary } = useCart();

    const handleSearch = useCallback(
      (value: string) => {
        if (value.trim()) {
          router.push(`/search?q=${encodeURIComponent(value.trim())}`);
        }
      },
      [router]
    );

    const handleLogout = useCallback(async () => {
      try {
        await logout();
        message.success("Logged out successfully");
      } catch (_error) {
        message.error("Failed to logout");
      }
    }, [logout]);

    // Main navigation menu items
    const mainMenuItems = useMemo(
      () => [
        {
          key: "home",
          icon: <HomeOutlined />,
          label: <Link href="/">Home</Link>,
        },
        {
          key: "products",
          icon: <AppstoreOutlined />,
          label: <Link href="/products">Products</Link>,
        },
        {
          key: "categories",
          icon: <AppstoreOutlined />,
          label: <Link href="/categories">Categories</Link>,
          children: categories
            .slice(0, 8)
            .map((category) => ({
              key: `category-${category.id}`,
              label: (
                <Link href={`/category/${category.slug}`}>{category.name}</Link>
              ),
            }))
            .concat(
              categories.length > 8
                ? [
                    {
                      key: "all-categories",
                      label: (
                        <Link href="/categories">View All Categories</Link>
                      ),
                    },
                  ]
                : []
            ),
        },
        {
          key: "about",
          icon: <InfoCircleOutlined />,
          label: <Link href="/about">About</Link>,
        },
        {
          key: "contact",
          icon: <PhoneOutlined />,
          label: <Link href="/contact">Contact</Link>,
        },
      ],
      [categories]
    );

    // User dropdown menu items
    const userMenuItems: MenuProps["items"] = useMemo(() => {
      if (!isAuthenticated || !user) {
        return [
          {
            key: "login",
            icon: <LoginOutlined />,
            label: <Link href="/auth/login">Login</Link>,
          },
          {
            key: "register",
            icon: <UserOutlined />,
            label: <Link href="/auth/register">Register</Link>,
          },
        ];
      }

      const items: MenuProps["items"] = [
        {
          key: "profile",
          icon: <ProfileOutlined />,
          label: <Link href="/profile">My Profile</Link>,
        },
        {
          key: "orders",
          icon: <AppstoreOutlined />,
          label: <Link href="/orders">My Orders</Link>,
        },
        {
          key: "wishlist",
          icon: <HeartOutlined />,
          label: <Link href="/wishlist">Wishlist</Link>,
        },
      ];

      if (user.role === "admin" || user.role === "super_admin") {
        items.push({
          type: "divider",
        });
        items.push({
          key: "admin",
          icon: <SettingOutlined />,
          label: <Link href="/admin/dashboard">Admin Dashboard</Link>,
        });
      }

      items.push({
        type: "divider",
      });
      items.push({
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Logout",
        onClick: handleLogout,
      });

      return items;
    }, [isAuthenticated, user, handleLogout]);

    const closeMobileMenu = useCallback(() => {
      setMobileMenuOpen(false);
    }, []);

    return (
      <>
        <Header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
            width: "100%",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            backgroundColor: "#fff",
            borderBottom: "1px solid #f0f0f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            height: "64px",
          }}
          className="responsive-header"
        >
          {/* Logo */}
          <div className="header-logo">
            <Link href="/">
              <Text
                strong
                className="logo-text"
                style={{
                  color: "#1890ff",
                  cursor: "pointer",
                }}
              >
                <span className="logo-full">Blue Ocean Export</span>
                <span className="logo-short">BO</span>
              </Text>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <Menu
            mode="horizontal"
            items={mainMenuItems}
            style={{
              flex: 1,
              border: "none",
              backgroundColor: "transparent",
            }}
            className="desktop-menu"
          />

          {/* Search Bar */}
          <div className="header-search">
            <Search
              placeholder="Search products..."
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              onSearch={handleSearch}
              style={{ width: "100%" }}
            />
          </div>

          {/* Right Actions */}
          <Space size="middle" className="header-actions">
            {/* Shopping Cart */}
            <Badge count={summary.itemCount} size="small">
              <Button
                type="text"
                icon={<ShoppingCartOutlined />}
                size="large"
                onClick={() => router.push("/cart")}
                style={{ display: "flex", alignItems: "center" }}
              />
            </Badge>

            {/* User Menu */}
            {!isLoading && (
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <Button
                  type="text"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "4px 8px",
                  }}
                >
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {isAuthenticated && user && (
                      <Text className="desktop-only">
                        {user.name || user.email}
                      </Text>
                    )}
                  </Space>
                </Button>
              </Dropdown>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              type="text"
              icon={<MenuOutlined />}
              size="large"
              onClick={() => setMobileMenuOpen(true)}
              className="mobile-menu-button"
              style={{ display: "none" }}
            />
          </Space>
        </Header>

        {/* Mobile Drawer */}
        <Drawer
          title="Menu"
          placement="right"
          onClose={closeMobileMenu}
          open={mobileMenuOpen}
          width={300}
        >
          <div style={{ marginBottom: 16 }}>
            <Search
              placeholder="Search products..."
              allowClear
              enterButton
              onSearch={(value) => {
                handleSearch(value);
                closeMobileMenu();
              }}
            />
          </div>

          <Divider />

          <Menu
            mode="vertical"
            items={mainMenuItems}
            style={{ border: "none" }}
            onClick={closeMobileMenu}
          />

          <Divider />

          {/* Mobile User Section */}
          {isAuthenticated && user ? (
            <div>
              <div style={{ padding: "16px 0", textAlign: "center" }}>
                <Avatar size={64} icon={<UserOutlined />} />
                <div style={{ marginTop: 8 }}>
                  <Text strong>{user.name || user.email}</Text>
                </div>
              </div>
              <Menu
                mode="vertical"
                items={userMenuItems}
                style={{ border: "none" }}
                onClick={closeMobileMenu}
              />
            </div>
          ) : (
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button
                type="primary"
                block
                icon={<LoginOutlined />}
                onClick={() => {
                  router.push("/auth/login");
                  closeMobileMenu();
                }}
              >
                Login
              </Button>
              <Button
                block
                icon={<UserOutlined />}
                onClick={() => {
                  router.push("/auth/register");
                  closeMobileMenu();
                }}
              >
                Register
              </Button>
            </Space>
          )}
        </Drawer>

        <style jsx global>{`
          .responsive-header {
            padding: 0 16px !important;
          }

          .header-logo {
            margin-right: 16px;
            min-width: fit-content;
            @media (max-width: 500px) {
              flex: 1;
            }
          }

          .logo-full {
            font-size: 20px;
          }

          .logo-short {
            display: none;
            font-size: 18px;
          }

          .header-search {
            margin: 0 16px;
            min-width: 200px;
            max-width: 400px;
            flex: 1;
            display: flex;
          }

          .header-actions {
            min-width: fit-content;
          }

          @media (max-width: 1200px) {
            .header-search {
              min-width: 150px;
              max-width: 250px;
            }
          }

          @media (max-width: 992px) {
            .desktop-menu {
              display: none !important;
            }
            .header-search {
              min-width: 120px;
              max-width: 200px;
            }
          }

          @media (max-width: 768px) {
            .mobile-menu-button {
              display: flex !important;
            }
            .desktop-only {
              display: none !important;
            }
            .header-search {
              margin: 0 8px;
              min-width: 100px;
              max-width: 150px;
            }
            .responsive-header {
              padding: 0 12px !important;
            }
          }

          @media (max-width: 576px) {
            .header-search {
              margin: 0 4px;
              min-width: 80px;
              max-width: 120px;
            }
            .responsive-header {
              padding: 0 8px !important;
            }
            .header-actions .ant-space-item {
              margin-right: 4px !important;
            }
          }

          @media (max-width: 500px) {
            .header-search {
              display: none !important;
            }
            .header-logo {
              margin-right: 8px;
            }
          }
          @media (max-width: 360px) {
            .logo-full {
              display: none;
            }
            .logo-short {
              display: inline;
            }
          }

          @media (min-width: 769px) {
            .desktop-only {
              display: inline !important;
            }
            .mobile-menu-button {
              display: none !important;
            }
          }

          @media (min-width: 993px) {
            .desktop-menu {
              display: flex !important;
              justify-content: space-evenly;
            }
          }
        `}</style>
      </>
    );
  }
);

AntdHeader.displayName = "AntdHeader";

export default AntdHeader;
