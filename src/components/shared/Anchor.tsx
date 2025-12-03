"use client";

import { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

const Anchor = ({
  id: propId,
  rootId: propRootId,
  childId: propChildId,
  onClick = () => {},
  content,
  tracking = { enabled: false, id: "", grouped: false },
  href,
  children,
  rootClassName = "",
  className = "",
  childClassName = "",
  rootStyle = {},
  classStyle = {},
  childStyle = {},
  rootProps = {},
  childProps = {},
}: {
  rootId?: string;
  childId?: string;
  id?: string;
  onClick?: () => void;
  content: string | React.ReactNode;
  tracking?: { enabled: boolean; id?: string; grouped?: boolean };
  href: Route;
  children?: React.ReactNode;
  rootClassName?: string;
  className?: string;
  childClassName?: string;
  rootStyle?: React.CSSProperties;
  classStyle?: React.CSSProperties;
  childStyle?: React.CSSProperties;
  rootProps?: React.HTMLProps<HTMLDivElement>;
  childProps?: React.HTMLProps<HTMLDivElement>;
}) => {
  const generatedId = useId();
  const generatedRootId = useId();
  const generatedChildId = useId();

  const id = propId ?? generatedId;
  const rootId = propRootId ?? generatedRootId;
  const childId = propChildId ?? generatedChildId;

  const pathname = usePathname();
  const [urlColor, setUrlColor] = useState(
    tracking?.enabled ? "gray" : "black"
  );
  useEffect(() => {
    if (tracking?.enabled) {
      setUrlColor(
        (pathname === href || (tracking.id && pathname === href)) &&
          tracking.grouped
          ? "black"
          : "gray"
      );
    }
  }, [pathname]);

  const rootPropsCopy: React.HTMLProps<HTMLDivElement> = {};
  const childPropsCopy: React.HTMLProps<HTMLDivElement> = {};
  if (rootClassName) rootPropsCopy.className = rootClassName;
  if (childClassName) childPropsCopy.className = childClassName;

  return (
    <div {...rootPropsCopy} {...rootProps} id={rootId} style={rootStyle}>
      <Link
        href={href as Route}
        onClick={onClick}
        style={{ color: urlColor, transition: "color 0.2s", ...classStyle }}
        className={className}
        id={id}
      >
        {content}
      </Link>
      {!!children && (
        <div
          {...childPropsCopy}
          {...childProps}
          id={childId}
          style={childStyle}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Anchor;
