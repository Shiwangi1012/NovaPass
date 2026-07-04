import { useEffect, useState, useRef } from 'react'
import { fetchSubscribeEvents, getLatestLedger, type SubscribeEvent } from '../lib/contracts'

const POLL_INTERVAL_MS = 10_000

export default function EventFeed() {
  const [events, setEvents] = useState<SubscribeEvent[]>([])
  const [loading, setLoading] = useState(false)
  const latestLedgerRef = useRef<number>(0)

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const ledger = await getLatestLedger()
      if (ledger > 0) latestLedgerRef.current = ledger
      const newEvents = await fetchSubscribeEvents(latestLedgerRef.current)
      if (newEvents.length > 0) {
        setEvents(prev => {
          const combined = [...newEvents, ...prev]
          const seen = new Set<string>()
          return combined.filter(e => {
            const key = `${e.subscriber}:${e.expiryLedger}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
          }).slice(0, 20)
        })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
    const id = setInterval(fetchEvents, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="card">
      <div className="card-header">
        <h2>Recent subscriptions</h2>
        <span className={`dot ${loading ? 'dot-pulse' : 'dot-live'}`} title="Live" />
      </div>
      <p className="card-copy">
        This feed shows recent pass mints so users can see the contract activity in real time.
      </p>
      {events.length === 0 ? (
        <p className="muted">No subscriptions have been minted yet.</p>
      ) : (
        <ul className="event-list">
          {events.map((e, i) => (
            <li key={i} className="event-item">
              <span className="event-addr" title={e.subscriber}>
                {e.subscriber.slice(0, 6)}...{e.subscriber.slice(-4)}
              </span>
              <span className="event-meta">
                Expires at ledger {e.expiryLedger.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}