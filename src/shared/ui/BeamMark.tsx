export function BeamMark({
  className = 'h-4 w-4',
  title = 'BEAM',
}: {
  className?: string;
  title?: string;
}) {
  // Static (non-animated) mark derived from the header Beam logo,
  // but styled like the network icons: uses currentColor + opacity layers.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 57 40"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <g fill="none">
        <path fill="currentColor" opacity="0.85" d="M28 0L52 40H4L28 0Zm0 13L17 33h22L28 13Z" />
        <path fill="currentColor" opacity="0.6" d="M28 18l8 13H21z" />
      </g>
    </svg>
  );
}

