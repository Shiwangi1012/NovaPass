import React, { useState } from 'react'
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit'
import { sendXlm } from '../lib/stellar'
import { classifyError, errorLabel } from '../lib/errors'

interface SendXlmProps {
  address: string | null
  onSuccess: () => void
}

type TxStatus = 'idle' | 'pending' | 'success' | 'fail'

export default function SendXlm({ address, onSuccess }: SendXlmProps) {
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('1')
  const [status, setStatus] = useState<TxStatus>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [errorInfo, setErrorInfo] = useState<{ type: string; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address || !destination.trim() || !amount) return

    setStatus('pending')
    setTxHash(null)
    setErrorInfo(null)

    try {
      const signFn = async (xdr: string) => {
        const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
          networkPassphrase: import.meta.env.VITE_NETWORK_PASSPHRASE,
        })
        return signedTxXdr
      }
      const hash = await sendXlm(address, destination.trim(), amount, signFn)
      setTxHash(hash)
      setStatus('success')
      onSuccess()
    } catch (err) {
      const classified = classifyError(err)
      setErrorInfo({ type: errorLabel(classified.type), message: classified.message })
      setStatus('fail')
    }
  }

  if (!address) return null

  return (
    <div className="card">
      <h2>Send XLM</h2>
      <form onSubmit={handleSubmit} className="form">
        <label className="form-label">
          Destination address
          <input
            type="text"
            placeholder="G..."
            value={destination}
            onChange={e => setDestination(e.target.value)}
            disabled={status === 'pending'}
            spellCheck={false}
          />
        </label>
        <label className="form-label">
          Amount (XLM)
          <input
            type="number"
            min="0.0000001"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            disabled={status === 'pending'}
          />
        </label>
        <button type="submit" className="btn-primary" disabled={status === 'pending' || !destination.trim()}>
          {status === 'pending' ? '⏳ Sending…' : 'Send XLM'}
        </button>
      </form>
      {status === 'pending' && <div className="status-badge pending">⏳ Broadcasting…</div>}
      {status === 'success' && txHash && (
        <div className="status-badge success">
          ✅ Sent!{' '}
          <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="tx-link">
            {txHash.slice(0, 8)}…{txHash.slice(-6)}
          </a>
        </div>
      )}
      {status === 'fail' && errorInfo && (
        <div className="status-badge fail">
          <strong>{errorInfo.type}</strong>: {errorInfo.message}
        </div>
      )}
    </div>
  )
}
