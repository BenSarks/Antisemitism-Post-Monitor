import React, { memo } from "react";
import ReactWordcloud from "react-wordcloud";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/scale.css";
import { COLORS } from "../theme";

const OPTIONS = {
  fontSizes: [12, 56],
  fontFamily: "Inter, sans-serif",
  fontWeight: "600",
  rotations: 2,
  rotationAngles: [0, 90],
  padding: 2,
  deterministic: true,
  colors: [COLORS.primary, "#A78BFA", COLORS.scanned, COLORS.flagged, "#F472B6", "#94A3B8"],
  transitionDuration: 600,
};

const WordCloud = ({ data }) => <ReactWordcloud words={data} options={OPTIONS} />;

export default memo(WordCloud);
