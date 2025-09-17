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

const COMMUNITY_TYPES = [
  {key: 'interest', label: 'Interest Club', description: 'Run by students or alumni around a shared passion.'},
  {key: 'skill', label: 'Skill Guild', description: 'Upskill-focused community for peer learning and projects.'},
  {key: 'institutional', label: 'Institutional', description: 'Official community linked to a campus or organization.'},
  {key: 'open', label: 'Open', description: 'Public space with flexible membership.'},
];

const INSTITUTION_TYPES = [
  {key: 'university', label: 'University'},
  {key: 'school', label: 'School'},
  {key: 'company', label: 'Company'},
  {key: 'organization', label: 'Organization'},
];

const VISIBILITY_OPTIONS = [
  {key: 'public', label: 'Public', description: 'Visible to everyone, joins controlled by join method.'},
  {key: 'protected', label: 'Protected', description: 'Visible but posts hidden until members join.'},
  {key: 'private', label: 'Private', description: 'Hidden from search; invite-only.'},
];

const JOIN_METHODS = [
  {key: 'open', label: 'Instant join', description: 'Anyone can join immediately.'},
  {key: 'approval', label: 'Request approval', description: 'Admins approve each request.'},
  {key: 'invite_only', label: 'Invite only', description: 'Only invited members can join.'},
];

const FEATURE_OPTIONS = [
  {key: 'allowPosts', label: 'Posts'},
  {key: 'allowPolls', label: 'Polls'},
  {key: 'allowEvents', label: 'Events'},
  {key: 'allowResources', label: 'Resources'},
  {key: 'allowDiscussions', label: 'Discussions'},
];

const STEP_LABELS = ['Basics', 'Access', 'Preview'];

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

const formatDomains = (domains) => domains.map((domain) => ({domain, verified: true}));

const CreateCommunity = ({navigation}) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [communityType, setCommunityType] = useState('interest');
  const [visibility, setVisibility] = useState('public');
  const [joinMethod, setJoinMethod] = useState('open');
  const [searchable, setSearchable] = useState(true);
  const [allowInvites, setAllowInvites] = useState(true);
  const [domains, setDomains] = useState([]);
  const [currentDomain, setCurrentDomain] = useState('');
  const [institutionType, setInstitutionType] = useState('university');
  const [officialName, setOfficialName] = useState('');
  const [institutionUrl, setInstitutionUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [features, setFeatures] = useState({
    allowPosts: true,
    allowPolls: true,
    allowEvents: true,
    allowResources: true,
    allowDiscussions: true,
  });
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [guidelines, setGuidelines] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [creating, setCreating] = useState(false);

  const addDomain = useCallback(() => {
    const value = currentDomain.trim().toLowerCase();
    if (!value) {
      return;
    }
    if (!value.includes('.') || value.startsWith('@')) {
      Alert.alert('Invalid domain', 'Domains should look like “university.edu” without @.');
      return;
    }
    if (domains.includes(value)) {
      return;
    }
    setDomains((prev) => [...prev, value]);
    setCurrentDomain('');
  }, [currentDomain, domains]);

  const removeDomain = useCallback((domain) => {
    setDomains((prev) => prev.filter((item) => item !== domain));
  }, []);

  const addTag = useCallback(() => {
    const value = currentTag.trim();
    if (!value) {
      return;
    }
    if (value.length > 30) {
      Alert.alert('Tag too long', 'Keep tags under 30 characters.');
      return;
    }
    if (tags.includes(value) || tags.length >= 10) {
      return;
    }
    setTags((prev) => [...prev, value]);
    setCurrentTag('');
  }, [currentTag, tags]);

  const removeTag = useCallback((tag) => {
    setTags((prev) => prev.filter((item) => item !== tag));
  }, []);

  const handleTypeSelect = useCallback((type) => {
    setCommunityType(type);
    if (type !== 'institutional') {
      setDomains([]);
    }
  }, []);

  const basicsValid = useMemo(() => name.trim().length >= 4 && description.trim().length >= 10, [name, description]);
  const accessValid = useMemo(() => {
    if (communityType === 'institutional') {
      return domains.length > 0;
    }
    return true;
  }, [communityType, domains.length]);

  const handleNext = useCallback(() => {
    if (step === 0 && !basicsValid) {
      Alert.alert('Basics incomplete', 'Please add a community name (min 4 chars) and description (min 10 chars).');
      return;
    }
    if (step === 1 && !accessValid) {
      Alert.alert('Verification required', 'Add at least one verified domain for institutional communities.');
      return;
    }
    setStep((prev) => Math.min(prev + 1, STEP_LABELS.length - 1));
  }, [accessValid, basicsValid, step]);

  const handleBack = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const buildPayload = useCallback(() => {
    const payload = {
      name: name.trim(),
      description: description.trim(),
      type: communityType,
      privacy: {
        visibility,
        joinMethod,
        searchable,
        allowMemberInvites: allowInvites,
      },
      features,
      tags,
      guidelines: guidelines.trim() || undefined,
      welcomeMessage: welcomeMessage.trim() || undefined,
    };

    if (communityType === 'institutional' && domains.length) {
      payload.institutionalInfo = {
        verifiedDomains: formatDomains(domains),
        institutionType,
        officialName: officialName.trim() || undefined,
        website: institutionUrl.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
      };
    }

    return payload;
  }, [allowInvites, communityType, contactEmail, description, domains, features, guidelines, institutionType, institutionUrl, joinMethod, name, officialName, tags, visibility, welcomeMessage, searchable]);

  const handleCreate = useCallback(async () => {
    if (!basicsValid || !accessValid || creating) {
      return;
    }
    setCreating(true);
    try {
      const payload = buildPayload();
      const response = await createCommunityApi(payload);
      
      // The API service likely returns response.data directly
      // So we need to check both possible structures
      const communityId = response?.data?.data?.community?.id;
      
      // Add debug logging to see the actual response structure
      if (!communityId) {
        console.log('API Response structure:', JSON.stringify(response, null, 2));
        console.log('Looking for ID at response.community.id or response.data.community.id');
        throw new Error('Community id missing in response. Check console for response structure.');
      }
      
      navigation.replace('CommunityManagement', {communityId});
    } catch (error) {
      console.log('Create community error:', error?.response?.data || error?.message || error);
      Alert.alert(
        'Error', 
        error?.response?.data?.message || error?.message || 'Unable to create your community right now.'
      );
    } finally {
      setCreating(false);
    }
  }, [accessValid, basicsValid, buildPayload, creating, navigation]);

  const keyboardBehavior = Platform.OS === 'ios' ? 'padding' : undefined;

  const renderStepIndicator = () => (
    <View style={styles.stepperRow}>
      {STEP_LABELS.map((label, index) => {
        const active = index === step;
        const completed = index < step;
        return (
          <View key={label} style={styles.stepperItem}>
            <View style={[styles.stepCircle, completed && styles.stepCircleCompleted, active && styles.stepCircleActive]}>
              {completed ? (
                <Icon name="checkmark" size={nw(14)} color={COLORS.whiteFFFFFF} />
              ) : (
                <Text style={[styles.stepNumber, active && styles.stepNumberActive]}>{index + 1}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );

  const renderBasics = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Community basics</Text>
      <TextInput
        style={styles.singleInput}
        placeholder="Community name"
        placeholderTextColor={PALETTE.subtle}
        value={name}
        onChangeText={setName}
        maxLength={100}
      />
      <TextInput
        style={[styles.multiInput, {minHeight: nh(140)}]}
        placeholder="Describe what this community is for"
        placeholderTextColor={PALETTE.subtle}
        multiline
        value={description}
        onChangeText={setDescription}
        maxLength={1000}
      />
      <View style={styles.helperRow}>
        <Icon name="information-circle" size={nw(16)} color={PALETTE.accent} />
        <Text style={styles.helperText}>
          You’ll become the owner. You can add other admins and configure the space later.
        </Text>
      </View>
      <Text style={styles.subheading}>Community type</Text>
      {COMMUNITY_TYPES.map((type) => {
        const active = communityType === type.key;
        return (
          <TouchableOpacity
            key={type.key}
            style={[styles.optionRow, active && styles.optionRowActive]}
            onPress={() => handleTypeSelect(type.key)}
            activeOpacity={0.85}>
            <View style={[styles.optionIcon, active && styles.optionIconActive]}>
              <Icon name="people" size={nw(16)} color={active ? COLORS.whiteFFFFFF : PALETTE.primary} />
            </View>
            <View style={styles.optionTextBlock}>
              <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>{type.label}</Text>
              <Text style={styles.optionSubtitle}>{type.description}</Text>
            </View>
            {active ? (
              <Icon name="checkmark-circle" size={nw(20)} color={PALETTE.primary} />
            ) : (
              <Icon name="ellipse-outline" size={nw(20)} color={PALETTE.subtle} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderAccess = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Access & verification</Text>
      <Text style={styles.subheading}>Visibility</Text>
      {VISIBILITY_OPTIONS.map((option) => {
        const active = visibility === option.key;
        return (
          <TouchableOpacity
            key={option.key}
            style={[styles.optionRow, active && styles.optionRowActive]}
            onPress={() => setVisibility(option.key)}
            activeOpacity={0.85}>
            <View style={[styles.optionIcon, active && styles.optionIconActive]}>
              <Icon name={option.key === 'public' ? 'earth' : option.key === 'protected' ? 'eye' : 'lock-closed'}
                size={nw(16)}
                color={active ? COLORS.whiteFFFFFF : PALETTE.primary}
              />
            </View>
            <View style={styles.optionTextBlock}>
              <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>{option.label}</Text>
              <Text style={styles.optionSubtitle}>{option.description}</Text>
            </View>
            {active ? (
              <Icon name="checkmark-circle" size={nw(20)} color={PALETTE.primary} />
            ) : (
              <Icon name="ellipse-outline" size={nw(20)} color={PALETTE.subtle} />
            )}
          </TouchableOpacity>
        );
      })}

      <Text style={styles.subheading}>Join method</Text>
      {JOIN_METHODS.map((option) => {
        const active = joinMethod === option.key;
        return (
          <TouchableOpacity
            key={option.key}
            style={[styles.optionRow, active && styles.optionRowActive]}
            onPress={() => setJoinMethod(option.key)}
            activeOpacity={0.85}>
            <View style={[styles.optionIcon, active && styles.optionIconActive]}>
              <Icon
                name={option.key === 'open' ? 'flash' : option.key === 'approval' ? 'chatbubble-ellipses' : 'key'}
                size={nw(16)}
                color={active ? COLORS.whiteFFFFFF : PALETTE.primary}
              />
            </View>
            <View style={styles.optionTextBlock}>
              <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>{option.label}</Text>
              <Text style={styles.optionSubtitle}>{option.description}</Text>
            </View>
            {active ? (
              <Icon name="checkmark-circle" size={nw(20)} color={PALETTE.primary} />
            ) : (
              <Icon name="ellipse-outline" size={nw(20)} color={PALETTE.subtle} />
            )}
          </TouchableOpacity>
        );
      })}

      <View style={styles.switchRow}>
        <View style={styles.switchTextBlock}>
          <Text style={styles.switchTitle}>Show in discovery</Text>
          <Text style={styles.switchSubtitle}>Allow students to find and request to join your community.</Text>
        </View>
        <Switch value={searchable} onValueChange={setSearchable} trackColor={{true: PALETTE.primary}} thumbColor={COLORS.whiteFFFFFF} />
      </View>
      <View style={styles.switchRow}>
        <View style={styles.switchTextBlock}>
          <Text style={styles.switchTitle}>Allow member invites</Text>
          <Text style={styles.switchSubtitle}>Members can invite their friends directly.</Text>
        </View>
        <Switch value={allowInvites} onValueChange={setAllowInvites} trackColor={{true: PALETTE.primary}} thumbColor={COLORS.whiteFFFFFF} />
      </View>

      {communityType === 'institutional' ? (
        <View style={styles.verificationCard}>
          <Text style={styles.subheading}>Verified domains</Text>
          <Text style={styles.optionSubtitle}>
            Students joining with these email domains will be auto-approved.
          </Text>
          <View style={styles.pillRow}>
            {INSTITUTION_TYPES.map((item) => {
              const active = institutionType === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.pillChip, active && styles.pillChipActive]}
                  onPress={() => setInstitutionType(item.key)}
                  activeOpacity={0.85}>
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.inlineInputRow}>
            <TextInput
              style={[styles.singleInput, styles.inlineInput]}
              placeholder="university.edu"
              placeholderTextColor={PALETTE.subtle}
              value={currentDomain}
              onChangeText={setCurrentDomain}
              onSubmitEditing={addDomain}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.inlineAddButton} onPress={addDomain}>
              <Text style={styles.inlineAddText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tokenContainer}>
            {domains.map((domain) => (
              <View key={domain} style={styles.tokenChip}>
                <Text style={styles.tokenText}>{domain}</Text>
                <TouchableOpacity onPress={() => removeDomain(domain)}>
                  <Icon name="close-circle" size={nw(18)} color={COLORS.whiteFFFFFF} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.inlineInputRow}>
            <TextInput
              style={styles.singleInput}
              placeholder="Official institution name (optional)"
              placeholderTextColor={PALETTE.subtle}
              value={officialName}
              onChangeText={setOfficialName}
            />
          </View>
          <TextInput
            style={styles.singleInput}
            placeholder="Website URL (optional)"
            placeholderTextColor={PALETTE.subtle}
            value={institutionUrl}
            onChangeText={setInstitutionUrl}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.singleInput}
            placeholder="Contact email (optional)"
            placeholderTextColor={PALETTE.subtle}
            value={contactEmail}
            onChangeText={setContactEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
      ) : null}
    </View>
  );

  const renderSummary = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Review & finish</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Name</Text>
        <Text style={styles.summaryValue}>{name.trim() || '—'}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Type</Text>
        <Text style={styles.summaryValue}>{communityType}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Visibility</Text>
        <Text style={styles.summaryValue}>{visibility}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Join method</Text>
        <Text style={styles.summaryValue}>{joinMethod}</Text>
      </View>
      {domains.length ? (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Domains</Text>
          <Text style={styles.summaryValue}>{domains.join(', ')}</Text>
        </View>
      ) : null}
      {tags.length ? (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tags</Text>
          <Text style={styles.summaryValue}>{tags.join(', ')}</Text>
        </View>
      ) : null}

      <Text style={styles.subheading}>Features</Text>
      <View style={styles.featureGrid}>
        {FEATURE_OPTIONS.map((feature) => (
          <View key={feature.key} style={styles.featureItem}>
            <Switch
              value={features[feature.key]}
              onValueChange={(value) =>
                setFeatures((prev) => ({
                  ...prev,
                  [feature.key]: value,
                }))
              }
              trackColor={{true: PALETTE.primary}}
              thumbColor={COLORS.whiteFFFFFF}
            />
            <Text style={styles.featureLabel}>{feature.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.subheading}>Welcome message</Text>
      <TextInput
        style={[styles.multiInput, {minHeight: nh(100)}]}
        placeholder="Optional greeting shown to new members"
        placeholderTextColor={PALETTE.subtle}
        multiline
        value={welcomeMessage}
        onChangeText={setWelcomeMessage}
        maxLength={500}
      />

      <Text style={styles.subheading}>Guidelines</Text>
      <TextInput
        style={[styles.multiInput, {minHeight: nh(140)}]}
        placeholder="Share rules, expectations, or community ethos"
        placeholderTextColor={PALETTE.subtle}
        multiline
        value={guidelines}
        onChangeText={setGuidelines}
        maxLength={5000}
      />

      <Text style={styles.subheading}>Tags</Text>
      <View style={styles.inlineInputRow}>
        <TextInput
          style={[styles.singleInput, styles.inlineInput]}
          placeholder="Add a tag"
          placeholderTextColor={PALETTE.subtle}
          value={currentTag}
          onChangeText={setCurrentTag}
          maxLength={30}
          onSubmitEditing={addTag}
        />
        <TouchableOpacity style={styles.inlineAddButton} onPress={addTag}>
          <Text style={styles.inlineAddText}>Add</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tokenContainer}>
        {tags.map((tag) => (
          <View key={tag} style={styles.tokenChip}>
            <Text style={styles.tokenText}>#{tag}</Text>
            <TouchableOpacity onPress={() => removeTag(tag)}>
              <Icon name="close-circle" size={nw(18)} color={COLORS.whiteFFFFFF} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStepContent = () => {
    if (step === 0) {
      return renderBasics();
    }
    if (step === 1) {
      return renderAccess();
    }
    return renderSummary();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.background} />
      <KeyboardAvoidingView behavior={keyboardBehavior} style={styles.flex}>
        <LinearGradient colors={[PALETTE.primary, '#0E4F62']} style={styles.headerGradient}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={nw(20)} color={COLORS.whiteFFFFFF} />
          </TouchableOpacity>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>New community</Text>
            <Text style={styles.headerSubtitle}>Craft a space that feels like home.</Text>
          </View>
          <View style={styles.headerButtonPlaceholder} />
        </LinearGradient>

        {renderStepIndicator()}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>

        <View style={styles.footerCard}>
          <TouchableOpacity style={styles.footerButtonOutline} onPress={handleBack} disabled={step === 0}>
            <Text style={[styles.footerButtonOutlineText, step === 0 && styles.footerButtonOutlineTextDisabled]}>Back</Text>
          </TouchableOpacity>
          {step < STEP_LABELS.length - 1 ? (
            <TouchableOpacity style={styles.footerButtonFilled} onPress={handleNext}>
              <Text style={styles.footerButtonFilledText}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.footerButtonFilled, (!basicsValid || !accessValid || creating) && styles.footerButtonFilledDisabled]}
              onPress={handleCreate}
              disabled={!basicsValid || !accessValid || creating}>
              {creating ? (
                <ActivityIndicator size="small" color={COLORS.whiteFFFFFF} />
              ) : (
                <Text style={styles.footerButtonFilledText}>Create community</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  flex: {
    flex: 1,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(20),
    paddingTop: nh(26),
    paddingBottom: nh(18),
    gap: nw(12),
  },
  headerButton: {
    width: nw(36),
    height: nw(36),
    borderRadius: nw(18),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonPlaceholder: {
    width: nw(36),
    height: nw(36),
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(18),
    fontWeight: '700',
  },
  headerSubtitle: {
    color: COLORS.whiteFFFFFF + 'CC',
    fontSize: nw(12),
    marginTop: nh(4),
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: nw(20),
    marginTop: nh(16),
  },
  stepperItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: nw(28),
    height: nw(28),
    borderRadius: nw(14),
    borderWidth: 2,
    borderColor: PALETTE.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.surface,
  },
  stepCircleCompleted: {
    backgroundColor: PALETTE.primary,
  },
  stepCircleActive: {
    backgroundColor: PALETTE.primary + 'EE',
  },
  stepNumber: {
    color: PALETTE.primary,
    fontSize: nw(12),
    fontWeight: '600',
  },
  stepNumberActive: {
    color: COLORS.whiteFFFFFF,
  },
  stepLabel: {
    color: PALETTE.subtle,
    fontSize: nw(11),
    marginTop: nh(6),
  },
  stepLabelActive: {
    color: PALETTE.primary,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: nw(20),
    paddingBottom: nh(120),
    gap: nh(20),
  },
  sectionCard: {
    borderRadius: nw(20),
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: nw(18),
    paddingVertical: nh(18),
    gap: nh(16),
  },
  sectionTitle: {
    color: PALETTE.primary,
    fontSize: nw(15),
    fontWeight: '700',
  },
  subheading: {
    color: PALETTE.primary,
    fontSize: nw(13),
    fontWeight: '600',
  },
  singleInput: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(14),
    paddingHorizontal: nw(14),
    paddingVertical: nh(10),
    color: PALETTE.primary,
    fontSize: nw(13),
  },
  multiInput: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(14),
    paddingHorizontal: nw(14),
    paddingVertical: nh(10),
    color: PALETTE.primary,
    fontSize: nw(13),
    textAlignVertical: 'top',
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: nw(8),
  },
  helperText: {
    color: PALETTE.muted,
    fontSize: nw(11),
    flex: 1,
    lineHeight: nh(16),
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(12),
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(16),
    paddingHorizontal: nw(14),
    paddingVertical: nh(12),
  },
  optionRowActive: {
    borderColor: PALETTE.primary,
    backgroundColor: PALETTE.primary + '08',
  },
  optionIcon: {
    width: nw(32),
    height: nw(32),
    borderRadius: nw(16),
    backgroundColor: PALETTE.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconActive: {
    backgroundColor: PALETTE.primary,
  },
  optionTextBlock: {
    flex: 1,
  },
  optionTitle: {
    color: PALETTE.primary,
    fontSize: nw(13),
    fontWeight: '600',
  },
  optionTitleActive: {
    color: PALETTE.primary,
  },
  optionSubtitle: {
    color: PALETTE.muted,
    fontSize: nw(11),
    lineHeight: nh(16),
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(16),
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
  },
  switchTextBlock: {
    flex: 1,
    marginRight: nw(10),
  },
  switchTitle: {
    color: PALETTE.primary,
    fontSize: nw(13),
    fontWeight: '600',
  },
  switchSubtitle: {
    color: PALETTE.muted,
    fontSize: nw(11),
    marginTop: nh(4),
  },
  verificationCard: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(16),
    padding: nw(16),
    gap: nh(12),
  },
  inlineInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(10),
  },
  inlineInput: {
    flex: 1,
  },
  inlineAddButton: {
    paddingHorizontal: nw(16),
    paddingVertical: nh(10),
    borderRadius: nw(14),
    backgroundColor: PALETTE.primary,
  },
  inlineAddText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(12),
    fontWeight: '600',
  },
  tokenContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(8),
  },
  tokenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
    backgroundColor: PALETTE.primary,
    borderRadius: nw(14),
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
  },
  tokenText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(12),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: nh(10),
  },
  summaryLabel: {
    color: PALETTE.muted,
    fontSize: nw(12),
  },
  summaryValue: {
    color: PALETTE.primary,
    fontSize: nw(12),
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: nw(10),
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(16),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
  },
  featureLabel: {
    color: PALETTE.primary,
    fontSize: nw(12),
  },
  footerCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: PALETTE.surface,
    borderTopWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: nw(20),
    paddingVertical: nh(12),
    gap: nw(12),
  },
  footerButtonOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(16),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(12),
  },
  footerButtonOutlineText: {
    color: PALETTE.primary,
    fontSize: nw(13),
    fontWeight: '600',
  },
  footerButtonOutlineTextDisabled: {
    color: PALETTE.subtle,
  },
  footerButtonFilled: {
    flex: 1,
    borderRadius: nw(16),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(12),
    backgroundColor: PALETTE.primary,
  },
  footerButtonFilledDisabled: {
    backgroundColor: PALETTE.primary + '66',
  },
  footerButtonFilledText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(13),
    fontWeight: '600',
  },
  missingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: nh(12),
    paddingHorizontal: nw(20),
  },
  missingTitle: {
    color: PALETTE.primary,
    fontSize: nw(16),
    fontWeight: '700',
  },
  missingSubtitle: {
    color: PALETTE.muted,
    fontSize: nw(12),
    textAlign: 'center',
  },
  missingButton: {
    marginTop: nh(10),
    paddingHorizontal: nw(20),
    paddingVertical: nh(12),
    backgroundColor: PALETTE.primary,
    borderRadius: nw(16),
  },
  missingButtonText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(12),
    fontWeight: '600',
  },
});

export default CreateCommunity;
