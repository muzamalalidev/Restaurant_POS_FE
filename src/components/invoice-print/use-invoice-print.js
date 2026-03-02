'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Hook to trigger print of an invoice payload.
 * Parent must render InvoicePrintLayout in a hidden div when invoicePrintPayload is set (see plan: print root).
 * When triggerPrint(payload) is called, payload is set; effect runs window.print() and cleans up on afterprint.
 *
 * @returns {{ invoicePrintPayload: Object|null, triggerPrint: (payload: Object) => void, isPrinting: boolean }}
 */
export function useInvoicePrint() {
  const [invoicePrintPayload, setInvoicePrintPayload] = useState(null);
  const isPrintingRef = useRef(false);

  const triggerPrint = useCallback((payload) => {
    if (!payload) return;
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;
    setInvoicePrintPayload(payload);
  }, []);

  useEffect(() => {
    if (!invoicePrintPayload) {
      return undefined;
    }

    const handleAfterPrint = () => {
      isPrintingRef.current = false;
      setInvoicePrintPayload(null);
      window.removeEventListener('afterprint', handleAfterPrint);
    };

    window.addEventListener('afterprint', handleAfterPrint);

    const timeoutFallback = setTimeout(() => {
      if (isPrintingRef.current) {
        isPrintingRef.current = false;
        setInvoicePrintPayload(null);
        window.removeEventListener('afterprint', handleAfterPrint);
      }
    }, 5000);

    try {
      window.print();
    } catch {
      isPrintingRef.current = false;
      setInvoicePrintPayload(null);
      window.removeEventListener('afterprint', handleAfterPrint);
    }

    return () => {
      clearTimeout(timeoutFallback);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [invoicePrintPayload]);

  return {
    invoicePrintPayload,
    triggerPrint,
    isPrinting: Boolean(invoicePrintPayload),
  };
}
