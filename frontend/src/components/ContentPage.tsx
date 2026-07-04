import { ArrowLeft, BadgeCheck, BookOpen, ChartColumn, Clapperboard, LockKeyhole, MessageSquare } from 'lucide-react'

interface ContentPageProps {
  address: string | null
  loading: boolean
  hasAccess: boolean
  onBack: () => void
  onMintPass: () => void
}

const premiumCards = [
  {
    icon: <BookOpen size={22} />,
    title: 'Exclusive Research Report',
    copy: 'Deep-dive analysis on Soroban smart contract architecture and the economics of subscription transactions on Stellar.',
    cta: 'Read Now',
  },
  {
    icon: <Clapperboard size={22} />,
    title: 'Masterclass: Building on Soroban',
    copy: 'Step-by-step video walkthrough covering writing, testing, and deploying production-grade Soroban contracts.',
    cta: 'Watch Now',
  },
  {
    icon: <ChartColumn size={22} />,
    title: 'Live Market Data Feed',
    copy: 'Real-time Stellar network metrics, validator data, and DEX liquidity analytics updated every block.',
    cta: 'View Dashboard',
  },
  {
    icon: <MessageSquare size={22} />,
    title: 'Private Community Access',
    copy: 'Join the subscriber-only channel for early feature access, governance votes, and direct creator Q&A.',
    cta: 'Join Community',
  },
]

export default function ContentPage({ address, loading, hasAccess, onBack, onMintPass }: ContentPageProps) {
  const locked = !hasAccess

  return (
    <section className="content-page">
      <div className="content-page__header">
        <div>
          <button type="button" className="back-link" onClick={onBack}>
            <ArrowLeft size={15} />
            Back
          </button>
          <span className="eyebrow">Exclusive Content</span>
          <h2>Content unlocked by the pass.</h2>
          <p>Access verified on-chain via ContentGate contract.</p>
        </div>
        <div className={locked ? 'content-page__access content-page__access--locked' : 'content-page__access'}>
          {hasAccess ? <BadgeCheck size={16} /> : <LockKeyhole size={16} />}
          <span>{loading ? 'Checking access' : hasAccess ? 'Access Granted' : 'Access Locked'}</span>
        </div>
      </div>

      <div className={locked ? 'access-banner access-banner--locked' : 'access-banner'}>
        <div className="access-banner__title">
          {hasAccess ? <BadgeCheck size={16} /> : <LockKeyhole size={16} />}
          {loading ? 'Checking access...' : hasAccess ? 'Access Granted' : 'Access Locked'}
        </div>
        <span className="access-banner__copy">
          {hasAccess
            ? 'Your on-chain pass is active'
            : address
              ? 'Mint a pass to unlock the cards below'
              : 'Connect a wallet and mint a pass to open the library'}
        </span>
      </div>

      <div className="content-grid">
        {premiumCards.map(card => (
          <article className={locked ? 'content-card content-card--locked' : 'content-card'} key={card.title}>
            <div className="content-card__topline">
              <div className="content-card__icon">{card.icon}</div>
              <span className={locked ? 'content-card__tag content-card__tag--locked' : 'content-card__tag'}>
                {locked ? 'Protected' : 'Included'}
              </span>
            </div>
            <h3>{card.title}</h3>
            <p>{card.copy}</p>
            <div className="content-card__footer">
              <button className="content-card__button" disabled={locked} type="button" onClick={locked ? onMintPass : undefined}>
                {locked ? 'Locked' : card.cta}
              </button>
              <span className="content-card__hint">{locked ? 'Mint pass to unlock' : 'Available now'}</span>
            </div>
            {locked && <div className="content-card__veil" />}
          </article>
        ))}
      </div>

      {locked && (
        <div className="unlock-panel glass-card">
          <div>
            <span className="eyebrow">Not yet unlocked</span>
            <h3>Mint a pass to reveal the library.</h3>
            <p>
              Once the subscription contract reports an active pass, the cards above become live automatically.
            </p>
          </div>
          <button type="button" className="action-button" onClick={onMintPass}>
            Mint pass
          </button>
        </div>
      )}
    </section>
  )
}
