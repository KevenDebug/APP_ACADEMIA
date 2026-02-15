import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
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

export default function CreateWorkout() {
  const [workoutName, setWorkoutName] = useState('');
  const [splits, setSplits] = useState<WorkoutSplit[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentSplitIndex, setCurrentSplitIndex] = useState<number | null>(null);
  const [exerciseForm, setExerciseForm] = useState<Exercise>({
    name: '',
    sets: 3,
    reps: '10-12',
    weight: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams();
  const router = useRouter();
  const workoutId = params.id as string | undefined;

  useEffect(() => {
    if (workoutId) {
      fetchWorkout();
    }
  }, [workoutId]);

  const fetchWorkout = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/workouts/${workoutId}`);
      const data = await response.json();
      setWorkoutName(data.name);
      setSplits(data.splits);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o treino');
    }
  };

  const addSplit = () => {
    setSplits([...splits, { day: `Treino ${String.fromCharCode(65 + splits.length)}`, exercises: [] }]);
  };

  const removeSplit = (index: number) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Deseja remover esta divisão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            const newSplits = splits.filter((_, i) => i !== index);
            setSplits(newSplits);
          },
        },
      ]
    );
  };

  const updateSplitDay = (index: number, day: string) => {
    const newSplits = [...splits];
    newSplits[index].day = day;
    setSplits(newSplits);
  };

  const openExerciseModal = (splitIndex: number) => {
    setCurrentSplitIndex(splitIndex);
    setExerciseForm({
      name: '',
      sets: 3,
      reps: '10-12',
      weight: '',
      notes: '',
    });
    setModalVisible(true);
  };

  const addExercise = () => {
    if (!exerciseForm.name.trim()) {
      Alert.alert('Erro', 'Digite o nome do exercício');
      return;
    }

    if (currentSplitIndex !== null) {
      const newSplits = [...splits];
      newSplits[currentSplitIndex].exercises.push(exerciseForm);
      setSplits(newSplits);
      setModalVisible(false);
    }
  };

  const removeExercise = (splitIndex: number, exerciseIndex: number) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Deseja remover este exercício?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            const newSplits = [...splits];
            newSplits[splitIndex].exercises = newSplits[splitIndex].exercises.filter(
              (_, i) => i !== exerciseIndex
            );
            setSplits(newSplits);
          },
        },
      ]
    );
  };

  const saveWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Erro', 'Digite o nome do treino');
      return;
    }

    if (splits.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos uma divisão de treino');
      return;
    }

    setLoading(true);

    try {
      const url = workoutId
        ? `${EXPO_PUBLIC_BACKEND_URL}/api/workouts/${workoutId}`
        : `${EXPO_PUBLIC_BACKEND_URL}/api/workouts`;

      const method = workoutId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: workoutName,
          type: 'custom',
          splits,
        }),
      });

      if (response.ok) {
        Alert.alert('Sucesso', workoutId ? 'Treino atualizado!' : 'Treino criado com sucesso!');
        router.back();
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o treino');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.label}>Nome do Treino</Text>
          <TextInput
            style={styles.input}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder="Ex: Meu Treino ABC"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Divisões de Treino</Text>
            <TouchableOpacity style={styles.addButton} onPress={addSplit}>
              <Ionicons name="add-circle" size={24} color="#3b82f6" />
              <Text style={styles.addButtonText}>Adicionar</Text>
            </TouchableOpacity>
          </View>

          {splits.map((split, splitIndex) => (
            <View key={splitIndex} style={styles.splitCard}>
              <View style={styles.splitCardHeader}>
                <TextInput
                  style={styles.splitInput}
                  value={split.day}
                  onChangeText={(text) => updateSplitDay(splitIndex, text)}
                  placeholder="Nome da divisão"
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity onPress={() => removeSplit(splitIndex)}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>

              <View style={styles.exercisesContainer}>
                {split.exercises.map((exercise, exerciseIndex) => (
                  <View key={exerciseIndex} style={styles.exerciseCard}>
                    <View style={styles.exerciseCardHeader}>
                      <Text style={styles.exerciseCardName}>{exercise.name}</Text>
                      <TouchableOpacity
                        onPress={() => removeExercise(splitIndex, exerciseIndex)}
                      >
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.exerciseCardDetails}>
                      {exercise.sets} séries × {exercise.reps} reps
                      {exercise.weight ? ` - ${exercise.weight}` : ''}
                    </Text>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addExerciseButton}
                  onPress={() => openExerciseModal(splitIndex)}
                >
                  <Ionicons name="add" size={20} color="#3b82f6" />
                  <Text style={styles.addExerciseButtonText}>Adicionar Exercício</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={saveWorkout}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Salvando...' : workoutId ? 'Atualizar Treino' : 'Criar Treino'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Exercício</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.modalLabel}>Nome do Exercício</Text>
              <TextInput
                style={styles.modalInput}
                value={exerciseForm.name}
                onChangeText={(text) => setExerciseForm({ ...exerciseForm, name: text })}
                placeholder="Ex: Supino Reto"
                placeholderTextColor="#9ca3af"
              />

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.modalLabel}>Séries</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={String(exerciseForm.sets)}
                    onChangeText={(text) =>
                      setExerciseForm({ ...exerciseForm, sets: parseInt(text) || 0 })
                    }
                    keyboardType="number-pad"
                    placeholder="3"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.halfWidth}>
                  <Text style={styles.modalLabel}>Repetições</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={exerciseForm.reps}
                    onChangeText={(text) => setExerciseForm({ ...exerciseForm, reps: text })}
                    placeholder="10-12"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <Text style={styles.modalLabel}>Carga (opcional)</Text>
              <TextInput
                style={styles.modalInput}
                value={exerciseForm.weight}
                onChangeText={(text) => setExerciseForm({ ...exerciseForm, weight: text })}
                placeholder="Ex: 50kg"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.modalLabel}>Observações (opcional)</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={exerciseForm.notes}
                onChangeText={(text) => setExerciseForm({ ...exerciseForm, notes: text })}
                placeholder="Ex: Pegada aberta"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity style={styles.modalSaveButton} onPress={addExercise}>
                <Text style={styles.modalSaveButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
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
  splitCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  splitInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  exercisesContainer: {
    gap: 8,
  },
  exerciseCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  exerciseCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  exerciseCardDetails: {
    fontSize: 12,
    color: '#6b7280',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addExerciseButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  modalSaveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  modalSaveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
