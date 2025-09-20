// src/screens/Community/StepDetails.js
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
import {PALETTE} from './CreateCommunity';

const PreviewCard = React.memo(({name, description, visibility}) => (
  <View style={styles.previewCard}>
    <View style={styles.previewAvatar}>
      <Text style={styles.previewAvatarText}>{name?.[0]?.toUpperCase() || 'C'}</Text>
    </View>
    <View style={styles.previewContent}>
      <Text style={styles.previewTitle} numberOfLines={1}>{name || 'Community Name'}</Text>
      <Text style={styles.previewDescription} numberOfLines={2}>
        {description || 'Community Description'}
      </Text>
      <View style={styles.previewStats}>
        <Text style={styles.previewStatItem}>0 members</Text>
        <Text style={styles.previewStatSeparator}>•</Text>
        <Text style={styles.previewStatItem}>{visibility}</Text>
      </View>
    </View>
  </View>
));

const StepDetails = React.memo(({
  formState,
  updateFormField,
  currentTag,
  setCurrentTag,
  addTag,
  removeTag
}) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>3. Final Details & Preview</Text>
      <Text style={styles.sectionSubtitle}>
        Add some finishing touches and see how your hub will look.
      </Text>
      
      <PreviewCard 
        name={formState.name}
        description={formState.description}
        visibility={formState.visibility}
      />

      <Text style={styles.subheading}>Tags (up to 5)</Text>
      <Text style={styles.sectionSubtitle}>
        Help others discover your hub with relevant tags.
      </Text>
      <View style={styles.inlineInputRow}>
        <TextInput
          style={styles.inlineInput}
          placeholder="e.g., #product-management"
          value={currentTag}
          onChangeText={setCurrentTag}
          onSubmitEditing={addTag}
        />
        <TouchableOpacity 
          style={styles.inlineAddButton} 
          onPress={addTag} 
          disabled={formState.tags.length >= 5}>
          <Text style={styles.inlineAddText}>Add</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tokenContainer}>
        {formState.tags.map(tag => (
          <View key={tag} style={styles.tokenChip}>
            <Text style={styles.tokenText}>#{tag}</Text>
            <TouchableOpacity onPress={() => removeTag(tag)}>
              <Icon name="close" size={nw(16)} color={PALETTE.surface} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Text style={styles.subheading}>Welcome Message (Optional)</Text>
      <Text style={styles.sectionSubtitle}>
        A brief message shown to new members when they join.
      </Text>
      <TextInput
        style={[styles.textInput, styles.textArea]}
        placeholder="Welcome to the hub! We're excited to have you..."
        placeholderTextColor={PALETTE.subtle}
        multiline
        value={formState.welcomeMessage}
        onChangeText={(text) => updateFormField('welcomeMessage', text)}
      />
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
  previewAvatar: { 
    width: nw(48), 
    height: nw(48), 
    borderRadius: nw(12), 
    backgroundColor: PALETTE.primary + '20', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: nw(12) 
  },
  previewAvatarText: { 
    fontSize: nw(20), 
    fontWeight: 'bold', 
    color: PALETTE.primary 
  },
  previewContent: { flex: 1 },
  previewTitle: { 
    fontSize: nw(15), 
    fontWeight: 'bold', 
    color: PALETTE.primary 
  },
  previewDescription: { 
    fontSize: nw(12), 
    color: PALETTE.muted, 
    marginTop: nh(2) 
  },
  previewStats: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: nh(6) 
  },
  previewStatItem: { 
    fontSize: nw(12), 
    color: PALETTE.muted 
  },
  previewStatSeparator: { 
    marginHorizontal: nw(6), 
    color: PALETTE.muted 
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
    minHeight: nh(100), 
    textAlignVertical: 'top' 
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

export default StepDetails;