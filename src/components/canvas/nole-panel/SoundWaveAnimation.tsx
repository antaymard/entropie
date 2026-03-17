import { useEffect, useState } from "react";

export default function SoundWaveAnimation() {
  const [heights, setHeights] = useState([40, 70, 50, 80, 30]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeights((prev) => prev.map(() => 20 + Math.random() * 80));
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-0.75 h-5">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-0.75 rounded-full bg-red-400 transition-all duration-150"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}
