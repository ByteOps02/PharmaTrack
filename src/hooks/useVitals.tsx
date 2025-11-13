import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '@/lib/api';

const API_BASE_URL = apiUrl('/api/vitals');

export interface Vital {
  id: number;
  patientId: number;
  recordDate: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  pulse?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  notes?: string;
  recordedBy: string;
  createdAt?: string;
}

export const useVitals = (patientId?: number) => {
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVitals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = patientId ? `${API_BASE_URL}?patientId=${patientId}` : API_BASE_URL;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch vitals');
      const data: Vital[] = await response.json();
      setVitals(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching vitals:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchVitals();
  }, [fetchVitals]);

  const addVital = async (newVital: Omit<Vital, 'id' | 'createdAt'>): Promise<Vital | null> => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVital),
      });
      if (!response.ok) throw new Error('Failed to add vital');
      const added: Vital = await response.json();
      setVitals((prev) => [...prev, added]);
      return added;
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding vital:', err);
      return null;
    }
  };

  const updateVital = async (updatedVital: Vital): Promise<Vital | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${updatedVital.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedVital),
      });
      if (!response.ok) throw new Error('Failed to update vital');
      const updated: Vital = await response.json();
      setVitals((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      return updated;
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating vital:', err);
      return null;
    }
  };

  const deleteVital = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete vital');
      setVitals((prev) => prev.filter((v) => v.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting vital:', err);
      return false;
    }
  };

  return { vitals, loading, error, fetchVitals, addVital, updateVital, deleteVital };
};
