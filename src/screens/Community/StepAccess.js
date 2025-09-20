// src/screens/Community/StepAccess.js
import React, {useState, useCallback} from 'react';
import {
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import Text from '../../components/Text';
import {nh, nw} from '../../helper/scales';
import {PALETTE, VISIBILITY_OPTIONS, JOIN_METHODS} from './CreateCommunity';

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

  const handleVisibilityChange = useCallback((value) => {
    updateFormField('visibility', value);
  }, [updateFormField]);

  const handleJoinMethodChange = useCallback((value) => {
    updateFormField('joinMethod', value);
  }, [updateFormField]);

  const handleSearchableToggle = useCallback((value) => {
    updateFormField('searchable', value);
  }, [updateFormField]);

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>2. Access Control</Text>
      <Text style={styles.sectionSubtitle}>Control who can see and join your hub.</Text>
      
      <Text style={styles.subheading}>Visibility</Text>
      {VISIBILITY_OPTIONS.map(option => (
        <TouchableOpacity 
          key={option.key} 
          style={[styles.optionCard, formState.visibility === option.key && styles.optionCardActive]} 
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
        </TouchableOpacity>
      ))}
      
      <Text style={styles.subheading}>Join Method</Text>
      {JOIN_METHODS.map(option => (
        <TouchableOpacity 
          key={option.key} 
          style={[styles.optionCard, formState.joinMethod === option.key && styles.optionCardActive]} 
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
        </TouchableOpacity>
      ))}
      
      {formState.communityType === 'institutional' && (
        <>
          <Text style={styles.subheading}>Verified Domains</Text>
          <Text style={styles.sectionSubtitle}>
            Members with a matching email domain can join automatically.
          </Text>
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
            {formState.domains.map(domain => (
              <View key={domain} style={styles.tokenChip}>
                <Text style={styles.tokenText}>{domain}</Text>
                <TouchableOpacity onPress={() => removeDomain(domain)}>
                  <Icon name="close" size={nw(16)} color={PALETTE.surface} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}
      
      <View style={styles.switchRow}>
        <Text style={styles.optionTitle}>Discoverable in Search</Text>
        {switchLoaded ? (
          <Switch 
            value={formState.searchable} 
            onValueChange={handleSearchableToggle} 
            trackColor={{true: PALETTE.primary}} 
            thumbColor={PALETTE.surface} 
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
    marginBottom: nh(16) 
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
    gap: nw(16),
    backgroundColor: PALETTE.background,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: nw(12),
    padding: nw(16),
    marginBottom: nh(10),
  },
  optionCardActive: { 
    borderColor: PALETTE.primary, 
    backgroundColor: PALETTE.primary + '10' 
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
    marginTop: nh(2) 
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: nh(8),
    marginTop: nh(10),
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
  inlineAddText: { 
    color: PALETTE.surface, 
    fontWeight: '600', 
    fontSize: nw(14) 
  },
  tokenContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: nw(8) 
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
    fontSize: nw(13) 
  },
});

export default StepAccess;