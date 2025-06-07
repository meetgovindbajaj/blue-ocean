import { Alert } from "antd";
import React from "react";
import AlertContainer from "../AlertContainer";

const ResizeAlert = () => {
  return (
    <AlertContainer>
      <Alert
        message="Insufficient Space"
        description={
          <>
            <p className="mb-4">Please resize or shrink the side panel.</p>
          </>
        }
        type="warning"
      />
    </AlertContainer>
  );
};

export default ResizeAlert;
