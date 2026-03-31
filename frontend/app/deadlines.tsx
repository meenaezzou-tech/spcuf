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
import { caseAPI, deadlineAPI } from '../src/services/api';
import { Case, Deadline } from '../src/types';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow, format } from 'date-fns';

export default function DeadlinesScreen() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const casesData = await caseAPI.getCases();
      setCases(casesData);
      
      if (casesData.length > 0) {
        const deadlinesData = await deadlineAPI.getDeadlines(casesData[0].id);
        setDeadlines(deadlinesData);
      }
    } catch (error) {
      console.error('Error loading deadlines:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleComplete = async (deadline: Deadline) => {
    setTogglingId(deadline.id);
    try {
      await deadlineAPI.updateDeadline(deadline.id, !deadline.completed);
      setDeadlines(prev =>
        prev.map(d => d.id === deadline.id ? { ...d, completed: !d.completed } : d)
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update deadline');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteDeadline = (deadline: Deadline) => {
    Alert.alert(
      'Delete Deadline',
      `Are you sure you want to delete "${deadline.deadline_type}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(deadline.id),
        },
      ]
    );
  };

  const confirmDelete = async (deadlineId: string) => {
    setDeletingId(deadlineId);
    try {
      await deadlineAPI.deleteDeadline(deadlineId);
      setDeadlines(prev => prev.filter(d => d.id !== deadlineId));
      Alert.alert('Deleted', 'Deadline removed successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete deadline');
    } finally {
      setDeletingId(null);
    }
  };

  const getDeadlineStatus = (deadline: Deadline) => {
    if (deadline.completed) return 'completed';
    const deadlineDate = new Date(deadline.deadline_date);
    const now = new Date();
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 7) return 'urgent';
    if (daysUntil <= 30) return 'upcoming';
    return 'future';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return Colors.accent.crimson;
      case 'urgent': return Colors.accent.amber;
      case 'upcoming': return Colors.accent.teal;
      case 'completed': return Colors.accent.sage;
      default: return Colors.silver.bright;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent.amber} />
      </View>
    );
  }

  const upcomingDeadlines = deadlines.filter(d => !d.completed && new Date(d.deadline_date) >= new Date());
  const overdueDeadlines = deadlines.filter(d => !d.completed && new Date(d.deadline_date) < new Date());
  const completedDeadlines = deadlines.filter(d => d.completed);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white.soft} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Deadlines & Hearings</Text>
          <Text style={styles.headerSubtitle}>Track Important Dates</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent.amber} />
        }
      >
        {deadlines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={Colors.silver.mid} />
            <Text style={styles.emptyTitle}>No Deadlines Tracked</Text>
            <Text style={styles.emptyText}>
              Deadlines will appear here once you add them to your case or calculate statutory deadlines.
            </Text>
          </View>
        ) : (
          <>
            {/* Overdue Deadlines */}
            {overdueDeadlines.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="warning" size={18} color={Colors.accent.crimson} />
                  <Text style={[styles.sectionTitle, { color: Colors.accent.crimson }]}>
                    Overdue ({overdueDeadlines.length})
                  </Text>
                </View>
                {overdueDeadlines.map((deadline) => renderDeadlineCard(deadline, 'overdue'))}
              </>
            )}

            {/* Upcoming Deadlines */}
            {upcomingDeadlines.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="time" size={18} color={Colors.accent.amber} />
                  <Text style={styles.sectionTitle}>Upcoming ({upcomingDeadlines.length})</Text>
                </View>
                {upcomingDeadlines.map((deadline) => renderDeadlineCard(deadline, getDeadlineStatus(deadline)))}
              </>
            )}

            {/* Completed Deadlines */}
            {completedDeadlines.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.accent.sage} />
                  <Text style={[styles.sectionTitle, { color: Colors.accent.sage }]}>
                    Completed ({completedDeadlines.length})
                  </Text>
                </View>
                {completedDeadlines.map((deadline) => renderDeadlineCard(deadline, 'completed'))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );

  function renderDeadlineCard(deadline: Deadline, status: string) {
    const statusColor = getStatusColor(status);
    const isCompleted = deadline.completed;

    return (
      <View
        key={deadline.id}
        style={[
          styles.deadlineCard,
          { borderLeftColor: statusColor },
          isCompleted && { opacity: 0.6 },
        ]}
      >
        <View style={styles.deadlineHeader}>
          <View style={styles.deadlineHeaderLeft}>
            <TouchableOpacity
              onPress={() => handleToggleComplete(deadline)}
              disabled={togglingId === deadline.id}
              style={styles.checkButton}
            >
              {togglingId === deadline.id ? (
                <ActivityIndicator size="small" color={statusColor} />
              ) : (
                <Ionicons
                  name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={statusColor}
                />
              )}
            </TouchableOpacity>
            <Text style={[styles.deadlineType, isCompleted && styles.completedText]}>
              {deadline.deadline_type}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteDeadline(deadline)}
            disabled={deletingId === deadline.id}
            style={styles.deleteIconButton}
          >
            {deletingId === deadline.id ? (
              <ActivityIndicator size="small" color={Colors.accent.crimson} />
            ) : (
              <Ionicons name="trash-outline" size={18} color={Colors.accent.crimson} />
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.deadlineDate, isCompleted && styles.completedText]}>
          {format(new Date(deadline.deadline_date), 'MMMM d, yyyy')}
        </Text>

        {!isCompleted && (
          <Text style={[styles.deadlineCountdown, { color: statusColor }]}>
            {status === 'overdue'
              ? `Overdue by ${formatDistanceToNow(new Date(deadline.deadline_date))}`
              : formatDistanceToNow(new Date(deadline.deadline_date), { addSuffix: true })}
          </Text>
        )}

        <Text style={styles.deadlineDescription}>{deadline.description}</Text>
      </View>
    );
  }
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
  headerSubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.accent.amber,
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
    maxWidth: 300,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.lg,
    color: Colors.white.soft,
    marginLeft: Spacing.sm,
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
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  deadlineHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deadlineType: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.sm,
    color: Colors.white.soft,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  deadlineDate: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: Typography.sizes.base,
    color: Colors.white.soft,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xxl - 12,
  },
  deadlineCountdown: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.accent.amber,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xxl - 12,
  },
  deadlineDescription: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
    marginLeft: Spacing.xxl - 12,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: Colors.silver.mid,
  },
});
