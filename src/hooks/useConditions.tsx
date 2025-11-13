import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '@/lib/api';

const API_BASE_URL = apiUrl('/api/conditions');

export interface Condition {
  id: number;
  patientId: number;
  condition: string;
  diagnosedDate: string;
  status: string;
  diagnosedBy: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const useConditions = (patientId?: number) => {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConditions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = patientId ? `${API_BASE_URL}?patientId=${patientId}` : API_BASE_URL;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch conditions');
      const data: Condition[] = await response.json();
      setConditions(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching conditions:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchConditions();
  }, [fetchConditions]);

  const addCondition = async (newCondition: Omit<Condition, 'id' | 'createdAt' | 'updatedAt'>): Promise<Condition | null> => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCondition),
      });
      if (!response.ok) throw new Error('Failed to add condition');
      const added: Condition = await response.json();
      setConditions((prev) => [...prev, added]);
      return added;
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding condition:', err);
      return null;
    }
  };

  const updateCondition = async (updatedCondition: Condition): Promise<Condition | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${updatedCondition.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCondition),
      });
      if (!response.ok) throw new Error('Failed to update condition');
      const updated: Condition = await response.json();
      setConditions((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      return updated;
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating condition:', err);
      return null;
    }
  };

  const deleteCondition = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete condition');
      setConditions((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting condition:', err);
      return false;
    }
  };

  return { conditions, loading, error, fetchConditions, addCondition, updateCondition, deleteCondition };
};
