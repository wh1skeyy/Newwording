interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ width = '100%', height = 16, className = '', style }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, ...style }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div style={{
      background: '#1d2022',
      border: '1px solid #464554',
      borderRadius: 8,
      padding: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <Skeleton width={80} height={20} />
          <div style={{ marginTop: 8 }}>
            <Skeleton width="60%" height={16} />
          </div>
          <div style={{ marginTop: 6 }}>
            <Skeleton width="40%" height={12} />
          </div>
        </div>
        <Skeleton width={100} height={36} />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      <div style={{
        background: '#191c1e',
        padding: '14px 16px',
        display: 'grid',
        gridTemplateColumns: '2fr 2fr 1fr 3fr',
        gap: 16,
        marginBottom: 1,
      }}>
        {['WORD', 'VIETNAMESE', 'TYPE', 'EXAMPLE'].map(h => (
          <Skeleton key={h} width={60} height={12} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          padding: '14px 16px',
          display: 'grid',
          gridTemplateColumns: '2fr 2fr 1fr 3fr',
          gap: 16,
          borderTop: '1px solid #272a2c',
        }}>
          <Skeleton width="70%" height={14} />
          <Skeleton width="80%" height={14} />
          <Skeleton width={40} height={22} />
          <Skeleton width="90%" height={14} />
        </div>
      ))}
    </div>
  )
}
