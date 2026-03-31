import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { caseAPI, aiAPI, documentAPI } from '../../src/services/api';
import { Case } from '../../src/types';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const TEMPLATE_CONFIGS: Record<string, any> = {
  supervisor_conference: {
    title: 'Request for Supervisor Conference',
    fields: [
      { key: 'your_name', label: 'Your Full Name', type: 'text', required: true },
      { key: 'case_number', label: 'Case Number', type: 'text', required: true },
      { key: 'caseworker_name', label: 'Caseworker Name', type: 'text', required: true },
      { key: 'supervisor_name', label: 'Supervisor Name', type: 'text', required: false },
      { key: 'concern_summary', label: 'Summary of Concerns', type: 'textarea', required: true },
      { key: 'specific_issues', label: 'Specific Issues to Discuss', type: 'textarea', required: true },
      { key: 'requested_outcome', label: 'Requested Outcome', type: 'textarea', required: true },
    ],
    aiPrompt: 'Help me draft a formal request for a supervisor conference with CPS. The tone should be professional and factual.',
  },
  service_plan_objection: {
    title: 'Written Objection to Service Plan',
    fields: [
      { key: 'your_name', label: 'Your Full Name', type: 'text', required: true },
      { key: 'case_number', label: 'Case Number', type: 'text', required: true },
      { key: 'service_objected', label: 'Service Being Objected To', type: 'text', required: true },
      { key: 'reason_for_objection', label: 'Reason for Objection', type: 'textarea', required: true },
      { key: 'alternative_proposed', label: 'Alternative Service Proposed', type: 'textarea', required: false },
      { key: 'supporting_evidence', label: 'Supporting Evidence', type: 'textarea', required: false },
    ],
    aiPrompt: 'Help me write a formal objection to a CPS service plan requirement. Cite relevant Texas Family Code sections if applicable.',
  },
  relative_placement: {
    title: 'Request for Relative Placement',
    fields: [
      { key: 'your_name', label: 'Your Full Name', type: 'text', required: true },
      { key: 'child_name', label: "Child's Name", type: 'text', required: true },
      { key: 'case_number', label: 'Case Number', type: 'text', required: true },
      { key: 'relative_name', label: 'Relative\'s Full Name', type: 'text', required: true },
      { key: 'relationship', label: 'Relationship to Child', type: 'text', required: true },
      { key: 'relative_address', label: 'Relative\'s Address', type: 'textarea', required: true },
      { key: 'relative_phone', label: 'Relative\'s Phone', type: 'text', required: true },
      { key: 'why_suitable', label: 'Why This Placement Is Suitable', type: 'textarea', required: true },
    ],
    aiPrompt: 'Help me request relative placement citing Texas Family Code §262.114 and §264.751 regarding relative placement preference.',
  },
  open_records: {
    title: 'Open Records Request (TPIA)',
    fields: [
      { key: 'your_name', label: 'Your Full Name', type: 'text', required: true },
      { key: 'address', label: 'Your Address', type: 'textarea', required: true },
      { key: 'email', label: 'Your Email', type: 'text', required: false },
      { key: 'phone', label: 'Your Phone', type: 'text', required: true },
      { key: 'case_number', label: 'Case Number', type: 'text', required: true },
      { key: 'records_requested', label: 'Specific Records Requested', type: 'textarea', required: true },
    ],
    aiPrompt: 'Help me draft a Texas Public Information Act (TPIA) request for all CPS records related to my case.',
  },
};

export default function TemplateFormScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams();
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  const config = TEMPLATE_CONFIGS[templateId as string];

  useEffect(() => {
    loadCaseData();
  }, []);

  const loadCaseData = async () => {
    try {
      const cases = await caseAPI.getCases();
      if (cases.length > 0) {
        const activeCase = cases[0];
        setActiveCase(activeCase);
        // Pre-fill form with case data
        setFormData({
          case_number: activeCase.case_id_display,
          caseworker_name: activeCase.investigator_name || '',
          supervisor_name: activeCase.supervisor_name || '',
        });
      }
    } catch (error) {
      console.error('Error loading case:', error);
    }
  };

  const handleAIAssist = async () => {
    setIsLoading(true);
    try {
      const prompt = `${config.aiPrompt}\n\nCase Details: ${JSON.stringify(formData)}\n\nPlease provide suggestions for completing this document professionally and accurately.`;
      const response = await aiAPI.chat(prompt, activeCase?.id);
      setAiSuggestion(response.response);
    } catch (error: any) {
      if (error.message?.includes('budget')) {
        Alert.alert(
          'AI Budget Limit',
          'The AI assistant feature requires balance in your Emergent LLM key. Please add balance to use AI-assisted document completion.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to get AI assistance');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    const missingFields = config.fields
      .filter((f: any) => f.required && !formData[f.key])
      .map((f: any) => f.label);

    if (missingFields.length > 0) {
      Alert.alert('Required Fields', `Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    setIsSaving(true);
    try {
      // Generate document text
      const documentText = generateDocumentText();
      const base64Doc = Buffer.from(documentText).toString('base64');

      await documentAPI.uploadDocument({
        case_id: activeCase!.id,
        document_type: config.title,
        file_name: `${config.title.replace(/\s+/g, '_')}_${Date.now()}.txt`,
        file_data: base64Doc,
        category: 'Legal Forms',
        tags: ['template', 'generated'],
      });

      Alert.alert('Success', 'Document saved to your case file', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const generateDocumentText = () => {
    let text = `${config.title}\n\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n\n`;
    config.fields.forEach((field: any) => {
      if (formData[field.key]) {
        text += `${field.label}:\n${formData[field.key]}\n\n`;
      }
    });
    return text;
  };

  if (!config) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Template not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white.soft} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{config.title}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* AI Assistant Button */}
        <TouchableOpacity
          style={[styles.aiButton, isLoading && styles.aiButtonDisabled]}
          onPress={handleAIAssist}
          disabled={isLoading}
        >
          <Ionicons name="sparkles" size={20} color={Colors.accent.teal} />
          <Text style={styles.aiButtonText}>
            {isLoading ? 'Getting AI Help...' : 'Get AI Assistance'}
          </Text>
        </TouchableOpacity>

        {/* AI Suggestion */}
        {aiSuggestion && (
          <View style={[styles.aiSuggestionCard, { borderLeftColor: Colors.accent.teal }]}>
            <Text style={styles.aiSuggestionTitle}>AI Suggestions:</Text>
            <Text style={styles.aiSuggestionText}>{aiSuggestion}</Text>
          </View>
        )}

        {/* Form Fields */}
        {config.fields.map((field: any) => (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label}
              {field.required && <Text style={styles.required}> *</Text>}
            </Text>
            {field.type === 'textarea' ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                placeholderTextColor={Colors.silver.light}
                value={formData[field.key] || ''}
                onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            ) : (
              <TextInput
                style={styles.input}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                placeholderTextColor={Colors.silver.light}
                value={formData[field.key] || ''}
                onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
              />
            )}
          </View>
        ))}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving || !activeCase}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.white.pure} />
          ) : (
            <>
              <Ionicons name="save" size={20} color={Colors.white.pure} />
              <Text style={styles.saveButtonText}>Save to Case File</Text>
            </>
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
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.lg,
    color: Colors.white.pure,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent.tealGlow,
    borderRadius: BorderRadius.card,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent.tealBorder,
  },
  aiButtonDisabled: {
    opacity: 0.6,
  },
  aiButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.base,
    color: Colors.accent.teal,
    marginLeft: Spacing.sm,
  },
  aiSuggestionCard: {
    backgroundColor: Colors.accent.tealGlow,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent.tealBorder,
    borderLeftWidth: 3,
  },
  aiSuggestionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.base,
    color: Colors.white.soft,
    marginBottom: Spacing.sm,
  },
  aiSuggestionText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.bright,
    lineHeight: 20,
  },
  fieldContainer: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.sm,
    color: Colors.white.soft,
    marginBottom: Spacing.sm,
  },
  required: {
    color: Colors.accent.crimson,
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent.copper,
    borderRadius: BorderRadius.card,
    paddingVertical: Spacing.md + 2,
    marginTop: Spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.base,
    color: Colors.white.pure,
    marginLeft: Spacing.sm,
  },
  errorText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.base,
    color: Colors.silver.mid,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});
