import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 57 40"
          width="28"
          height="20"
        >
          <defs>
            <linearGradient id="x" x1="0%" x2="100%" y1="50%" y2="50%">
              <stop offset="0%" stopColor="#24C1FF" />
              <stop offset="48.99%" stopColor="#24C1FF" />
              <stop offset="49%" stopColor="#0B76FF" />
              <stop offset="100%" stopColor="#0B76FF" />
            </linearGradient>
            <linearGradient id="z" x1="0%" x2="100%" y1="50%" y2="50%">
              <stop offset="0%" stopColor="#6BFFFA" />
              <stop offset="49.99%" stopColor="#6BFFFA" />
              <stop offset="50%" stopColor="#00E2C2" />
              <stop offset="100%" stopColor="#00E2C2" />
            </linearGradient>
          </defs>
          <g fill="none">
            <path fill="url(#x)" d="M28 0L52 40H4L28 0Zm0 13L17 33h22L28 13Z" />
            <path fill="url(#z)" d="M28 18l8 13H21z" />
          </g>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
