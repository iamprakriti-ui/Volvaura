import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      data-testid="site-footer"
      className="relative border-t border-white/5 bg-[#050505] px-6 pb-14 pt-24"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-1 gap-14 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
              /agency — est. 2026
            </div>
            <h3 className="mt-4 font-display text-4xl leading-[0.95] tracking-tight text-white md:text-6xl">
              The cut is
              <br />
              <span className="italic text-white/70">everything.</span>
            </h3>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/60">
              Volvaura curates the top 1% of editors and pairs them with
              creators who refuse to blend in.
            </p>
            <Link
              to="/register"
              data-testid="footer-cta"
              className="btn-violet mt-8"
            >
              Join Volvaura →
            </Link>
          </div>

          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
              Platform
            </div>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li><Link className="hover:text-white" to="/editors">Browse editors</Link></li>
              <li><Link className="hover:text-white" to="/how-it-works">How it works</Link></li>
              <li><Link className="hover:text-white" to="/register">For creators</Link></li>
              <li><Link className="hover:text-white" to="/register">For editors</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
              Company
            </div>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li><Link className="hover:text-white" to="/about">About</Link></li>
              <li><Link className="hover:text-white" to="/contact">Contact</Link></li>
              <li><Link className="hover:text-white" to="/faq">FAQ</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-8 text-xs text-white/40 md:flex-row md:items-center">
          <div className="font-mono uppercase tracking-widest">
            © 2026 Volvaura Agency — All rights reserved
          </div>
          <div className="font-mono uppercase tracking-widest">
            Made for creators who refuse to blend in.
          </div>
        </div>
      </div>
    </footer>
  );
}
