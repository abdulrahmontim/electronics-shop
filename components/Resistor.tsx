"use client";

import { useState } from "react";
import {
  BAND_COLORS,
  MULTIPLIER_COLORS,
  TOLERANCE_COLOR,
  formatResistorValue,
} from "@/lib/resistor";

const LEAD_COLOR = "#9AA1AD";
const BODY_COLOR = "#3E6FA3";

// The shared formatter returns ASCII units so it stays testable; the hero shows the symbol.
function toDisplayValue(value: string): string {
  return value.replace(/MOhms$/, "MΩ").replace(/kOhms$/, "kΩ").replace(/ O$/, " Ω");
}

export function Resistor() {
  const [band1, setBand1] = useState(4);
  const [band2, setBand2] = useState(7);
  const [band3, setBand3] = useState(2);

  const first = BAND_COLORS[band1];
  const second = BAND_COLORS[band2];
  const multiplier = MULTIPLIER_COLORS[band3];
  const value = toDisplayValue(formatResistorValue(band1, band2, band3));

  const bands = [
    {
      role: "First band",
      color: first.color,
      label: first.label,
      onClick: () => setBand1((band1 % 9) + 1),
    },
    {
      role: "Second band",
      color: second.color,
      label: second.label,
      onClick: () => setBand2((band2 + 1) % 10),
    },
    {
      role: "Multiplier band",
      color: multiplier.color,
      label: multiplier.label,
      onClick: () => setBand3((band3 + 1) % MULTIPLIER_COLORS.length),
    },
  ];

  return (
    <div className="resistor-widget">
      <div className="resistor" style={{ background: BODY_COLOR }}>
        <span className="resistor-lead resistor-lead-left" style={{ background: LEAD_COLOR }} />
        <div className="resistor-body">
          {bands.map((band) => (
            <button
              key={band.role}
              type="button"
              className="resistor-band"
              style={{ background: band.color }}
              aria-label={`${band.role}, ${band.label}. Activate to change.`}
              onClick={band.onClick}
            />
          ))}
          <span
            className="resistor-band resistor-band-tolerance"
            style={{ background: TOLERANCE_COLOR }}
            aria-hidden="true"
          />
        </div>
        <span className="resistor-lead resistor-lead-right" style={{ background: LEAD_COLOR }} />
      </div>
      <p className="resistor-value" aria-live="polite">
        {value}
      </p>
      <p className="resistor-hint">
        Press a band to change its colour and read the new value.
      </p>
    </div>
  );
}