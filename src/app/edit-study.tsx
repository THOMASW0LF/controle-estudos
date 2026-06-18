import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
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
  color?: string;
  deadline?: string;
};

const POSTIT_COLORS = [
  '#FFEAA7', '#FFD3B4', '#FFB3B3', '#B8E6E6', 
  '#C9E4DE', '#E8D5F5', '#F7DC6F', '#F5B7B1',
  '#A9DFBF', '#AED6F1', '#FADBD8', '#D5F5E3',
];

export default function EditStudyScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const studyId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedColor, setSelectedColor] = useState(POSTIT_COLORS[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudy();
  }, [studyId]);

  const formatDeadline = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = '';
    if (cleaned.length > 0) {
      formatted = cleaned.substring(0, 2);
      if (cleaned.length > 2) {
        formatted += '/' + cleaned.substring(2, 4);
      }
      if (cleaned.length > 4) {
        formatted += '/' + cleaned.substring(4, 8);
      }
    }
    setDeadline(formatted);
  };

  // Limita o texto a 100 caracteres
  const handleSubjectChange = (text: string) => {
    if (text.length <= 100) {
      setSubject(text);
    }
  };

  const handleTopicChange = (text: string) => {
    if (text.length <= 100) {
      setTopic(text);
    }
  };

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
      setDeadline(study.deadline || '');
      setSelectedColor(study.color || POSTIT_COLORS[0]);
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

    // Valida a data se foi preenchida
    if (deadline.trim()) {
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(deadline)) {
        Alert.alert('Atenção', 'Formato de data inválido. Use DD/MM/AAAA.');
        return;
      }

      const parts = deadline.split('/');
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      const date = new Date(year, month, day);
      
      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day
      ) {
        Alert.alert('Atenção', 'Data inválida. Verifique o dia, mês e ano.');
        return;
      }
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
              color: selectedColor,
              deadline: deadline.trim() || undefined,
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

      Alert.alert('Sucesso', 'Estudo atualizado com sucesso!');
      router.replace('/studies');
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível atualizar.');
    }
  }

  if (loading) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />
        <LinearGradient
          colors={['#2C3E50', '#3498DB']}
          style={styles.gradientBackground}
        >
          <SafeAreaView style={styles.container}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Carregando...</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />
      <LinearGradient
        colors={['#2C3E50', '#3498DB']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                  <Text style={styles.backButtonText}>← Voltar</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Editar Estudo</Text>
                <View style={styles.headerPlaceholder} />
              </View>

              <View style={[styles.card, { backgroundColor: selectedColor }]}>
                <View style={styles.tapeContainer}>
                  <View style={styles.tape} />
                </View>

                <Text style={styles.cardTitle}>Editar Estudo</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Matéria</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: 'rgba(255,255,255,0.5)' }]}
                    placeholder="Ex.: Matemática"
                    placeholderTextColor="rgba(44,62,80,0.4)"
                    value={subject}
                    onChangeText={handleSubjectChange}
                    returnKeyType="next"
                    maxLength={100}
                  />
                  <Text style={styles.charCounter}>{subject.length}/100</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Assunto</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: 'rgba(255,255,255,0.5)' }]}
                    placeholder="Ex.: Função do 1º grau"
                    placeholderTextColor="rgba(44,62,80,0.4)"
                    value={topic}
                    onChangeText={handleTopicChange}
                    returnKeyType="next"
                    maxLength={100}
                  />
                  <Text style={styles.charCounter}>{topic.length}/100</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Prazo (opcional)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: 'rgba(255,255,255,0.5)' }]}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="rgba(44,62,80,0.4)"
                    value={deadline}
                    onChangeText={formatDeadline}
                    keyboardType="numeric"
                    maxLength={10}
                    returnKeyType="done"
                  />
                  <Text style={styles.helperText}>Deixe em branco para prazo indefinido</Text>
                </View>

                <View style={styles.colorPicker}>
                  <Text style={styles.label}>Cor do post-it</Text>
                  <View style={styles.colorOptions}>
                    {POSTIT_COLORS.map((color) => (
                      <Pressable
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          selectedColor === color && styles.colorSelected,
                        ]}
                        onPress={() => setSelectedColor(color)}
                      />
                    ))}
                  </View>
                </View>

                <Pressable style={styles.buttonPrimary} onPress={updateStudy}>
                  <Text style={styles.buttonText}>Salvar alterações</Text>
                </Pressable>

                <Pressable style={styles.buttonSecondary} onPress={() => router.back()}>
                  <Text style={styles.buttonSecondaryText}>Cancelar</Text>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerPlaceholder: {
    width: 70,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  card: {
    borderRadius: 4,
    padding: 24,
    paddingTop: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
    marginHorizontal: 4,
  },
  tapeContainer: {
    position: 'absolute',
    top: -6,
    left: '50%',
    marginLeft: -18,
    width: 36,
    height: 18,
    zIndex: 10,
  },
  tape: {
    width: 36,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 2,
    transform: [{ rotate: '-3deg' }],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 6,
    opacity: 0.8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(44,62,80,0.2)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C3E50',
  },
  charCounter: {
    fontSize: 11,
    color: 'rgba(44,62,80,0.4)',
    textAlign: 'right',
    marginTop: 2,
  },
  helperText: {
    fontSize: 11,
    color: 'rgba(44,62,80,0.5)',
    marginTop: 4,
  },
  colorPicker: {
    marginBottom: 16,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  colorOption: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  colorSelected: {
    borderColor: '#2C3E50',
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  buttonPrimary: {
    backgroundColor: '#2C3E50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
  },
  buttonSecondaryText: {
    color: '#2C3E50',
    fontWeight: '600',
    fontSize: 17,
  },
});