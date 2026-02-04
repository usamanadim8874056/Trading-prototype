"use client";

import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";

export default function CandleChart({ ticker, tf }: { ticker: string; tf: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Binance-style dark chart
    const chart = createChart(containerRef.current, {
      height: 260,
      autoSize: true,
      layout: {
        background: { color: "#0f1419" },
        textColor: "#b7bdc6",
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.12, bottom: 0.12 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      grid: {
        vertLines: { color: "rgba(43,49,57,0.25)" },
        horzLines: { color: "rgba(43,49,57,0.25)" },
      },
      crosshair: {
        vertLine: { color: "rgba(240,185,11,0.4)" },
        horzLine: { color: "rgba(240,185,11,0.4)" },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#0ecb81",
      downColor: "#f6465d",
      borderVisible: false,
      wickUpColor: "#0ecb81",
      wickDownColor: "#f6465d",
    });

    let alive = true;

    async function load() {
      const res = await fetch(
        `/api/market/candles?mode=sim&ticker=${encodeURIComponent(ticker)}&tf=${encodeURIComponent(tf)}`,
        { cache: "no-store" }
      );

      const json = await res.json();
      let data = json.candles || [];

      // safety sort/dedupe
      data = data
        .sort((a: any, b: any) => a.time - b.time)
        .filter((c: any, i: number, arr: any[]) => i === 0 || c.time > arr[i - 1].time);

      if (alive) series.setData(data);
    }

    load();
    const id = setInterval(load, 1500);

    return () => {
      alive = false;
      clearInterval(id);
      chart.remove();
    };
  }, [ticker, tf]);

  return <div ref={containerRef} className="w-full rounded-2xl overflow-hidden" />;
}
