'use client';

/** Minimal inline icon set — avoids pulling in an icon package for ~20 glyphs. */

type IconProps = { className?: string };

const base = 'h-4.5 w-4.5';

function Svg({ children, className }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? base}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const CursorIcon = (p: IconProps) => (
  <Svg {...p}><path d="m4 3 7.5 17 2.2-6.8L20.5 11 4 3Z" /></Svg>
);
export const TextIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 6V4h14v2M12 4v16M9 20h6" /></Svg>
);
export const ImageIcon = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="4.5" width="18" height="15" rx="2" /><circle cx="8.5" cy="10" r="1.6" /><path d="m3.5 17 5-5 4.5 4.5L16 14l4.5 4.5" /></Svg>
);
export const PenIcon = (p: IconProps) => (
  <Svg {...p}><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7.5 18.5 3 20l1.5-4.5L16.5 3.5Z" /></Svg>
);
export const HighlightIcon = (p: IconProps) => (
  <Svg {...p}><path d="m14 3 7 7-8 8H7l-3-3 10-12Z" /><path d="M3 21h18" /></Svg>
);
export const SquareIcon = (p: IconProps) => (
  <Svg {...p}><rect x="4" y="4" width="16" height="16" rx="1.5" /></Svg>
);
export const CircleIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /></Svg>
);
export const LineIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 20 20 4" /></Svg>
);
export const ArrowIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 20 20 4M13 4h7v7" /></Svg>
);
export const SignatureIcon = (p: IconProps) => (
  <Svg {...p}><path d="M3 17c3 0 3.5-9 6-9s1.5 9 4 9 2-5 4-5 2.5 2 4 2" /><path d="M3 21h18" /></Svg>
);
export const UndoIcon = (p: IconProps) => (
  <Svg {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></Svg>
);
export const RedoIcon = (p: IconProps) => (
  <Svg {...p}><path d="m15 14 5-5-5-5" /><path d="M20 9H10a6 6 0 0 0 0 12h3" /></Svg>
);
export const DownloadIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></Svg>
);
export const TrashIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></Svg>
);
export const RotateLeftIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 5v5h5" /><path d="M4.5 10a8 8 0 1 1 1.2 6" /></Svg>
);
export const RotateRightIcon = (p: IconProps) => (
  <Svg {...p}><path d="M20 5v5h-5" /><path d="M19.5 10a8 8 0 1 0-1.2 6" /></Svg>
);
export const CopyIcon = (p: IconProps) => (
  <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></Svg>
);
export const ZoomInIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M11 8.5v5M8.5 11h5M16 16l4.5 4.5" /></Svg>
);
export const ZoomOutIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M8.5 11h5M16 16l4.5 4.5" /></Svg>
);
export const LayersIcon = (p: IconProps) => (
  <Svg {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></Svg>
);
export const CloseIcon = (p: IconProps) => (
  <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
);
export const FileIcon = (p: IconProps) => (
  <Svg {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5" /></Svg>
);
