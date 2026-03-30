import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { caseAPI } from '../../src/services/api';
import { Case } from '../../src/types';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CaseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCase();
    }
  }, [id]);

  const loadCase = async () => {
    try {
      const data = await caseAPI.getCase(id as string);
      setCaseData(data);
    } catch (error) {
      console.error('Error loading case:', error);
      Alert.alert('Error', 'Failed to load case details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent.steel} />
      </View>
    );
  }

  if (!caseData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Case not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white.soft} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Case Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Case ID */}
        <View style={[styles.card, { borderLeftColor: Colors.accent.steel }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Case Information</Text>
            <View style={[styles.statusBadge, { backgroundColor: Colors.accent.amberGlow }]}>
              <Text style={[styles.statusText, { color: Colors.accent.amber }]}>
                {caseData.current_stage}
              </Text>
            </View>
          </View>
          <Text style={styles.caseId}>{caseData.case_id_display}</Text>
          {caseData.date_opened && (
            <Text style={styles.detailText}>
              Opened: {new Date(caseData.date_opened).toLocaleDateString()}
            </Text>
          )}
          {caseData.investigation_type && (
            <Text style={styles.detailText}>Type: {caseData.investigation_type}</Text>
          )}
        </View>

        {/* DFPS Info */}
        {(caseData.dfps_region || caseData.dfps_unit || caseData.investigator_name) && (
          <View style={[styles.card, { borderLeftColor: Colors.accent.teal }]}>
            <Text style={styles.cardTitle}>DFPS Information</Text>
            {caseData.dfps_region && (
              <Text style={styles.detailText}>Region: {caseData.dfps_region}</Text>
            )}
            {caseData.dfps_unit && <Text style={styles.detailText}>Unit: {caseData.dfps_unit}</Text>}
            {caseData.investigator_name && (
              <Text style={styles.detailText}>Investigator: {caseData.investigator_name}</Text>
            )}
            {caseData.supervisor_name && (
              <Text style={styles.detailText}>Supervisor: {caseData.supervisor_name}</Text>
            )}
          </View>
        )}

        {/* Notes */}
        {caseData.notes && (
          <View style={[styles.card, { borderLeftColor: Colors.silver.mid }]}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{caseData.notes}</Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { borderLeftColor: Colors.accent.amber }]}
            onPress={() => router.push(`/case/${id}/timeline`)}
          >
            <Ionicons name="time" size={20} color={Colors.accent.amber} />
            <Text style={styles.actionButtonText}>View Timeline</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.silver.mid} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { borderLeftColor: Colors.accent.copper }]}
            onPress={() => Alert.alert('Coming Soon', 'Document management is being developed')}
          >
            <Ionicons name="document" size={20} color={Colors.accent.copper} />
            <Text style={styles.actionButtonText}>Case Documents</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.silver.mid} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { borderLeftColor: Colors.accent.teal }]}
            onPress={() => Alert.alert('Coming Soon', 'Deadline tracking is being developed')}
          >
            <Ionicons name="calendar" size={20} color={Colors.accent.teal} />
            <Text style={styles.actionButtonText}>Deadlines</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.silver.mid} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.black.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  card: {
    backgroundColor: Colors.black.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.silver.border,
    borderLeftWidth: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.base,
    color: Colors.white.soft,
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  statusText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.xs,
  },
  caseId: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: Typography.sizes.xl,
    color: Colors.white.soft,
    marginBottom: Spacing.sm,
  },
  detailText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
    marginTop: 4,
  },
  notesText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.bright,
    lineHeight: 20,
  },
  errorText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.base,
    color: Colors.silver.mid,
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.lg,
    color: Colors.white.soft,
    marginBottom: Spacing.md,
  },
  actionButton: {
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
  actionButtonText: {
    flex: 1,
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.base,
    color: Colors.white.soft,
    marginLeft: Spacing.md,
  },
});
