import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { caseAPI } from '../../src/services/api';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CreateCaseScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    dfps_region: '',
    dfps_unit: '',
    investigator_name: '',
    supervisor_name: '',
    investigation_type: '',
    notes: '',
  });

  const handleCreate = async () => {
    if (!formData.investigator_name && !formData.supervisor_name) {
      Alert.alert('Required', 'Please provide at least investigator or supervisor name');
      return;
    }

    setIsLoading(true);
    try {
      const newCase = await caseAPI.createCase({
        ...formData,
        date_opened: new Date().toISOString(),
        current_stage: 'Investigation',
        parties: [],
        allegations: [],
        service_plan_items: [],
        placement_history: [],
      });

      Alert.alert('Success', 'Case created successfully', [
        {
          text: 'OK',
          onPress: () => router.replace(`/case/${newCase.id}`),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create case');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white.soft} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Case</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>DFPS Region</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Region 3 Houston"
            placeholderTextColor={Colors.silver.light}
            value={formData.dfps_region}
            onChangeText={(text) => setFormData({ ...formData, dfps_region: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>DFPS Unit</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., CVS Unit 1234"
            placeholderTextColor={Colors.silver.light}
            value={formData.dfps_unit}
            onChangeText={(text) => setFormData({ ...formData, dfps_unit: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Investigator Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Name of assigned investigator"
            placeholderTextColor={Colors.silver.light}
            value={formData.investigator_name}
            onChangeText={(text) => setFormData({ ...formData, investigator_name: text })}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Supervisor Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Name of supervisor"
            placeholderTextColor={Colors.silver.light}
            value={formData.supervisor_name}
            onChangeText={(text) => setFormData({ ...formData, supervisor_name: text })}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Investigation Type</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Neglect, Physical Abuse"
            placeholderTextColor={Colors.silver.light}
            value={formData.investigation_type}
            onChangeText={(text) => setFormData({ ...formData, investigation_type: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add any initial notes about your case"
            placeholderTextColor={Colors.silver.light}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white.pure} />
          ) : (
            <Text style={styles.buttonText}>Create Case</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.black.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.silver.border,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: Typography.sizes.xl,
    color: Colors.white.pure,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.lg,
    color: Colors.white.soft,
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.sm,
    color: Colors.white.soft,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.black.card,
    borderWidth: 1,
    borderColor: Colors.silver.border,
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.base,
    color: Colors.white.soft,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  button: {
    backgroundColor: Colors.accent.steel,
    borderRadius: BorderRadius.card,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.base,
    color: Colors.white.pure,
  },
});
