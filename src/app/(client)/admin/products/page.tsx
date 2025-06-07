import { Alert } from "antd";
import React from "react";

const AdminProductPage = () => {
  return (
    <div className="products__container">
      <Alert
        message="Admin Products"
        description={
          <>
            <p className="mb-4">This page is under construction.</p>
            <p className="mb-4">
              Please check back later for the admin products management
              features.
            </p>
            <p className="mb-4">
              If you have any questions or need assistance, please contact
              support.
            </p>
          </>
        }
        type="warning"
      />
    </div>
  );
};

export default AdminProductPage;
