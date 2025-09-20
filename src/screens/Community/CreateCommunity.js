// src/screens/Community/CreateCommunity.js
'use strict';

import React, {useCallback, useEffect, useMemo, useState, Suspense, lazy} from 'react';
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import Text from '../../components/Text';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Routes from '../../helper/routes';

// --- UI Palette ---
export const PALETTE = {
  background: COLORS.greyF7F7F7,
  surface: COLORS.whiteFFFFFF,
  primary: COLORS.blue043142,
  accent: COLORS.yellowF5BE00,
  muted: COLORS.grey777777,
  subtle: COLORS.grey999999,
  border: COLORS.greyEEEEEE,
  danger: COLORS.redEA4335,
};

// --- Data Constants ---
export const COMMUNITY_TYPES = [
  {key: 'interest', label: 'Interest Club', description: 'For shared passions and hobbies.', icon: 'heart-outline'},
  {key: 'skill', label: 'Skill Guild', description: 'For peer learning and projects.', icon: 'code-slash-outline'},
  {key: 'institutional', label: 'Institutional', description: 'Official campus or organization hub.', icon: 'business-outline'},
  {key: 'open', label: 'Open Hub', description: 'Public space with flexible membership.', icon: 'globe-outline'},
];

export const VISIBILITY_OPTIONS = [
  {key: 'public', label: 'Public', description: 'Visible to everyone in search.', icon: 'earth-outline'},
  {key: 'protected', label: 'Protected', description: 'Visible, but posts are private.', icon: 'eye-outline'},
  {key: 'private', label: 'Private', description: 'Hidden & invite-only.', icon: 'lock-closed-outline'},
];

export const JOIN_METHODS = [
  {key: 'open', label: 'Instant Join', description: 'Anyone can join immediately.', icon: 'flash-outline'},
  {key: 'approval', label: 'Approval Required', description: 'Admins approve each request.', icon: 'shield-checkmark-outline'},
  {key: 'invite_only', label: 'Invite Only', description: 'Only invited members can join.', icon: 'mail-outline'},
];

const STEP_LABELS = ['Basics', 'Access', 'Details & Preview'];

// Lazy load step components
const StepBasics = lazy(() => import('./StepBasics'));
const StepAccess = lazy(() => import('./StepAccess'));
const StepDetails = lazy(() => import('./StepDetails'));

// Helper function
const formatDomains = domains => domains.map(domain => ({domain, verified: true}));

// Memoized Stepper Component
const Stepper = React.memo(({step}) => (
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
));

// Loading component
const StepLoader = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={PALETTE.primary} />
  </View>
);

const CreateCommunity = ({navigation}) => {
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  
  // Deferred UI states
  const [gradientLoaded, setGradientLoaded] = useState(false);
  const [LinearGradientComponent, setLinearGradientComponent] = useState(null);
  
  // Lazy load API module
  const [apiModule, setApiModule] = useState(null);
  
  // Core form state - initialized only when needed
  const [formState, setFormState] = useState(() => ({
    name: '',
    description: '',
    communityType: 'interest',
    visibility: 'public',
    joinMethod: 'open',
    searchable: true,
    domains: [],
    tags: [],
    welcomeMessage: ''
  }));
  
  // Current input states
  const [currentDomain, setCurrentDomain] = useState('');
  const [currentTag, setCurrentTag] = useState('');

  // Load LinearGradient after initial render
  useEffect(() => {
    InteractionManager.runAfterInteractions(async () => {
      const module = await import('react-native-linear-gradient');
      setLinearGradientComponent(() => module.default);
      setGradientLoaded(true);
    });
  }, []);

  // Lazy load API when needed
  const getApiModule = useCallback(async () => {
    if (!apiModule) {
      const module = await import('../../services/apiService');
      setApiModule(module);
      return module;
    }
    return apiModule;
  }, [apiModule]);

  // Optimized callbacks with batch updates
  const updateFormField = useCallback((field, value) => {
    setFormState(prev => ({...prev, [field]: value}));
  }, []);

  const addDomain = useCallback(() => {
    const value = currentDomain.trim().toLowerCase();
    if (!value || !value.includes('.')) return;
    setFormState(prev => ({
      ...prev,
      domains: [...new Set([...prev.domains, value])]
    }));
    setCurrentDomain('');
  }, [currentDomain]);

  const removeDomain = useCallback((domain) => {
    setFormState(prev => ({
      ...prev,
      domains: prev.domains.filter(item => item !== domain)
    }));
  }, []);

  const addTag = useCallback(() => {
    const value = currentTag.trim().replace(/\s+/g, '-');
    if (!value || formState.tags.length >= 5) return;
    setFormState(prev => ({
      ...prev,
      tags: [...new Set([...prev.tags, value])]
    }));
    setCurrentTag('');
  }, [currentTag, formState.tags.length]);

  const removeTag = useCallback((tag) => {
    setFormState(prev => ({
      ...prev,
      tags: prev.tags.filter(item => item !== tag)
    }));
  }, []);

  const handleTypeSelect = useCallback((type) => {
    setFormState(prev => ({
      ...prev,
      communityType: type,
      domains: type !== 'institutional' ? [] : prev.domains
    }));
  }, []);

  // Validation memoization
  const basicsValid = useMemo(() => 
    formState.name.trim().length >= 3 && formState.description.trim().length >= 10, 
    [formState.name, formState.description]
  );
  
  const accessValid = useMemo(() => 
    formState.communityType !== 'institutional' || formState.domains.length > 0, 
    [formState.communityType, formState.domains]
  );

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
    name: formState.name.trim(),
    description: formState.description.trim(),
    type: formState.communityType,
    privacy: { 
      visibility: formState.visibility, 
      joinMethod: formState.joinMethod, 
      searchable: formState.searchable 
    },
    tags: formState.tags,
    welcomeMessage: formState.welcomeMessage.trim() || undefined,
    ...(formState.communityType === 'institutional' && {
      institutionalInfo: { verifiedDomains: formatDomains(formState.domains) },
    }),
  }), [formState]);
  
  const handleCreate = useCallback(async () => {
    if (!basicsValid || !accessValid || creating) return;
    setCreating(true);
    
    try {
      const api = await getApiModule();
      const payload = buildPayload();
      const response = await api.createCommunityApi(payload);
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
  }, [accessValid, basicsValid, buildPayload, creating, navigation, getApiModule]);

  // Props for step components
  const stepProps = {
    formState,
    updateFormField,
    handleTypeSelect,
    currentDomain,
    setCurrentDomain,
    currentTag,
    setCurrentTag,
    addDomain,
    removeDomain,
    addTag,
    removeTag
  };

  const HeaderComponent = gradientLoaded && LinearGradientComponent ? LinearGradientComponent : View;
  const headerStyle = gradientLoaded 
    ? styles.headerGradient 
    : [styles.headerGradient, {backgroundColor: PALETTE.primary}];
  const headerProps = gradientLoaded 
    ? {colors: [PALETTE.primary, '#0E4F62'], style: styles.headerGradient}
    : {style: headerStyle};

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        
        <HeaderComponent {...headerProps}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Icon name="close" size={nw(22)} color={COLORS.whiteFFFFFF} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Community</Text>
        </HeaderComponent>

        <Stepper step={step} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Suspense fallback={<StepLoader />}>
            {step === 0 && <StepBasics {...stepProps} />}
            {step === 1 && <StepAccess {...stepProps} />}
            {step === 2 && <StepDetails {...stepProps} />}
          </Suspense>
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
  headerGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: nw(16), 
    paddingTop: nh(5),
    paddingBottom: nh(6),
    gap: nw(16),
  },
  headerButton: { 
    padding: nw(18) 
  },
  headerTitle: { 
    color: COLORS.whiteFFFFFF, 
    fontSize: nw(18),
    fontWeight: 'bold',
  },
  stepperContainer: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    justifyContent: 'space-between', 
    paddingHorizontal: nw(20), 
    paddingTop: nh(20), 
    paddingBottom: nh(10), 
    backgroundColor: PALETTE.surface 
  },
  stepperTrack: { 
    position: 'absolute', 
    height: 2, 
    backgroundColor: PALETTE.border, 
    top: nh(34), 
    left: '25%', 
    right: '25%' 
  },
  stepperProgress: { 
    position: 'absolute', 
    height: 2, 
    backgroundColor: PALETTE.primary, 
    top: nh(34), 
    left: '25%' 
  },
  step: { alignItems: 'center', width: '33%' },
  stepCircle: { 
    width: nw(32), 
    height: nw(32), 
    borderRadius: nw(16), 
    borderWidth: 2, 
    borderColor: PALETTE.border, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: PALETTE.surface 
  },
  stepCompleted: { backgroundColor: PALETTE.primary, borderColor: PALETTE.primary },
  stepActive: { borderColor: PALETTE.primary },
  stepNumber: { color: PALETTE.subtle, fontSize: nw(14), fontWeight: '600' },
  stepNumberActive: { color: PALETTE.primary },
  stepLabel: { color: PALETTE.subtle, fontSize: nw(12), marginTop: nh(8), textAlign: 'center' },
  stepLabelActive: { color: PALETTE.primary, fontWeight: '600' },
  scrollContent: { padding: nw(16), paddingBottom: nh(100) },
  loadingContainer: {
    height: nh(300),
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  footerButton: { 
    flex: 1, 
    borderRadius: nw(14), 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: nh(14) 
  },
  footerButtonText: { fontSize: nw(15), fontWeight: '600', color: PALETTE.muted },
  footerButtonPrimary: { backgroundColor: PALETTE.primary },
  footerButtonTextPrimary: { color: PALETTE.surface },
  disabledButton: { backgroundColor: PALETTE.muted },
});

export default CreateCommunity;