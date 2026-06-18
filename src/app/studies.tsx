import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { deleteDoc, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  SafeAreaView,
  StatusBar,
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
const { width, height } = Dimensions.get('window');

// Cores dos post-its
const POSTIT_COLORS = [
  '#FFEAA7', '#FFD3B4', '#FFB3B3', '#B8E6E6', 
  '#C9E4DE', '#E8D5F5', '#F7DC6F', '#F5B7B1',
  '#A9DFBF', '#AED6F1', '#FADBD8', '#D5F5E3',
];

// Função para truncar texto sem os 3 pontinhos
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength);
};

export default function StudiesScreen() {
  const [items, setItems] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'late' | 'onTime'>('all');

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

  const getColorForItem = (item: Study, index: number) => {
    return item.color || POSTIT_COLORS[index % POSTIT_COLORS.length];
  };

  const getRandomRotation = () => {
    const rotations = [-2, -1, 0, 1, 2];
    return rotations[Math.floor(Math.random() * rotations.length)];
  };

  const getStatusText = (synced?: boolean) => 
    synced ? 'Sincronizado' : 'Pendente';

  const isTaskLate = (deadline?: string): boolean => {
    if (!deadline) return false;
    
    const parts = deadline.split('/');
    const date = new Date(
      parseInt(parts[2]),
      parseInt(parts[1]) - 1,
      parseInt(parts[0])
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return date.getTime() < today.getTime();
  };

  const hasDeadline = (deadline?: string): boolean => {
    return !!deadline && deadline.trim().length > 0;
  };

  const getFilteredItems = () => {
    if (activeTab === 'all') return items;
    if (activeTab === 'late') return items.filter(item => isTaskLate(item.deadline));
    if (activeTab === 'onTime') {
      return items.filter(item => {
        if (!hasDeadline(item.deadline)) return true;
        return !isTaskLate(item.deadline);
      });
    }
    return items;
  };

  const getDeadlineDisplay = (deadline?: string) => {
    if (!deadline) return { text: 'Sem prazo', isLate: false, hasDeadline: false };
    
    const parts = deadline.split('/');
    const date = new Date(
      parseInt(parts[2]),
      parseInt(parts[1]) - 1,
      parseInt(parts[0])
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: `Atrasado (${deadline})`, isLate: true, hasDeadline: true };
    if (diffDays === 0) return { text: `Hoje (${deadline})`, isLate: false, hasDeadline: true };
    if (diffDays <= 3) return { text: `${diffDays}d (${deadline})`, isLate: false, hasDeadline: true };
    return { text: `${deadline}`, isLate: false, hasDeadline: true };
  };

  const filteredItems = getFilteredItems();
  const numColumns = width > 600 ? 3 : 2;

  const lateCount = items.filter(item => isTaskLate(item.deadline)).length;

  const renderPostIt = ({ item, index }: { item: Study; index: number }) => {
    const color = getColorForItem(item, index);
    const rotation = getRandomRotation();
    const deadlineInfo = getDeadlineDisplay(item.deadline);
    const isLate = isTaskLate(item.deadline);
    
    // Limita o tamanho do texto da matéria e assunto para 100 caracteres cada
    const subjectText = truncateText(item.subject, 100);
    const topicText = truncateText(item.topic, 100);
    
    return (
      <View style={[
        styles.postitWrapper,
        { width: numColumns > 1 ? (width - (numColumns * 16) - 16) / numColumns : width - 32 }
      ]}>
        <View 
          style={[
            styles.postit,
            { 
              backgroundColor: color,
              transform: [{ rotate: `${rotation}deg` }],
              borderColor: isLate ? '#E74C3C' : 'transparent',
              borderWidth: isLate ? 2 : 0,
            }
          ]}
        >
          <View style={styles.tapeContainer}>
            <View style={styles.tape} />
          </View>

          <View style={styles.postitHeader}>
            <Text style={styles.postitNumber}>#{index + 1}</Text>
            <View style={[
              styles.statusBadge,
              item.synced ? styles.statusSynced : styles.statusPending
            ]}>
              <Text style={styles.statusBadgeText}>
                {getStatusText(item.synced)}
              </Text>
            </View>
          </View>

          <Text style={styles.postitSubject} numberOfLines={2}>
            {subjectText}
          </Text>
          
          <Text style={styles.postitTopic} numberOfLines={3}>
            {topicText}
          </Text>

          <View style={styles.postitFooter}>
            <View style={styles.deadlineContainer}>
              <Text style={styles.deadlineLabel}>PRAZO:</Text>
              <Text style={[
                styles.postitDeadline,
                deadlineInfo.isLate && styles.postitDeadlineLate
              ]}>
                {deadlineInfo.text}
              </Text>
            </View>
            
            <View style={styles.postitActions}>
              <Pressable
                style={styles.postitEditButton}
                onPress={() =>
                  router.push({
                    pathname: '/edit-study',
                    params: { id: item.id },
                  })
                }
              >
                <Text style={styles.postitEditText}>Editar</Text>
              </Pressable>

              <Pressable
                style={styles.postitDeleteButton}
                onPress={() => deleteStudy(item.id)}
              >
                <Text style={styles.postitDeleteText}>Excluir</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />
      <LinearGradient
        colors={['#2C3E50', '#3498DB']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Meus Estudos</Text>
            <Text style={styles.headerSubtitle}>
              {items.length} {items.length === 1 ? 'item' : 'itens'} cadastrados
              {lateCount > 0 && ` • ${lateCount} atrasado${lateCount > 1 ? 's' : ''}`}
            </Text>
          </View>

          <View style={styles.topButtons}>
            <Pressable 
              style={[styles.actionButton, styles.syncButton]} 
              onPress={handleSync}
              disabled={syncing}
            >
              <Text style={styles.actionButtonText}>
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </Text>
            </Pressable>

            <Pressable 
              style={[styles.actionButton, styles.downloadButton]} 
              onPress={handleDownload}
              disabled={downloading}
            >
              <Text style={styles.actionButtonText}>
                {downloading ? 'Baixando...' : 'Baixar'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.tabsContainer}>
            <Pressable
              style={[styles.tab, activeTab === 'all' && styles.tabActive]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                Todos ({items.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'late' && styles.tabActive, styles.tabLate]}
              onPress={() => setActiveTab('late')}
            >
              <Text style={[styles.tabText, activeTab === 'late' && styles.tabTextActive, styles.tabTextLate]}>
                Atrasados ({lateCount})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'onTime' && styles.tabActive]}
              onPress={() => setActiveTab('onTime')}
            >
              <Text style={[styles.tabText, activeTab === 'onTime' && styles.tabTextActive]}>
                Em dia ({items.length - lateCount})
              </Text>
            </Pressable>
          </View>

          <View style={styles.listContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Carregando...</Text>
              </View>
            ) : filteredItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>
                  {activeTab === 'late' ? '🎉' : '📚'}
                </Text>
                <Text style={styles.emptyTitle}>
                  {activeTab === 'late' 
                    ? 'Nenhum estudo atrasado!' 
                    : activeTab === 'onTime'
                    ? 'Nenhum estudo em dia'
                    : 'Nenhum estudo cadastrado'}
                </Text>
                <Text style={styles.emptyText}>
                  {activeTab === 'all' 
                    ? 'Comece adicionando seu primeiro estudo' 
                    : activeTab === 'late'
                    ? 'Todos os seus estudos estão em dia! 🎉'
                    : 'Adicione prazos aos seus estudos'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                numColumns={numColumns}
                columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
                renderItem={renderPostIt}
              />
            )}
          </View>

          <View style={styles.bottomButtons}>
            <Pressable
              style={styles.addButton}
              onPress={() => router.push('/add-study')}
            >
              <Text style={styles.addButtonText}>+ Novo Estudo</Text>
            </Pressable>

            <Pressable
              style={styles.homeButton}
              onPress={() => router.push('/')}
            >
              <Text style={styles.homeButtonText}>Início</Text>
            </Pressable>
          </View>
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
  header: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  topButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  syncButton: {
    backgroundColor: 'rgba(46, 204, 113, 0.25)',
    borderColor: 'rgba(46, 204, 113, 0.4)',
  },
  downloadButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.25)',
    borderColor: 'rgba(52, 152, 219, 0.4)',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabLate: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabTextLate: {
    color: '#E74C3C',
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 2,
  },
  listContent: {
    padding: 6,
    paddingBottom: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  postitWrapper: {
    marginBottom: 4,
  },
  postit: {
    borderRadius: 4,
    padding: 14,
    paddingTop: 18,
    paddingBottom: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 1,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
    alignSelf: 'flex-start',
    width: '100%',
  },
  tapeContainer: {
    position: 'absolute',
    top: -5,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 14,
    zIndex: 10,
  },
  tape: {
    width: 24,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 2,
    transform: [{ rotate: '-3deg' }],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  postitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  postitNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.3)',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusSynced: {
    backgroundColor: 'rgba(46, 204, 113, 0.3)',
  },
  statusPending: {
    backgroundColor: 'rgba(241, 196, 15, 0.3)',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#2C3E50',
  },
  postitSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 3,
    lineHeight: 20,
  },
  postitTopic: {
    fontSize: 13,
    color: 'rgba(44, 62, 80, 0.7)',
    lineHeight: 18,
    marginBottom: 6,
  },
  postitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    flexWrap: 'wrap',
    gap: 4,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  deadlineLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2C3E50',
    letterSpacing: 0.5,
  },
  postitDeadline: {
    fontSize: 11,
    color: 'rgba(44, 62, 80, 0.6)',
    fontWeight: '500',
  },
  postitDeadlineLate: {
    color: '#E74C3C',
    fontWeight: '700',
  },
  postitActions: {
    flexDirection: 'row',
    gap: 4,
  },
  postitEditButton: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  postitEditText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2C3E50',
  },
  postitDeleteButton: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
  },
  postitDeleteText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E74C3C',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  addButton: {
    flex: 2,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#2C3E50',
    fontWeight: '700',
    fontSize: 16,
  },
  homeButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});