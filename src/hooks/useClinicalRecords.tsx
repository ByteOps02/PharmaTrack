import { useState, useEffect, useCallback } from 'react';

import { apiUrl } from '@/lib/api';
const API_BASE_URL = apiUrl('/api/clinical-records'); // Base URL for your backend clinical records API

export interface ClinicalRecord {
  id: number;
  patientId: number;
  date: string;
  type: string; // e.g., "Consultation Note", "Lab Result", "Prescription"
  title: string;
  content: string;
  provider: string;
}

export const useClinicalRecords = (patientId?: number) => {
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!patientId) {
      setRecords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}?patientId=${patientId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch clinical records');
      }
      const data: ClinicalRecord[] = await response.json();
      setRecords(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching clinical records:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, patientId]);

  const addRecord = async (newRecordData: Omit<ClinicalRecord, 'id' | 'date'>): Promise<ClinicalRecord | null> => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...newRecordData, date: new Date().toISOString().split('T')[0] }),
      });
      if (!response.ok) {
        throw new Error('Failed to add clinical record');
      }
      const addedRecord: ClinicalRecord = await response.json();
      setRecords((prev) => [...prev, addedRecord]);
      return addedRecord;
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding clinical record:', err);
      return null;
    }
  };

  const updateRecord = async (updatedRecordData: ClinicalRecord): Promise<ClinicalRecord | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${updatedRecordData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRecordData),
      });
      if (!response.ok) {
        throw new Error('Failed to update clinical record');
      }
      const updatedRecord: ClinicalRecord = await response.json();
      setRecords((prev) =>
        prev.map((rec) => (rec.id === updatedRecord.id ? updatedRecord : rec))
      );
      return updatedRecord;
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating clinical record:', err);
      return null;
    }
  };

  const deleteRecord = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete clinical record');
      }
      setRecords((prev) => prev.filter((rec) => rec.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting clinical record:', err);
      return false;
    }
  };

  return {
    patientRecords: records,
    loading,
    error,
    fetchRecords,
    addRecord,
    updateRecord,
    deleteRecord,
  };
};
