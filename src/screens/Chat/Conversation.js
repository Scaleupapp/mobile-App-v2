import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Pressable,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import {Image} from 'react-native';
import Text from '../../components/Text';
import Routes from '../../helper/routes';
import {getconversation} from '../../services/apiService';
import {useSelector} from 'react-redux';
import Button from '../../components/Button';
import {images} from '../../assets/images';
import ChatModal from './ChatModal';
import {formatDateforchat} from '../../helper/commonFunctions';
import {useFocusEffect} from '@react-navigation/native';
import CallInterface from './CallInterface';
import { io } from "socket.io-client";
import AsyncStorage from '@react-native-async-storage/async-storage';


const socketInstance = io("http://192.168.136.240:3000"); // Replace with your actual socket URL


const Conversation = ({navigation, route}) => {
  const userData = useSelector(state => state?.userData);
  console.log(userData?.id)
  const [loader, setLoader] = useState(true);

  const [conversation, setConversation] = useState([]);
  const chatmodelRef = useRef(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showCallInterface, setShowCallInterface] = useState(false);


  useFocusEffect(
    useCallback(() => {
      fetchConversations(); // Function to fetch conversations
    }, []), // Add dependencies if needed
  );

  
  const fetchConversations = async () => {
    try {
      const {data} = await getconversation();
      setConversation(data);
      //   console.log('🚀 ~ fetchConversations ~ data:', data);
    } catch (error) {
      console.log('🚀 ~ fetchConversations ~ error..:', error);
    } finally {
      setLoader(false);
    }

    // setConversations(data);
  };
  const truncateString = (str, maxLength = 130) => {
    return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
  };

  // Modify your Card component to include call buttons:
  const Card = ({item}) => {
    const member = item?.members[0];
    return (
      <Pressable style={styles.card}>
        <View style={styles.cardContent}>
          <Image
            source={{uri: member?.profilePicture}}
            style={styles.image}
          />
          <View style={{flex: 7}}>
            <Text variant="medium12" color={COLORS.blue043142}>
              {member?.firstname + ' ' + member?.lastname}
            </Text>
            <Text variant="medium12" color={COLORS.grey999999}>
              {truncateString(item?.lastMessage?.message, 30)}
            </Text>
          </View>
          <View style={styles.callButtons}>
            <TouchableOpacity 
              style={styles.callButton}
              onPress={() => {
                setSelectedUser({
                  id: member?._id, // Ensure this matches your user object structure
                  name: member?.firstname + ' ' + member?.lastname
                });
                setShowCallInterface(true);
              }}>
              <Icon name="call-outline" size={20} color={COLORS.blue043142} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.callButton}
              onPress={() => {
                setSelectedUser({
                  id: member?._id, // Ensure this matches your user object structure
                  name: member?.firstname + ' ' + member?.lastname
                });
                setShowCallInterface(true);
              }}>
              <Icon name="videocam-outline" size={20} color={COLORS.blue043142} />
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    );
  };
  return loader ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size={30} />
      <Text variant="medium12" style={{marginTop: 10}}>
        Conversation Loading....
      </Text>
    </View>
  ) : (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header
        title="Chat"
        // backIcon={icons.backArrow} // Provide your back arrow icon
        // rightIcon={icons.menu} // Provide your right icon
        // onBackPress={handleBackPress}
        // onRightIconPress={handleRightIconPress}
      />
      {showCallInterface && (
        <Modal
          visible={showCallInterface}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCallInterface(false)}>
          <View style={styles.modalContainer}>
          <CallInterface 
        userId={selectedUser?.id}
        receiverName={selectedUser?.name}
        socket={socketInstance}
        onClose={() => {
          setShowCallInterface(false);
          setSelectedUser(null);
        }}
        onError={(error) => {
          Alert.alert('Call Error', error);
          setShowCallInterface(false);
        }}
      />
          </View>
        </Modal>
      )}
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <ChatModal ref={chatmodelRef} />
          <FlatList
            data={conversation}
            renderItem={({item}) => <Card item={item} />}
            ListEmptyComponent={() => {
              return (
                <View>
                  <Image
                    source={images.nochat}
                    resizeMode="contain"
                    style={styles.notimage}
                  />

                  <Text
                    variant="semibold20"
                    color={COLORS.blue043142}
                    style={{textAlign: 'center', marginTop: nh(30)}}>
                    No Chats Yet
                  </Text>
                  <Text
                    variant="medium14"
                    color={COLORS.grey999999}
                    style={{
                      textAlign: 'center',
                      marginTop: nh(5),
                      marginBottom: nh(20),
                    }}>
                    Start a conversation and connect with fellow learners. It’s
                    more fun learning together!
                  </Text>
                  <Button
                    text="Start a new chat"
                    onPress={() => chatmodelRef.current?.present()}
                  />
                </View>
              );
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Conversation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  layer1: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(32),
    marginHorizontal: nw(16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
  },
  layer2: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(15),
    marginHorizontal: nw(-16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
    paddingHorizontal: nw(16),
    paddingTop: nh(30),
  },
  callButtons: {
    flex: 3,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  callButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.greyF5F5F5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  image: {
    height: nh(50),
    width: nh(50),
    borderRadius: nh(25),
    marginRight: 10,
    borderColor: COLORS.grey777777,
    borderWidth: 1,
  },
  card: {
    flexDirection: 'row',
    marginBottom: nh(15),
    alignItems: 'center',
    flex: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notimage: {
    height: nh(275),
    width: nw(300),
    alignSelf: 'center',
    marginTop: nh(30),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
