import { useState, useCallback } from 'react';

export interface Document {
  id: string;
  title: string;
  category: string;
  url: string;
  areaId: string | null;
  machineId: string | null;
  createdAt: string;
  area?: { name: string };
  machine?: { name: string };
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = useCallback(async (showLoading?: boolean) => {
    const isFirstLoad = showLoading !== undefined ? showLoading : false;
    if (isFirstLoad) setLoading(true);
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } finally {
      if (isFirstLoad) setLoading(false);
    }
  }, []);

  const addDocument = async (data: { title: string; category: string; url: string; areaId?: string; machineId?: string }) => {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Błąd podczas dodawania dokumentu');
    }
    await fetchDocuments(false);
  };

  return {
    documents,
    loading,
    fetchDocuments,
    addDocument
  };
}
