// src/screens/Community/CreateCommunity.js
'use strict';

import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

import Text from '../../components/Text';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import {createCommunityApi} from '../../services/apiService';
import Routes from '../../helper/routes';

// --- Data Constants ---
const COMMUNITY_TYPES = [
  {key: 'interest', label: 'Interest Club', description: 'For shared passions and hobbies.', icon: 'heart-outline'},
  {key: 'skill', label: 'Skill Guild', description: 'For peer learning and projects.', icon: 'code-slash-outline'},
  {key: 'institutional', label: 'Institutional', description: 'Official campus or organization hub.', icon: 'business-outline'},
  {key: 'open', label: 'Open Hub', description: 'Public space with flexible membership.', icon: 'globe-outline'},
];
const VISIBILITY_OPTIONS = [
  {key: 'public', label: 'Public', description: 'Visible to everyone in search.', icon: 'earth-outline'},
  {key: 'protected', label: 'Protected', description: 'Visible, but posts are private.', icon: 'eye-outline'},
  {key: 'private', label: 'Private', description: 'Hidden & invite-only.', icon: 'lock-closed-outline'},
];
const JOIN_METHODS = [
  {key: 'open', label: 'Instant Join', description: 'Anyone can join immediately.', icon: 'flash-outline'},
  {key: 'approval', label: 'Approval Required', description: 'Admins approve each request.', icon: 'shield-checkmark-outline'},
  {key: 'invite_only', label: 'Invite Only', description: 'Only invited members can join.', icon: 'mail-outline'},
];
const STEP_LABELS = ['Basics', 'Access', 'Details & Preview'];

// --- UI Palette ---
const PALETTE = {
  background: COLORS.greyF7F7F7,
  surface: COLORS.whiteFFFFFF,
  primary: COLORS.blue043142,
  accent: COLORS.yellowF5BE00,
  muted: COLORS.grey777777,
  subtle: COLORS.grey999999,
  border: COLORS.greyEEEEEE,
  danger: COLORS.redEA4335,
};

// --- Helper & Sub-components ---
const formatDomains = domains => domains.map(domain => ({domain, verified: true}));

const Stepper = ({step}) => (
  <View style={styles.stepperContainer}>
    <View style={styles.stepperTrack} />
    <View style={[styles.stepperProgress, {width: `${step * 50}%`}]} />
    {STEP_LABELS.map((label, index) => {
      const isCompleted = index < step;
      const isActive = index === step;
      return (
        <View key={label} style={styles.step}>
          <View style={[styles.stepCircle, isCompleted && styles.stepCompleted, isActive && styles.stepActive]}>
            {isCompleted ? (
              <Icon name="checkmark" size={nw(16)} color={PALETTE.surface} />
            ) : (
              <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>{index + 1}</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{label}</Text>
        </View>
      );
    })}
  </View>
);

const CreateCommunity = ({navigation}) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [communityType, setCommunityType] = useState('interest');
  const [visibility, setVisibility] = useState('public');
  const [joinMethod, setJoinMethod] = useState('open');
  const [searchable, setSearchable] = useState(true);
  const [domains, setDomains] = useState([]);
  const [currentDomain, setCurrentDomain] = useState('');
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [creating, setCreating] = useState(false);

  const addDomain = useCallback(() => {
    const value = currentDomain.trim().toLowerCase();
    if (!value || !value.includes('.')) return;
    setDomains(prev => [...new Set([...prev, value])]);
    setCurrentDomain('');
  }, [currentDomain]);

  const removeDomain = useCallback(domain => setDomains(prev => prev.filter(item => item !== domain)), []);

  const addTag = useCallback(() => {
    const value = currentTag.trim().replace(/\s+/g, '-');
    if (!value || tags.length >= 5) return;
    setTags(prev => [...new Set([...prev, value])]);
    setCurrentTag('');
  }, [currentTag, tags]);

  const removeTag = useCallback(tag => setTags(prev => prev.filter(item => item !== tag)), []);

  const handleTypeSelect = useCallback(type => {
    setCommunityType(type);
    if (type !== 'institutional') setDomains([]);
  }, []);

  const basicsValid = useMemo(() => name.trim().length >= 3 && description.trim().length >= 10, [name, description]);
  const accessValid = useMemo(() => communityType !== 'institutional' || domains.length > 0, [communityType, domains]);

  const handleNext = useCallback(() => {
    if (step === 0 && !basicsValid) {
      Alert.alert('Basics Incomplete', 'Please provide a name (min 3 chars) and description (min 10 chars).');
      return;
    }
    if (step === 1 && !accessValid) {
      Alert.alert('Verification Required', 'Please add at least one email domain for an institutional community.');
      return;
    }
    setStep(prev => Math.min(prev + 1, STEP_LABELS.length - 1));
  }, [accessValid, basicsValid, step]);

  const handleBack = useCallback(() => setStep(prev => Math.max(prev - 1, 0)), []);

  const buildPayload = useCallback(() => ({
    name: name.trim(),
    description: description.trim(),
    type: communityType,
    privacy: { visibility, joinMethod, searchable },
    tags,
    welcomeMessage: welcomeMessage.trim() || undefined,
    ...(communityType === 'institutional' && {
      institutionalInfo: { verifiedDomains: formatDomains(domains) },
    }),
  }), [name, description, communityType, visibility, joinMethod, searchable, tags, welcomeMessage, domains]);
  
  const handleCreate = useCallback(async () => {
    if (!basicsValid || !accessValid || creating) return;
    setCreating(true);
    try {
      const payload = buildPayload();
      const response = await createCommunityApi(payload);
      const communityId = response?.data?.data?.community?.id;

      if (!communityId) throw new Error('Community ID not found in API response.');
      
      Alert.alert('Success!', 'Your community has been created.', [
        { text: 'OK', onPress: () => navigation.replace(Routes.CommunityManagement, {communityId}) }
      ]);
    } catch (error) {
      console.error('Create community error:', error?.response?.data || error.message);
      Alert.alert('Creation Failed', error?.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setCreating(false);
    }
  }, [accessValid, basicsValid, buildPayload, creating, navigation]);

  const renderBasics = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>1. The Basics</Text>
      <Text style={styles.sectionSubtitle}>Choose a name and describe your hub's purpose.</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Community Hub Name"
        placeholderTextColor={PALETTE.subtle}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={[styles.textInput, styles.textArea]}
        placeholder="What is this hub about?"
        placeholderTextColor={PALETTE.subtle}
        multiline
        value={description}
        onChangeText={setDescription}
      />
      <Text style={styles.sectionTitle}>Hub Type</Text>
      {COMMUNITY_TYPES.map(type => (
        <TouchableOpacity
          key={type.key}
          style={[styles.optionCard, communityType === type.key && styles.optionCardActive]}
          onPress={() => handleTypeSelect(type.key)}>
          <Icon name={type.icon} size={nw(22)} color={communityType === type.key ? PALETTE.primary : PALETTE.muted} />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>{type.label}</Text>
            <Text style={styles.optionDescription}>{type.description}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAccess = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>2. Access Control</Text>
      <Text style={styles.sectionSubtitle}>Control who can see and join your hub.</Text>
      <Text style={styles.subheading}>Visibility</Text>
      {VISIBILITY_OPTIONS.map(option => (
        <TouchableOpacity key={option.key} style={[styles.optionCard, visibility === option.key && styles.optionCardActive]} onPress={() => setVisibility(option.key)}>
          <Icon name={option.icon} size={nw(22)} color={visibility === option.key ? PALETTE.primary : PALETTE.muted} />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>{option.label}</Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </View>
        </TouchableOpacity>
      ))}
      <Text style={styles.subheading}>Join Method</Text>
      {JOIN_METHODS.map(option => (
        <TouchableOpacity key={option.key} style={[styles.optionCard, joinMethod === option.key && styles.optionCardActive]} onPress={() => setJoinMethod(option.key)}>
          <Icon name={option.icon} size={nw(22)} color={joinMethod === option.key ? PALETTE.primary : PALETTE.muted} />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>{option.label}</Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </View>
        </TouchableOpacity>
      ))}
      {communityType === 'institutional' && (
        <>
          <Text style={styles.subheading}>Verified Domains</Text>
          <Text style={styles.sectionSubtitle}>Members with a matching email domain can join automatically.</Text>
          <View style={styles.inlineInputRow}>
            <TextInput
              style={styles.inlineInput}
              placeholder="e.g., university.edu"
              value={currentDomain}
              onChangeText={setCurrentDomain}
              onSubmitEditing={addDomain}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity style={styles.inlineAddButton} onPress={addDomain}>
              <Text style={styles.inlineAddText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tokenContainer}>
            {domains.map(domain => (
              <View key={domain} style={styles.tokenChip}><Text style={styles.tokenText}>{domain}</Text><TouchableOpacity onPress={() => removeDomain(domain)}><Icon name="close" size={nw(16)} color={PALETTE.surface} /></TouchableOpacity></View>
            ))}
          </View>
        </>
      )}
      <View style={styles.switchRow}>
        <Text style={styles.optionTitle}>Discoverable in Search</Text>
        <Switch value={searchable} onValueChange={setSearchable} trackColor={{true: PALETTE.primary}} thumbColor={PALETTE.surface} />
      </View>
    </View>
  );

  const renderDetailsAndPreview = () => (
    <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>3. Final Details & Preview</Text>
        <Text style={styles.sectionSubtitle}>Add some finishing touches and see how your hub will look.</Text>
        
        <View style={styles.previewCard}>
            <View style={styles.previewAvatar}>
                <Text style={styles.previewAvatarText}>{name?.[0]?.toUpperCase() || 'C'}</Text>
            </View>
            <View style={styles.previewContent}>
                <Text style={styles.previewTitle} numberOfLines={1}>{name || 'Community Name'}</Text>
                <Text style={styles.previewDescription} numberOfLines={2}>{description || 'Community Description'}</Text>
                <View style={styles.previewStats}>
                    <Text style={styles.previewStatItem}>0 members</Text>
                    <Text style={styles.previewStatSeparator}>•</Text>
                    <Text style={styles.previewStatItem}>{visibility}</Text>
                </View>
            </View>
        </View>

        <Text style={styles.subheading}>Tags (up to 5)</Text>
        <Text style={styles.sectionSubtitle}>Help others discover your hub with relevant tags.</Text>
        <View style={styles.inlineInputRow}>
            <TextInput
                style={styles.inlineInput}
                placeholder="e.g., #product-management"
                value={currentTag}
                onChangeText={setCurrentTag}
                onSubmitEditing={addTag}
            />
            <TouchableOpacity style={styles.inlineAddButton} onPress={addTag} disabled={tags.length >= 5}>
                <Text style={styles.inlineAddText}>Add</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.tokenContainer}>
            {tags.map(tag => (
              <View key={tag} style={styles.tokenChip}><Text style={styles.tokenText}>#{tag}</Text><TouchableOpacity onPress={() => removeTag(tag)}><Icon name="close" size={nw(16)} color={PALETTE.surface} /></TouchableOpacity></View>
            ))}
        </View>

        <Text style={styles.subheading}>Welcome Message (Optional)</Text>
        <Text style={styles.sectionSubtitle}>A brief message shown to new members when they join.</Text>
        <TextInput
            style={[styles.textInput, styles.textArea, {minHeight: nh(100)}]}
            placeholder="Welcome to the hub! We're excited to have you..."
            multiline
            value={welcomeMessage}
            onChangeText={setWelcomeMessage}
        />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        
        <LinearGradient colors={[PALETTE.primary, '#0E4F62']} style={styles.headerGradient}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Icon name="close" size={nw(22)} color={COLORS.whiteFFFFFF} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Community</Text>
        </LinearGradient>

        <Stepper step={step} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {step === 0 && renderBasics()}
          {step === 1 && renderAccess()}
          {step === 2 && renderDetailsAndPreview()}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerButton} onPress={handleBack} disabled={step === 0}>
            <Text style={[styles.footerButtonText, step === 0 && {color: PALETTE.subtle}]}>Back</Text>
          </TouchableOpacity>
          {step < STEP_LABELS.length - 1 ? (
            <TouchableOpacity style={[styles.footerButton, styles.footerButtonPrimary]} onPress={handleNext}>
              <Text style={styles.footerButtonTextPrimary}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.footerButton, styles.footerButtonPrimary, (!basicsValid || !accessValid || creating) && styles.disabledButton]}
              onPress={handleCreate}
              disabled={!basicsValid || !accessValid || creating}>
              {creating ? (
                <ActivityIndicator size="small" color={PALETTE.surface} />
              ) : (
                <Text style={styles.footerButtonTextPrimary}>Create Hub</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PALETTE.background },
  flex: { flex: 1 },
  // Updated Header Styles
  headerGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: nw(16), 
    paddingTop: nh(5), // Increased top padding for more space
    paddingBottom: nh(6), // Slightly increased bottom padding
    gap: nw(16),
  },
  headerButton: { 
    padding: nw(18) 
  },
  headerTitle: { 
    color: COLORS.whiteFFFFFF, 
    fontSize: nw(18), // Slightly larger font size
    fontWeight: 'bold',
  },
  stepperContainer: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: nw(20), paddingTop: nh(20), paddingBottom: nh(10), backgroundColor: PALETTE.surface },
  stepperTrack: { position: 'absolute', height: 2, backgroundColor: PALETTE.border, top: nh(34), left: '25%', right: '25%' },
  stepperProgress: { position: 'absolute', height: 2, backgroundColor: PALETTE.primary, top: nh(34), left: '25%' },
  step: { alignItems: 'center', width: '33%' },
  stepCircle: { width: nw(32), height: nw(32), borderRadius: nw(16), borderWidth: 2, borderColor: PALETTE.border, justifyContent: 'center', alignItems: 'center', backgroundColor: PALETTE.surface },
  stepCompleted: { backgroundColor: PALETTE.primary, borderColor: PALETTE.primary },
  stepActive: { borderColor: PALETTE.primary },
  stepNumber: { color: PALETTE.subtle, fontSize: nw(14), fontWeight: '600' },
  stepNumberActive: { color: PALETTE.primary },
  stepLabel: { color: PALETTE.subtle, fontSize: nw(12), marginTop: nh(8), textAlign: 'center' },
  stepLabelActive: { color: PALETTE.primary, fontWeight: '600' },
  scrollContent: { padding: nw(16), paddingBottom: nh(100) },
  sectionCard: {
    backgroundColor: PALETTE.surface,
    borderRadius: nw(16),
    padding: nw(16),
    marginBottom: nh(16),
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  sectionTitle: { fontSize: nw(18), fontWeight: 'bold', color: PALETTE.primary, marginBottom: nh(4) },
  sectionSubtitle: { fontSize: nw(13), color: PALETTE.muted, marginBottom: nh(16) },
  subheading: { fontSize: nw(15), fontWeight: '600', color: PALETTE.primary, marginTop: nh(16), marginBottom: nh(8) },
  textInput: {
    backgroundColor: PALETTE.background,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(12),
    paddingHorizontal: nw(14),
    paddingVertical: nh(12),
    fontSize: nw(14),
    color: PALETTE.primary,
    marginBottom: nh(16),
  },
  textArea: { minHeight: nh(120), textAlignVertical: 'top' },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(16),
    backgroundColor: PALETTE.background,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: nw(12),
    padding: nw(16),
    marginBottom: nh(10),
  },
  optionCardActive: { borderColor: PALETTE.primary, backgroundColor: PALETTE.primary + '10' },
  optionTextContainer: { flex: 1 },
  optionTitle: { fontSize: nw(14), fontWeight: '600', color: PALETTE.primary },
  optionDescription: { fontSize: nw(12), color: PALETTE.muted, marginTop: nh(2) },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: nh(8),
    marginTop: nh(10),
  },
  inlineInputRow: { flexDirection: 'row', alignItems: 'center', gap: nw(10), marginBottom: nh(10) },
  inlineInput: { flex: 1, backgroundColor: PALETTE.background, borderWidth: 1, borderColor: PALETTE.border, borderRadius: nw(12), paddingHorizontal: nw(14), paddingVertical: nh(12), fontSize: nw(14), color: PALETTE.primary },
  inlineAddButton: { backgroundColor: PALETTE.primary, paddingHorizontal: nw(20), paddingVertical: nh(13), borderRadius: nw(12) },
  inlineAddText: { color: PALETTE.surface, fontWeight: '600', fontSize: nw(14) },
  tokenContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: nw(8) },
  tokenChip: { flexDirection: 'row', alignItems: 'center', gap: nw(6), backgroundColor: PALETTE.primary, borderRadius: nw(16), paddingHorizontal: nw(12), paddingVertical: nh(6) },
  tokenText: { color: PALETTE.surface, fontSize: nw(13) },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.background,
    borderRadius: nw(12),
    padding: nw(16),
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: nh(16),
  },
  previewAvatar: { width: nw(48), height: nw(48), borderRadius: nw(12), backgroundColor: PALETTE.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: nw(12) },
  previewAvatarText: { fontSize: nw(20), fontWeight: 'bold', color: PALETTE.primary },
  previewContent: { flex: 1 },
  previewTitle: { fontSize: nw(15), fontWeight: 'bold', color: PALETTE.primary },
  previewDescription: { fontSize: nw(12), color: PALETTE.muted, marginTop: nh(2) },
  previewStats: { flexDirection: 'row', alignItems: 'center', marginTop: nh(6) },
  previewStatItem: { fontSize: nw(12), color: PALETTE.muted },
  previewStatSeparator: { marginHorizontal: nw(6), color: PALETTE.muted },
  footer: {
    flexDirection: 'row',
    backgroundColor: PALETTE.surface,
    borderTopWidth: 1,
    borderColor: PALETTE.border,
    padding: nw(16),
    gap: nw(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  footerButton: { flex: 1, borderRadius: nw(14), alignItems: 'center', justifyContent: 'center', paddingVertical: nh(14) },
  footerButtonText: { fontSize: nw(15), fontWeight: '600', color: PALETTE.muted },
  footerButtonPrimary: { backgroundColor: PALETTE.primary },
  footerButtonTextPrimary: { color: PALETTE.surface },
  disabledButton: { backgroundColor: PALETTE.muted },
});

export default CreateCommunity;