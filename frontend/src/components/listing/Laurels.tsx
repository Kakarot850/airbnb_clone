/** Laurel wreath halves around the "Guest favorite" rating. */
export function Laurel({ flip = false, className = "h-9 w-auto" }: { flip?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 20 32" className={className} style={flip ? { transform: "scaleX(-1)" } : undefined} fill="currentColor" aria-hidden="true">
      <path d="M15.4 30.6c-3.8-1.1-6.8-3.5-8.6-6.8l1.1-.6c1.6 3 4.4 5.2 7.9 6.2l-.4 1.2z" />
      <path d="M8.2 25.6c-2.2.6-4.3-.2-5.9-1.9 2.1-.9 4.3-.9 6.1.3l-.2 1.6zM5.9 20.9C3.7 20.7 2 19.2 1 17.1c2.3-.2 4.3.6 5.6 2.2l-.7 1.6zM5 15.9c-2-.7-3.3-2.5-3.8-4.8 2.2.4 4 1.6 4.8 3.5L5 15.9zM5.6 10.9C3.9 9.6 3.2 7.6 3.3 5.3c2 .9 3.4 2.6 3.7 4.6l-1.4 1zM7.7 6.4C6.6 4.6 6.5 2.5 7.3.4c1.6 1.4 2.4 3.4 2.2 5.5l-1.8.5z" />
      <path d="M7.1 25.1c-.6-6.4.5-12.9 3.3-18.9l1.1.5c-2.7 5.8-3.8 12.1-3.2 18.3l-1.2.1z" />
    </svg>
  );
}
