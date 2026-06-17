import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { db } from '../services/firebase';

const STUDIES_STORAGE_KEY = '@controle-estudos:items';

type Study = {
  id: string;
  subject: string;
  topic: string;
  remoteId?: string;
  synced?: boolean;
};

export default function AddStudyScreen() {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');

  async function saveStudy() {
    if (!subject.trim() || !topic.trim()) {
      Alert.alert('Atenção', 'Preencha a matéria e o assunto.');
      return;
    }

    try {
      const newStudy: Study = {
        id: String(Date.now()),
        subject: subject.trim(),
        topic: topic.trim(),
        synced: false,
      };

      const storedStudies = await AsyncStorage.getItem(STUDIES_STORAGE_KEY);
      const studies: Study[] = storedStudies ? JSON.parse(storedStudies) : [];

      studies.unshift(newStudy);

      await AsyncStorage.setItem(
        STUDIES_STORAGE_KEY,
        JSON.stringify(studies)
      );

      try {
        const docRef = await addDoc(collection(db, 'studies'), {
          subject: newStudy.subject,
          topic: newStudy.topic,
          createdAt: new Date(),
        });

        const updatedStudies = studies.map((study) =>
          study.id === newStudy.id
            ? { ...study, remoteId: docRef.id, synced: true }
            : study
        );

        await AsyncStorage.setItem(
          STUDIES_STORAGE_KEY,
          JSON.stringify(updatedStudies)
        );
      } catch (firebaseError) {
        console.log('Não foi possível salvar no Firebase:', firebaseError);
      }

      Alert.alert('Sucesso', 'Estudo salvo.');

      setSubject('');
      setTopic('');

      router.push('/studies');
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível salvar.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Cadastrar estudo</Text>

        <Text style={styles.label}>Matéria</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex.: Matemática"
          value={subject}
          onChangeText={setSubject}
        />

        <Text style={styles.label}>Assunto</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex.: Função do 1º grau"
          value={topic}
          onChangeText={setTopic}
        />

        <Pressable style={styles.buttonPrimary} onPress={saveStudy}>
          <Text style={styles.buttonText}>Salvar</Text>
        </Pressable>

        <Pressable style={styles.buttonSecondary} onPress={() => router.back()}>
          <Text style={styles.buttonSecondaryText}>Voltar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
  },
  buttonPrimary: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  buttonSecondary: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  buttonSecondaryText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },
});