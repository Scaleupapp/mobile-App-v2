// src/screens/Community/StepAccess.js
import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import Text from '../../components/Text';
import {nh, nw} from '../../helper/scales';
import {PALETTE} from './CreateCommunity';

// Enhanced visibility options with domain_restricted
const ENHANCED_VISIBILITY_OPTIONS = [
  {key: 'public', label: 'Public', description: 'Visible to everyone in search.', icon: 'earth-outline'},
  {key: 'protected', label: 'Protected', description: 'Visible, but posts are private.', icon: 'eye-outline'},
  {key: 'domain_restricted', label: 'Domain Restricted', description: 'Auto-join for verified domain users.', icon: 'shield-outline'},
  {key: 'private', label: 'Private', description: 'Hidden & invite-only.', icon: 'lock-closed-outline'},
];

// Enhanced join methods with domain_auto
const ENHANCED_JOIN_METHODS = [
  {key: 'open', label: 'Instant Join', description: 'Anyone can join immediately.', icon: 'flash-outline'},
  {key: 'domain_auto', label: 'Auto-Join (Domain)', description: 'Domain users join automatically.', icon: 'key-outline'},
  {key: 'approval', label: 'Approval Required', description: 'Admins approve each request.', icon: 'shield-checkmark-outline'},
  {key: 'invite_only', label: 'Invite Only', description: 'Only invited members can join.', icon: 'mail-outline'},
];

const StepAccess = React.memo(({
  formState, 
  updateFormField, 
  currentDomain,
  setCurrentDomain,
  addDomain,
  removeDomain
}) => {
  // Lazy load Switch state
  const [switchLoaded, setSwitchLoaded] = useState(false);
  
  React.useEffect(() => {
    requestAnimationFrame(() => setSwitchLoaded(true));
  }, []);

  // Filter options based on community type and visibility
  const visibilityOptions = useMemo(() => {
    if (formState.communityType === 'institutional') {
      // For institutional communities, show only relevant options
      return ENHANCED_VISIBILITY_OPTIONS.filter(opt => 
        ['domain_restricted', 'private'].includes(opt.key)
      );
    }
    return ENHANCED_VISIBILITY_OPTIONS;
  }, [formState.communityType]);

  const joinMethods = useMemo(() => {
    // If domain_restricted, ONLY show domain_auto
    if (formState.visibility === 'domain_restricted') {
      return ENHANCED_JOIN_METHODS.filter(opt => opt.key === 'domain_auto');
    }
    
    // For other visibility types, show appropriate options
    if (formState.visibility === 'private') {
      return ENHANCED_JOIN_METHODS.filter(opt => opt.key === 'invite_only');
    }
    
    if (formState.visibility === 'public') {
      return ENHANCED_JOIN_METHODS.filter(opt => 
        ['open', 'approval'].includes(opt.key)
      );
    }
    
    if (formState.visibility === 'protected') {
      return ENHANCED_JOIN_METHODS.filter(opt => 
        ['approval', 'invite_only'].includes(opt.key)
      );
    }
    
    return ENHANCED_JOIN_METHODS;
  }, [formState.visibility]);

  // Auto-select appropriate settings based on visibility
  useEffect(() => {
    // When domain_restricted is selected, automatically set domain_auto
    if (formState.visibility === 'domain_restricted' && formState.joinMethod !== 'domain_auto') {
      updateFormField('joinMethod', 'domain_auto');
    }
    
    // When private is selected, automatically set invite_only
    if (formState.visibility === 'private' && formState.joinMethod !== 'invite_only') {
      updateFormField('joinMethod', 'invite_only');
    }
    
    // For institutional communities, auto-select domain_restricted if not already set
    if (formState.communityType === 'institutional' && 
        !['domain_restricted', 'private'].includes(formState.visibility)) {
      updateFormField('visibility', 'domain_restricted');
      updateFormField('joinMethod', 'domain_auto');
    }
  }, [formState.communityType, formState.visibility, formState.joinMethod, updateFormField]);

  // Validate domain format
  const validateDomain = useCallback((domain) => {
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    return domainRegex.test(domain);
  }, []);

  const handleVisibilityChange = useCallback((value) => {
    updateFormField('visibility', value);
    
    // Auto-set join method based on visibility
    if (value === 'domain_restricted') {
      // Domain restricted ALWAYS uses domain_auto
      updateFormField('joinMethod', 'domain_auto');
    } else if (value === 'private') {
      // Private ALWAYS uses invite_only
      updateFormField('joinMethod', 'invite_only');
    } else if (value === 'public') {
      // Public defaults to open
      updateFormField('joinMethod', 'open');
    } else if (value === 'protected') {
      // Protected defaults to approval
      updateFormField('joinMethod', 'approval');
    }
  }, [updateFormField]);

  const handleJoinMethodChange = useCallback((value) => {
    updateFormField('joinMethod', value);
  }, [updateFormField]);

  const handleSearchableToggle = useCallback((value) => {
    updateFormField('searchable', value);
  }, [updateFormField]);

  const handleAddDomain = useCallback(() => {
    const domain = currentDomain.trim().toLowerCase();
    
    if (!domain) {
      return;
    }
    
    if (!validateDomain(domain)) {
      Alert.alert('Invalid Domain', 'Please enter a valid domain (e.g., university.edu)');
      return;
    }
    
    if (formState.domains.includes(domain)) {
      Alert.alert('Duplicate Domain', 'This domain has already been added.');
      return;
    }
    
    addDomain();
  }, [currentDomain, validateDomain, formState.domains, addDomain]);

  // Show info message for institutional communities
  const showInstitutionalInfo = formState.communityType === 'institutional';
  const showDomainConfig = formState.visibility === 'domain_restricted';
  const isJoinMethodLocked = formState.visibility === 'domain_restricted' || 
                            formState.visibility === 'private';

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>2. Access Control</Text>
      <Text style={styles.sectionSubtitle}>
        {showInstitutionalInfo 
          ? 'Configure domain-based access for your institutional hub.'
          : 'Control who can see and join your hub.'}
      </Text>

      {showInstitutionalInfo && (
        <View style={styles.infoBox}>
          <Icon name="information-circle" size={nw(20)} color={PALETTE.accent} />
          <Text style={styles.infoText}>
            Institutional communities use domain-restricted access with automatic joining for verified members.
          </Text>
        </View>
      )}
      
      <Text style={styles.subheading}>Visibility</Text>
      {visibilityOptions.map(option => (
        <TouchableOpacity 
          key={option.key} 
          style={[
            styles.optionCard, 
            formState.visibility === option.key && styles.optionCardActive
          ]} 
          onPress={() => handleVisibilityChange(option.key)}>
          <Icon 
            name={option.icon} 
            size={nw(22)} 
            color={formState.visibility === option.key ? PALETTE.primary : PALETTE.muted} 
          />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>{option.label}</Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </View>
          {formState.visibility === option.key && (
            <Icon name="checkmark-circle" size={nw(20)} color={PALETTE.primary} />
          )}
        </TouchableOpacity>
      ))}
      
      {/* Only show join method if there are options to choose from */}
      {joinMethods.length > 1 && (
        <>
          <Text style={styles.subheading}>Join Method</Text>
          {joinMethods.map(option => (
            <TouchableOpacity 
              key={option.key} 
              style={[
                styles.optionCard, 
                formState.joinMethod === option.key && styles.optionCardActive
              ]} 
              onPress={() => handleJoinMethodChange(option.key)}>
              <Icon 
                name={option.icon} 
                size={nw(22)} 
                color={formState.joinMethod === option.key ? PALETTE.primary : PALETTE.muted} 
              />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{option.label}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              {formState.joinMethod === option.key && (
                <Icon name="checkmark-circle" size={nw(20)} color={PALETTE.primary} />
              )}
            </TouchableOpacity>
          ))}
        </>
      )}
      
      {/* Show locked join method for domain_restricted */}
      {isJoinMethodLocked && (
        <View style={styles.lockedMethodBox}>
          <Icon 
            name={formState.visibility === 'domain_restricted' ? 'key-outline' : 'mail-outline'} 
            size={nw(18)} 
            color={PALETTE.primary} 
          />
          <View style={styles.lockedMethodTextContainer}>
            <Text style={styles.lockedMethodTitle}>
              {formState.visibility === 'domain_restricted' 
                ? 'Auto-Join Enabled' 
                : 'Invite Only'}
            </Text>
            <Text style={styles.lockedMethodDescription}>
              {formState.visibility === 'domain_restricted'
                ? 'Users with verified domains will join automatically.'
                : 'Only invited members can join this private community.'}
            </Text>
          </View>
        </View>
      )}
      
      {showDomainConfig && (
        <>
          <Text style={styles.subheading}>Auto-Join Domains</Text>
          <Text style={styles.sectionSubtitle}>
            Users with email addresses from these domains will automatically become members without approval.
          </Text>
          <View style={styles.inlineInputRow}>
            <TextInput
              style={styles.inlineInput}
              placeholder="e.g., university.edu or company.com"
              value={currentDomain}
              onChangeText={setCurrentDomain}
              onSubmitEditing={handleAddDomain}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="done"
            />
            <TouchableOpacity 
              style={[
                styles.inlineAddButton,
                !currentDomain.trim() && styles.inlineAddButtonDisabled
              ]} 
              onPress={handleAddDomain}
              disabled={!currentDomain.trim()}>
              <Text style={styles.inlineAddText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          {formState.domains.length > 0 ? (
            <View style={styles.tokenContainer}>
              {formState.domains.map(domain => (
                <View key={domain} style={styles.tokenChip}>
                  <Icon name="globe-outline" size={nw(14)} color={PALETTE.surface} />
                  <Text style={styles.tokenText}>{domain}</Text>
                  <TouchableOpacity onPress={() => removeDomain(domain)}>
                    <Icon name="close" size={nw(16)} color={PALETTE.surface} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyDomainsBox}>
              <Icon name="alert-circle-outline" size={nw(18)} color={PALETTE.danger || PALETTE.muted} />
              <Text style={styles.emptyDomainsText}>
                Add at least one domain to enable auto-join
              </Text>
            </View>
          )}
        </>
      )}
      
      <View style={styles.switchRow}>
        <View style={styles.switchTextContainer}>
          <Text style={styles.optionTitle}>Discoverable in Search</Text>
          <Text style={styles.switchDescription}>
            Allow users to find this community through search
          </Text>
        </View>
        {switchLoaded ? (
          <Switch 
            value={formState.searchable} 
            onValueChange={handleSearchableToggle} 
            trackColor={{false: PALETTE.border, true: PALETTE.primary}} 
            thumbColor={PALETTE.surface} 
            ios_backgroundColor={PALETTE.border}
          />
        ) : (
          <View style={styles.switchPlaceholder} />
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: PALETTE.surface,
    borderRadius: nw(16),
    padding: nw(16),
    marginBottom: nh(16),
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  sectionTitle: { 
    fontSize: nw(18), 
    fontWeight: 'bold', 
    color: PALETTE.primary, 
    marginBottom: nh(4) 
  },
  sectionSubtitle: { 
    fontSize: nw(13), 
    color: PALETTE.muted, 
    marginBottom: nh(16),
    lineHeight: nw(18),
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: PALETTE.accent + '15',
    borderRadius: nw(10),
    padding: nw(12),
    marginBottom: nh(16),
    gap: nw(10),
  },
  infoText: {
    flex: 1,
    fontSize: nw(12),
    color: PALETTE.primary,
    lineHeight: nw(16),
  },
  subheading: { 
    fontSize: nw(15), 
    fontWeight: '600', 
    color: PALETTE.primary, 
    marginTop: nh(16), 
    marginBottom: nh(8) 
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(12),
    backgroundColor: PALETTE.background,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: nw(12),
    padding: nw(14),
    marginBottom: nh(10),
  },
  optionCardActive: { 
    borderColor: PALETTE.primary, 
    backgroundColor: PALETTE.primary + '08' 
  },
  optionTextContainer: { flex: 1 },
  optionTitle: { 
    fontSize: nw(14), 
    fontWeight: '600', 
    color: PALETTE.primary 
  },
  optionDescription: { 
    fontSize: nw(12), 
    color: PALETTE.muted, 
    marginTop: nh(2),
    lineHeight: nw(16),
  },
  lockedMethodBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(12),
    backgroundColor: PALETTE.primary + '10',
    borderRadius: nw(12),
    padding: nw(14),
    marginTop: nh(16),
    marginBottom: nh(10),
    borderWidth: 1,
    borderColor: PALETTE.primary + '20',
  },
  lockedMethodTextContainer: {
    flex: 1,
  },
  lockedMethodTitle: {
    fontSize: nw(14),
    fontWeight: '600',
    color: PALETTE.primary,
  },
  lockedMethodDescription: {
    fontSize: nw(12),
    color: PALETTE.muted,
    marginTop: nh(2),
    lineHeight: nw(16),
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: nh(12),
    marginTop: nh(10),
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: nw(12),
  },
  switchDescription: {
    fontSize: nw(11),
    color: PALETTE.muted,
    marginTop: nh(2),
  },
  switchPlaceholder: {
    width: nw(51),
    height: nh(31),
    backgroundColor: PALETTE.border,
    borderRadius: nh(16),
  },
  inlineInputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: nw(10), 
    marginBottom: nh(10) 
  },
  inlineInput: { 
    flex: 1, 
    backgroundColor: PALETTE.background, 
    borderWidth: 1, 
    borderColor: PALETTE.border, 
    borderRadius: nw(12), 
    paddingHorizontal: nw(14), 
    paddingVertical: nh(12), 
    fontSize: nw(14), 
    color: PALETTE.primary 
  },
  inlineAddButton: { 
    backgroundColor: PALETTE.primary, 
    paddingHorizontal: nw(20), 
    paddingVertical: nh(13), 
    borderRadius: nw(12) 
  },
  inlineAddButtonDisabled: {
    backgroundColor: PALETTE.muted,
    opacity: 0.5,
  },
  inlineAddText: { 
    color: PALETTE.surface, 
    fontWeight: '600', 
    fontSize: nw(14) 
  },
  tokenContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: nw(8),
    marginTop: nh(4),
  },
  tokenChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: nw(6), 
    backgroundColor: PALETTE.primary, 
    borderRadius: nw(16), 
    paddingHorizontal: nw(12), 
    paddingVertical: nh(6) 
  },
  tokenText: { 
    color: PALETTE.surface, 
    fontSize: nw(13),
    fontWeight: '500',
  },
  emptyDomainsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
    backgroundColor: PALETTE.background,
    borderRadius: nw(10),
    padding: nw(12),
    marginTop: nh(4),
    borderWidth: 1,
    borderColor: PALETTE.danger + '30' || PALETTE.border,
  },
  emptyDomainsText: {
    flex: 1,
    fontSize: nw(12),
    color: PALETTE.danger || PALETTE.muted,
  },
});

export default StepAccess;