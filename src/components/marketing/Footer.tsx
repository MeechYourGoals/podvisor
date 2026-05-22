import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="border-t border-border mt-12">
      <div className="container max-w-6xl py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2">
            <span className="text-[17px] font-semibold tracking-tight">
              Pod<span className="text-primary">visor</span>
            </span>
            <p className="text-footnote text-muted-foreground mt-2 max-w-sm">
              Personalized insights from any video or audio. Built for people who learn from long-form content.
            </p>
          </div>

          <div>
            <h3 className="text-caption font-semibold uppercase tracking-wider text-muted-foreground mb-3">Product</h3>
            <ul className="space-y-2 text-footnote">
              <li><a href="#try" className="hover:text-primary transition-colors">Try free</a></li>
              <li><Link to="/auth" className="hover:text-primary transition-colors">Sign in</Link></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-caption font-semibold uppercase tracking-wider text-muted-foreground mb-3">Company</h3>
            <ul className="space-y-2 text-footnote">
              <li><a href="mailto:hello@podvisor.app" className="hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-border text-caption text-muted-foreground">
          <p>© {new Date().getFullYear()} Podvisor. All rights reserved.</p>
          <p>Made for people who watch a lot.</p>
        </div>
      </div>
    </footer>
  );
};
