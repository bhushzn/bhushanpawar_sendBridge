"use client";

import * as React from "react";
import { useTransferStore } from "@/lib/stores/transfer-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  FileCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const COUNTRIES = [
  { value: "IN", label: "India" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "SG", label: "Singapore" },
  { value: "JP", label: "Japan" },
  { value: "DE", label: "Germany" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "BR", label: "Brazil" },
];

type KycState = "not_started" | "in_progress" | "verified" | "rejected";

function KycCard() {
  const store = useTransferStore();
  const [kycState, setKycState] = React.useState<KycState>(
    store.kycVerified ? "verified" : "not_started"
  );
  const [loading, setLoading] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [ageConfirmed, setAgeConfirmed] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [attestationHash, setAttestationHash] = React.useState("");

  const kycDerived: KycState = store.kycVerified ? "verified" : kycState;
  const effectiveState = kycDerived === "verified" ? "verified" : kycState;

  const canSubmit =
    fullName.trim().length >= 2 &&
    country &&
    ageConfirmed &&
    termsAccepted;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setKycState("in_progress");
    setLoading(true);

    // Simulate KYC verification (in production, operator sets on-chain)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const simulatedHash =
      "0x" +
      Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");

    setAttestationHash(simulatedHash);
    store.setKycVerified(true, simulatedHash);
    setKycState("verified");
    setLoading(false);
  };

  if (effectiveState === "verified") {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/20 border border-emerald-600/30">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-emerald-400">
                KYC Verified
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Your identity has been verified for this session.
              </p>
            </div>
            <Badge variant="success">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          </div>
          {attestationHash && (
            <div className="mt-4 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">
                Attestation Hash
              </label>
              <code className="text-xs text-gray-300 font-mono break-all">
                {attestationHash}
              </code>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (effectiveState === "rejected") {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/20 border border-red-600/30">
              <ShieldX className="h-6 w-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-400">
                Verification Rejected
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Please review your information and try again.
              </p>
            </div>
            <Badge variant="danger">Rejected</Badge>
          </div>
          <Button
            variant="secondary"
            onClick={() => setKycState("not_started")}
            className="mt-4 w-full"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-cyan-400" />
          KYC Verification
          <Badge variant="outline" className="text-[10px] ml-auto">
            Demo
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-cyan-600/10 border border-cyan-600/20 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-cyan-400/80">
            This is a demo verification. In production, KYC attestation is set
            by the operator on-chain.
          </p>
        </div>

        <Input
          label="Full Name"
          placeholder="Enter your full legal name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={loading}
        />

        <Select
          label="Country"
          options={COUNTRIES}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Select your country"
          disabled={loading}
        />

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              disabled={loading}
              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-600 focus:ring-cyan-400/50 focus:ring-offset-0"
            />
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
              I confirm that I am at least 18 years of age.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              disabled={loading}
              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-600 focus:ring-cyan-400/50 focus:ring-offset-0"
            />
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
              I agree to the terms of service and privacy policy.
            </span>
          </label>
        </div>

        <Separator />

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          loading={loading}
          className="w-full"
        >
          <FileCheck className="h-4 w-4" />
          {loading ? "Verifying..." : "Verify Identity"}
        </Button>
      </CardContent>
    </Card>
  );
}

export { KycCard };
