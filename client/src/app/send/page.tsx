"use client";

import * as React from "react";
import { useWallet } from "@/hooks/use-wallet";
import { useTransferStore } from "@/lib/stores/transfer-store";
import { useCreateTransfer } from "@/hooks/use-transfers";
import { KycCard } from "@/components/kyc/kyc-card";
import { SendForm } from "@/components/transfer/send-form";
import { ReviewTransfer } from "@/components/transfer/review-transfer";
import { TransferStatus } from "@/components/transfer/transfer-status";
import { Button } from "@/components/ui/button";
import { Wallet, Shield, Send as SendIcon, CheckCircle2, ArrowRight } from "lucide-react";

type SendStep = "kyc" | "form" | "review" | "status";

export default function SendPage() {
  const wallet = useWallet();
  const store = useTransferStore();
  const createTransfer = useCreateTransfer();
  const [step, setStep] = React.useState<SendStep>("kyc");

  React.useEffect(() => {
    if (store.transactionStatus === "success" || store.transactionStatus === "error") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep("status");
    }
  }, [store.transactionStatus]);

  const handleKycComplete = () => {
    setStep("form");
  };

  const handleReview = () => {
    setStep("review");
  };

  const handleBackToForm = () => {
    setStep("form");
  };

  const handleConfirm = async () => {
    try {
      await createTransfer.mutateAsync({
        recipient: store.recipientAddress,
        sourceAsset: store.sourceAsset,
        destAsset: store.destAsset,
        sourceAmount: store.sourceAmount,
        destAmount: store.getDestAmount(),
        exchangeRate: store.exchangeRate,
        feeBps: store.feeBps,
      });
      setStep("status");
    } catch {
      setStep("status");
    }
  };

  const handleReset = () => {
    store.resetTransaction();
    store.resetForm();
    setStep("kyc");
  };

  if (!wallet.isConnected) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20">
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mx-auto mb-6">
            <Wallet className="h-8 w-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Send Money</h1>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Connect your wallet to start sending cross-border remittances on Stellar.
          </p>
          <Button onClick={() => wallet.connect()} loading={wallet.isLoading} size="lg">
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  const steps: { key: SendStep; label: string; icon: React.ReactNode }[] = [
    { key: "kyc", label: "KYC", icon: <Shield className="h-4 w-4" /> },
    { key: "form", label: "Details", icon: <SendIcon className="h-4 w-4" /> },
    { key: "review", label: "Review", icon: <CheckCircle2 className="h-4 w-4" /> },
    { key: "status", label: "Result", icon: <ArrowRight className="h-4 w-4" /> },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Send Money</h1>
        <p className="text-gray-400 mt-1">Cross-border remittance on Stellar</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <button
              onClick={() => {
                if (i < stepIndex && step !== "status") setStep(s.key);
              }}
              disabled={step === "status" || i > stepIndex}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                i === stepIndex
                  ? "bg-cyan-600/20 text-cyan-400 border border-cyan-600/30"
                  : i < stepIndex
                  ? "text-emerald-400 hover:bg-white/5 cursor-pointer"
                  : "text-gray-600 cursor-not-allowed"
              }`}
            >
              {s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 rounded-full ${
                i < stepIndex ? "bg-emerald-600" : "bg-white/10"
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      {step === "kyc" && (
        <div className="space-y-6">
          <KycCard />
          {store.kycVerified && (
            <div className="flex justify-center">
              <Button onClick={handleKycComplete} size="lg">
                Continue to Send Form
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}

      {step === "form" && <SendForm onReview={handleReview} />}

      {step === "review" && (
        <ReviewTransfer
          onConfirm={handleConfirm}
          onBack={handleBackToForm}
          loading={createTransfer.isPending}
        />
      )}

      {step === "status" && <TransferStatus onReset={handleReset} />}
    </div>
  );
}
