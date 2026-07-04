import {
  rpc as SorobanRpc,
  Horizon,
  Asset,
  TransactionBuilder,
  BASE_FEE,
  Operation,
  Memo,
} from '@stellar/stellar-sdk'

export const NETWORK = import.meta.env.VITE_STELLAR_NETWORK as string
export const RPC_URL = import.meta.env.VITE_STELLAR_RPC_URL as string
export const NETWORK_PASSPHRASE = import.meta.env.VITE_NETWORK_PASSPHRASE as string
export const SUBSCRIPTION_CONTRACT_ID = import.meta.env.VITE_SUBSCRIPTION_CONTRACT_ID as string
export const CONTENT_GATE_CONTRACT_ID = import.meta.env.VITE_CONTENT_GATE_CONTRACT_ID as string

export const HORIZON_URL = 'https://horizon-testnet.stellar.org'

export const rpc = new SorobanRpc.Server(RPC_URL, { allowHttp: false })
export const horizon = new Horizon.Server(HORIZON_URL)

/** Fetch XLM balance for an address. Returns '0' if account not found. */
export async function fetchXlmBalance(address: string): Promise<string> {
  try {
    const account = await horizon.loadAccount(address)
    const native = account.balances.find(
      (b): b is Horizon.HorizonApi.BalanceLine<'native'> => b.asset_type === 'native'
    )
    return native ? parseFloat(native.balance).toFixed(4) : '0.0000'
  } catch {
    return '0.0000'
  }
}

/** Send XLM from `from` address to `to` using signed transaction XDR.
 *  Returns tx hash on success.
 */
export async function sendXlm(
  fromAddress: string,
  toAddress: string,
  amount: string,
  signTransaction: (xdr: string) => Promise<string>
): Promise<string> {
  const account = await horizon.loadAccount(fromAddress)
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: toAddress,
        asset: Asset.native(),
        amount,
      })
    )
    .setTimeout(30)
    .addMemo(Memo.none())
    .build()

  const signedXdr = await signTransaction(tx.toEnvelope().toXDR('base64'))
  const result = await horizon.submitTransaction(
    TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  )
  return result.hash
}
