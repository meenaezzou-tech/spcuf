import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function DocumentTemplatesScreen() {
  const router = useRouter();

  const templates = [
    {
      id: 'supervisor_conference',
      title: 'Request for Supervisor Conference',
      description: 'Formal request to meet with CPS supervisor about case issues',
      icon: 'people',
      color: Colors.accent.copper,
    },
    {
      id: 'service_plan_objection',
      title: 'Written Objection to Service Plan',
      description: 'Object to unnecessary or inappropriate service plan requirements',
      icon: 'document-text',
      color: Colors.accent.crimson,
    },
    {
      id: 'relative_placement',
      title: 'Request for Relative Placement',
      description: 'Formal request to place child with specific relative',
      icon: 'home',
      color: Colors.accent.sage,
    },
    {
      id: 'attorney_representation',
      title: 'Notice of Attorney Representation',
      description: 'Notify DFPS that you have legal representation',
      icon: 'briefcase',
      color: Colors.accent.teal,
    },
    {
      id: 'open_records',
      title: 'Open Records Request (TPIA)',
      description: 'Request copies of all CPS records under Texas Public Information Act',
      icon: 'folder-open',
      color: Colors.accent.amber,
    },
    {
      id: 'compliance_affidavit',
      title: 'Affidavit of Compliance',
      description: 'Document your completion of service plan requirements',
      icon: 'checkmark-circle',
      color: Colors.accent.sage,
    },
    {
      id: 'caseworker_reassignment',
      title: 'Request for Caseworker Reassignment',
      description: 'Request a different caseworker due to conflict or misconduct',
      icon: 'swap-horizontal',
      color: Colors.accent.steel,
    },
    {
      id: 'visitation_dispute',
      title: 'Visitation Dispute Letter',
      description: 'Challenge cancelled or restricted visitation',
      icon: 'heart',
      color: Colors.accent.lavender,
    },
    {
      id: 'ombudsman_complaint',
      title: 'Complaint to DFPS Ombudsman',
      description: 'File formal complaint about CPS conduct or policy violations',
      icon: 'alert-circle',
      color: Colors.accent.crimson,
    },
  ];

  const handleTemplateSelect = (templateId: string) => {
    router.push(`/documents/${templateId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white.soft} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Document Templates</Text>
          <Text style={styles.headerSubtitle}>AI-Assisted Legal Forms</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.infoCard, { borderLeftColor: Colors.accent.copper }]}>
          <Ionicons name="information-circle" size={20} color={Colors.accent.copper} />
          <Text style={styles.infoText}>
            These templates are pre-filled with Texas-specific language. The AI assistant will help you complete each template based on your case details.
          </Text>
        </View>

        {templates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={[styles.templateCard, { borderLeftColor: template.color }]}
            onPress={() => handleTemplateSelect(template.id)}
          >
            <View style={styles.templateIcon}>
              <Ionicons name={template.icon as any} size={24} color={template.color} />
            </View>
            <View style={styles.templateContent}>
              <Text style={styles.templateTitle}>{template.title}</Text>
              <Text style={styles.templateDescription}>{template.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.silver.mid} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
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
  headerSubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.accent.copper,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.accent.copperGlow,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent.copperBorder,
    borderLeftWidth: 3,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.bright,
    marginLeft: Spacing.sm,
    lineHeight: 18,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.black.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.silver.border,
    borderLeftWidth: 3,
  },
  templateIcon: {
    marginRight: Spacing.md,
  },
  templateContent: {
    flex: 1,
  },
  templateTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.base,
    color: Colors.white.soft,
    marginBottom: 4,
  },
  templateDescription: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.xs,
    color: Colors.silver.mid,
    lineHeight: 16,
  },
});
