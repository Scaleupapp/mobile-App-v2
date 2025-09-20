// src/screens/Community/tabs/DangerTab.js
import React, { useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import Text from '../../../components/Text';
import { nh, nw } from '../../../helper/scales';
import { PALETTE } from '../CommunitySettings';

const DangerTab = React.memo(({ communityId, navigation, onDelete }) => {
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Community',
      'This is a permanent action and cannot be undone. All posts, members, and data will be lost. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  }, [onDelete]);

  return (
    <ScrollView style={styles.tabContent}>
      <View style={styles.dangerSection}>
        <Text style={styles.dangerTitle}>Danger Zone</Text>
        <Text style={styles.dangerDescription}>
          These actions are irreversible. Please be certain.
        </Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleDelete}>
          <Text style={styles.dangerButtonText}>Delete This Community</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  tabContent: { 
    flex: 1, 
    padding: nw(16) 
  },
  dangerSection: {
    marginVertical: nh(16),
    padding: nw(20),
    backgroundColor: PALETTE.danger + '15',
    borderRadius: nh(12),
    borderWidth: 1,
    borderColor: PALETTE.danger + '40',
  },
  dangerTitle: {
    fontSize: nw(18),
    fontWeight: 'bold',
    color: PALETTE.danger,
    marginBottom: nh(8),
  },
  dangerDescription: {
    fontSize: nw(13),
    color: PALETTE.danger,
    marginBottom: nh(20),
    lineHeight: nh(18),
  },
  dangerButton: {
    backgroundColor: PALETTE.danger,
    borderRadius: nh(8),
    paddingVertical: nh(12),
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: nw(14),
    fontWeight: '600',
    color: PALETTE.surface,
  },
});

export default DangerTab;