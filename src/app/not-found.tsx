import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #F8F9FC 0%, #F1F1F1 100%)',
      padding: 32,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        {/* Decorative 404 */}
        <div style={{
          fontSize: 120, fontWeight: 800,
          background: 'linear-gradient(135deg, #714B67 0%, #9B7695 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1, marginBottom: 8, letterSpacing: '-4px',
        }}>
          404
        </div>

        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#F3EFF2', border: '1px solid #D4C3D0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#714B67" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            <path d="M8 11h6"/>
          </svg>
        </div>

        <h1 style={{
          fontSize: 24, fontWeight: 700, color: '#212529',
          marginBottom: 8, letterSpacing: '-.3px',
        }}>
          Page introuvable
        </h1>

        <p style={{
          fontSize: 14, color: '#888', lineHeight: 1.7,
          marginBottom: 32, maxWidth: 360, margin: '0 auto 32px',
        }}>
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
          Vérifiez l&apos;URL ou revenez à l&apos;accueil.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="o-btn o-btn-primary o-btn-lg" style={{ fontSize: 14, padding: '10px 24px' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Retour à l&apos;accueil
          </Link>
          <Link href="/halls" className="o-btn o-btn-secondary o-btn-lg" style={{ fontSize: 14, padding: '10px 24px' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
            Parcourir les salles
          </Link>
        </div>

        <div style={{
          marginTop: 40, padding: '14px 20px',
          background: '#F3EFF2', border: '1px solid #D4C3D0',
          borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: '#714B67', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#5E3D56' }}>Saha Event</span>
        </div>
      </div>
    </div>
  );
}
