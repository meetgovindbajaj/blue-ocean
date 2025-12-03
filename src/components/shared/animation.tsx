"use client";

import Lottie from "react-lottie-player";

const Animation = ({
  data,
  style,
}: {
  data: object;
  style?: React.CSSProperties;
}) => {
  return (
    <Lottie
      loop={true}
      play={true}
      animationData={data}
      style={style || { height: "80dvh" }}
    />
  );
};

export default Animation;
