import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

export default function EditStudyScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const studyId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudy();
  }, [studyId]);

  async function loadStudy() {
    try {
      setLoading(true);

      if (!studyId) {
        Alert.alert('Erro', 'ID do estudo não encontrado.');
        router.back();
        return;
      }

      const storedStudies = await AsyncStorage.getItem(STUDIES_STORAGE_KEY);
      const studies: Study[] = storedStudies ? JSON.parse(storedStudies) : [];

      const study = studies.find((item) => item.id === studyId);

      if (!study) {
        Alert.alert('Erro', 'Estudo não encontrado.');
        router.back();
        return;
      }

      setSubject(study.subject);
      setTopic(study.topic);
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível carregar o estudo.');
    } finally {
      setLoading(false);
    }
  }

  async function updateStudy() {
    if (!studyId) {
      Alert.alert('Erro', 'ID inválido.');
      return;
    }

    if (!subject.trim() || !topic.trim()) {
      Alert.alert('Atenção', 'Preencha a matéria e o assunto.');
      return;
    }

    try {
      const storedStudies = await AsyncStorage.getItem(STUDIES_STORAGE_KEY);
      const studies: Study[] = storedStudies ? JSON.parse(storedStudies) : [];

      const currentStudy = studies.find((item) => item.id === studyId);

      const updatedStudies = studies.map((study) =>
        study.id === studyId
          ? {
              ...study,
              subject: subject.trim(),
              topic: topic.trim(),
              synced: false,
            }
          : study
      );

      await AsyncStorage.setItem(
        STUDIES_STORAGE_KEY,
        JSON.stringify(updatedStudies)
      );

      if (currentStudy?.remoteId) {
        try {
          await updateDoc(doc(db, 'studies', currentStudy.remoteId), {
            subject: subject.trim(),
            topic: topic.trim(),
            updatedAt: new Date(),
          });

          const syncedStudies = updatedStudies.map((study) =>
            study.id === studyId ? { ...study, synced: true } : study
          );

          await AsyncStorage.setItem(
            STUDIES_STORAGE_KEY,
            JSON.stringify(syncedStudies)
          );
        } catch (firebaseError) {
          console.log('Não foi possível atualizar no Firebase:', firebaseError);
        }
      }

      Alert.alert('Sucesso', 'Estudo atualizado.');
      router.replace('/studies');
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível atualizar.');
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Editar estudo</Text>

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

        <Pressable style={styles.buttonPrimary} onPress={updateStudy}>
          <Text style={styles.buttonText}>Salvar alterações</Text>
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