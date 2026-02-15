import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

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

export default function WorkoutDetail() {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useLocalSearchParams();
  const router = useRouter();
  const workoutId = params.id as string;

  useEffect(() => {
    fetchWorkout();
  }, [workoutId]);

  const fetchWorkout = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/workouts/${workoutId}`);
      const data = await response.json();
      setWorkout(data);
    } catch (error) {
      console.error('Erro ao buscar treino:', error);
      Alert.alert('Erro', 'Não foi possível carregar o treino');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/create-workout?id=${workoutId}`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Treino não encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons
              name={workout.type === 'predefined' ? 'library' : 'barbell'}
              size={32}
              color={workout.type === 'predefined' ? '#8b5cf6' : '#3b82f6'}
            />
            <View style={styles.titleTextContainer}>
              <Text style={styles.workoutName}>{workout.name}</Text>
              <Text style={styles.workoutType}>
                {workout.type === 'predefined' ? 'Pré-definido' : 'Personalizado'}
              </Text>
            </View>
          </View>
          {workout.type === 'custom' && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEdit}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={24} color="#3b82f6" />
            </TouchableOpacity>
          )}
        </View>

        {workout.splits.map((split, splitIndex) => (
          <View key={splitIndex} style={styles.splitCard}>
            <View style={styles.splitHeader}>
              <Ionicons name="calendar" size={20} color="#3b82f6" />
              <Text style={styles.splitDay}>{split.day}</Text>
            </View>
            <View style={styles.exercisesList}>
              {split.exercises.map((exercise, exerciseIndex) => (
                <View key={exerciseIndex} style={styles.exerciseItem}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                  </View>
                  <View style={styles.exerciseDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons name="fitness" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>
                        {exercise.sets} séries × {exercise.reps} reps
                      </Text>
                    </View>
                    {exercise.weight && (
                      <View style={styles.detailItem}>
                        <Ionicons name="barbell" size={16} color="#6b7280" />
                        <Text style={styles.detailText}>{exercise.weight}</Text>
                      </View>
                    )}
                  </View>
                  {exercise.notes && (
                    <View style={styles.notesContainer}>
                      <Ionicons name="information-circle" size={14} color="#9ca3af" />
                      <Text style={styles.notesText}>{exercise.notes}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
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
  scrollContent: {
    padding: 16,
  },
  header: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  titleTextContainer: {
    flex: 1,
  },
  workoutName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  workoutType: {
    fontSize: 14,
    color: '#6b7280',
  },
  editButton: {
    padding: 8,
  },
  splitCard: {
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
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  splitDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  exercisesList: {
    gap: 12,
  },
  exerciseItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  exerciseHeader: {
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  notesText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
