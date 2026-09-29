'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AntechamberModal, CheckoutPhase } from '@/components/AntechamberModal';
import { BluntEmbed } from '@/components/checkout/BluntEmbed';

interface CheckoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OrderData {
  orderId: string;
  amountUsd: number;
  publicKey: string;
  chains: string[];
  courseId: string;
}

const SESSION_KEY = 'chad_kermit_order_session';

export function CheckoutSheet({ isOpen, onClose }: CheckoutSheetProps) {
  const [phase, setPhase] = useState<CheckoutPhase>('idle');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up polling on unmount or close
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  // Reset state when drawer closes
  const handleClose = useCallback(() => {
    if (phase === 'confirming') return; // Esc key lock during on-chain settlement
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    onClose();
  }, [phase, onClose]);

  const pollOrderStatus = useCallback((orderId: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.fulfilled || data.status === 'fulfilled') {
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          setPhase('fulfilled');
        }
      } catch (err) {
        console.error('[checkout] polling error', err);
      }
    }, 2500);
  }, []);

  const handleStartCheckout = async () => {
    // Validate email
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email address to receive your access link.');
      return;
    }
    setEmailError(null);
    setIsPreparing(true);
    setErrorMessage(null);

    try {
      let sessionId = typeof window !== 'undefined' ? window.sessionStorage.getItem(SESSION_KEY) : null;
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(SESSION_KEY, sessionId);
        }
      }

      const res = await fetch('/api/blunt/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        throw new Error('Failed to initialize order');
      }

      const data = await res.json();
      setOrderData({
        orderId: data.orderId,
        amountUsd: data.amountUsd,
        publicKey: data.publicKey,
        chains: data.chains,
        courseId: data.courseId,
      });

      setPhase('checkout');
    } catch (err) {
      console.error('[checkout] creation failed', err);
      setErrorMessage('Could not initialize checkout. Please check your connection and retry.');
      setPhase('error');
    } finally {
      setIsPreparing(false);
    }
  };

  const handlePaymentSubmitted = () => {
    setPhase('confirming');
    if (orderData?.orderId) {
      pollOrderStatus(orderData.orderId);
    }
  };

  const handleWidgetClosed = () => {
    if (phase === 'checkout') {
      setPhase('idle');
    }
  };

  const handleLoadError = (msg: string) => {
    setErrorMessage(msg);
    setPhase('error');
  };

  return (
    <AntechamberModal
      isOpen={isOpen}
      onClose={handleClose}
      onStartCheckout={handleStartCheckout}
      isPreparing={isPreparing}
      phase={phase}
      errorMessage={errorMessage}
      email={email}
      onEmailChange={setEmail}
      emailError={emailError}
      embedSlot={
        orderData ? (
          <BluntEmbed
            orderId={orderData.orderId}
            amountUsd={orderData.amountUsd}
            publicKey={orderData.publicKey}
            chains={orderData.chains}
            email={email}
            courseId={orderData.courseId}
            onPaymentSubmitted={handlePaymentSubmitted}
            onWidgetClosed={handleWidgetClosed}
            onLoadError={handleLoadError}
          />
        ) : null
      }
    />
  );
}
