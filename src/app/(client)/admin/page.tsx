import { Alert } from "antd";
import Link from "next/link";
import React from "react";

const AdminPage = () => {
  return (
    <div className="admin__container">
      <Alert
        message="Admin Page"
        description={
          <>
            <p className="mb-4">This page is under construction.</p>
            <p className="mb-4">
              Please check back later for the admin management features.
            </p>
            <p className="mb-4">
              If you have any questions or need assistance, please contact
              support.
            </p>
            <h4>Related Links</h4>
            <ul>
              <li>
                <Link href="/admin/dashboard">Admin Dashboard</Link>
              </li>
              <li>
                <Link href="/admin/categories">Admin Categories</Link>
              </li>
              <li>
                <Link href="/admin/products">Admin Products</Link>
              </li>
              <li>
                <Link href="/admin/users">Admin Users</Link>
              </li>
              <li>
                <Link href="/admin/orders">Admin Orders</Link>
              </li>
            </ul>
          </>
        }
        type="warning"
      />
    </div>
  );
};

export default AdminPage;
