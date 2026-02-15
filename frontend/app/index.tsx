import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

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

export default function Index() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchWorkouts = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/workouts/custom`);
      const data = await response.json();
      setWorkouts(data);
    } catch (error) {
      console.error('Erro ao buscar treinos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os treinos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkouts();
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir o treino "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/workouts/${id}`, {
                method: 'DELETE',
              });
              fetchWorkouts();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o treino');
            }
          },
        },
      ]
    );
  };

  const renderWorkoutCard = ({ item }: { item: Workout }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/workout-detail?id=${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Ionicons name="barbell" size={24} color="#3b82f6" />
          <Text style={styles.cardTitle}>{item.name}</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDelete(item.id, item.name)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
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
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {workouts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Nenhum treino personalizado</Text>
          <Text style={styles.emptyText}>
            Crie seu próprio treino ou copie um da biblioteca
          </Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          renderItem={renderWorkoutCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/create-workout')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
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
    paddingBottom: 80,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#3b82f6',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
