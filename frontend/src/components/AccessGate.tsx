import { useEffect, useState, useCallback } from 'react'
import { isActive, checkAccess } from '../lib/contracts'

interface AccessGateProps {
  address: string | null
  refreshTrigger?: number
  onStatusChange?: (snapshot: {
    subscriptionActive: boolean | null
    contentAccess: boolean | null
  }) => void
}

export default function AccessGate({ address, refreshTrigger, onStatusChange }: AccessGateProps) {
  const [subActive, setSubActive] = useState<boolean | null>(null)
  const [gateAccess, setGateAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  const check = useCallback(async () => {
    if (!address) {
      setSubActive(null)
      setGateAccess(null)
      onStatusChange?.({ subscriptionActive: null, contentAccess: null })
      return
    }

    setLoading(true)
    try {
      const [active, gate] = await Promise.all([
        isActive(address),
        checkAccess(address),
      ])
      setSubActive(active)
      setGateAccess(gate)
      onStatusChange?.({ subscriptionActive: active, contentAccess: gate })
    } finally {
      setLoading(false)
    }
  }, [address, onStatusChange])

  useEffect(() => {
    check()
  }, [check, refreshTrigger])

  if (!address) return null

  return (
    <div className="card">
      <div className="mini-card-header">
        <span className="label">Access status</span>
        <span className="card-caption">Checked in real time</span>
      </div>
      {loading ? (
        <p className="muted">Checking...</p>
      ) : (
        <div className="access-rows">
          <div className="access-row">
            <div>
              <span className="label">Subscription pass</span>
              <p className="row-help">Does this wallet hold an active time-locked pass?</p>
            </div>
            <span className={`badge ${subActive ? 'badge-active' : 'badge-inactive'}`}>
              {subActive ? 'Active' : 'Expired / none'}
            </span>
          </div>
          <div className="access-row">
            <div>
              <span className="label">Content gate</span>
              <p className="row-help">Can a separate contract verify access right now?</p>
            </div>
            <span className={`badge ${gateAccess ? 'badge-active' : 'badge-inactive'}`}>
              {gateAccess ? 'Access granted' : 'Access denied'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}