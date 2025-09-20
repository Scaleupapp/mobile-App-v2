import React, {useCallback, useState, useMemo} from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
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

const eventCharacterLimit = 500;

const formatDateTime = (value) => value.toLocaleString(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const MediaPreview = React.memo(({asset, onRemove}) => {
  const [imageLoading, setImageLoading] = useState(true);
  
  return (
    <View style={styles.mediaPreviewCard}>
      {imageLoading && (
        <View style={styles.imageLoadingOverlay}>
          <ActivityIndicator size="small" color={PALETTE.primary} />
        </View>
      )}
      <Image 
        source={{uri: asset?.uri}} 
        style={styles.mediaPreviewImage}
        onLoad={() => setImageLoading(false)}
        progressiveRenderingEnabled={true}
      />
      <TouchableOpacity style={styles.mediaRemoveButton} onPress={onRemove}>
        <Icon name="close-circle" size={nw(22)} color={COLORS.whiteFFFFFF} />
      </TouchableOpacity>
    </View>
  );
});

const EventContent = ({state, setState}) => {
  const [datePickerModule, setDatePickerModule] = useState(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [imagePickerModule, setImagePickerModule] = useState(null);

  const DatePickerComponent = useMemo(() => datePickerModule?.default, [datePickerModule]);

  const handleShowDatePicker = useCallback(async () => {
    if (!datePickerModule) {
      const module = await import('react-native-date-picker');
      setDatePickerModule(module);
    }
    setDatePickerVisible(true);
  }, [datePickerModule]);

  const handleTitleChange = useCallback((text) => {
    setState(prev => ({...prev, eventTitle: text}));
  }, [setState]);

  const handleDescriptionChange = useCallback((text) => {
    setState(prev => ({...prev, eventDescription: text}));
  }, [setState]);

  const handleLocationChange = useCallback((text) => {
    setState(prev => ({...prev, eventLocation: text}));
  }, [setState]);

  const handleDateConfirm = useCallback((date) => {
    setDatePickerVisible(false);
    setState(prev => ({...prev, eventDate: date}));
  }, [setState]);

  const handleSelectMedia = useCallback(async () => {
    try {
      let picker = imagePickerModule;
      if (!picker) {
        const module = await import('react-native-image-picker');
        setImagePickerModule(module);
        picker = module;
      }
      
      picker.launchImageLibrary({mediaType: 'mixed', quality: 0.85}, (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', 'Unable to select media right now.');
          return;
        }
        if (response.assets && response.assets[0]) {
          setState(prev => ({...prev, mediaAsset: response.assets[0]}));
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to load image picker.');
    }
  }, [imagePickerModule, setState]);

  const handleRemoveMedia = useCallback(() => {
    setState(prev => ({...prev, mediaAsset: null}));
  }, [setState]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Event details</Text>
      
      <TextInput
        style={styles.singleLineInput}
        placeholder="Event title"
        placeholderTextColor={PALETTE.subtle}
        value={state.eventTitle}
        onChangeText={handleTitleChange}
        maxLength={150}
      />
      
      <TouchableOpacity style={styles.dateButton} onPress={handleShowDatePicker}>
        <Icon name="calendar" size={nw(18)} color={PALETTE.primary} />
        <Text style={styles.dateButtonText}>{formatDateTime(state.eventDate)}</Text>
      </TouchableOpacity>
      
      {DatePickerComponent && (
        <DatePickerComponent
          modal
          open={datePickerVisible}
          mode="datetime"
          minimumDate={new Date()}
          date={state.eventDate}
          onConfirm={handleDateConfirm}
          onCancel={() => setDatePickerVisible(false)}
        />
      )}
      
      <TextInput
        style={styles.singleLineInput}
        placeholder="Location (optional)"
        placeholderTextColor={PALETTE.subtle}
        value={state.eventLocation}
        onChangeText={handleLocationChange}
        maxLength={200}
      />
      
      <TextInput
        style={styles.multiLineInput}
        placeholder="Describe the event agenda, venue, or logistics"
        placeholderTextColor={PALETTE.subtle}
        multiline
        value={state.eventDescription}
        onChangeText={handleDescriptionChange}
        maxLength={eventCharacterLimit}
      />
      
      <View style={styles.cardFooter}>
        <Text style={styles.charCounter}>
          {state.eventDescription.length}/{eventCharacterLimit}
        </Text>
        <TouchableOpacity style={styles.mediaButton} onPress={handleSelectMedia}>
          <Icon name="image" size={nw(18)} color={PALETTE.primary} />
          <Text style={styles.mediaButtonText}>Add banner</Text>
        </TouchableOpacity>
      </View>
      
      {state.mediaAsset ? (
        <MediaPreview asset={state.mediaAsset} onRemove={handleRemoveMedia} />
      ) : null}
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
  singleLineInput: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(12),
    paddingHorizontal: nw(14),
    paddingVertical: nh(10),
    fontSize: nw(14),
    color: PALETTE.primary,
  },
  multiLineInput: {
    minHeight: nh(120),
    color: PALETTE.primary,
    fontSize: nw(14),
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(12),
    paddingHorizontal: nw(14),
    paddingVertical: nh(10),
  },
  dateButtonText: {
    color: PALETTE.primary,
    fontSize: nw(13),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCounter: {
    color: PALETTE.subtle,
    fontSize: nw(11),
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
  },
  mediaButtonText: {
    color: PALETTE.primary,
    fontSize: nw(12),
    fontWeight: '600',
  },
  mediaPreviewCard: {
    borderRadius: nw(16),
    overflow: 'hidden',
    position: 'relative',
  },
  mediaPreviewImage: {
    width: '100%',
    height: nh(200),
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.border,
    zIndex: 1,
  },
  mediaRemoveButton: {
    position: 'absolute',
    right: nw(10),
    top: nh(10),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: nw(14),
    padding: nw(4),
  },
});

export default EventContent;