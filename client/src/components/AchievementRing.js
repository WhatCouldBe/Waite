// client/src/components/AchievementRing.js
import React from 'react';

export default function AchievementRing({ unlockedCount, total = 9, size = 60, strokeWidth = 6 }) {
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.min(unlockedCount / total, 1);
  const strokeDashoffset = circumference - fraction * circumference;
  return (
    <svg width={size} height={size} className="achievement-ring-mini">
      <circle
        stroke="#ccc"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        stroke="#4caf50"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text
        x={size / 2}
        y={(size / 2) + 5} /* Moved down by 2 pixels */
        textAnchor="middle"
        fontSize={size / 3}
        fontWeight="bold"
        fill="#333"
      >
        {unlockedCount}/{total}
      </text>
    </svg>
  );
}
