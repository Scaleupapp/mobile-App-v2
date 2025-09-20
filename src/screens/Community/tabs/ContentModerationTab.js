// src/screens/Community/tabs/ContentModerationTab.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Text from '../../../components/Text';
import { nh, nw } from '../../../helper/scales';
import { PALETTE } from '../CommunitySettings';

const ContentModerationTab = React.memo(({ settings, onSave, saving }) => {
  const [bannedWords, setBannedWords] = useState([]);
  const [newWord, setNewWord] = useState('');

  useEffect(() => {
    if (settings?.contentFilters) {
      setBannedWords(settings.contentFilters.bannedWords || []);
    }
  }, [settings]);

  const handleAddWord = useCallback(() => {
    const wordToAdd = newWord.trim().toLowerCase();
    if (!wordToAdd || bannedWords.some(w => w.word === wordToAdd)) {
      setNewWord('');
      return;
    }
    const updatedWords = [...bannedWords, { word: wordToAdd, severity: 'medium', action: 'flag' }];
    setBannedWords(updatedWords);
    onSave('content', { bannedWords: updatedWords });
    setNewWord('');
  }, [newWord, bannedWords, onSave]);

  const handleRemoveWord = useCallback((wordToRemove) => {
    const updatedWords = bannedWords.filter(w => w.word !== wordToRemove);
    setBannedWords(updatedWords);
    onSave('content', { bannedWords: updatedWords });
  }, [bannedWords, onSave]);

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Banned Words</Text>
        <Text style={styles.sectionDescription}>
          Automatically filter content containing these words.
        </Text>
        <View style={styles.domainInput}>
          <TextInput
            style={styles.domainInputField}
            value={newWord}
            onChangeText={setNewWord}
            placeholder="Add a word to filter..."
            placeholderTextColor={PALETTE.subtle}
            onSubmitEditing={handleAddWord}
          />
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAddWord} 
            disabled={saving}>
            <Icon name="add" size={nw(20)} color={PALETTE.surface} />
          </TouchableOpacity>
        </View>
        {bannedWords.length > 0 && (
          <View style={styles.domainList}>
            {bannedWords.map((item, index) => (
              <View key={index} style={styles.domainChip}>
                <Text style={styles.domainChipText}>{item.word}</Text>
                <TouchableOpacity onPress={() => handleRemoveWord(item.word)}>
                  <Icon name="close-circle" size={nw(18)} color={PALETTE.surface} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  tabContent: { 
    flex: 1, 
    padding: nw(16) 
  },
  section: {
    backgroundColor: PALETTE.surface,
    borderRadius: nw(12),
    padding: nw(16),
    marginBottom: nh(16),
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  sectionTitle: { 
    fontSize: nw(16), 
    fontWeight: 'bold', 
    color: PALETTE.primary, 
    marginBottom: nh(4) 
  },
  sectionDescription: { 
    fontSize: nw(12), 
    color: PALETTE.muted, 
    marginBottom: nh(16), 
    lineHeight: nh(18) 
  },
  domainInput: { 
    flexDirection: 'row', 
    marginBottom: nh(12) 
  },
  domainInputField: {
    flex: 1,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderTopLeftRadius: nh(8),
    borderBottomLeftRadius: nh(8),
    padding: nw(12),
    fontSize: nw(14),
    backgroundColor: PALETTE.surface,
    color: PALETTE.primary,
  },
  addButton: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: nw(16),
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: nh(8),
    borderBottomRightRadius: nh(8),
  },
  domainList: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: nw(8), 
    marginTop: nh(8) 
  },
  domainChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: nh(16),
    paddingVertical: nh(6),
    paddingHorizontal: nw(12),
    gap: nw(8),
  },
  domainChipText: { 
    color: PALETTE.surface, 
    fontSize: nw(13) 
  },
});

export default ContentModerationTab;