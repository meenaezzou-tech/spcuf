import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Case } from '../types';
import { Colors, Typography, Spacing } from '../constants/theme';

interface CaseHealthMeterProps {
  caseData: Case;
  documentsCount: number;
  deadlinesCount: number;
}

export default function CaseHealthMeter({ caseData, documentsCount, deadlinesCount }: CaseHealthMeterProps) {
  const calculateHealthScore = (): number => {
    let score = 0;
    let maxScore = 5;

    // Profile completeness (20 points)
    if (caseData.investigator_name) score += 0.5;
    if (caseData.supervisor_name) score += 0.5;
    if (caseData.investigation_type) score += 0.5;
    if (caseData.date_opened) score += 0.5;

    // Parties documented (20 points)
    if (caseData.parties && caseData.parties.length > 0) score += 1;

    // Documents uploaded (20 points)
    if (documentsCount > 0) score += 0.5;
    if (documentsCount >= 3) score += 0.5;

    // Deadlines tracked (20 points)
    if (deadlinesCount > 0) score += 0.5;
    if (deadlinesCount >= 3) score += 0.5;

    // Service plan items (20 points)
    if (caseData.service_plan_items && caseData.service_plan_items.length > 0) score += 1;

    const percentage = (score / maxScore) * 100;
    return Math.round(percentage);
  };

  const score = calculateHealthScore();
  const getHealthColor = () => {
    if (score >= 70) return Colors.accent.sage;
    if (score >= 40) return Colors.accent.amber;
    return Colors.accent.crimson;
  };

  const getHealthLabel = () => {
    if (score >= 70) return 'Well Documented';
    if (score >= 40) return 'Needs Attention';
    return 'Incomplete';
  };

  const healthColor = getHealthColor();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Case Health</Text>
        <Text style={[styles.scoreText, { color: healthColor }]}>{score}%</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${score}%`, backgroundColor: healthColor }]} />
      </View>
      <Text style={[styles.label, { color: healthColor }]}>{getHealthLabel()}</Text>
      
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{documentsCount}</Text>
          <Text style={styles.metricLabel}>Documents</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{deadlinesCount}</Text>
          <Text style={styles.metricLabel}>Deadlines</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{caseData.service_plan_items?.length || 0}</Text>
          <Text style={styles.metricLabel}>Services</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.black.card,
    borderRadius: 4,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.silver.border,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.base,
    color: Colors.white.soft,
  },
  scoreText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: Typography.sizes.xl,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.black.elevated,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  label: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.md,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.silver.border,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.xl,
    color: Colors.white.soft,
  },
  metricLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.xs,
    color: Colors.silver.mid,
    marginTop: 4,
  },
});
