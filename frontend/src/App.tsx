import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import WalletConnect from './components/WalletConnect'
import SubscribeForm from './components/SubscribeForm'
import ContentPage from './components/ContentPage'
import Balance from './components/Balance'
import { checkAccess, isActive } from './lib/contracts'
import './App.css'

type View = 'overview' | 'mint' | 'content'

type AccessState = {
  loading: boolean
  subscriptionActive: boolean | null
  contentAccess: boolean | null
}

const overviewSteps = [
  {
    badge: 'NOW',
    title: 'Connect wallet',
    copy: 'Click Connect Wallet and approve the session in Freighter or your preferred Stellar wallet.',
  },
  {
    badge: 'NEXT',
    title: 'Mint pass',
    copy: 'Choose a duration, sign the subscribe transaction, and mint a time-locked access pass on-chain.',
  },
  {
    badge: 'NEXT',
    title: 'Unlock content',
    copy: 'The gate checks the contract in real time, so premium content appears only when the pass is active.',
  },
]

const benefitCards = [
  {
    title: 'No middlemen',
    copy: 'Fans pay the creator directly through a smart contract instead of a subscription platform taking a cut.',
  },
  {
    title: 'Micro-subscriptions',
    copy: 'Stellar fees stay tiny, so short passes like 3 or 30 days remain practical and profitable.',
  },
  {
    title: 'No surprise renewals',
    copy: 'The pass is time-locked once, so users know exactly what they bought with no recurring billing.',
  },
  {
    title: 'Universal access',
    copy: 'Any app can read the public blockchain and check whether a wallet still has active access.',
  },
]

export default function App() {
  const [address, setAddress] = useState<string | null>(null)
  const [view, setView] = useState<View>('overview')
  const [refreshToken, setRefreshToken] = useState(0)
  const [access, setAccess] = useState<AccessState>({
    loading: false,
    subscriptionActive: null,
    contentAccess: null,
  })

  const accessGranted = access.subscriptionActive === true && access.contentAccess === true

  useEffect(() => {
    if (!address) {
      setAccess({
        loading: false,
        subscriptionActive: null,
        contentAccess: null,
      })
      return
    }

    let cancelled = false
    setAccess(prev => ({ ...prev, loading: true }))

    Promise.all([isActive(address), checkAccess(address)])
      .then(([subscriptionActive, contentAccess]) => {
        if (cancelled) return
        setAccess({
          loading: false,
          subscriptionActive,
          contentAccess,
        })
      })
      .catch(() => {
        if (cancelled) return
        setAccess({
          loading: false,
          subscriptionActive: false,
          contentAccess: false,
        })
      })

    return () => {
      cancelled = true
    }
  }, [address, refreshToken])

  const handleConnect = (nextAddress: string) => {
    setAddress(nextAddress)
  }

  const handleDisconnect = () => {
    setAddress(null)
    setView('overview')
    setAccess({
      loading: false,
      subscriptionActive: null,
      contentAccess: null,
    })
  }

  const handleMintSuccess = () => {
    setRefreshToken(value => value + 1)
    setView('content')
  }

  const handleUnlockClick = () => {
    setView('content')
  }

  return (
    <div className="app-shell">
      <div className="app-shell__backdrop" aria-hidden="true" />
      <div className="app-shell__grid" aria-hidden="true" />
      <div className="app-shell__glow app-shell__glow--left" aria-hidden="true" />
      <div className="app-shell__glow app-shell__glow--right" aria-hidden="true" />

      <header className="site-header">
        <div className="site-header__inner">
          <button className="brand" onClick={() => setView('overview')} type="button" aria-label="NovaPass home">
            <span className="brand__mark">
              <img className="brand__logo" src="/novapass-logo.png" alt="" aria-hidden="true" />
            </span>
            <span className="brand__text">NovaPass</span>
          </button>

          <nav className="nav-pills" aria-label="Primary">
            <button
              type="button"
              className={view === 'overview' ? 'nav-pill is-active' : 'nav-pill'}
              onClick={() => setView('overview')}
            >
              Dashboard
            </button>
            <button
              type="button"
              className={view === 'mint' ? 'nav-pill is-active' : 'nav-pill'}
              onClick={() => setView('mint')}
            >
              Mint Pass
            </button>
            <button
              type="button"
              className={view === 'content' ? 'nav-pill nav-pill--highlight is-active' : 'nav-pill nav-pill--highlight'}
              onClick={handleUnlockClick}
            >
              Unlock Content
            </button>
          </nav>

          <div className="site-header__wallet">
            <WalletConnect address={address} onConnect={handleConnect} onDisconnect={handleDisconnect} />
          </div>
        </div>
      </header>

      <main className={`page-body page-body--${view}`}>
        {view === 'overview' && (
          <>
            <section className="hero-grid">
              <div className="hero-copy">
                <span className="eyebrow">NovaPass - Stellar</span>
                <h1 className="hero-title">
                  Connect.
                  <br />
                  Mint.
                  <br />
                  Unlock premium access.
                </h1>
                <p className="hero-description">
                  This app mints a time-locked access pass on Stellar. The blockchain handles verification and expiry, so users get a simple one-time flow and creators keep the relationship direct.
                </p>
                <p className="hero-note">
                  Use the Connect Wallet button in the header to start. After that the dashboard will show your balance, access status, and subscription controls.
                </p>

                <div className="hero-meta">
                  <div className="hero-meta__item">
                    <span>Flow</span>
                    <strong>Connect → Mint → Unlock</strong>
                  </div>
                  <div className="hero-meta__item">
                    <span>Ledger</span>
                    <strong>On-chain verification</strong>
                  </div>
                  <div className="hero-meta__item">
                    <span>Expiry</span>
                    <strong>Auto-locked access</strong>
                  </div>
                </div>

                <div className="hero-actions">
                  <button type="button" className="action-button" onClick={() => setView('mint')}>
                    Mint pass
                    <ArrowRight size={16} />
                  </button>
                  <button type="button" className="action-button action-button--ghost" onClick={handleUnlockClick}>
                    Unlock content
                  </button>
                </div>
              </div>

              <div className="story-panel glass-card">
                <div className="section-intro section-intro--tight">
                  <div>
                    <span className="eyebrow">Connect / Mint / Unlock</span>
                    <h2>Three steps, one clean story.</h2>
                  </div>
                </div>

                <div className="step-stack">
                  {overviewSteps.map((step, index) => (
                    <article className="step-card" key={step.title} style={{ animationDelay: String(index * 120) + 'ms' }}>
                      <span className={index === 0 ? 'step-badge step-badge--now' : 'step-badge step-badge--next'}>
                        {step.badge}
                      </span>
                      <div>
                        <h3>{step.title}</h3>
                        <p>{step.copy}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="benefit-section">
              <div className="section-intro benefit-section__intro">
                <div>
                  <span className="eyebrow">Why this matters</span>
                  <h2>Why this matters</h2>
                </div>
              </div>

              <div className="benefit-grid">
                {benefitCards.map((card, index) => (
                  <article className="benefit-card glass-card" key={card.title} style={{ animationDelay: String(index * 90) + 'ms' }}>
                    <h3>{card.title}</h3>
                    <p>{card.copy}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {view === 'mint' && (
          <section className="mint-layout">
            <div className="mint-panel glass-card">
              <button type="button" className="back-link" onClick={() => setView('overview')}>
                Back
              </button>
              <span className="eyebrow">Mint Pass</span>
              <h2>Issue the time-locked pass.</h2>
              <p>
                Enter the duration you want, then sign the subscribe transaction.
              </p>
              <SubscribeForm address={address} onSuccess={handleMintSuccess} />
            </div>

            <aside className="mint-aside">
              <div className="side-card glass-card">
                <span className="eyebrow">Flow summary</span>
                <h3>What happens next</h3>
                <ul>
                  <li>Connect your Stellar wallet.</li>
                  <li>Pick a pass duration and sign once.</li>
                  <li>The contract updates the access state automatically.</li>
                </ul>
              </div>

              <div className="side-card glass-card">
                <span className="eyebrow">Current access</span>
                <h3>{access.loading ? 'Checking...' : accessGranted ? 'Pass active' : 'No active pass'}</h3>
                <p>
                  {address
                    ? 'The app checks the subscription and content gate in real time.'
                    : 'Connect a wallet to see the access state and mint controls.'}
                </p>
                {address && <Balance address={address} refreshTrigger={refreshToken} />}
                <button type="button" className="action-button action-button--ghost action-button--block" onClick={() => setView('content')}>
                  Open content view
                </button>
              </div>
            </aside>
          </section>
        )}

        {view === 'content' && (
          <ContentPage
            address={address}
            loading={access.loading}
            hasAccess={accessGranted}
            onBack={() => setView('overview')}
            onMintPass={() => setView('mint')}
          />
        )}
      </main>
    </div>
  )
}
