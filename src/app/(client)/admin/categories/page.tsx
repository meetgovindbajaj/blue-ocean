import { Alert } from "antd";

const AdminCategoryPage = () => {
  return (
    <div className="categories__container">
      <Alert
        message="Admin Categories"
        description={
          <>
            <p className="mb-4">This page is under construction.</p>
            <p className="mb-4">
              Please check back later for the admin categories management
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

export default AdminCategoryPage;
