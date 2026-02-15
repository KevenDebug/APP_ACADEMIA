import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  notes?: string;
}

interface WorkoutSplit {
  day: string;
  exercises: Exercise[];
}

interface Workout {
  id: string;
  name: string;
  type: 'predefined' | 'custom';
  splits: WorkoutSplit[];
  createdAt?: string;
}

export default function Library() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const router = useRouter();

  const fetchWorkouts = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/workouts/predefined`);
      const data = await response.json();
      setWorkouts(data);
    } catch (error) {
      console.error('Erro ao buscar treinos:', error);
      Alert.alert('Erro', 'Não foi possível carregar a biblioteca');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkouts();
  };

  const handleCopyWorkout = async () => {
    if (!selectedWorkout || !newWorkoutName.trim()) {
      Alert.alert('Erro', 'Por favor, digite um nome para o treino');
      return;
    }

    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/workouts/${selectedWorkout.id}/copy?new_name=${encodeURIComponent(newWorkoutName)}`,
        { method: 'POST' }
      );

      if (response.ok) {
        Alert.alert('Sucesso', 'Treino copiado com sucesso!');
        setModalVisible(false);
        setNewWorkoutName('');
        setSelectedWorkout(null);
        router.push('/');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível copiar o treino');
    }
  };

  const openCopyModal = (workout: Workout) => {
    setSelectedWorkout(workout);
    setNewWorkoutName(`${workout.name} - Personalizado`);
    setModalVisible(true);
  };

  const renderWorkoutCard = ({ item }: { item: Workout }) => (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() => router.push(`/workout-detail?id=${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="library" size={24} color="#8b5cf6" />
            <Text style={styles.cardTitle}>{item.name}</Text>
          </View>
        </View>
        <Text style={styles.splitsCount}>
          {item.splits.length} {item.splits.length === 1 ? 'divisão' : 'divisões'}
        </Text>
        <View style={styles.splitsList}>
          {item.splits.slice(0, 3).map((split, index) => (
            <View key={index} style={styles.splitItem}>
              <Ionicons name="chevron-forward" size={14} color="#6b7280" />
              <Text style={styles.splitText}>{split.day}</Text>
            </View>
          ))}
          {item.splits.length > 3 && (
            <Text style={styles.moreText}>+{item.splits.length - 3} mais</Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.copyButton}
        onPress={() => openCopyModal(item)}
        activeOpacity={0.7}
      >
        <Ionicons name="copy-outline" size={18} color="#ffffff" />
        <Text style={styles.copyButtonText}>Copiar e Personalizar</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={workouts}
        renderItem={renderWorkoutCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Copiar Treino</Text>
            <Text style={styles.modalSubtitle}>
              Digite um nome para seu treino personalizado:
            </Text>
            <TextInput
              style={styles.input}
              value={newWorkoutName}
              onChangeText={setNewWorkoutName}
              placeholder="Nome do treino"
              placeholderTextColor="#9ca3af"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewWorkoutName('');
                  setSelectedWorkout(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCopyWorkout}
              >
                <Text style={styles.confirmButtonText}>Copiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  splitsCount: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  splitsList: {
    gap: 6,
    marginBottom: 16,
  },
  splitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  splitText: {
    fontSize: 14,
    color: '#374151',
  },
  moreText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 4,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  copyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#8b5cf6',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
