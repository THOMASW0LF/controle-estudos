import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const STUDIES_STORAGE_KEY = '@controle-estudos:items';

type Study = {
  id: string;
  subject: string;
  topic: string;
};

export default function StudiesScreen() {
  const [items, setItems] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Lista de estudos</Text>

        {loading ? (
          <ActivityIndicator size="large" />
        ) : items.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum estudo cadastrado ainda.</Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <Text style={styles.listSubject}>{item.subject}</Text>
                <Text style={styles.listTopic}>{item.topic}</Text>
              </View>
            )}
          />
        )}

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