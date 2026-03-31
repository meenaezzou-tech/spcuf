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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { caseAPI } from '../../../src/services/api';
import { TimelineEvent, Case } from '../../../src/types';
import { Colors, Typography, Spacing, BorderRadius } from '../../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function CaseTimelineScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [caseResponse, timelineResponse] = await Promise.all([
        caseAPI.getCase(id as string),
        caseAPI.getTimeline(id as string),
      ]);
      setCaseData(caseResponse);
      setTimeline(timelineResponse);
    } catch (error) {
      console.error('Error loading timeline:', error);
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
        <ActivityIndicator size="large" color={Colors.accent.steel} />
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
          <Text style={styles.headerTitle}>Case Timeline</Text>
          {caseData && (
            <Text style={styles.headerSubtitle}>{caseData.case_id_display}</Text>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent.steel} />
        }
      >
        {timeline.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color={Colors.silver.mid} />
            <Text style={styles.emptyTitle}>No Timeline Events</Text>
            <Text style={styles.emptyText}>
              Timeline events will appear here as you document interactions and milestones in your case.
            </Text>
          </View>
        ) : (
          timeline.map((event, index) => (
            <TouchableOpacity
              key={event.id}
              style={[styles.timelineCard, { borderLeftColor: Colors.accent.steel }]}
              onPress={() => router.push(`/case/${id}/timeline/${event.id}`)}
            >
              <View style={styles.timelineHeader}>
                <View style={[styles.typeBadge, { backgroundColor: Colors.accent.steelGlow }]}>
                  <Text style={[styles.typeBadgeText, { color: Colors.accent.steel }]}>
                    {event.event_type}
                  </Text>
                </View>
                {event.legal_significance && (
                  <View style={styles.legalFlag}>
                    <Ionicons name="shield-checkmark" size={16} color={Colors.accent.teal} />
                  </View>
                )}
              </View>
              
              <Text style={styles.eventDate}>
                {format(new Date(event.event_date), 'MMMM d, yyyy')}
              </Text>
              <Text style={styles.eventDescription} numberOfLines={2}>
                {event.description}
              </Text>
              
              <View style={styles.viewDetailButton}>
                <Text style={styles.viewDetailText}>View Details →</Text>
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
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
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
  timelineCard: {
    backgroundColor: Colors.black.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.silver.border,
    borderLeftWidth: 3,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  typeBadgeText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.xs,
  },
  legalFlag: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent.tealGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDate: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: Typography.sizes.base,
    color: Colors.white.soft,
    marginBottom: Spacing.xs,
  },
  eventDescription: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
    lineHeight: 20,
  },
  viewDetailButton: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.silver.border,
  },
  viewDetailText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.sm,
    color: Colors.accent.steel,
  },
});
