import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { caseAPI, deadlineAPI, documentAPI } from '../../src/services/api';
import { Case, Deadline } from '../../src/types';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import CaseHealthMeter from '../../src/components/CaseHealthMeter';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const casesData = await caseAPI.getCases();
      setCases(casesData);
      
      if (casesData.length > 0) {
        const active = casesData[0];
        setActiveCase(active);
        
        // Load deadlines for active case
        try {
          const deadlinesData = await deadlineAPI.getDeadlines(active.id);
          setDeadlines(deadlinesData.filter(d => !d.completed).slice(0, 3));
        } catch (err) {
          console.log('No deadlines yet');
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.full_name}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={Colors.white.soft} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent.steel}
          />
        }
      >
        {!activeCase ? (
          /* No Cases State */
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color={Colors.silver.mid} />
            <Text style={styles.emptyTitle}>No Active Case</Text>
            <Text style={styles.emptyText}>
              Start by creating your first case to begin managing your CPS matter.
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/(tabs)/cases')}
            >
              <Text style={styles.createButtonText}>Create Your First Case</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Active Case Dashboard */
          <>
            {/* Case Health Meter */}
            <CaseHealthMeter
              caseData={activeCase}
              documentsCount={documentsCount}
              deadlinesCount={deadlines.length}
            />
            
            {/* Active Case Card */}
            <TouchableOpacity
              style={[styles.card, styles.activeCaseCard]}
              onPress={() => router.push(`/case/${activeCase.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Active Case</Text>
                <View style={[styles.statusBadge, { backgroundColor: Colors.accent.amberGlow }]}>
                  <Text style={[styles.statusText, { color: Colors.accent.amber }]}>
                    {activeCase.current_stage}
                  </Text>
                </View>
              </View>
              <Text style={styles.caseId}>{activeCase.case_id_display}</Text>
              {activeCase.date_opened && (
                <Text style={styles.caseDetail}>
                  Opened: {new Date(activeCase.date_opened).toLocaleDateString()}
                </Text>
              )}
              {activeCase.investigation_type && (
                <Text style={styles.caseDetail}>Type: {activeCase.investigation_type}</Text>
              )}
            </TouchableOpacity>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity
                  style={[styles.actionCard, { borderLeftColor: Colors.accent.teal }]}
                  onPress={() => router.push('/(tabs)/ai')}
                >
                  <Ionicons name="chatbubbles" size={24} color={Colors.accent.teal} />
                  <Text style={styles.actionText}>Ask SPCUF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionCard, { borderLeftColor: Colors.accent.copper }]}
                  onPress={() => router.push('/documents')}
                >
                  <Ionicons name="cloud-upload" size={24} color={Colors.accent.copper} />
                  <Text style={styles.actionText}>Documents</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionCard, { borderLeftColor: Colors.accent.amber }]}
                  onPress={() => router.push(`/case/${activeCase.id}/timeline`)}
                >
                  <Ionicons name="time" size={24} color={Colors.accent.amber} />
                  <Text style={styles.actionText}>View Timeline</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionCard, { borderLeftColor: Colors.accent.lavender }]}
                  onPress={() => router.push('/resources')}
                >
                  <Ionicons name="heart" size={24} color={Colors.accent.lavender} />
                  <Text style={styles.actionText}>Resources</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Upcoming Deadlines */}
            {deadlines.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
                {deadlines.map((deadline) => (
                  <View
                    key={deadline.id}
                    style={[styles.deadlineCard, { borderLeftColor: Colors.accent.amber }]}
                  >
                    <View style={styles.deadlineHeader}>
                      <Ionicons name="calendar" size={20} color={Colors.accent.amber} />
                      <Text style={styles.deadlineType}>{deadline.deadline_type}</Text>
                    </View>
                    <Text style={styles.deadlineDate}>
                      {formatDistanceToNow(new Date(deadline.deadline_date), { addSuffix: true })}
                    </Text>
                    <Text style={styles.deadlineDescription}>{deadline.description}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* AI Alert */}
            <View style={[styles.card, styles.aiAlertCard]}>
              <View style={styles.aiAlertHeader}>
                <Ionicons name="information-circle" size={24} color={Colors.accent.teal} />
                <Text style={styles.aiAlertTitle}>SPCUF Tip</Text>
              </View>
              <Text style={styles.aiAlertText}>
                Document every interaction with CPS. Keep detailed notes with dates, times, and names.
                These records are evidence of your cooperation and can protect you in court.
              </Text>
            </View>
          </>
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
  greeting: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
  },
  userName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.xl,
    color: Colors.white.pure,
  },
  logoutButton: {
    padding: Spacing.sm,
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
  card: {
    backgroundColor: Colors.black.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.silver.border,
  },
  activeCaseCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.steel,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.bright,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.lg,
    color: Colors.white.soft,
    marginBottom: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    backgroundColor: Colors.black.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.silver.border,
    borderLeftWidth: 3,
    width: '48%',
    alignItems: 'center',
  },
  actionText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.sm,
    color: Colors.white.soft,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  deadlineCard: {
    backgroundColor: Colors.black.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.silver.border,
    borderLeftWidth: 3,
  },
  deadlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  deadlineType: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.sm,
    color: Colors.white.soft,
    marginLeft: Spacing.sm,
  },
  deadlineDate: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.accent.amber,
    marginBottom: Spacing.xs,
  },
  deadlineDescription: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
  },
  aiAlertCard: {
    backgroundColor: Colors.accent.tealGlow,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.teal,
  },
  aiAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  aiAlertTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.base,
    color: Colors.white.soft,
    marginLeft: Spacing.sm,
  },
  aiAlertText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.bright,
    lineHeight: 20,
  },
});
