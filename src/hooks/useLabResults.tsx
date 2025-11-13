import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '@/lib/api';

const API_BASE_URL = apiUrl('/api/lab-results');

export interface LabResult {
  id: number;
  patientId: number;
  testDate: string;
  testName: string;
  result: string;
  unit?: string;
  referenceRange?: string;
  status: string;
  orderedBy: string;
  performedBy?: string;
  notes?: string;
  createdAt?: string;
}

export const useLabResults = (patientId?: number) => {
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLabResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = patientId ? `${API_BASE_URL}?patientId=${patientId}` : API_BASE_URL;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch lab results');
      const data: LabResult[] = await response.json();
      setLabResults(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching lab results:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchLabResults();
  }, [fetchLabResults]);

  const addLabResult = async (newLab: Omit<LabResult, 'id' | 'createdAt'>): Promise<LabResult | null> => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLab),
      });
      if (!response.ok) throw new Error('Failed to add lab result');
      const added: LabResult = await response.json();
      setLabResults((prev) => [...prev, added]);
      return added;
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding lab result:', err);
      return null;
    }
  };

  const updateLabResult = async (updatedLab: LabResult): Promise<LabResult | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${updatedLab.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLab),
      });
      if (!response.ok) throw new Error('Failed to update lab result');
      const updated: LabResult = await response.json();
      setLabResults((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      return updated;
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating lab result:', err);
      return null;
    }
  };

  const deleteLabResult = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete lab result');
      setLabResults((prev) => prev.filter((l) => l.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting lab result:', err);
      return false;
    }
  };

  return { labResults, loading, error, fetchLabResults, addLabResult, updateLabResult, deleteLabResult };
};
