"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useWallet } from "@/hooks/use-wallet";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/sheet";
import { WalletStatus } from "@/components/wallet/wallet-status";
import { ConnectWallet } from "@/components/wallet/connect-wallet";
import {
  Send,
  Activity,
  LayoutDashboard,
  Home,
  ArrowLeftRight,
  Menu,
  Zap,
  Shield,
  Settings,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/send", label: "Send", icon: Send },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/operator", label: "Operator", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
];


function Navbar() {
  const pathname = usePathname();
  const wallet = useWallet();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0a0f1a]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600/20 border border-cyan-600/30 group-hover:bg-cyan-600/30 transition-colors">
              <Zap className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white tracking-tight leading-none">
                SEND BRIDGE
              </span>
              <span className="text-[10px] text-gray-500 tracking-widest uppercase">
                Stellar Remittance
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "text-cyan-400 bg-cyan-400/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Badge variant="default" className="text-[10px] uppercase tracking-wider">
            Testnet
          </Badge>
          {wallet.isConnected ? <WalletStatus /> : <ConnectWallet />}
        </div>

        <button
          className="md:hidden rounded-lg p-2 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen} side="right">
        <div className="flex flex-col gap-1 mb-6">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "text-cyan-400 bg-cyan-400/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="border-t border-white/10 pt-4">
          {wallet.isConnected ? (
            <WalletStatus />
          ) : (
            <ConnectWallet />
          )}
        </div>
        <div className="mt-3">
          <Badge variant="default" className="text-[10px] uppercase tracking-wider">
            Testnet
          </Badge>
        </div>
      </Sheet>
    </header>
  );
}

export { Navbar };
export default Navbar;
