import { ExternalLink, Users } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-12 bg-muted/20">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              JobConnect Pro
            </span>
          </div>

          <div className="text-center">
            <Link href="https://tytantech.co.ke" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/80 hover:text-primary hover:underline transition-colors group inline-flex items-center gap-1">
              <span>Powered by TytanTech</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>

          <div className="text-center md:text-right">
            <p className="text-muted-foreground/80">
              &copy; {new Date().getFullYear()} JobConnect Pro. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground/80 mt-1">Connecting talent with opportunity.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}