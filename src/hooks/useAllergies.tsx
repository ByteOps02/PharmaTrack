import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '@/lib/api';

const API_BASE_URL = apiUrl('/api/allergies');

export interface Allergy {
  id: number;
  patientId: number;
  allergen: string;
  reaction: string;
  severity: string;
  notes?: string;
  recordedDate: string;
  recordedBy: string;
  createdAt?: string;
}

export const useAllergies = (patientId?: number) => {
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllergies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = patientId ? `${API_BASE_URL}?patientId=${patientId}` : API_BASE_URL;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch allergies');
      const data: Allergy[] = await response.json();
      setAllergies(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching allergies:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchAllergies();
  }, [fetchAllergies]);

  const addAllergy = async (newAllergy: Omit<Allergy, 'id' | 'createdAt'>): Promise<Allergy | null> => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAllergy),
      });
      if (!response.ok) throw new Error('Failed to add allergy');
      const added: Allergy = await response.json();
      setAllergies((prev) => [...prev, added]);
      return added;
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding allergy:', err);
      return null;
    }
  };

  const deleteAllergy = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete allergy');
      setAllergies((prev) => prev.filter((a) => a.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting allergy:', err);
      return false;
    }
  };

  return { allergies, loading, error, fetchAllergies, addAllergy, deleteAllergy };
};
