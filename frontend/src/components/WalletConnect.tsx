import { useEffect, useState } from 'react'
import { StellarWalletsKit, Networks, KitEventType } from '@creit.tech/stellar-wallets-kit'
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils'
import { Wallet, LogOut } from 'lucide-react'
import { classifyError } from '../lib/errors'

interface WalletConnectProps {
  onConnect: (address: string) => void
  onDisconnect: () => void
  address: string | null
}

const NETWORK = import.meta.env.VITE_STELLAR_NETWORK === 'testnet'
  ? Networks.TESTNET
  : Networks.PUBLIC

StellarWalletsKit.init({
  network: NETWORK,
  modules: defaultModules(),
})

export default function WalletConnect({ onConnect, onDisconnect, address }: WalletConnectProps) {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const unsub = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      onDisconnect()
    })
    return () => {
      if (typeof unsub === 'function') unsub()
    }
  }, [onDisconnect])

  const handleConnect = async () => {
    setErrorMsg(null)
    setLoading(true)
    try {
      const result = await StellarWalletsKit.authModal()
      onConnect(result.address)
    } catch (err) {
      const error = err as { code?: number }
      if (error?.code !== -1) {
        const classified = classifyError(err)
        setErrorMsg(classified.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    await StellarWalletsKit.disconnect()
    onDisconnect()
    setErrorMsg(null)
  }

  return (
    <div className="wallet-connect">
      {address ? (
        <div className="wallet-connected">
          <span className="wallet-address" title={address}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <button className="wallet-button wallet-button--ghost" onClick={handleDisconnect} type="button">
            <LogOut size={15} />
            Disconnect
          </button>
        </div>
      ) : (
        <button className="wallet-button" onClick={handleConnect} disabled={loading} type="button">
          <Wallet size={15} />
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
      {errorMsg && <p className="wallet-error">{errorMsg}</p>}
    </div>
  )
}
