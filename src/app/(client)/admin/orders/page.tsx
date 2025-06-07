import { Alert } from "antd";
import React from "react";

const AdminOrderPage = () => {
  return (
    <div className="orders__container">
      <Alert
        message="Admin Orders"
        description={
          <>
            <p className="mb-4">This page is under construction.</p>
            <p className="mb-4">
              Please check back later for the admin order management features.
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

export default AdminOrderPage;
