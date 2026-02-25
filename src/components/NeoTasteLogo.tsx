export function NeoTasteLogo({ className = "h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: "visible" }}
    >
      <rect x="2" y="2" width="32" height="32" rx="8" fill="#53F293" />
      <text
        x="18"
        y="27"
        textAnchor="middle"
        fill="#11301D"
        fontWeight="800"
        fontSize="22"
        fontFamily="var(--font-poppins), sans-serif"
      >
        N
      </text>
      <text
        x="44"
        y="26"
        fill="white"
        fontWeight="700"
        fontSize="20"
        fontFamily="var(--font-poppins), sans-serif"
      >
        NeoTaste
      </text>
    </svg>
  );
}

export function NeoTasteIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="2" y="2" width="32" height="32" rx="8" fill="#53F293" />
      <text
        x="18"
        y="27"
        textAnchor="middle"
        fill="#11301D"
        fontWeight="800"
        fontSize="22"
        fontFamily="var(--font-poppins), sans-serif"
      >
        N
      </text>
    </svg>
  );
}
