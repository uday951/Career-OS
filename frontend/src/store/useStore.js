import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user, token) => set({ user, token, isAuthenticated: !!user }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      
      // Dashboard state
      jobs: [],
      setJobs: (jobs) => set({ jobs }),
      
      resumes: [],
      setResumes: (resumes) => set({ resumes })
    }),
    {
      name: 'careeros-storage', // saves to localStorage so reloads don't log you out
    }
  )
);

export default useStore;
