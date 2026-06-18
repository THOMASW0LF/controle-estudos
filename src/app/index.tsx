import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />
      <LinearGradient
        colors={['#2C3E50', '#3498DB']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>📚</Text>
            </View>
            
            <Text style={styles.title}>Controle de Estudos</Text>
            <Text style={styles.subtitle}>
              Organize suas matérias e acompanhe seus estudos
            </Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>Organize</Text>
                <Text style={styles.statLabel}>Matérias</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>Acompanhe</Text>
                <Text style={styles.statLabel}>Progresso</Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <Pressable 
                style={styles.buttonPrimary} 
                onPress={() => router.push('/add-study')}
              >
                <Text style={styles.buttonPrimaryText}>+ Novo estudo</Text>
              </Pressable>

              <Pressable 
                style={styles.buttonSecondary} 
                onPress={() => router.push('/studies')}
              >
                <Text style={styles.buttonSecondaryText}>Ver lista</Text>
              </Pressable>
            </View>

            <Text style={styles.footerText}>
              Sincronizado com a nuvem ☁️
            </Text>
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 18,
    marginBottom: 28,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  buttonPrimary: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPrimaryText: {
    color: '#2C3E50',
    fontWeight: '700',
    fontSize: 17,
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  buttonSecondaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 17,
  },
  footerText: {
    marginTop: 20,
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
});