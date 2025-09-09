import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Store } from '../utils/db';
import { seedDemo } from '../utils/db';

interface DatabaseContextType {
  store: Store | null;
  updateStore: (newStore: Store) => void;
  updatePartialStore: (updates: Partial<Store>) => void;
  resetToDemo: () => void;
  isLoading: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useDatabaseContext = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider');
  }
  return context;
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to load from localStorage first
    const savedStore = localStorage.getItem('linkbox-store');
    let initialStore: Store;

    if (savedStore) {
      try {
        initialStore = JSON.parse(savedStore);
      } catch {
        // If parsing fails, fall back to demo data
        initialStore = seedDemo();
      }
    } else {
      // No saved data, use demo seed
      initialStore = seedDemo();
    }

    setStore(initialStore);
    setIsLoading(false);
  }, []);

  const updateStore = (newStore: Store) => {
    setStore(newStore);
    // Save to localStorage whenever store updates
    localStorage.setItem('linkbox-store', JSON.stringify(newStore));
  };

  const updatePartialStore = (updates: Partial<Store>) => {
    if (store) {
      const updatedStore = { ...store, ...updates };
      setStore(updatedStore);
      // Save to localStorage whenever store updates
      localStorage.setItem('linkbox-store', JSON.stringify(updatedStore));
    }
  };

  const resetToDemo = () => {
    localStorage.removeItem('linkbox-store');
    const freshStore = seedDemo();
    setStore(freshStore);
    localStorage.setItem('linkbox-store', JSON.stringify(freshStore));
  };

  const value: DatabaseContextType = {
    store,
    updateStore,
    updatePartialStore,
    resetToDemo,
    isLoading,
  };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
};
