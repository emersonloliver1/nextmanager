import { useState, useCallback } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, where, orderBy, QueryConstraint } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './useAuth';

interface FirestoreError {
  code: string;
  message: string;
}

export function useFirestore(collectionName: string) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FirestoreError | null>(null);

  const getDocuments = useCallback(async (constraints: QueryConstraint[] = []) => {
    if (!user) {
      setError({ code: 'auth/not-authenticated', message: 'Usuário não autenticado' });
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, collectionName),
        where('userId', '==', user.uid),
        ...constraints
      );
      
      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return documents;
    } catch (err: any) {
      setError({
        code: err.code || 'unknown',
        message: err.message || 'Erro desconhecido'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [collectionName, user]);

  const addDocument = useCallback(async (data: any) => {
    if (!user) {
      setError({ code: 'auth/not-authenticated', message: 'Usuário não autenticado' });
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (err: any) {
      setError({
        code: err.code || 'unknown',
        message: err.message || 'Erro desconhecido'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [collectionName, user]);

  const updateDocument = useCallback(async (id: string, data: any) => {
    if (!user) {
      setError({ code: 'auth/not-authenticated', message: 'Usuário não autenticado' });
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (err: any) {
      setError({
        code: err.code || 'unknown',
        message: err.message || 'Erro desconhecido'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [collectionName, user]);

  const deleteDocument = useCallback(async (id: string) => {
    if (!user) {
      setError({ code: 'auth/not-authenticated', message: 'Usuário não autenticado' });
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await deleteDoc(doc(db, collectionName, id));
      return true;
    } catch (err: any) {
      setError({
        code: err.code || 'unknown',
        message: err.message || 'Erro desconhecido'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [collectionName, user]);

  return {
    loading,
    error,
    getDocuments,
    addDocument,
    updateDocument,
    deleteDocument
  };
} 