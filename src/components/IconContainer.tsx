import { ReactNode } from "react";

const IconContainer = ({
  children,
  onClick = () => {},
  className = "",
}: Readonly<{
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}>) => {
  return (
    <div className={`iconContainer ${className}`} onClick={onClick}>
      {children}
    </div>
  );
};

export default IconContainer;
