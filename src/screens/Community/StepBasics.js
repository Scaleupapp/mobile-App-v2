// src/screens/Community/StepBasics.js
import React from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import Text from '../../components/Text';
import {nh, nw} from '../../helper/scales';
import {PALETTE, COMMUNITY_TYPES} from './CreateCommunity';

const StepBasics = React.memo(({formState, updateFormField, handleTypeSelect}) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>1. The Basics</Text>
      <Text style={styles.sectionSubtitle}>Choose a name and describe your hub's purpose.</Text>
      
      <TextInput
        style={styles.textInput}
        placeholder="Community Hub Name"
        placeholderTextColor={PALETTE.subtle}
        value={formState.name}
        onChangeText={(text) => updateFormField('name', text)}
      />
      
      <TextInput
        style={[styles.textInput, styles.textArea]}
        placeholder="What is this hub about?"
        placeholderTextColor={PALETTE.subtle}
        multiline
        value={formState.description}
        onChangeText={(text) => updateFormField('description', text)}
      />
      
      <Text style={styles.sectionTitle}>Hub Type</Text>
      {COMMUNITY_TYPES.map(type => (
        <TouchableOpacity
          key={type.key}
          style={[styles.optionCard, formState.communityType === type.key && styles.optionCardActive]}
          onPress={() => handleTypeSelect(type.key)}>
          <Icon 
            name={type.icon} 
            size={nw(22)} 
            color={formState.communityType === type.key ? PALETTE.primary : PALETTE.muted} 
          />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>{type.label}</Text>
            <Text style={styles.optionDescription}>{type.description}</Text>
          </View>
        </TouchableOpacity>
      ))}
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
  textArea: { 
    minHeight: nh(120), 
    textAlignVertical: 'top' 
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
});

export default StepBasics;