import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '@/lib/api';

const API_BASE_URL = apiUrl('/api/medications');

export interface Medication {
  id: number;
  patientId: number;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  prescribedDate: string;
  prescribedBy: string;
  startDate?: string;
  endDate?: string;
  status: string;
  instructions?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const useMedications = (patientId?: number) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = patientId ? `${API_BASE_URL}?patientId=${patientId}` : API_BASE_URL;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch medications');
      const data: Medication[] = await response.json();
      setMedications(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching medications:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  const addMedication = async (newMed: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>): Promise<Medication | null> => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMed),
      });
      if (!response.ok) throw new Error('Failed to add medication');
      const added: Medication = await response.json();
      setMedications((prev) => [...prev, added]);
      return added;
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding medication:', err);
      return null;
    }
  };

  const updateMedication = async (updatedMed: Medication): Promise<Medication | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${updatedMed.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMed),
      });
      if (!response.ok) throw new Error('Failed to update medication');
      const updated: Medication = await response.json();
      setMedications((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      return updated;
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating medication:', err);
      return null;
    }
  };

  const deleteMedication = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete medication');
      setMedications((prev) => prev.filter((m) => m.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting medication:', err);
      return false;
    }
  };

  return { medications, loading, error, fetchMedications, addMedication, updateMedication, deleteMedication };
};
