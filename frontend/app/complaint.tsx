import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ComplaintScreen() {
  const router = useRouter();

  const complaintOptions = [
    {
      id: 'ombudsman',
      title: 'DFPS Ombudsman',
      description: 'Internal DFPS oversight for policy violations and caseworker conduct',
      icon: 'shield',
      color: Colors.accent.crimson,
      canDo: 'Investigate complaints, mediate disputes, recommend policy changes',
      cannot: 'Cannot overturn court orders or fire employees',
      phone: '1-800-252-8154',
      website: 'https://www.dfps.texas.gov/Contact_Us/ombudsman.asp',
    },
    {
      id: 'hhsc',
      title: 'HHSC Complaint',
      description: 'Health and Human Services Commission oversight',
      icon: 'medkit',
      color: Colors.accent.amber,
      canDo: 'Investigate DFPS, licensing issues, health and safety violations',
      cannot: 'Cannot provide legal advice or represent you',
      phone: '1-800-458-9858',
      website: 'https://hhs.texas.gov/about/contact-us',
    },
    {
      id: 'civil_rights',
      title: 'HHS Office for Civil Rights',
      description: 'Federal civil rights violations (discrimination based on race, disability, etc.)',
      icon: 'flag',
      color: Colors.accent.steel,
      canDo: 'Investigate discrimination, retaliation, civil rights violations',
      cannot: 'Cannot address routine CPS decisions',
      phone: '1-800-368-1019',
      website: 'https://www.hhs.gov/ocr/index.html',
    },
    {
      id: 'state_bar',
      title: 'Texas State Bar',
      description: 'Attorney misconduct or ethical violations',
      icon: 'briefcase',
      color: Colors.accent.teal,
      canDo: 'Discipline attorneys, investigate ethical violations',
      cannot: 'Cannot give legal advice or reverse court decisions',
      phone: '1-800-932-1900',
      website: 'https://www.texasbar.com/grievance',
    },
    {
      id: 'casa',
      title: 'Request CASA Involvement',
      description: 'Court Appointed Special Advocate for your child',
      icon: 'people',
      color: Colors.accent.lavender,
      canDo: 'Independent advocate for child, report to judge, recommend placement',
      cannot: 'Cannot be your advocate or give you legal advice',
      phone: '1-800-628-3233',
      website: 'https://texascasa.org',
    },
    {
      id: 'legislature',
      title: 'Contact Your State Legislator',
      description: 'Policy change, systemic issues, legislative advocacy',
      icon: 'megaphone',
      color: Colors.accent.sage,
      canDo: 'Advocate for policy changes, investigate systemic issues',
      cannot: 'Cannot intervene in individual cases directly',
      website: 'https://wrm.capitol.texas.gov/home',
    },
  ];

  const handleCall = (phone: string) => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      Linking.openURL(`tel:${cleanPhone}`);
    }
  };

  const handleLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white.soft} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>File a Complaint</Text>
          <Text style={styles.headerSubtitle}>Report Violations & Misconduct</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.warningCard, { borderLeftColor: Colors.accent.crimson }]}>
          <Ionicons name="alert-circle" size={20} color={Colors.accent.crimson} />
          <Text style={styles.warningText}>
            Document everything before filing a complaint: dates, times, names, witnesses, and what specifically was violated. Keep copies of all correspondence.
          </Text>
        </View>

        {complaintOptions.map((option) => (
          <View
            key={option.id}
            style={[styles.optionCard, { borderLeftColor: option.color }]}
          >
            <View style={styles.optionHeader}>
              <Ionicons name={option.icon as any} size={24} color={option.color} />
              <Text style={styles.optionTitle}>{option.title}</Text>
            </View>
            <Text style={styles.optionDescription}>{option.description}</Text>

            <View style={styles.capabilitySection}>
              <Text style={styles.capabilityLabel}>What they CAN do:</Text>
              <Text style={styles.capabilityText}>{option.canDo}</Text>
            </View>

            <View style={styles.capabilitySection}>
              <Text style={styles.capabilityLabel}>What they CANNOT do:</Text>
              <Text style={styles.capabilityTextNeg}>{option.cannot}</Text>
            </View>

            <View style={styles.contactButtons}>
              {option.phone && (
                <TouchableOpacity
                  style={[styles.contactButton, { backgroundColor: option.color + '20' }]}
                  onPress={() => handleCall(option.phone!)}
                >
                  <Ionicons name="call" size={16} color={option.color} />
                  <Text style={[styles.contactButtonText, { color: option.color }]}>
                    {option.phone}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: option.color + '20' }]}
                onPress={() => handleLink(option.website)}
              >
                <Ionicons name="globe" size={16} color={option.color} />
                <Text style={[styles.contactButtonText, { color: option.color }]}>Website</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    color: Colors.accent.crimson,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: Colors.accent.crimsonGlow,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent.crimsonBorder,
    borderLeftWidth: 3,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.bright,
    marginLeft: Spacing.sm,
    lineHeight: 18,
  },
  optionCard: {
    backgroundColor: Colors.black.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.silver.border,
    borderLeftWidth: 3,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  optionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.lg,
    color: Colors.white.soft,
    marginLeft: Spacing.sm,
  },
  optionDescription: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  capabilitySection: {
    marginBottom: Spacing.sm,
  },
  capabilityLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.xs,
    color: Colors.silver.bright,
    marginBottom: 4,
  },
  capabilityText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.accent.sage,
    lineHeight: 18,
  },
  capabilityTextNeg: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
    lineHeight: 18,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.card,
  },
  contactButtonText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.sm,
    marginLeft: Spacing.xs,
  },
});
