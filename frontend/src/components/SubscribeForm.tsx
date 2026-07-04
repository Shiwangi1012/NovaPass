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
        <div className="mint-status mint-status--success">
          <div>Subscribed successfully.</div>
          <a href={explorerBase + '/tx/' + txHash} target="_blank" rel="noopener noreferrer">
            {txHash.slice(0, 8)}...{txHash.slice(-6)}
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
