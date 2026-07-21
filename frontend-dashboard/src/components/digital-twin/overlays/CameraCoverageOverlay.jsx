import React from "react";
import { PLAN, centerOf } from "../../../utils/geometry.js";
import { CAMERA_ZONES } from "../../../utils/overlayData.js";

/** Static reference overlay — see utils/overlayData.js for why this one
 * isn't live (no CCTV coverage endpoint exists in the backend). */
export default function CameraCoverageOverlay() {
  return (
    <g className="overlay-fade">
      {Object.keys(PLAN).map((zoneId) => {
        const covered = CAMERA_ZONES.includes(zoneId);
        const { cx } = centerOf(zoneId);
        const s = PLAN[zoneId];
        return (
          <g key={zoneId}>
            {covered && <circle cx={cx} cy={s.y} r="4" fill="none" stroke="#8B5CF6" strokeWidth="1.5" opacity="0.5" />}
            <circle cx={s.x + s.w - 11} cy={s.y + 11} r="3.5" fill={covered ? "#8B5CF6" : "#D1D5DB"} className={covered ? "pulse" : ""} />
          </g>
        );
      })}
    </g>
  );
}
