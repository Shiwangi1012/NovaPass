import {
  Contract,
  TransactionBuilder,
  rpc as SorobanRpc,
  xdr,
  Address,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk'
import { rpc, NETWORK_PASSPHRASE, SUBSCRIPTION_CONTRACT_ID, CONTENT_GATE_CONTRACT_ID } from './stellar'

const TIMEOUT = 30

/** Build, simulate, sign and submit a Soroban contract invocation.
 *  Returns the tx hash on success.
 */
async function invokeContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  callerAddress: string,
  signTransaction: (xdr: string) => Promise<string>
): Promise<string> {
  const account = await rpc.getAccount(callerAddress)
  const contract = new Contract(contractId)

  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(TIMEOUT)
    .build()

  const simResult = await rpc.simulateTransaction(tx)
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(simResult.error)
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build()
  const signedXdr = await signTransaction(preparedTx.toEnvelope().toXDR('base64'))

  const { TransactionBuilder: TB } = await import('@stellar/stellar-sdk')
  const signedTx = TB.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  const sendResult = await rpc.sendTransaction(signedTx)

  if (sendResult.status === 'ERROR') {
    throw new Error(sendResult.errorResult?.toXDR('base64') ?? 'Transaction failed')
  }

  // Poll for finality
  const hash = sendResult.hash
  let getResult = await rpc.getTransaction(hash)
  let attempts = 0
  while (
    getResult.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND &&
    attempts < 20
  ) {
    await new Promise(r => setTimeout(r, 2000))
    getResult = await rpc.getTransaction(hash)
    attempts++
  }

  if (getResult.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
    throw new Error('Transaction failed on-chain')
  }

  return hash
}

/** Read-only simulation — returns the ScVal result without submitting. */
async function simulateRead(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  callerAddress: string
): Promise<xdr.ScVal | undefined> {
  const account = await rpc.getAccount(callerAddress)
  const contract = new Contract(contractId)

  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(TIMEOUT)
    .build()

  const simResult = await rpc.simulateTransaction(tx)
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(simResult.error)
  }
  return (simResult as SorobanRpc.Api.SimulateTransactionSuccessResponse).result?.retval
}

/** Mint a time-locked subscription pass. */
export async function subscribe(
  subscriberAddress: string,
  durationDays: number,
  signTransaction: (xdr: string) => Promise<string>
): Promise<string> {
  const args = [
    new Address(subscriberAddress).toScVal(),
    nativeToScVal(BigInt(durationDays), { type: 'u64' }),
  ]
  return invokeContract(SUBSCRIPTION_CONTRACT_ID, 'subscribe', args, subscriberAddress, signTransaction)
}

/** Check if an address has an active subscription pass. */
export async function isActive(address: string): Promise<boolean> {
  // Use a dummy "read" account – just need any funded account; use the address itself
  try {
    const result = await simulateRead(
      SUBSCRIPTION_CONTRACT_ID,
      'is_active',
      [new Address(address).toScVal()],
      address
    )
    if (!result) return false
    return scValToNative(result) as boolean
  } catch {
    return false
  }
}

/** Cross-contract: ContentGate.check_access → SubscriptionContract.is_active */
export async function checkAccess(userAddress: string): Promise<boolean> {
  try {
    const result = await simulateRead(
      CONTENT_GATE_CONTRACT_ID,
      'check_access',
      [new Address(userAddress).toScVal()],
      userAddress
    )
    if (!result) return false
    return scValToNative(result) as boolean
  } catch {
    return false
  }
}

/** Admin-only: cancel a subscriber's pass. */
export async function cancel(
  adminAddress: string,
  subscriberAddress: string,
  signTransaction: (xdr: string) => Promise<string>
): Promise<string> {
  const args = [new Address(subscriberAddress).toScVal()]
  return invokeContract(SUBSCRIPTION_CONTRACT_ID, 'cancel', args, adminAddress, signTransaction)
}

/** Fetch recent subscribe events from the contract.
 *  Returns array of { subscriber, expiryLedger, timestamp }.
 */
export interface SubscribeEvent {
  subscriber: string
  expiryLedger: number
  timestamp: string
}

export async function fetchSubscribeEvents(
  latestLedger: number
): Promise<SubscribeEvent[]> {
  try {
    const response = await rpc.getEvents({
      startLedger: Math.max(1, latestLedger - 4000),
      filters: [
        {
          type: 'contract',
          contractIds: [SUBSCRIPTION_CONTRACT_ID],
          topics: [['*', '*']],
        },
      ],
      limit: 50,
    })

    return response.events
      .filter(e => {
        try {
          const topicVal = e.topic[0]
          if (!topicVal) return false
          return scValToNative(topicVal) === 'subscribe'
        } catch {
          return false
        }
      })
      .map(e => {
        let subscriber = 'unknown'
        try {
          subscriber = scValToNative(e.topic[1]) as string
        } catch {}
        let expiryLedger = 0
        try {
          expiryLedger = Number(scValToNative(e.value))
        } catch {}
        return {
          subscriber,
          expiryLedger,
          timestamp: new Date().toISOString(),
        }
      })
  } catch {
    return []
  }
}

export async function getLatestLedger(): Promise<number> {
  try {
    const resp = await rpc.getLatestLedger()
    return resp.sequence
  } catch {
    return 0
  }
}
