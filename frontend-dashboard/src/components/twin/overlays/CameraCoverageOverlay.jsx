import React from "react";
import { PLAN, centerOf } from "../../../utils/geometry.js";
import { CAMERA_COVERAGE } from "../../../utils/overlayData.js";

export default function CameraCoverageOverlay() {
  return (
    <g className="overlay-fade">
      {Object.keys(PLAN).map((id) => {
        const covered = CAMERA_COVERAGE[id];
        const { cx, cy } = centerOf(id);
        const s = PLAN[id];
        return (
          <g key={id}>
            {covered && <circle cx={cx} cy={s.y} r="4" fill="none" stroke="#8B5CF6" strokeWidth="1.5" opacity="0.5" />}
            <circle cx={s.x + s.w - 10} cy={s.y + 10} r="3.5" fill={covered ? "#8B5CF6" : "#D1D5DB"} className={covered ? "pulse" : ""} />
          </g>
        );
      })}
    </g>
  );
}
