import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { caseAPI } from '../../src/services/api';
import { Case } from '../../src/types';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CasesScreen() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const data = await caseAPI.getCases();
      setCases(data);
    } catch (error) {
      console.error('Error loading cases:', error);
      Alert.alert('Error', 'Failed to load cases');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCases();
  };

  const handleCreateCase = () => {
    router.push('/case/create');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent.steel} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cases</Text>
        <TouchableOpacity onPress={handleCreateCase} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color={Colors.accent.steel} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent.steel} />
        }
      >
        {cases.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color={Colors.silver.mid} />
            <Text style={styles.emptyTitle}>No Cases Yet</Text>
            <Text style={styles.emptyText}>
              Create your first case to start managing your CPS matter.
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateCase}>
              <Text style={styles.createButtonText}>Create Case</Text>
            </TouchableOpacity>
          </View>
        ) : (
          cases.map((caseItem) => (
            <TouchableOpacity
              key={caseItem.id}
              style={styles.caseCard}
              onPress={() => router.push(`/case/${caseItem.id}`)}
            >
              <View style={styles.caseHeader}>
                <View style={[styles.statusBadge, { backgroundColor: Colors.accent.steelGlow }]}>
                  <Text style={[styles.statusText, { color: Colors.accent.steel }]}>
                    {caseItem.current_stage}
                  </Text>
                </View>
              </View>
              <Text style={styles.caseId}>{caseItem.case_id_display}</Text>
              {caseItem.date_opened && (
                <Text style={styles.caseDetail}>
                  Opened: {new Date(caseItem.date_opened).toLocaleDateString()}
                </Text>
              )}
              {caseItem.investigation_type && (
                <Text style={styles.caseDetail}>Type: {caseItem.investigation_type}</Text>
              )}
              <View style={styles.caseFooter}>
                <Text style={styles.viewDetailsText}>View Details →</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.black.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.silver.border,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: Typography.sizes.xxl,
    color: Colors.white.pure,
  },
  addButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: Typography.sizes.xxl,
    color: Colors.white.soft,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.base,
    color: Colors.silver.mid,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    maxWidth: 300,
  },
  createButton: {
    backgroundColor: Colors.accent.steel,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.card,
  },
  createButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.base,
    color: Colors.white.pure,
  },
  caseCard: {
    backgroundColor: Colors.black.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.silver.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.steel,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
    fontSize: Typography.sizes.base,
    color: Colors.white.soft,
    marginBottom: Spacing.sm,
  },
  caseDetail: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
    marginTop: 4,
  },
  caseFooter: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.silver.border,
  },
  viewDetailsText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.sm,
    color: Colors.accent.steel,
  },
});
