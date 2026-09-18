import './Footer.css';

/** Reusable product footer for the Tierra Automation platform. */
export default function Footer({ version = 'v1.0.0' }) {
  return (
    <footer className="product-footer" aria-label="Tierra Automation footer">
      <div className="product-footer__gradient" />
      <div className="product-footer__main">
        <div className="product-footer__brand">
          <img className="product-footer__logo" src="/brand/tierra-logo.jpeg" alt="Tierra Automation" />
          <div>
            <p className="product-footer__eyebrow">Powered by</p>
            <p className="product-footer__name">Tierra <span>Automation</span></p>
          </div>
        </div>
        <div className="product-footer__meta">
          <nav className="product-footer__nav" aria-label="Footer navigation">
            <a href="#support">Support</a>
            <a href="#documentation">Documentation</a>
            <a href="#privacy">Privacy</a>
          </nav>
          <span className="product-footer__divider" aria-hidden="true" />
          <p className="product-footer__copyright">© 2026 Tierra Automation. All rights reserved.</p>
        </div>
      </div>
      <div className="product-footer__bottom">
        <span className="product-footer__status"><i aria-hidden="true" />System Online</span>
        <span className="product-footer__version">{version}</span>
      </div>
    </footer>
  );
}
