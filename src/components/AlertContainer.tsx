import React from "react";

const AlertContainer = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return <div className="alert__container">{children}</div>;
};

export default AlertContainer;
