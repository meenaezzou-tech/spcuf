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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent.amber} />
      </View>
    );
  }

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
            {/* Upcoming Deadlines */}
            <Text style={styles.sectionTitle}>Upcoming</Text>
            {deadlines
              .filter(d => !d.completed && new Date(d.deadline_date) >= new Date())
              .map((deadline) => (
                <View
                  key={deadline.id}
                  style={[styles.deadlineCard, { borderLeftColor: Colors.accent.amber }]}
                >
                  <View style={styles.deadlineHeader}>
                    <Ionicons name="calendar" size={20} color={Colors.accent.amber} />
                    <Text style={styles.deadlineType}>{deadline.deadline_type}</Text>
                  </View>
                  <Text style={styles.deadlineDate}>
                    {format(new Date(deadline.deadline_date), 'MMMM d, yyyy')}
                  </Text>
                  <Text style={styles.deadlineCountdown}>
                    {formatDistanceToNow(new Date(deadline.deadline_date), { addSuffix: true })}
                  </Text>
                  <Text style={styles.deadlineDescription}>{deadline.description}</Text>
                </View>
              ))}

            {/* Past Deadlines */}
            {deadlines.filter(d => new Date(d.deadline_date) < new Date()).length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Past</Text>
                {deadlines
                  .filter(d => new Date(d.deadline_date) < new Date())
                  .map((deadline) => (
                    <View
                      key={deadline.id}
                      style={[
                        styles.deadlineCard,
                        { borderLeftColor: Colors.silver.mid, opacity: 0.6 },
                      ]}
                    >
                      <View style={styles.deadlineHeader}>
                        <Ionicons name="calendar" size={20} color={Colors.silver.mid} />
                        <Text style={[styles.deadlineType, { color: Colors.silver.mid }]}>
                          {deadline.deadline_type}
                        </Text>
                      </View>
                      <Text style={styles.deadlineDate}>
                        {format(new Date(deadline.deadline_date), 'MMMM d, yyyy')}
                      </Text>
                      <Text style={styles.deadlineDescription}>{deadline.description}</Text>
                    </View>
                  ))}
              </>
            )}
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
  sectionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.lg,
    color: Colors.white.soft,
    marginBottom: Spacing.md,
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
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: Typography.sizes.base,
    color: Colors.white.soft,
    marginBottom: Spacing.xs,
  },
  deadlineCountdown: {
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
});
