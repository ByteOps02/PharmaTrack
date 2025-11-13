import { useState, useEffect, useCallback } from 'react';

import { apiUrl } from '@/lib/api';
const API_BASE_URL = apiUrl('/api');

export interface InvoiceItem {
  id?: number;
  description: string;
  code?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: number;
  userId: string;
  patientId: number;
  appointmentId?: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'draft' | 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  notes?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface Payment {
  id: number;
  invoiceId: number;
  patientId: number;
  amount: number;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'insurance' | 'check' | 'online';
  paymentDate: string;
  transactionId?: string;
  notes?: string;
}

export interface InsuranceClaim {
  id: number;
  userId: string;
  patientId: number;
  invoiceId?: number;
  insuranceId: number;
  claimNumber: string;
  submissionDate: string;
  serviceDate: string;
  claimedAmount: number;
  approvedAmount?: number;
  paidAmount?: number;
  status: 'draft' | 'submitted' | 'pending' | 'approved' | 'denied' | 'partially_approved';
  diagnosisCodes?: string;
  procedureCodes?: string;
  notes?: string;
  denialReason?: string;
}

export interface InsuranceProvider {
  id: number;
  name: string;
  code: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  active: number;
}

export const useBilling = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [providers, setProviders] = useState<InsuranceProvider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/invoices`);
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const data: Invoice[] = await response.json();
      setInvoices(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments`);
      if (!response.ok) throw new Error('Failed to fetch payments');
      const data: Payment[] = await response.json();
      setPayments(data);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
    }
  }, []);

  const fetchClaims = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/insurance-claims`);
      if (!response.ok) throw new Error('Failed to fetch claims');
      const data: InsuranceClaim[] = await response.json();
      setClaims(data);
    } catch (err: any) {
      console.error('Error fetching claims:', err);
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/insurance-providers`);
      if (!response.ok) throw new Error('Failed to fetch providers');
      const data: InsuranceProvider[] = await response.json();
      setProviders(data);
    } catch (err: any) {
      console.error('Error fetching providers:', err);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchPayments();
    fetchClaims();
    fetchProviders();
  }, [fetchInvoices, fetchPayments, fetchClaims, fetchProviders]);

  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'paidAmount' | 'balanceAmount'>): Promise<Invoice | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });
      if (!response.ok) throw new Error('Failed to create invoice');
      const newInvoice: Invoice = await response.json();
      setInvoices((prev) => [...prev, newInvoice]);
      return newInvoice;
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating invoice:', err);
      return null;
    }
  };

  const addPayment = async (paymentData: Omit<Payment, 'id'>): Promise<Payment | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      if (!response.ok) throw new Error('Failed to record payment');
      const newPayment: Payment = await response.json();
      setPayments((prev) => [...prev, newPayment]);
      fetchInvoices(); // Refresh invoices to update paid amounts
      return newPayment;
    } catch (err: any) {
      setError(err.message);
      console.error('Error recording payment:', err);
      return null;
    }
  };

  const addClaim = async (claimData: Omit<InsuranceClaim, 'id'>): Promise<InsuranceClaim | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/insurance-claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claimData),
      });
      if (!response.ok) throw new Error('Failed to submit claim');
      const newClaim: InsuranceClaim = await response.json();
      setClaims((prev) => [...prev, newClaim]);
      return newClaim;
    } catch (err: any) {
      setError(err.message);
      console.error('Error submitting claim:', err);
      return null;
    }
  };

  const updateClaim = async (claimData: InsuranceClaim): Promise<InsuranceClaim | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/insurance-claims/${claimData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claimData),
      });
      if (!response.ok) throw new Error('Failed to update claim');
      const updatedClaim: InsuranceClaim = await response.json();
      setClaims((prev) => prev.map((c) => (c.id === updatedClaim.id ? updatedClaim : c)));
      return updatedClaim;
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating claim:', err);
      return null;
    }
  };

  return {
    invoices,
    payments,
    claims,
    providers,
    loading,
    error,
    fetchInvoices,
    addInvoice,
    addPayment,
    addClaim,
    updateClaim,
  };
};
