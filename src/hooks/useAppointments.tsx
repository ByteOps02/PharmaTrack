import { useState, useEffect, useCallback } from 'react';

import { apiUrl } from '@/lib/api';
const API_BASE_URL = apiUrl('/api/appointments'); // Base URL for your backend appointments API

export interface Appointment {
  id: number;
  patientId: number; // Add patientId to link to patients table
  time: string;
  patientName: string; // Changed from 'patient' to 'patientName' to match backend
  mrn: string;
  type: string;
  provider: string;
  location: string;
  status: 'confirmed' | 'checked-in' | 'pending' | 'cancelled';
  phone: string;
  date: string;
}

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      const data: Appointment[] = await response.json();
      setAppointments(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const addAppointment = async (newAppointmentData: Omit<Appointment, 'id'>): Promise<Appointment | null> => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...newAppointmentData, status: 'pending' }),
      });
      if (!response.ok) {
        throw new Error('Failed to add appointment');
      }
      const addedAppointment: Appointment = await response.json();
      setAppointments((prev) => [...prev, addedAppointment]);
      return addedAppointment;
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding appointment:', err);
      return null;
    }
  };

  const updateAppointment = async (updatedAppointmentData: Appointment): Promise<Appointment | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${updatedAppointmentData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedAppointmentData),
      });
      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }
      const updatedAppointment: Appointment = await response.json();
      setAppointments((prev) =>
        prev.map((app) => (app.id === updatedAppointment.id ? updatedAppointment : app))
      );
      return updatedAppointment;
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating appointment:', err);
      return null;
    }
  };

  const deleteAppointment = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete appointment');
      }
      setAppointments((prev) => prev.filter((app) => app.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting appointment:', err);
      return false;
    }
  };

  const checkInAppointment = async (id: number): Promise<Appointment | null> => {
    try {
      const appointmentToUpdate = appointments.find(app => app.id === id);
      if (!appointmentToUpdate) throw new Error('Appointment not found');

      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...appointmentToUpdate, status: 'checked-in' }),
      });
      if (!response.ok) {
        throw new Error('Failed to check in appointment');
      }
      const updatedAppointment: Appointment = await response.json();
      setAppointments((prev) =>
        prev.map((app) => (app.id === updatedAppointment.id ? updatedAppointment : app))
      );
      return updatedAppointment;
    } catch (err: any) {
      setError(err.message);
      console.error('Error checking in appointment:', err);
      return null;
    }
  };

  const rescheduleAppointment = async (id: number, newDate: string, newTime: string): Promise<Appointment | null> => {
    try {
      const appointmentToUpdate = appointments.find(app => app.id === id);
      if (!appointmentToUpdate) throw new Error('Appointment not found');

      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...appointmentToUpdate, date: newDate, time: newTime, status: 'pending' }),
      });
      if (!response.ok) {
        throw new Error('Failed to reschedule appointment');
      }
      const updatedAppointment: Appointment = await response.json();
      setAppointments((prev) =>
        prev.map((app) => (app.id === updatedAppointment.id ? updatedAppointment : app))
      );
      return updatedAppointment;
    } catch (err: any) {
      setError(err.message);
      console.error('Error rescheduling appointment:', err);
      return null;
    }
  };

  return {
    appointments,
    loading,
    error,
    fetchAppointments, // Expose fetch function to allow manual refetching
    addAppointment,
    updateAppointment,
    deleteAppointment,
    checkInAppointment,
    rescheduleAppointment,
  };
};
