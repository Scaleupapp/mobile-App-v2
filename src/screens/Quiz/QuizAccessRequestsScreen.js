import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Alert,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {FadeInDown} from 'react-native-reanimated';
import moment from 'moment';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Text component
const Text = ({children, style, variant, color, ...props}) => {
  let fontWeight = 'normal';
  let fontSize = 14;
  if (variant) {
    if (variant.includes('semibold')) fontWeight = '600';
    if (variant.includes('bold')) fontWeight = 'bold';
    if (variant.includes('10')) fontSize = 10;
    if (variant.includes('12')) fontSize = 12;
    if (variant.includes('14')) fontSize = 14;
    if (variant.includes('16')) fontSize = 16;
    if (variant.includes('18')) fontSize = 18;
    if (variant.includes('20')) fontSize = 20;
    if (variant.includes('24')) fontSize = 24;
  }
  return (
    <RNText style={[{fontSize, fontWeight, color}, style]} {...props}>
      {children}
    </RNText>
  );
};
import {Text as RNText} from 'react-native';

// Header component
const Header = ({title, subtitle, onBack}) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color={COLORS.whiteFFFFFF} />
    </TouchableOpacity>
    <View style={styles.headerContent}>
      <Text variant="bold18" color={COLORS.whiteFFFFFF}>
        {title}
      </Text>
      {subtitle && (
        <Text variant="regular12" color={COLORS.whiteFFFFFF} style={{opacity: 0.8, marginTop: 4}}>
          {subtitle}
        </Text>
      )}
    </View>
  </View>
);

import {
  getQuizAccessRequestsApi,
  approveAccessRequestApi,
  rejectAccessRequestApi,
  bulkApproveRequestsApi,
  bulkRejectRequestsApi,
  getQuizByIdApi,
} from '../../services/apiService';

const {width: DEVICE_WIDTH, height: DEVICE_HEIGHT} = Dimensions.get('window');
const nw = percentage => (DEVICE_WIDTH * percentage) / 100;
const nh = percentage => (DEVICE_HEIGHT * percentage) / 100;

const COLORS = {
  yellowF5BE00: '#F5BE00',
  blue043142: '#043142',
  whiteFFFFFF: '#FFFFFF',
  grey999999: '#999999',
  grey666666: '#666666',
  greyEEEEEE: '#EEEEEE',
  greyF7F7F7: '#F7F7F7',
  greyF8F9FA: '#F8F9FA',
  greenSuccess: '#28A745',
  redError: '#DC3545',
  orangeWarning: '#FFA500',
  purpleCommunity: '#8B5CF6',
  purpleLightBg: '#F3E8FF',
};

const QuizAccessRequestsScreen = ({navigation, route}) => {
  const {quizId} = route.params;
  const userdata = useSelector(state => state?.userData);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequestForReject, setSelectedRequestForReject] = useState(null);
  
  // Load quiz details and requests
  useEffect(() => {
    loadData();
  }, [filterStatus]);
  
  const loadData = async (refresh = false) => {
    try {
      if (!refresh) setIsLoading(true);
      
      // Fetch quiz details and requests in parallel
      const [quizResponse, requestsResponse] = await Promise.all([
        getQuizByIdApi(quizId),
        getQuizAccessRequestsApi(quizId, filterStatus, 1, 100),
      ]);
      
      setQuiz(quizResponse.data.data.quiz);
      setRequests(requestsResponse.data.data.requests);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load access requests');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData(true);
  }, [filterStatus]);
  
  // Handle approve request
  const handleApprove = async (requestId) => {
    Alert.alert(
      'Approve Request',
      'Are you sure you want to approve this access request?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Approve',
          onPress: async () => {
            try {
              setIsLoading(true);
              await approveAccessRequestApi(requestId, 'Welcome to the quiz!');
              Alert.alert('Success', 'Access request approved');
              loadData();
            } catch (error) {
              console.error('Error approving request:', error);
              Alert.alert('Error', 'Failed to approve request');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };
  
  // Handle reject request
  const handleReject = (requestId) => {
    setSelectedRequestForReject(requestId);
    setShowRejectModal(true);
  };
  
  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }
    
    try {
      setIsLoading(true);
      await rejectAccessRequestApi(selectedRequestForReject, rejectReason);
      Alert.alert('Success', 'Access request rejected');
      setShowRejectModal(false);
      setRejectReason('');
      loadData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject request');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle bulk actions
  const handleBulkApprove = async () => {
    if (selectedRequests.length === 0) {
      Alert.alert('Error', 'Please select requests to approve');
      return;
    }
    
    Alert.alert(
      'Bulk Approve',
      `Are you sure you want to approve ${selectedRequests.length} requests?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Approve All',
          onPress: async () => {
            try {
              setIsLoading(true);
              await bulkApproveRequestsApi(selectedRequests, 'Welcome to the quiz!');
              Alert.alert('Success', `${selectedRequests.length} requests approved`);
              setSelectedRequests([]);
              setIsSelectionMode(false);
              loadData();
            } catch (error) {
              console.error('Error bulk approving:', error);
              Alert.alert('Error', 'Failed to approve requests');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };
  
  const handleBulkReject = () => {
    if (selectedRequests.length === 0) {
      Alert.alert('Error', 'Please select requests to reject');
      return;
    }
    setShowRejectModal(true);
  };
  
  const confirmBulkReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }
    
    try {
      setIsLoading(true);
      await bulkRejectRequestsApi(selectedRequests, rejectReason);
      Alert.alert('Success', `${selectedRequests.length} requests rejected`);
      setSelectedRequests([]);
      setIsSelectionMode(false);
      setShowRejectModal(false);
      setRejectReason('');
      loadData();
    } catch (error) {
      console.error('Error bulk rejecting:', error);
      Alert.alert('Error', 'Failed to reject requests');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle selection
  const toggleSelection = (requestId) => {
    if (selectedRequests.includes(requestId)) {
      setSelectedRequests(selectedRequests.filter(id => id !== requestId));
    } else {
      setSelectedRequests([...selectedRequests, requestId]);
    }
  };
  
  // Render request item
  const renderRequestItem = ({item, index}) => (
    <Animated.View
      entering={FadeInDown.delay(index * 100)}
      style={styles.requestCard}>
      {isSelectionMode && filterStatus === 'pending' && (
        <TouchableOpacity
          onPress={() => toggleSelection(item.id)}
          style={styles.checkboxContainer}>
          <View style={[
            styles.checkbox,
            selectedRequests.includes(item.id) && styles.checkboxSelected
          ]}>
            {selectedRequests.includes(item.id) && (
              <Ionicons name="checkmark" size={16} color={COLORS.whiteFFFFFF} />
            )}
          </View>
        </TouchableOpacity>
      )}
      
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.user.profilePicture ? (
            <Image
              source={{uri: item.user.profilePicture}}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={COLORS.grey666666} />
            </View>
          )}
        </View>
        
        <View style={styles.userDetails}>
          <Text variant="semibold16" color={COLORS.blue043142}>
            {item.user.username}
          </Text>

        </View>
        
        
      </View>
      
      {item.request.message && (
        <View style={styles.messageContainer}>
          <Text variant="regular14" color={COLORS.grey666666}>
            "{item.request.message}"
          </Text>
        </View>
      )}
      
      <View style={styles.requestMeta}>
        <Text variant="regular12" color={COLORS.grey999999}>
          Requested {moment(item.request.requestedAt).fromNow()}
        </Text>
        
        {item.request.status === 'pending' && !isSelectionMode && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => handleApprove(item.id)}>
              <Ionicons name="checkmark" size={18} color={COLORS.whiteFFFFFF} />
              <Text variant="semibold12" color={COLORS.whiteFFFFFF} style={{marginLeft: 4}}>
                Approve
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleReject(item.id)}>
              <Ionicons name="close" size={18} color={COLORS.whiteFFFFFF} />
              <Text variant="semibold12" color={COLORS.whiteFFFFFF} style={{marginLeft: 4}}>
                Reject
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {item.request.status !== 'pending' && (
          <View style={[
            styles.statusBadge,
            {backgroundColor: item.request.status === 'approved' 
              ? COLORS.greenSuccess + '20' 
              : COLORS.redError + '20'}
          ]}>
            <Text
              variant="semibold12"
              color={item.request.status === 'approved' 
                ? COLORS.greenSuccess 
                : COLORS.redError}>
              {item.request.status === 'approved' ? 'Approved' : 'Rejected'}
            </Text>
          </View>
        )}
      </View>
      
      {item.request.processNote && (
        <View style={styles.processNoteContainer}>
          <Text variant="regular12" color={COLORS.grey666666}>
            Note: {item.request.processNote}
          </Text>
        </View>
      )}
    </Animated.View>
  );
  
  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.yellowF5BE00} />
        <Text variant="regular16" color={COLORS.blue043142} style={{marginTop: 16}}>
          Loading access requests...
        </Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.blue043142} />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.blue043142, '#02293A']}
        style={styles.headerGradient}>
        <Header
          title="Access Requests"
          subtitle={quiz?.title}
          onBack={() => navigation.goBack()}
        />
      </LinearGradient>
      
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['pending', 'approved', 'rejected', 'all'].map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterTab,
              filterStatus === status && styles.activeFilterTab
            ]}
            onPress={() => {
              setFilterStatus(status);
              setSelectedRequests([]);
              setIsSelectionMode(false);
            }}>
            <Text
              variant={filterStatus === status ? 'semibold14' : 'regular14'}
              color={filterStatus === status ? COLORS.yellowF5BE00 : COLORS.grey666666}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Bulk Actions */}
      {filterStatus === 'pending' && requests.length > 0 && (
        <View style={styles.bulkActionsContainer}>
          {!isSelectionMode ? (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setIsSelectionMode(true)}>
              <MaterialIcons name="checklist" size={20} color={COLORS.blue043142} />
              <Text variant="semibold14" color={COLORS.blue043142} style={{marginLeft: 8}}>
                Select Multiple
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.bulkActionButtons}>
              <TouchableOpacity
                style={styles.cancelSelectButton}
                onPress={() => {
                  setIsSelectionMode(false);
                  setSelectedRequests([]);
                }}>
                <Text variant="semibold14" color={COLORS.grey666666}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <Text variant="regular14" color={COLORS.grey666666}>
                {selectedRequests.length} selected
              </Text>
              
              <View style={styles.bulkActionGroup}>
                <TouchableOpacity
                  style={[styles.bulkApproveButton, selectedRequests.length === 0 && styles.disabledButton]}
                  onPress={handleBulkApprove}
                  disabled={selectedRequests.length === 0}>
                  <Ionicons name="checkmark-done" size={18} color={COLORS.whiteFFFFFF} />
                  <Text variant="semibold12" color={COLORS.whiteFFFFFF} style={{marginLeft: 4}}>
                    Approve
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.bulkRejectButton, selectedRequests.length === 0 && styles.disabledButton]}
                  onPress={handleBulkReject}
                  disabled={selectedRequests.length === 0}>
                  <Ionicons name="close-circle" size={18} color={COLORS.whiteFFFFFF} />
                  <Text variant="semibold12" color={COLORS.whiteFFFFFF} style={{marginLeft: 4}}>
                    Reject
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
      
      {/* Requests List */}
      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.yellowF5BE00]}
            tintColor={COLORS.yellowF5BE00}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inbox" size={64} color={COLORS.greyEEEEEE} />
            <Text variant="semibold18" color={COLORS.grey666666} style={{marginTop: 16}}>
              No {filterStatus === 'all' ? '' : filterStatus} requests
            </Text>
            <Text variant="regular14" color={COLORS.grey999999} style={{marginTop: 8, textAlign: 'center'}}>
              {filterStatus === 'pending' 
                ? 'No pending access requests at the moment'
                : `No ${filterStatus} requests to display`}
            </Text>
          </View>
        )}
      />
      
      {/* Reject Modal */}
      {showRejectModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="bold18" color={COLORS.blue043142} style={{marginBottom: 16}}>
              Reason for Rejection
            </Text>
            
            <TextInput
              style={styles.reasonInput}
              placeholder="Please provide a reason..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedRequestForReject(null);
                }}>
                <Text variant="semibold14" color={COLORS.grey666666}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={selectedRequestForReject ? confirmReject : confirmBulkReject}>
                <Text variant="semibold14" color={COLORS.whiteFFFFFF}>
                  Confirm Rejection
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.greyF8F9FA,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(4),
    paddingVertical: nh(2),
  },
  headerContent: {
    flex: 1,
    marginLeft: nw(4),
  },
  backButton: {
    padding: nw(2),
    marginLeft: -nw(2),
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: nw(4),
    paddingVertical: nh(1),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  filterTab: {
    marginRight: nw(6),
    paddingVertical: nh(1),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeFilterTab: {
    borderBottomColor: COLORS.yellowF5BE00,
  },
  bulkActionsContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: nw(4),
    paddingVertical: nh(1.5),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(1),
  },
  bulkActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelSelectButton: {
    paddingVertical: nh(0.5),
    paddingHorizontal: nw(3),
  },
  bulkActionGroup: {
    flexDirection: 'row',
    gap: nw(2),
  },
  bulkApproveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greenSuccess,
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.8),
    borderRadius: 16,
  },
  bulkRejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.redError,
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.8),
    borderRadius: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  listContainer: {
    paddingVertical: nh(2),
    paddingHorizontal: nw(4),
  },
  requestCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 12,
    padding: nw(4),
    marginBottom: nh(2),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  checkboxContainer: {
    position: 'absolute',
    top: nw(4),
    left: nw(4),
    zIndex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.grey999999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.blue043142,
    borderColor: COLORS.blue043142,
  },
  userInfo: {
    flexDirection: 'row',
    marginBottom: nh(1.5),
  },
  avatarContainer: {
    marginRight: nw(3),
  },
  avatar: {
    width: nw(12),
    height: nw(12),
    borderRadius: nw(6),
  },
  avatarPlaceholder: {
    width: nw(12),
    height: nw(12),
    borderRadius: nw(6),
    backgroundColor: COLORS.greyEEEEEE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userStats: {
    flexDirection: 'row',
    gap: nw(3),
  },
  statItem: {
    alignItems: 'center',
  },
  messageContainer: {
    backgroundColor: COLORS.greyF8F9FA,
    padding: nw(3),
    borderRadius: 8,
    marginBottom: nh(1.5),
  },
  requestMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: nw(2),
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greenSuccess,
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.8),
    borderRadius: 16,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.redError,
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.8),
    borderRadius: 16,
  },
  statusBadge: {
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.5),
    borderRadius: 12,
  },
  processNoteContainer: {
    marginTop: nh(1),
    paddingTop: nh(1),
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(10),
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: nw(4),
  },
  modalContent: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 16,
    padding: nw(6),
    width: '100%',
    maxWidth: 400,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
    borderRadius: 8,
    padding: nw(3),
    fontSize: 14,
    color: COLORS.blue043142,
    maxHeight: nh(15),
    marginBottom: nh(2),
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: nw(3),
  },
  modalCancelButton: {
    paddingHorizontal: nw(4),
    paddingVertical: nh(1.2),
  },
  modalConfirmButton: {
    backgroundColor: COLORS.redError,
    paddingHorizontal: nw(4),
    paddingVertical: nh(1.2),
    borderRadius: 8,
  },
});

export default QuizAccessRequestsScreen;