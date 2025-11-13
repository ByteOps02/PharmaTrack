import { useState, useEffect, useCallback } from 'react';

import { apiUrl } from '@/lib/api';
const API_BASE_URL = apiUrl('/api/patients'); // Base URL for your backend patients API

export interface Patient {
  id: number;
  fullName: string;
  mrn: string;
  dob: string; // Date of Birth
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  address: string;
  lastVisit: string; // Date of last visit
}

export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      const data: Patient[] = await response.json();
      setPatients(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const addPatient = async (newPatientData: Omit<Patient, 'id' | 'lastVisit' | 'mrn'>): Promise<Patient | null> => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...newPatientData, lastVisit: new Date().toISOString().split('T')[0] }),
      });
      if (!response.ok) {
        throw new Error('Failed to add patient');
      }
      const addedPatient: Patient = await response.json();
      setPatients((prev) => [...prev, addedPatient]);
      return addedPatient;
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding patient:', err);
      return null;
    }
  };

  const updatePatient = async (updatedPatientData: Patient): Promise<Patient | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${updatedPatientData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPatientData),
      });
      if (!response.ok) {
        throw new Error('Failed to update patient');
      }
      const updatedPatient: Patient = await response.json();
      setPatients((prev) =>
        prev.map((pat) => (pat.id === updatedPatient.id ? updatedPatient : pat))
      );
      return updatedPatient;
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating patient:', err);
      return null;
    }
  };

  const deletePatient = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete patient');
      }
      setPatients((prev) => prev.filter((pat) => pat.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting patient:', err);
      return false;
    }
  };

  return {
    patients,
    loading,
    error,
    fetchPatients,
    addPatient,
    updatePatient,
    deletePatient,
  };
};
