import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: '#4f46e5',
          borderRadius: 96,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {/* Card shape */}
        <div
          style={{
            width: 300,
            height: 220,
            background: 'white',
            borderRadius: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 48px rgba(0,0,0,0.25)',
            position: 'relative',
          }}
        >
          {/* Lines on card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: 200 }}>
            <div style={{ height: 20, background: '#e0e7ff', borderRadius: 10, width: '100%' }} />
            <div style={{ height: 20, background: '#e0e7ff', borderRadius: 10, width: '75%' }} />
            <div style={{ height: 20, background: '#c7d2fe', borderRadius: 10, width: '88%' }} />
          </div>
        </div>
        {/* Label */}
        <div
          style={{
            color: 'white',
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: -2,
            marginTop: 28,
            fontFamily: 'sans-serif',
          }}
        >
          Caflash
        </div>
      </div>
    ),
    { ...size }
  )
}
