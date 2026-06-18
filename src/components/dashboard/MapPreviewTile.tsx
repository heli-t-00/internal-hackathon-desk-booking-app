import { FloorMap } from '../map/FloorMap'
import { useStore } from '../../store/StoreContext'
import { availabilityForDate, todayKey } from '../../store/selectors'

export function MapPreviewTile({ onOpen }: { onOpen: () => void }) {
  const { state } = useStore()
  const avail = availabilityForDate(state, todayKey(state))

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <button onClick={onOpen} style={{ display: 'block', width: '100%', textAlign: 'left' }}>
        <div className="row spread" style={{ padding: '14px 16px 6px' }}>
          <div>
            <div className="section-title" style={{ marginBottom: 2 }}>Floor plan</div>
            <div style={{ fontWeight: 700 }}>{avail.free} desks free now</div>
          </div>
          <span className="pill">Open map →</span>
        </div>
        <div
          style={{
            padding: '0 12px 12px',
            maxHeight: 200,
            overflow: 'hidden',
            maskImage: 'linear-gradient(to bottom, #000 78%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, #000 78%, transparent)',
          }}
        >
          <FloorMap />
        </div>
      </button>
    </div>
  )
}
