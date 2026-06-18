import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase';

const STUDIES_STORAGE_KEY = '@controle-estudos:items';

export type Study = {
  id: string;
  subject: string;
  topic: string;
  remoteId?: string;
  synced?: boolean;
  color?: string;
  deadline?: string; // Data limite no formato "DD/MM/YYYY"
};

export async function syncStudies(): Promise<Study[]> {
  const storedStudies = await AsyncStorage.getItem(STUDIES_STORAGE_KEY);

  const studies: Study[] = storedStudies ? JSON.parse(storedStudies) : [];
  const updatedStudies = [...studies];

  for (let i = 0; i < updatedStudies.length; i++) {
    const study = updatedStudies[i];

    if (!study.synced) {
      if (study.remoteId) {
        // Atualiza apenas subject e topic no Firebase
        await updateDoc(doc(db, 'studies', study.remoteId), {
          subject: study.subject,
          topic: study.topic,
          updatedAt: new Date(),
        });
      } else {
        // Cria apenas com subject e topic no Firebase
        const docRef = await addDoc(collection(db, 'studies'), {
          subject: study.subject,
          topic: study.topic,
          createdAt: new Date(),
        });

        updatedStudies[i] = {
          ...study,
          remoteId: docRef.id,
        };
      }

      updatedStudies[i] = {
        ...updatedStudies[i],
        synced: true,
      };
    }
  }

  await AsyncStorage.setItem(
    STUDIES_STORAGE_KEY,
    JSON.stringify(updatedStudies)
  );

  return updatedStudies;
}

export async function downloadFromCloud(): Promise<Study[]> {
  const querySnapshot = await getDocs(collection(db, 'studies'));

  // Busca apenas subject e topic do Firebase
  const cloudStudies: Study[] = querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data() as {
      subject?: string;
      topic?: string;
    };

    return {
      id: docSnap.id,
      remoteId: docSnap.id,
      subject: data.subject ?? '',
      topic: data.topic ?? '',
      synced: true,
    };
  });

  // Mantém cores e prazos locais
  const storedStudies = await AsyncStorage.getItem(STUDIES_STORAGE_KEY);
  const localStudies: Study[] = storedStudies ? JSON.parse(storedStudies) : [];
  
  const mergedStudies = cloudStudies.map((cloudStudy) => {
    const localStudy = localStudies.find((s) => s.remoteId === cloudStudy.remoteId);
    return {
      ...cloudStudy,
      color: localStudy?.color,
      deadline: localStudy?.deadline, // Mantém o prazo local
    };
  });

  await AsyncStorage.setItem(
    STUDIES_STORAGE_KEY,
    JSON.stringify(mergedStudies)
  );

  return mergedStudies;
}