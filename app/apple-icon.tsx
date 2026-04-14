import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#4f46e5',
          borderRadius: 40,
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
            width: 106,
            height: 78,
            background: 'white',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 70 }}>
            <div style={{ height: 7, background: '#e0e7ff', borderRadius: 4, width: '100%' }} />
            <div style={{ height: 7, background: '#e0e7ff', borderRadius: 4, width: '75%' }} />
            <div style={{ height: 7, background: '#c7d2fe', borderRadius: 4, width: '88%' }} />
          </div>
        </div>
        <div
          style={{
            color: 'white',
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: -0.5,
            marginTop: 10,
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
