import React, { useState, useMemo, useEffect, useRef } from "react";
import * as math from "mathjs";

function Divider() {
  return (
    <div
      style={{
        color: "#a5d6a7",
        textAlign: "center",
        letterSpacing: "2px",
        margin: "20px 0",
        userSelect: "none",
      }}
    >
      ------
    </div>
  );
}

export default function RiemannSumCalculator() {
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("6");
  const [expression, setExpression] = useState("x^2");
  const [rectangles, setRectangles] = useState("10");
  const [isConverging, setIsConverging] = useState(false);
  const convergeRef = useRef(null);

  const a = parseFloat(start);
  const b = parseFloat(end);
  const n = parseInt(rectangles, 10);

  const validStart = Number.isFinite(a);
  const validEnd = Number.isFinite(b);
  const validRectangles = Number.isFinite(n) && n >= 1;

  const { compiled, parseError } = useMemo(() => {
    try {
      const node = math.parse(expression);
      const code = node.compile();
      return { compiled: code, parseError: null };
    } catch (err) {
      return { compiled: null, parseError: "The function could not be understood, so please check the syntax." };
    }
  }, [expression]);

  const evaluate = (x) => {
    if (!compiled) return 0;
    try {
      const value = compiled.evaluate({ x });
      return Number.isFinite(value) ? value : 0;
    } catch (err) {
      return 0;
    }
  };

  const lowerBound = validStart && validEnd ? Math.min(a, b) : 0;
  const upperBound = validStart && validEnd ? Math.max(a, b) : 0;
  const canCompute = validStart && validEnd && validRectangles && compiled && lowerBound !== upperBound;

  const renderLimit = 500;

  const { delta, sum, points, curve } = useMemo(() => {
    if (!canCompute) {
      return { delta: 0, sum: 0, points: [], curve: [] };
    }
    const width = (upperBound - lowerBound) / n;
    let total = 0;
    for (let i = 0; i < n; i++) {
      const left = lowerBound + i * width;
      const mid = left + width / 2;
      total += evaluate(mid) * width;
    }
    const rectPoints = [];
    const rectStep = Math.max(1, Math.floor(n / renderLimit));
    for (let i = 0; i < n; i += rectStep) {
      const left = lowerBound + i * width;
      const mid = left + width / 2;
      rectPoints.push({ left, height: evaluate(mid), width: width * rectStep });
    }
    const curvePoints = [];
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const x = lowerBound + ((upperBound - lowerBound) * i) / steps;
      curvePoints.push({ x, y: evaluate(x) });
    }
    return { delta: width, sum: total, points: rectPoints, curve: curvePoints };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowerBound, upperBound, n, compiled, canCompute]);

  const svgWidth = 600;
  const svgHeight = 320;
  const margin = 40;

  const allY = curve.map((p) => p.y).concat(points.map((p) => p.height));
  const minY = allY.length ? Math.min(0, ...allY) : 0;
  const maxY = allY.length ? Math.max(0, ...allY) : 1;
  const yRange = maxY - minY === 0 ? 1 : maxY - minY;
  const xRange = upperBound - lowerBound === 0 ? 1 : upperBound - lowerBound;

  const xToPixel = (x) => margin + ((x - lowerBound) / xRange) * (svgWidth - 2 * margin);
  const yToPixel = (y) => svgHeight - margin - ((y - minY) / yRange) * (svgHeight - 2 * margin);

  const curvePath = curve
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xToPixel(p.x)} ${yToPixel(p.y)}`)
    .join(" ");

  const facts = [
    "The Riemann sum is named after the German mathematician Bernhard Riemann, who formalized the idea of integration through limits of sums in the nineteenth century.",
    "As the number of rectangles grows toward infinity, the Riemann sum approaches the exact value of the definite integral.",
    "Riemann sums come in several forms, including left endpoint, right endpoint, and midpoint versions, each choosing a different point in each subinterval to measure height.",
    "Before calculators and computers existed, Riemann sums were calculated entirely by hand to approximate areas under curves for engineering and physics problems.",
    "The symbol used for integration, an elongated S, was chosen because integration is essentially an infinite sum, and S stands for sum.",
  ];
  const factIndex = Math.abs(expression.length + n) % facts.length;
  const fact = facts[factIndex];

  const startConverging = () => {
    if (isConverging) return;
    setIsConverging(true);
    setRectangles("1");
    let current = 1;
    convergeRef.current = setInterval(() => {
      current = Math.min(200, Math.round(current * 1.3) + 1);
      setRectangles(String(current));
      if (current >= 200) {
        clearInterval(convergeRef.current);
        setIsConverging(false);
      }
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (convergeRef.current) clearInterval(convergeRef.current);
    };
  }, []);

  const baseText = {
    fontFamily: "Roboto, sans-serif",
    fontSize: "12pt",
    lineHeight: 1.5,
    fontWeight: 400,
    color: "#1b4d2e",
  };

  const labelStyle = { ...baseText, display: "block", marginBottom: "6px" };

  const inputStyle = {
    ...baseText,
    width: "100%",
    border: "1px solid #2e7d32",
    borderRadius: "4px",
    padding: "8px",
    boxSizing: "border-box",
  };

  const noteStyle = { ...baseText, color: "#2e7d32", marginTop: "6px" };

  const panelStyle = {
    backgroundColor: "#e8f5e9",
    border: "1px solid #2e7d32",
    borderRadius: "6px",
    padding: "14px",
  };

  return (
    <div
      style={{
        ...baseText,
        backgroundColor: "#ffffff",
        padding: "28px",
        maxWidth: "700px",
        margin: "0 auto",
        border: "1px solid #2e7d32",
        borderRadius: "8px",
      }}
    >
      <h1 style={{ ...baseText, fontSize: "24pt", margin: 0 }}>Riemann Sum Calculator</h1>
      <p style={{ ...baseText, color: "#2e7d32", marginTop: "10px", marginBottom: 0 }}>
        This section lets you type in any function and any interval to see how a curved area is approximated by rectangles, with every value updating instantly as you change the inputs.
      </p>

      <Divider />

      <div style={panelStyle}>
        <div style={{ ...baseText, marginBottom: "10px" }}>Sum in sigma notation</div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", marginRight: "10px" }}>
            <span style={{ ...baseText, fontSize: "10pt", lineHeight: 1.2 }}>n</span>
            <span style={{ ...baseText, fontSize: "20pt", lineHeight: 1 }}>{"\u03A3"}</span>
            <span style={{ ...baseText, fontSize: "10pt", lineHeight: 1.2 }}>i = 1</span>
          </span>
          <span style={baseText}>f(x sub i) times delta x</span>
        </div>
        <div style={{ ...baseText, marginTop: "10px" }}>
          where delta x equals the length from a to b divided by n, and x sub i is the midpoint of each of the n pieces.
        </div>
        <div style={{ ...baseText, marginTop: "10px" }}>
          With the current values, this reads as the sum from i equals 1 to {validRectangles ? n : "n"} of f evaluated at the midpoint, times {canCompute ? delta.toFixed(6) : "delta x"}, which totals {canCompute ? sum.toFixed(6) : "an amount that cannot be shown yet"}.
        </div>
      </div>

      <Divider />

      <div style={{ marginBottom: "18px" }}>
        <label style={labelStyle}>Function of x</label>
        <input
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          style={inputStyle}
          placeholder="for example x^2 or sin(x)"
        />
        {parseError && <div style={noteStyle}>{parseError}</div>}
      </div>

      <div style={{ marginBottom: "18px" }}>
        <label style={labelStyle}>Start of interval</label>
        <input type="number" value={start} onChange={(e) => setStart(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ marginBottom: "18px" }}>
        <label style={labelStyle}>End of interval</label>
        <input type="number" value={end} onChange={(e) => setEnd(e.target.value)} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Number of rectangles</label>
        <input
          type="number"
          min={1}
          step={1}
          value={rectangles}
          onChange={(e) => setRectangles(e.target.value)}
          style={inputStyle}
        />
        {validRectangles && n > renderLimit && (
          <div style={noteStyle}>
            The sum uses every rectangle, though the picture only draws a sample of them so the browser stays smooth.
          </div>
        )}
      </div>

      <Divider />

      <div style={{ ...panelStyle, display: "flex", justifyContent: "space-between" }}>
        <div style={baseText}>Delta x: {canCompute ? delta.toFixed(6) : "not available"}</div>
        <div style={baseText}>Approximate sum: {canCompute ? sum.toFixed(6) : "not available"}</div>
      </div>

      <Divider />

      <svg
        width={svgWidth}
        height={svgHeight}
        style={{ display: "block", margin: "0 auto", backgroundColor: "#ffffff", border: "1px solid #2e7d32", borderRadius: "6px" }}
      >
        {canCompute && (
          <>
            <line x1={margin} y1={yToPixel(0)} x2={svgWidth - margin} y2={yToPixel(0)} stroke="#a5d6a7" strokeWidth={1} />
            <line x1={xToPixel(lowerBound)} y1={margin} x2={xToPixel(lowerBound)} y2={svgHeight - margin} stroke="#a5d6a7" strokeWidth={1} />

            {points.map((p, i) => {
              const x0 = xToPixel(p.left);
              const x1 = xToPixel(p.left + p.width);
              const y0 = yToPixel(0);
              const y1 = yToPixel(p.height);
              const rectY = Math.min(y0, y1);
              const rectHeight = Math.abs(y0 - y1);
              return (
                <rect
                  key={i}
                  x={Math.min(x0, x1)}
                  y={rectY}
                  width={Math.abs(x1 - x0)}
                  height={rectHeight}
                  fill="#a5d6a7"
                  fillOpacity={0.5}
                  stroke="#2e7d32"
                  strokeWidth={1}
                />
              );
            })}

            <path d={curvePath} fill="none" stroke="#1b4d2e" strokeWidth={2} />
          </>
        )}
        {!canCompute && (
          <text x={svgWidth / 2} y={svgHeight / 2} textAnchor="middle" fill="#2e7d32" fontFamily="Roboto, sans-serif" fontSize="12pt">
            Please enter a valid function and interval to see the graph.
          </text>
        )}
      </svg>

      <Divider />

      <p style={{ ...baseText, color: "#2e7d32", margin: 0 }}>Fun fact: {fact}</p>

      <Divider />

      <div style={panelStyle}>
        <div style={{ ...baseText, marginBottom: "10px" }}>
          Fun trick: press the button below to watch the rectangle count climb on its own, so you can see the approximate sum settle onto the true area as the rectangles get thinner.
        </div>
        <button
          onClick={startConverging}
          disabled={isConverging}
          style={{
            ...baseText,
            color: "#ffffff",
            backgroundColor: "#2e7d32",
            border: "none",
            borderRadius: "4px",
            padding: "10px 18px",
            cursor: isConverging ? "default" : "pointer",
          }}
        >
          {isConverging ? "Converging" : "Watch it converge"}
        </button>
      </div>
    </div>
  );
}