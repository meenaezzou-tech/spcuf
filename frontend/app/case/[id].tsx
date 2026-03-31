import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { caseAPI, contactAPI, deadlineAPI } from '../../src/services/api';
import { Case, Contact, Deadline, TimelineEvent } from '../../src/types';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function CaseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  const handleDelete = () => {
    Alert.alert(
      'Delete Case',
      'Are you sure you want to delete this case? All related timeline events, contacts, deadlines, and documents will be permanently removed. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await caseAPI.deleteCase(id as string);
      Alert.alert('Success', 'Case deleted successfully', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/cases') },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete case');
      setIsDeleting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!caseData) return;
    setIsExporting(true);

    try {
      // Gather all related data in parallel
      let timeline: TimelineEvent[] = [];
      let contacts: Contact[] = [];
      let deadlines: Deadline[] = [];

      try {
        const [t, c, d] = await Promise.all([
          caseAPI.getTimeline(id as string),
          contactAPI.getContacts(id as string),
          deadlineAPI.getDeadlines(id as string),
        ]);
        timeline = t || [];
        contacts = c || [];
        deadlines = d || [];
      } catch (err) {
        console.log('Some related data unavailable:', err);
      }

      const html = generatePDFHtml(caseData, timeline, contacts, deadlines);

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `SPCUF Case Report - ${caseData.case_id_display}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Export Complete', `PDF saved to: ${uri}`);
      }
    } catch (error: any) {
      console.error('PDF Export error:', error);
      Alert.alert('Export Failed', error.message || 'Could not generate PDF report');
    } finally {
      setIsExporting(false);
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
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleExportPDF}
            style={styles.headerActionBtn}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={Colors.accent.teal} />
            ) : (
              <Ionicons name="download-outline" size={22} color={Colors.accent.teal} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.headerActionBtn}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={Colors.accent.crimson} />
            ) : (
              <Ionicons name="trash" size={22} color={Colors.accent.crimson} />
            )}
          </TouchableOpacity>
        </View>
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
          <Text style={styles.caseId} numberOfLines={1} adjustsFontSizeToFit>
            {caseData.case_id_display}
          </Text>
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

        {/* Parties */}
        {caseData.parties && caseData.parties.length > 0 && (
          <View style={[styles.card, { borderLeftColor: Colors.accent.lavender }]}>
            <Text style={styles.cardTitle}>Parties Involved</Text>
            {caseData.parties.map((party, idx) => (
              <View key={idx} style={styles.partyRow}>
                <Ionicons name="person" size={16} color={Colors.accent.lavender} />
                <View style={styles.partyInfo}>
                  <Text style={styles.partyName}>{party.name}</Text>
                  <Text style={styles.partyRole}>{party.relationship}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Allegations */}
        {caseData.allegations && caseData.allegations.length > 0 && (
          <View style={[styles.card, { borderLeftColor: Colors.accent.crimson }]}>
            <Text style={styles.cardTitle}>Allegations</Text>
            {caseData.allegations.map((a, idx) => (
              <View key={idx} style={styles.allegationRow}>
                <View style={styles.allegationBadge}>
                  <Text style={styles.allegationBadgeText}>{a.finding || 'Pending'}</Text>
                </View>
                <Text style={styles.allegationType}>{a.type}</Text>
                {a.details && <Text style={styles.detailText}>{a.details}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Court Info */}
        {caseData.court_info && (caseData.court_info.court_name || caseData.court_info.cause_number) && (
          <View style={[styles.card, { borderLeftColor: Colors.accent.copper }]}>
            <Text style={styles.cardTitle}>Court Information</Text>
            {caseData.court_info.cause_number && (
              <Text style={styles.detailText}>Cause #: {caseData.court_info.cause_number}</Text>
            )}
            {caseData.court_info.court_name && (
              <Text style={styles.detailText}>Court: {caseData.court_info.court_name}</Text>
            )}
            {caseData.court_info.judge_name && (
              <Text style={styles.detailText}>Judge: {caseData.court_info.judge_name}</Text>
            )}
            {caseData.court_info.next_hearing_date && (
              <Text style={[styles.detailText, { color: Colors.accent.amber }]}>
                Next Hearing: {new Date(caseData.court_info.next_hearing_date).toLocaleDateString()}
                {caseData.court_info.next_hearing_type ? ` (${caseData.court_info.next_hearing_type})` : ''}
              </Text>
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

        {/* Export PDF Banner */}
        <TouchableOpacity
          style={styles.exportBanner}
          onPress={handleExportPDF}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator color={Colors.accent.teal} />
          ) : (
            <Ionicons name="document-text" size={24} color={Colors.accent.teal} />
          )}
          <View style={styles.exportBannerText}>
            <Text style={styles.exportTitle}>Export Full Case Report</Text>
            <Text style={styles.exportSubtitle}>
              PDF with case summary, timeline, parties, and deadlines
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.silver.mid} />
        </TouchableOpacity>

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
            onPress={() => router.push('/documents')}
          >
            <Ionicons name="document" size={20} color={Colors.accent.copper} />
            <Text style={styles.actionButtonText}>Case Documents</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.silver.mid} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { borderLeftColor: Colors.accent.steel }]}
            onPress={() => router.push('/contacts')}
          >
            <Ionicons name="people" size={20} color={Colors.accent.steel} />
            <Text style={styles.actionButtonText}>Contacts</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.silver.mid} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { borderLeftColor: Colors.accent.teal }]}
            onPress={() => router.push('/deadlines')}
          >
            <Ionicons name="calendar" size={20} color={Colors.accent.teal} />
            <Text style={styles.actionButtonText}>Deadlines & Hearings</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.silver.mid} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function generatePDFHtml(
  caseData: Case,
  timeline: TimelineEvent[],
  contacts: Contact[],
  deadlines: Deadline[]
): string {
  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return d; }
  };

  const partiesHtml = caseData.parties?.length
    ? caseData.parties.map(p => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${p.name}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${p.relationship}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${p.dob ? formatDate(p.dob) : 'N/A'}</td>
      </tr>`).join('')
    : '<tr><td style="padding:6px 12px;" colspan="3">No parties recorded</td></tr>';

  const allegationsHtml = caseData.allegations?.length
    ? caseData.allegations.map(a => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${a.type}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">
          <span style="background:${a.finding === 'Substantiated' ? '#fef3c7' : '#f0fdf4'};padding:2px 8px;border-radius:4px;font-size:11px;">${a.finding || 'Pending'}</span>
        </td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${a.details || ''}</td>
      </tr>`).join('')
    : '<tr><td style="padding:6px 12px;" colspan="3">No allegations recorded</td></tr>';

  const timelineHtml = timeline.length
    ? timeline.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
      .map(e => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">${formatDate(e.event_date)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">
          <span style="background:#dbeafe;padding:2px 8px;border-radius:4px;font-size:11px;">${e.event_type}</span>
        </td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${e.description}</td>
      </tr>`).join('')
    : '<tr><td style="padding:6px 12px;" colspan="3">No timeline events recorded</td></tr>';

  const contactsHtml = contacts.length
    ? contacts.map(c => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${c.name}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${c.contact_type}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${c.phone || ''}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${c.email || ''}</td>
      </tr>`).join('')
    : '<tr><td style="padding:6px 12px;" colspan="4">No contacts recorded</td></tr>';

  const deadlinesHtml = deadlines.length
    ? deadlines.map(d => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${d.deadline_type}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${formatDate(d.deadline_date)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">
          <span style="color:${d.completed ? '#16a34a' : '#dc2626'};">${d.completed ? 'Completed' : 'Pending'}</span>
        </td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${d.description}</td>
      </tr>`).join('')
    : '<tr><td style="padding:6px 12px;" colspan="4">No deadlines calculated</td></tr>';

  const courtHtml = caseData.court_info
    ? `<div style="margin-bottom:8px;">
        ${caseData.court_info.cause_number ? `<p><strong>Cause Number:</strong> ${caseData.court_info.cause_number}</p>` : ''}
        ${caseData.court_info.court_name ? `<p><strong>Court:</strong> ${caseData.court_info.court_name}</p>` : ''}
        ${caseData.court_info.judge_name ? `<p><strong>Judge:</strong> ${caseData.court_info.judge_name}</p>` : ''}
        ${caseData.court_info.next_hearing_date ? `<p><strong>Next Hearing:</strong> ${formatDate(caseData.court_info.next_hearing_date)} ${caseData.court_info.next_hearing_type ? `(${caseData.court_info.next_hearing_type})` : ''}</p>` : ''}
       </div>`
    : '<p>No court information recorded</p>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; font-size: 12px; line-height: 1.5; padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #060606; padding-bottom: 20px; }
    .header h1 { font-size: 24px; letter-spacing: 4px; color: #060606; margin-bottom: 4px; }
    .header .subtitle { font-size: 10px; color: #6b7280; letter-spacing: 2px; text-transform: uppercase; }
    .header .case-id { font-family: 'Courier New', monospace; font-size: 16px; margin-top: 12px; color: #374151; }
    .header .gen-date { font-size: 10px; color: #9ca3af; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 700; color: #060606; border-bottom: 1px solid #d1d5db; padding-bottom: 6px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .info-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
    .info-item { flex: 1; min-width: 180px; }
    .info-item label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-item .value { font-size: 13px; font-weight: 600; color: #111827; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f3f4f6; padding: 8px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #d1d5db; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #d1d5db; text-align: center; font-size: 9px; color: #9ca3af; }
    .notes-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; font-size: 12px; white-space: pre-wrap; }
    p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>S P C U F</h1>
    <div class="subtitle">Supporting Parents, Children, United Families</div>
    <div class="case-id">${caseData.case_id_display}</div>
    <div class="gen-date">Report Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
  </div>

  <div class="section">
    <div class="section-title">Case Summary</div>
    <div class="info-grid">
      <div class="info-item"><label>Case ID</label><div class="value">${caseData.case_id_display}</div></div>
      <div class="info-item"><label>Status</label><div class="value">${caseData.current_stage}</div></div>
      <div class="info-item"><label>Date Opened</label><div class="value">${caseData.date_opened ? formatDate(caseData.date_opened) : 'N/A'}</div></div>
      <div class="info-item"><label>Investigation Type</label><div class="value">${caseData.investigation_type || 'N/A'}</div></div>
    </div>
    <div class="info-grid">
      <div class="info-item"><label>DFPS Region</label><div class="value">${caseData.dfps_region || 'N/A'}</div></div>
      <div class="info-item"><label>DFPS Unit</label><div class="value">${caseData.dfps_unit || 'N/A'}</div></div>
      <div class="info-item"><label>Investigator</label><div class="value">${caseData.investigator_name || 'N/A'}</div></div>
      <div class="info-item"><label>Supervisor</label><div class="value">${caseData.supervisor_name || 'N/A'}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Court Information</div>
    ${courtHtml}
  </div>

  <div class="section">
    <div class="section-title">Parties Involved</div>
    <table><thead><tr><th>Name</th><th>Relationship</th><th>DOB</th></tr></thead><tbody>${partiesHtml}</tbody></table>
  </div>

  <div class="section">
    <div class="section-title">Allegations</div>
    <table><thead><tr><th>Type</th><th>Finding</th><th>Details</th></tr></thead><tbody>${allegationsHtml}</tbody></table>
  </div>

  <div class="section">
    <div class="section-title">Case Timeline</div>
    <table><thead><tr><th>Date</th><th>Type</th><th>Description</th></tr></thead><tbody>${timelineHtml}</tbody></table>
  </div>

  <div class="section">
    <div class="section-title">Case Contacts</div>
    <table><thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Email</th></tr></thead><tbody>${contactsHtml}</tbody></table>
  </div>

  <div class="section">
    <div class="section-title">Deadlines & Hearings</div>
    <table><thead><tr><th>Type</th><th>Date</th><th>Status</th><th>Description</th></tr></thead><tbody>${deadlinesHtml}</tbody></table>
  </div>

  ${caseData.notes ? `
  <div class="section">
    <div class="section-title">Case Notes</div>
    <div class="notes-box">${caseData.notes}</div>
  </div>` : ''}

  <div class="footer">
    <p>SPCUF Case Management Report &bull; Confidential Legal Document &bull; ${new Date().getFullYear()}</p>
    <p>This document was generated by SPCUF and is intended for the case participant's personal records.</p>
  </div>
</body>
</html>`;
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
    justifyContent: 'space-between',
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
    flex: 1,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: Typography.sizes.xl,
    color: Colors.white.pure,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: Typography.sizes.base,
    color: Colors.white.soft,
    marginBottom: Spacing.sm,
  },
  detailText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
    marginTop: 4,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.silver.border,
  },
  partyInfo: {
    marginLeft: Spacing.md,
  },
  partyName: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.sm,
    color: Colors.white.soft,
  },
  partyRole: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.xs,
    color: Colors.silver.mid,
  },
  allegationRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.silver.border,
  },
  allegationBadge: {
    backgroundColor: Colors.accent.crimson + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  allegationBadgeText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.xs,
    color: Colors.accent.crimson,
  },
  allegationType: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.sm,
    color: Colors.white.soft,
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
    marginTop: Spacing.xxl,
  },
  exportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.tealGlow,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent.tealBorder,
  },
  exportBannerText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  exportTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.base,
    color: Colors.white.soft,
  },
  exportSubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.xs,
    color: Colors.silver.bright,
    marginTop: 2,
  },
  actionsContainer: {
    marginTop: Spacing.sm,
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
