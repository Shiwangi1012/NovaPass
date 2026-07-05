import { useState, type FormEvent } from 'react'
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit'
import { Clock3, Sparkles } from 'lucide-react'
import { subscribe } from '../lib/contracts'
import { classifyError, errorLabel } from '../lib/errors'

interface SubscribeFormProps {
  address: string | null
  onSuccess: () => void
}

type TxStatus = 'idle' | 'pending' | 'success' | 'fail'

const presetDurations = ['7', '30', '90']
const explorerBase = import.meta.env.VITE_STELLAR_EXPLORER_BASE ?? (import.meta.env.VITE_STELLAR_NETWORK === 'testnet'
  ? 'https://stellar.expert/explorer/testnet'
  : 'https://stellar.expert/explorer/public')

export default function SubscribeForm({ address, onSuccess }: SubscribeFormProps) {
  const [duration, setDuration] = useState('30')
  const [status, setStatus] = useState<TxStatus>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [errorInfo, setErrorInfo] = useState<{ type: string; message: string } | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!address) return

    setStatus('pending')
    setTxHash(null)
    setErrorInfo(null)

    try {
      const days = Math.max(1, parseInt(duration, 10))
      const signTransaction = async (xdr: string) => {
        const signed = await StellarWalletsKit.signTransaction(xdr, {
          networkPassphrase: import.meta.env.VITE_NETWORK_PASSPHRASE,
        })
        return signed.signedTxXdr
      }

      const hash = await subscribe(address, days, signTransaction)
      setTxHash(hash)
      setStatus('success')
      onSuccess()
    } catch (err) {
      const classified = classifyError(err)
      setErrorInfo({ type: errorLabel(classified.type), message: classified.message })
      setStatus('fail')
    }
  }

  if (!address) {
    return (
      <div className="mint-empty">
        <div className="mint-empty__icon">
          <Sparkles size={18} />
        </div>
        <div>
          <h3>Connect a wallet to mint.</h3>
          <p>The mint flow will appear here once the wallet is connected.</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mint-form">
      <div className="mint-form__header">
        <div>
          <span className="eyebrow">Duration</span>
          <h3>Choose the access window.</h3>
        </div>
        <div className="mint-form__chip">
          <Clock3 size={14} />
          Time-locked pass
        </div>
      </div>

      <div className="duration-pills" role="group" aria-label="Duration presets">
        {presetDurations.map(value => (
          <button
            key={value}
            type="button"
            className={duration === value ? 'duration-pill is-active' : 'duration-pill'}
            onClick={() => setDuration(value)}
          >
            {value} days
          </button>
        ))}
      </div>

      <label className="mint-form__field">
        <span>Custom duration</span>
        <input
          type="number"
          min="1"
          max="365"
          value={duration}
          onChange={event => setDuration(event.target.value)}
          disabled={status === 'pending'}
        />
      </label>

      <button type="submit" className="action-button action-button--block" disabled={status === 'pending'}>
        {status === 'pending' ? 'Minting...' : 'Mint pass'}
      </button>

      {status === 'pending' && <div className="mint-status mint-status--pending">Transaction pending...</div>}

      {status === 'success' && txHash && (
        <div className="mint-panel glass-card" style={{ marginTop: '2rem', border: '1px solid #10b981', background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Transaction Successful: Subscribed!</div>
          <p style={{ margin: '0 0 1rem 0', color: 'inherit' }}>Your time-locked pass has been minted.</p>
          <a href={explorerBase + '/tx/' + txHash} target="_blank" rel="noopener noreferrer" className="action-button action-button--ghost" style={{ display: 'inline-flex', textDecoration: 'none' }}>
            View on Explorer
          </a>
        </div>
      )}

      {status === 'fail' && errorInfo && (
        <div className="mint-status mint-status--fail">
          <strong>{errorInfo.type}</strong>
          <span>{errorInfo.message}</span>
        </div>
      )}
    </form>
  )
}
