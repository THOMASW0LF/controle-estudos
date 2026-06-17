import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { deleteDoc, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  downloadFromCloud,
  syncStudies,
  type Study,
} from '../app/studiesSync';
import { db } from '../services/firebase';

const STUDIES_STORAGE_KEY = '@controle-estudos:items';

export default function StudiesScreen() {
  const [items, setItems] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function loadStudies() {
    try {
      setLoading(true);

      const storedStudies = await AsyncStorage.getItem(STUDIES_STORAGE_KEY);

      if (storedStudies) {
        setItems(JSON.parse(storedStudies));
      } else {
        setItems([]);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudies();
  }, []);

  async function deleteStudy(id: string) {
    try {
      const storedStudies = await AsyncStorage.getItem(STUDIES_STORAGE_KEY);
      const studies: Study[] = storedStudies ? JSON.parse(storedStudies) : [];

      const studyToDelete = studies.find((item) => item.id === id);
      const updatedStudies = studies.filter((item) => item.id !== id);

      await AsyncStorage.setItem(
        STUDIES_STORAGE_KEY,
        JSON.stringify(updatedStudies)
      );

      setItems(updatedStudies);

      if (studyToDelete?.remoteId) {
        try {
          await deleteDoc(doc(db, 'studies', studyToDelete.remoteId));
        } catch (firebaseError) {
          console.log('Não foi possível excluir no Firebase:', firebaseError);
        }
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível excluir.');
    }
  }

  async function handleSync() {
    try {
      setSyncing(true);
      const updatedStudies = await syncStudies();
      setItems(updatedStudies);
      Alert.alert('Sucesso', 'Sincronização concluída.');
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível sincronizar.');
    } finally {
      setSyncing(false);
    }
  }

  async function handleDownload() {
    Alert.alert(
      'Baixar da nuvem',
      'Isso vai substituir os dados locais pela versão do Firebase.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Baixar',
          onPress: async () => {
            try {
              setDownloading(true);
              const cloudStudies = await downloadFromCloud();
              setItems(cloudStudies);
              Alert.alert('Sucesso', 'Dados baixados da nuvem.');
            } catch (error) {
              console.log(error);
              Alert.alert('Erro', 'Não foi possível baixar os dados.');
            } finally {
              setDownloading(false);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Lista de estudos</Text>

        <View style={styles.topButtons}>
          <Pressable style={styles.syncButton} onPress={handleSync}>
            <Text style={styles.topButtonText}>
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </Text>
          </Pressable>

          <Pressable style={styles.downloadButton} onPress={handleDownload}>
            <Text style={styles.topButtonText}>
              {downloading ? 'Baixando...' : 'Baixar da nuvem'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.listArea}>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : items.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum estudo cadastrado ainda.</Text>
          ) : (
            <FlatList
              style={styles.list}
              contentContainerStyle={styles.listContent}
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <Text style={styles.listSubject}>{item.subject}</Text>
                  <Text style={styles.listTopic}>{item.topic}</Text>

                  <Text style={styles.statusText}>
                    {item.synced ? 'Sincronizado' : 'Pendente'}
                  </Text>

                  <View style={styles.actionsRow}>
                    <Pressable
                      style={styles.editButton}
                      onPress={() =>
                        router.push({
                          pathname: '/edit-study',
                          params: { id: item.id },
                        })
                      }
                    >
                      <Text style={styles.editButtonText}>Editar</Text>
                    </Pressable>

                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => deleteStudy(item.id)}
                    >
                      <Text style={styles.deleteButtonText}>Excluir</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        <Pressable
          style={styles.buttonPrimary}
          onPress={() => router.push('/add-study')}
        >
          <Text style={styles.buttonText}>Adicionar</Text>
        </Pressable>

        <Pressable
          style={styles.buttonSecondary}
          onPress={() => router.push('/')}
        >
          <Text style={styles.buttonSecondaryText}>Início</Text>
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
  },
  card: {
    flex: 1,
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
  topButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  syncButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  downloadButton: {
    flex: 1,
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  topButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  listArea: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 12,
  },
  listItem: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  listSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  listTopic: {
    marginTop: 4,
    fontSize: 14,
    color: '#4B5563',
  },
  statusText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#E0F2FE',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#075985',
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#991B1B',
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 8,
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