export type AppErrorType = 'WalletNotFound' | 'UserRejected' | 'InsufficientBalance' | 'Unknown'

export interface AppError {
  type: AppErrorType
  message: string
}

export function classifyError(err: unknown): AppError {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()

  if (
    lower.includes('wallet not found') ||
    lower.includes('freighter not') ||
    lower.includes('wallet extension') ||
    lower.includes('not installed') ||
    lower.includes('no wallet')
  ) {
    return { type: 'WalletNotFound', message: 'Wallet extension not found. Please install Freighter.' }
  }

  if (
    lower.includes('user rejected') ||
    lower.includes('user declined') ||
    lower.includes('cancelled') ||
    lower.includes('canceled') ||
    lower.includes('rejected by user') ||
    lower.includes('transaction was rejected')
  ) {
    return { type: 'UserRejected', message: 'Transaction was rejected by the user.' }
  }

  if (
    lower.includes('insufficient') ||
    lower.includes('not enough') ||
    lower.includes('underfunded') ||
    lower.includes('balance too low')
  ) {
    return { type: 'InsufficientBalance', message: 'Insufficient XLM balance to complete this transaction.' }
  }

  return { type: 'Unknown', message: msg }
}

export function errorLabel(type: AppErrorType): string {
  switch (type) {
    case 'WalletNotFound':
      return 'Wallet Not Found'
    case 'UserRejected':
      return 'Transaction Rejected'
    case 'InsufficientBalance':
      return 'Insufficient Balance'
    default:
      return 'Error'
  }
}