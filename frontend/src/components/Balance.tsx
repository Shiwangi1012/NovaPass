import { useEffect, useState, useCallback } from 'react'
import { fetchXlmBalance } from '../lib/stellar'

interface BalanceProps {
  address: string | null
  refreshTrigger?: number
  onBalanceChange?: (balance: string | null) => void
}

export default function Balance({ address, refreshTrigger, onBalanceChange }: BalanceProps) {
  const [balance, setBalance] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!address) {
      setBalance(null)
      onBalanceChange?.(null)
      return
    }

    setLoading(true)
    try {
      const bal = await fetchXlmBalance(address)
      setBalance(bal)
      onBalanceChange?.(bal)
    } finally {
      setLoading(false)
    }
  }, [address, onBalanceChange])

  useEffect(() => {
    load()
  }, [load, refreshTrigger])

  if (!address) return null

  return (
    <div className="balance-card">
      <div className="mini-card-header">
        <span className="label">XLM balance</span>
        <span className="card-caption">Read from Stellar</span>
      </div>
      {loading
        ? <span className="value muted">Loading...</span>
        : <span className="value">{balance ?? '-'} XLM</span>
      }
    </div>
  )
}