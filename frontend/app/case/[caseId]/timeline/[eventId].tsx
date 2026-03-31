import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { caseAPI } from '../../../../src/services/api';
import { TimelineEvent } from '../../../../src/types';
import { Colors, Typography, Spacing, BorderRadius } from '../../../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function TimelineDetailScreen() {
  const router = useRouter();
  const { caseId, eventId } = useLocalSearchParams();
  const [event, setEvent] = useState<TimelineEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEventDetail();
  }, []);

  const loadEventDetail = async () => {
    try {
      const timeline = await caseAPI.getTimeline(caseId as string);
      const foundEvent = timeline.find(e => e.id === eventId);
      if (foundEvent) {
        setEvent(foundEvent);
      }
    } catch (error) {
      console.error('Error loading event:', error);
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

  if (!event) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white.soft} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Timeline Event</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Event Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: Colors.accent.steelGlow }]}>
          <Text style={[styles.typeBadgeText, { color: Colors.accent.steel }]}>
            {event.event_type}
          </Text>
        </View>

        {/* Event Date */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date</Text>
          <Text style={styles.dateText}>
            {format(new Date(event.event_date), 'MMMM d, yyyy')}
          </Text>
          <Text style={styles.timeText}>
            {format(new Date(event.event_date), 'h:mm a')}
          </Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.descriptionText}>{event.description}</Text>
        </View>

        {/* Legal Significance */}
        {event.legal_significance && (
          <View style={[styles.significanceCard, { borderLeftColor: Colors.accent.teal }]}>
            <View style={styles.significanceHeader}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.accent.teal} />
              <Text style={styles.significanceTitle}>Legal Significance</Text>
            </View>
            <Text style={styles.significanceText}>{event.legal_significance}</Text>
            <View style={[styles.aiFlag, { backgroundColor: Colors.accent.tealGlow }]}>
              <Ionicons name="sparkles" size={16} color={Colors.accent.teal} />
              <Text style={[styles.aiFlagText, { color: Colors.accent.teal }]}>
                AI-flagged as legally significant
              </Text>
            </View>
          </View>
        )}

        {/* Why This Matters */}
        <View style={[styles.explanationCard, { borderLeftColor: Colors.accent.amber }]}>
          <Text style={styles.explanationTitle}>Why This Event Matters</Text>
          <Text style={styles.explanationText}>
            {getEventExplanation(event.event_type)}
          </Text>
        </View>

        {/* Documents (Placeholder) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Attached Documents</Text>
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={32} color={Colors.silver.mid} />
            <Text style={styles.emptyStateText}>No documents attached to this event</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const getEventExplanation = (eventType: string): string => {
  const explanations: Record<string, string> = {
    'Investigation Opened': 'This marks the official start of the CPS investigation. CPS has 45 days to complete the investigation and 60 days to notify you of their finding in writing.',
    'Home Visit': 'Home visits are required by policy and must be documented. Each visit should focus on assessing safety and your progress on any service plan requirements.',
    'Court Hearing': 'Court hearings are critical checkpoints. The judge will review CPS compliance, your progress, and make decisions about your child\'s placement and your visitation.',
    'Service Completed': 'Completing services demonstrates your commitment to addressing safety concerns. Document all completion certificates and present them at court hearings.',
    'Visitation': 'Regular visitation maintains your parent-child bond and shows the court your ongoing commitment. Document every visit, what you did, and how your child responded.',
    'Placement Change': 'Any change in your child\'s placement should be documented and justified. You have the right to request relative placement at any time.',
    'Default': 'This event is part of your case timeline and should be documented for court. Keep detailed records of all interactions with CPS.',
  };

  return explanations[eventType] || explanations['Default'];
};

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
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 4,
    marginBottom: Spacing.lg,
  },
  typeBadgeText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.bright,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  dateText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.xxl,
    color: Colors.white.soft,
    marginBottom: 4,
  },
  timeText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: Typography.sizes.base,
    color: Colors.silver.mid,
  },
  descriptionText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.base,
    color: Colors.silver.bright,
    lineHeight: 24,
  },
  significanceCard: {
    backgroundColor: Colors.accent.tealGlow,
    borderRadius: 4,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent.tealBorder,
    borderLeftWidth: 3,
  },
  significanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  significanceTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.base,
    color: Colors.white.soft,
    marginLeft: Spacing.sm,
  },
  significanceText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.bright,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  aiFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  aiFlagText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.xs,
    marginLeft: 6,
  },
  explanationCard: {
    backgroundColor: Colors.black.card,
    borderRadius: 4,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent.amberBorder,
    borderLeftWidth: 3,
  },
  explanationTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.base,
    color: Colors.white.soft,
    marginBottom: Spacing.sm,
  },
  explanationText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.bright,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.black.card,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.silver.border,
  },
  emptyStateText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
    marginTop: Spacing.sm,
  },
  errorText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.base,
    color: Colors.silver.mid,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});
