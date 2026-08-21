"use client";

import Link from "next/link";
import {
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Clock,
  DollarSign,
  ArrowRightLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="relative">
      {/* Testnet Banner */}
      <div className="w-full bg-amber-500/10 border-b border-amber-500/20 py-2.5 text-center text-xs text-amber-400 flex items-center justify-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5" />
        Stellar Testnet Demo — Not a real-money remittance service
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-20 sm:pt-32 pb-20">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="default" className="mb-6 text-xs uppercase tracking-widest">
              ⚡ Stellar Powered
            </Badge>

            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              Send Money
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Across Borders
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-4 leading-relaxed">
              Fast, transparent and low-cost cross-border remittance
              powered by Stellar.
            </p>
            <p className="text-sm text-gray-500 max-w-xl mx-auto mb-10">
              SendBridge makes cross-border remittance simple with low-fee Stellar settlement
              and live transfer tracking. Built on Soroban smart contracts.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/send">
                <Button size="lg" className="px-8 text-base font-semibold">
                  Send Money
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="px-8 text-base">
                  Open Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-gray-400 text-center max-w-xl mx-auto mb-14">
            Three simple steps to send money across borders
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Connect & Verify",
                desc: "Connect your Stellar wallet and complete lightweight demo KYC verification.",
                icon: Shield,
              },
              {
                step: "02",
                title: "Enter Amount",
                desc: "Choose source and destination currencies, enter the amount to send.",
                icon: DollarSign,
              },
              {
                step: "03",
                title: "Sign & Track",
                desc: "Review the transfer, sign with your wallet, and track it live on-chain.",
                icon: Clock,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 hover:border-cyan-500/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <item.icon className="h-5 w-5 text-cyan-400" />
                  </div>
                  <span className="text-xs font-mono text-gray-500">
                    STEP {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Stellar */}
      <section className="py-20 border-t border-white/5 bg-gradient-to-b from-cyan-500/[0.02] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Why Stellar</h2>
          <p className="text-gray-400 text-center max-w-xl mx-auto mb-14">
            Built on the network designed for payments
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: "Fast Settlement",
                desc: "Transactions confirm in 3–5 seconds on Stellar.",
              },
              {
                icon: DollarSign,
                title: "Ultra-Low Fees",
                desc: "Transaction fees fractions of a cent.",
              },
              {
                icon: Globe,
                title: "Global Network",
                desc: "Send to anyone, anywhere on the Stellar network.",
              },
              {
                icon: Shield,
                title: "On-Chain Transparency",
                desc: "Every transfer is recorded on the public ledger.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
                  <item.icon className="h-5 w-5 text-cyan-400" />
                </div>
                <h3 className="font-semibold mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Currencies */}
      <section className="py-20 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Supported Remittance Corridors
          </h2>
          <p className="text-gray-400 text-center max-w-xl mx-auto mb-10">
            Multi-currency Stellar anchor settlement corridors with live Soroban exchange rate routing
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              { code: "SB-USD", label: "US Dollar", flag: "🇺🇸", symbol: "$" },
              { code: "SB-INR", label: "Indian Rupee", flag: "🇮🇳", symbol: "₹" },
              { code: "SB-EUR", label: "Euro", flag: "🇪🇺", symbol: "€" },
              { code: "SB-GBP", label: "British Pound", flag: "🇬🇧", symbol: "£" },
              { code: "SB-SGD", label: "Singapore Dollar", flag: "🇸🇬", symbol: "S$" },
              { code: "SB-AED", label: "UAE Dirham", flag: "🇦🇪", symbol: "د.إ" },
              { code: "SB-PHP", label: "Philippine Peso", flag: "🇵🇭", symbol: "₱" },
              { code: "SB-BRL", label: "Brazilian Real", flag: "🇧🇷", symbol: "R$" },
            ].map((asset) => (
              <div
                key={asset.code}
                className="flex items-center gap-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 hover:border-cyan-500/30 transition-all"
              >
                <span className="text-2xl">{asset.flag}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm">{asset.code}</p>
                    <span className="text-xs text-gray-500 font-mono">({asset.symbol})</span>
                  </div>
                  <p className="text-xs text-gray-400">{asset.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Security */}
      <section className="py-20 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-10 sm:p-14 text-center max-w-3xl mx-auto">
            <Shield className="h-12 w-12 text-cyan-400 mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Security First</h2>
            <p className="text-gray-400 leading-relaxed mb-6">
              Built on Soroban smart contracts with on-chain authorization.
              No private keys are ever exposed. KYC data never touches the blockchain.
              Every transfer is cryptographically signed and verified on the Stellar network.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-500">
              <span className="rounded-full bg-white/5 border border-white/10 px-4 py-1.5">
                Soroban Smart Contracts
              </span>
              <span className="rounded-full bg-white/5 border border-white/10 px-4 py-1.5">
                Wallet-based Auth
              </span>
              <span className="rounded-full bg-white/5 border border-white/10 px-4 py-1.5">
                On-Chain Attestation
              </span>
              <span className="rounded-full bg-white/5 border border-white/10 px-4 py-1.5">
                No Private Key Storage
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Send?
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Try SendBridge on Stellar Testnet. Connect your wallet and send your first cross-border transfer.
          </p>
          <Link href="/send">
            <Button size="lg" className="px-10 text-base font-semibold">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
