import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "relative",
        width: 56,
        height: 28,
        borderRadius: 14,
        border: "none",
        cursor: "pointer",
        overflow: "hidden",
        padding: 0,
        flexShrink: 0,
        marginLeft: 12,
        transition: "box-shadow 0.3s ease",
        boxShadow: isDark
          ? "0 0 8px rgba(100, 80, 180, 0.4)"
          : "0 0 8px rgba(135, 206, 235, 0.4)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transition: "opacity 0.4s ease",
          opacity: isDark ? 1 : 0,
          background:
            "linear-gradient(135deg, #1a1145 0%, #2d1b69 40%, #4a3080 70%, #3b2566 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transition: "opacity 0.4s ease",
          opacity: isDark ? 0 : 1,
          background:
            "linear-gradient(135deg, #87CEEB 0%, #b8e4f9 40%, #d4f0ff 70%, #a8d8ea 100%)",
        }}
      />
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
        viewBox="0 0 56 28"
        preserveAspectRatio="none"
      >
        <g
          style={{
            transition: "opacity 0.4s ease",
            opacity: isDark ? 1 : 0,
          }}
        >
          <circle cx="38" cy="6" r="1" fill="rgba(255,255,255,0.8)" />
          <circle cx="44" cy="10" r="0.7" fill="rgba(255,255,255,0.6)" />
          <circle cx="32" cy="12" r="0.8" fill="rgba(255,255,255,0.7)" />
          <circle cx="48" cy="8" r="0.5" fill="rgba(255,255,255,0.5)" />
          <circle cx="36" cy="18" r="0.6" fill="rgba(255,255,255,0.4)" />
          <circle cx="42" cy="22" r="0.7" fill="rgba(255,255,255,0.5)" />
          <circle cx="50" cy="16" r="0.5" fill="rgba(255,255,255,0.6)" />
          <circle cx="30" cy="8" r="0.6" fill="rgba(255,255,255,0.5)" />
          <circle cx="46" cy="5" r="0.4" fill="rgba(255,255,255,0.4)" />
          <ellipse cx="35" cy="24" rx="6" ry="3" fill="rgba(80,60,140,0.5)" />
          <ellipse cx="45" cy="22" rx="7" ry="4" fill="rgba(70,50,130,0.4)" />
          <ellipse cx="40" cy="20" rx="5" ry="2.5" fill="rgba(90,70,160,0.35)" />
        </g>
        <g
          style={{
            transition: "opacity 0.4s ease",
            opacity: isDark ? 0 : 1,
          }}
        >
          <ellipse cx="12" cy="20" rx="8" ry="4" fill="rgba(255,255,255,0.6)" />
          <ellipse cx="18" cy="18" rx="6" ry="3.5" fill="rgba(255,255,255,0.5)" />
          <ellipse cx="8" cy="22" rx="5" ry="3" fill="rgba(255,255,255,0.45)" />
          <ellipse cx="25" cy="22" rx="7" ry="3.5" fill="rgba(255,255,255,0.4)" />
          <ellipse cx="15" cy="16" rx="4" ry="2.5" fill="rgba(255,255,255,0.35)" />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          top: 2,
          left: 2,
          width: 24,
          height: 24,
          borderRadius: "50%",
          transition:
            "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), background 0.35s ease, box-shadow 0.35s ease",
          transform: isDark ? "translateX(0)" : "translateX(28px)",
          background: isDark
            ? "radial-gradient(circle at 40% 40%, #f0f0f0, #d0d0d0, #b8b8b8)"
            : "radial-gradient(circle at 40% 40%, #fff176, #ffeb3b, #fdd835)",
          boxShadow: isDark
            ? "0 0 6px rgba(200, 200, 220, 0.6), inset -2px -2px 4px rgba(180, 180, 200, 0.3)"
            : "0 0 10px rgba(255, 235, 59, 0.6), 0 0 20px rgba(255, 193, 7, 0.3)",
          zIndex: 2,
        }}
      >
        {isDark && (
          <div style={{ position: "absolute", inset: 0 }}>
            <div
              style={{
                position: "absolute",
                top: 5,
                left: 7,
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "rgba(180, 180, 200, 0.3)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                width: 3,
                height: 3,
                borderRadius: "50%",
                background: "rgba(180, 180, 200, 0.2)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 8,
                left: 15,
                width: 2,
                height: 2,
                borderRadius: "50%",
                background: "rgba(180, 180, 200, 0.25)",
              }}
            />
          </div>
        )}
      </div>
    </button>
  );
}
