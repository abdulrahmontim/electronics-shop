"use client";

import { useEffect, useState } from "react";

const BAND_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const BAND2_DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const MULTIPLIERS = [0, 1, 2, 3, 4, 5, 6];

const BAND1_COLORS = [
  "#7d5e40",
  "#e57373",
  "#ffb74d",
  "#fff176",
  "#aed581",
  "#64b5f6",
  "#ce93d8",
  "#cfd8dc",
  "#fafafa",
];

const BAND2_COLORS = [
  "#bfbfbf",
  "#7d5e40",
  "#e57373",
  "#ffb74d",
  "#fff176",
  "#aed581",
  "#64b5f6",
  "#ce93d8",
  "#cfd8dc",
  "#fafafa",
];

const MULT_COLORS = [
  "#bfbfbf",
  "#7d5e40",
  "#e57373",
  "#ffb74d",
  "#fff176",
  "#aed581",
  "#64b5f6",
];

function formatValue(b1: number, b2: number, m: number) {
  const d1 = BAND_DIGITS[b1 % BAND_DIGITS.length];
  const d2 = BAND2_DIGITS[b2 % BAND2_DIGITS.length];
  const mIdx = MULTIPLIERS[m % MULTIPLIERS.length];
  const mult = [1, 10, 100, 1000, 10000, 100000, 1000000][mIdx];
  const ohms = (d1 * 10 + d2) * mult;
  if (ohms >= 1000000) {
    return (ohms / 1000000).toFixed(ohms % 1000000 === 0 ? 0 : 1) + " MOhms";
  }
  if (ohms >= 1000) {
    return (ohms / 1000).toFixed(ohms % 1000 === 0 ? 0 : 1) + " kOhms";
  }
  return ohms + " Ohms";
}

export function Resistor() {
  const [b1, setB1] = useState(0);
  const [b2, setB2] = useState(0);
  const [m, setM] = useState(0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "1rem 2rem",
          background: "var(--resistor-blue)",
          borderRadius: "0.5rem",
          border: "1px solid var(--hairline)",
        }}
      >
        <button
          type="button"
          onClick={() => setB1((b1 + 1) % BAND_DIGITS.length)}
          aria-label="First band, digit"
          style={{
            width: "2rem",
            height: "4rem",
            background: BAND1_COLORS[b1 % BAND1_COLORS.length],
            border: "1px solid #0003",
          }}
        />
        <button
          type="button"
          onClick={() => setB2((b2 + 1) % BAND2_DIGITS.length)}
          aria-label="Second band, digit"
          style={{
            width: "2rem",
            height: "4rem",
            background: BAND2_COLORS[b2 % BAND2_COLORS.length],
            border: "1px solid #0003",
          }}
        />
        <button
          type="button"
          onClick={() => setM((m + 1) % MULTIPLIERS.length)}
          aria-label="Multiplier band"
          style={{
            width: "2rem",
            height: "4rem",
            background: MULT_COLORS[m % MULT_COLORS.length],
            border: "1px solid #0003",
          }}
        />
        <div
          style={{
            width: "2rem",
            height: "4rem",
            background: "var(--band-yellow)",
            border: "1px solid #0003",
          }}
          aria-label="Tolerance band, gold"
        />
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 800 }}>
        {formatValue(b1, b2, m)}
      </div>
      <p>Press a band to cycle its value</p>
    </div>
  );
}
