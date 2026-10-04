'use client';

import { useState, useEffect, useCallback } from 'react';
import { userRepository } from '../models';
import { User } from '../models/types';

export interface StaffCreatedData {
  staffCode: string;
  name: string;
  role: 'Agent' | 'Driver';
  email: string;
  tempPassword: string;
  userId: string;
}

/**
 * ViewModel for the Staff Registry tab.
 * Handles creating new staff (via API route) and listing existing staff.
 */
export const useStaffViewModel = () => {
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Agent' | 'Driver'>('Agent');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // QR result state (shown after successful creation)
  const [createdStaff, setCreatedStaff] = useState<StaffCreatedData | null>(null);

  // Staff list
  const [staffList, setStaffList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setListError(null);
    try {
      const all = await userRepository.getUsers();
      // Only show Agents and Drivers in the staff registry
      setStaffList(all.filter((u) => u.role === 'Agent' || u.role === 'Driver'));
    } catch (err: unknown) {
      setListError(err instanceof Error ? err.message : 'Failed to load staff.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const registerStaff = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) {
        setError('Please enter a full name.');
        return;
      }
      if (!email.trim()) {
        setError('Please enter an email address.');
        return;
      }
      setIsSubmitting(true);
      setError(null);
      setCreatedStaff(null);

      try {
        const response = await fetch('/api/admin/create-staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), role }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? 'Failed to register staff member.');
        }

        setCreatedStaff(data as StaffCreatedData);
        setName('');
        setEmail('');
        await fetchStaff(); // Refresh the list
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, email, role, fetchStaff]
  );

  const dismissQr = () => setCreatedStaff(null);

  return {
    // Form
    name, setName,
    email, setEmail,
    role, setRole,
    isSubmitting,
    error,
    registerStaff,
    // QR result
    createdStaff,
    dismissQr,
    // Staff list
    staffList,
    isLoading,
    listError,
    refresh: fetchStaff,
  };
};
