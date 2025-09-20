import React, {useCallback} from 'react';
import {
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import Text from '../../components/Text';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import {PALETTE} from './CreateCommunityPost';

const PollContent = ({state, setState}) => {
  const handleQuestionChange = useCallback((text) => {
    setState(prev => ({...prev, pollQuestion: text}));
  }, [setState]);

  const handleOptionChange = useCallback((text, index) => {
    setState(prev => ({
      ...prev,
      pollOptions: prev.pollOptions.map((value, idx) => (idx === index ? text : value))
    }));
  }, [setState]);

  const handleAddOption = useCallback(() => {
    if (state.pollOptions.length >= 5) {
      Alert.alert('Limit reached', 'You can add up to 5 options only');
      return;
    }
    setState(prev => ({
      ...prev,
      pollOptions: [...prev.pollOptions, '']
    }));
  }, [state.pollOptions.length, setState]);

  const handleRemoveOption = useCallback((index) => {
    setState(prev => ({
      ...prev,
      pollOptions: prev.pollOptions.filter((_, idx) => idx !== index)
    }));
  }, [setState]);

  const toggleSetting = useCallback((setting) => {
    setState(prev => ({
      ...prev,
      pollSettings: {
        ...prev.pollSettings,
        [setting]: !prev.pollSettings[setting]
      }
    }));
  }, [setState]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Create a poll</Text>
      
      <TextInput
        style={styles.pollQuestionInput}
        placeholder="Ask your community a question"
        placeholderTextColor={PALETTE.subtle}
        value={state.pollQuestion}
        onChangeText={handleQuestionChange}
        maxLength={200}
      />
      
      <Text style={styles.optionsLabel}>Options</Text>
      
      {state.pollOptions.map((option, index) => (
        <View key={index} style={styles.pollOptionRow}>
          <TextInput
            style={styles.pollOptionInput}
            placeholder={`Option ${index + 1}`}
            placeholderTextColor={PALETTE.subtle}
            value={option}
            onChangeText={(text) => handleOptionChange(text, index)}
            maxLength={100}
          />
          {state.pollOptions.length > 2 ? (
            <TouchableOpacity onPress={() => handleRemoveOption(index)}>
              <Icon name="close-circle" size={nw(20)} color={PALETTE.danger + 'CC'} />
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
      
      {state.pollOptions.length < 5 ? (
        <TouchableOpacity style={styles.addOptionButton} onPress={handleAddOption}>
          <Icon name="add-circle" size={nw(18)} color={PALETTE.primary} />
          <Text style={styles.addOptionText}>Add option</Text>
        </TouchableOpacity>
      ) : null}
      
      <View style={styles.pollSettingsContainer}>
        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => toggleSetting('multipleChoice')}>
          <Icon 
            name={state.pollSettings.multipleChoice ? "checkbox" : "square-outline"} 
            size={nw(20)} 
            color={PALETTE.primary} 
          />
          <Text style={styles.checkboxLabel}>Allow multiple choices</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => toggleSetting('anonymous')}>
          <Icon 
            name={state.pollSettings.anonymous ? "checkbox" : "square-outline"} 
            size={nw(20)} 
            color={PALETTE.primary} 
          />
          <Text style={styles.checkboxLabel}>Anonymous voting</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: nw(20),
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: nw(18),
    paddingVertical: nh(16),
    gap: nh(14),
  },
  cardTitle: {
    color: PALETTE.primary,
    fontSize: nw(14),
    fontWeight: '700',
  },
  pollQuestionInput: {
    borderBottomWidth: 1,
    borderColor: PALETTE.border,
    fontSize: nw(16),
    fontWeight: '600',
    paddingBottom: nh(10),
    color: PALETTE.primary,
  },
  optionsLabel: {
    color: PALETTE.primary,
    fontSize: nw(13),
    fontWeight: '600',
  },
  pollOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(10),
  },
  pollOptionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(12),
    paddingHorizontal: nw(14),
    paddingVertical: nh(10),
    fontSize: nw(13),
    color: PALETTE.primary,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
  },
  addOptionText: {
    color: PALETTE.primary,
    fontSize: nw(12),
    fontWeight: '600',
  },
  pollSettingsContainer: {
    gap: nh(10),
    marginTop: nh(8),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
  },
  checkboxLabel: {
    color: PALETTE.primary,
    fontSize: nw(13),
  },
});

export default PollContent;