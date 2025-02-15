import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  RTCView,
  MediaStream
} from 'react-native-webrtc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Text from '../../components/Text';
import Sound from 'react-native-sound';

const API_URL = 'http://192.168.136.240:3000';

const CallInterface = ({ userId, socket, onClose }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [activeCall, setActiveCall] = useState(null);
  const [ringtone, setRingtone] = useState(null);
  const [remotePeerName, setRemotePeerName] = useState('');
  const [callType, setCallType] = useState(null);
  const [callError, setCallError] = useState(null);
const [isCallAccepted, setIsCallAccepted] = useState(false);

  const peerConnection = useRef(null);
  const callSetupInProgress = useRef(false);

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:your-turn-server:3478',
        username: 'username',
        credential: 'password'
      }
    ]
  };

  useEffect(() => {
    setupRingtone();
    return () => cleanupCall();
  }, []);

  useEffect(() => {
    let socketReconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 3;
  
    const initializeSocket = () => {
      if (!socket) return;
  
      socket.on('connect', () => {
        console.log('Socket connected successfully');
        socketReconnectAttempts = 0;
        
        // Register user ID with socket after connection
        const registerUser = async () => {
          try {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
              const { id } = JSON.parse(userData);
              socket.emit('register', id);
              console.log('User registered with socket:', id);
            }
          } catch (error) {
            console.error('Failed to register user with socket:', error);
          }
        };
        
        registerUser();
      });
  
      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        socketReconnectAttempts++;
        
        if (socketReconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          Alert.alert(
            'Connection Error',
            'Unable to establish connection to call service. Please try again later.'
          );
        }
      });
  
      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Reconnect manually if server disconnected
          socket.connect();
        }
      });
  
      // Ensure socket is connected
      if (!socket.connected) {
        socket.connect();
      }
    };
  
    initializeSocket();
  
    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('connect_error');
        socket.off('disconnect');
      }
    };
  }, [socket]);

  const setupRingtone = () => {
    const ring = new Sound('ringtone.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load ringtone:', error);
        return;
      }
      ring.setNumberOfLoops(-1);
    });
    setRingtone(ring);
  };

  const setupSocketListeners = () => {
    socket.on('incomingCall', handleIncomingCall);
    socket.on('callResponse', handleCallResponse);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('iceCandidate', handleIceCandidate);
    socket.on('callEnded', handleCallEnded);
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setCallError(error.message);
      cleanupCall();
    });
  };
  const removeSocketListeners = () => {
    socket.off('incomingCall');
    socket.off('callResponse');
    socket.off('offer');
    socket.off('answer');
    socket.off('iceCandidate');
    socket.off('callEnded');
  };

  const handleCallResponse = async ({ callId, action, receiver }) => {
    try {
      if (action === 'accepted') {
        setCallStatus('inCall');
        // If ringtone is playing, stop it
        if (ringtone) ringtone.stop();
        
        // If we don't have a local stream yet, initialize it
        if (!localStream) {
          const stream = await initializeMediaStream(callType === 'video');
          if (!stream) throw new Error('Failed to get local media stream');
        }
  
        // If we don't have a peer connection, create one
        if (!peerConnection.current) {
          await createPeerConnection(localStream);
        }
  
      } else if (action === 'rejected') {
        Alert.alert('Call Rejected', 'The other person rejected the call');
        cleanupCall();
      } else if (action === 'ended') {
        cleanupCall();
      }
    } catch (error) {
      console.error('Call response handling error:', error);
      cleanupCall();
    }
  };
  
  const handleCallEnded = () => {
    Alert.alert('Call Ended', 'The call has ended');
    cleanupCall();
  };

  const initializeMediaStream = async (isVideo) => {
    try {
      const constraints = {
        audio: true,
        video: isVideo ? {
          facingMode: 'user',
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 }
        } : false
      };

      const stream = await mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Media stream error:', error);
      Alert.alert('Error', 'Cannot access camera/microphone');
      return null;
    }
  };

  const createPeerConnection = async (stream) => {
    try {
      const pc = new RTCPeerConnection(iceServers);
  
      // Store ICE candidates if offer/answer hasn't been set
      const iceCandidates = [];
      
      pc.onicecandidate = ({ candidate }) => {
        if (candidate && socket && activeCall) {
          socket.emit('iceCandidate', {
            callId: activeCall,
            candidate
          });
        }
      };
  
      pc.oniceconnectionstatechange = () => {
        console.log('ICE Connection State:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          cleanupCall();
        }
      };
  
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };
  
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
  
      peerConnection.current = pc;
      return pc;
    } catch (error) {
      console.error('PeerConnection error:', error);
      throw error;
    }
  };

const initiateCall = async (receiverId, type) => {
  try {
    if (!receiverId) {
      throw new Error('Receiver ID is required');
    }
    if (callSetupInProgress.current) return;
    callSetupInProgress.current = true;

    // Add debug logging
    console.log('Initiating call with:', { receiverId, type });
    
    const userData = await AsyncStorage.getItem('userData');
    if (!userData) {
      throw new Error('No user data found');
    }
    
    const { token } = JSON.parse(userData);
    if (!token) {
      throw new Error('No auth token found');
    }

    console.log('Socket status:', socket?.connected);
    if (!socket?.connected) {
      throw new Error('Socket not connected');
    }

    const stream = await initializeMediaStream(type === 'video');
    if (!stream) {
      throw new Error('Failed to get media stream');
    }

    setCallType(type);
    
    // Add logging for API call
    console.log('Making API call to initiate call');
    const response = await fetch(`${API_URL}/api/calls/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ receiverId, type })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Server error: ${errorData.error || response.statusText}`);
    }

    const { callId } = await response.json();
    console.log('Call initiated successfully:', callId);
    
    setActiveCall(callId);
    setCallStatus('calling');

    socket.emit('joinCall', callId);

    const pc = await createPeerConnection(stream);
    console.log('Peer connection created');
    
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: type === 'video'
    });

    await pc.setLocalDescription(offer);
    
    socket.emit('offer', { 
      callId, 
      sdp: offer, 
      receiverId 
    });

    // Start call timeout
    setTimeout(() => {
      if (callStatus === 'calling') {
        Alert.alert('No Answer', 'The call was not answered');
        cleanupCall();
      }
    }, 30000);

  } catch (error) {
    console.error('Call initiation error details:', {
      message: error.message,
      stack: error.stack
    });
    Alert.alert('Error', `Failed to start call: ${error.message}`);
    cleanupCall();
  } finally {
    callSetupInProgress.current = false;
  }
};

  const handleIncomingCall = async ({ callId, caller, type }) => {
    try {
      setActiveCall(callId);
      setCallStatus('receiving');
      setCallType(type);
      setRemotePeerName(caller.name);
      
      if (ringtone) ringtone.play();
      
      const stream = await initializeMediaStream(type === 'video');
      if (!stream) throw new Error('Failed to get media stream');
      
      socket.emit('joinCall', callId);
    } catch (error) {
      console.error('Incoming call error:', error);
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    try {
      if (ringtone) ringtone.stop();
  
      const userData = await AsyncStorage.getItem('userData');
      const { token } = JSON.parse(userData);
  
      // First initialize media stream
      const stream = await initializeMediaStream(callType === 'video');
      if (!stream) throw new Error('Failed to get media stream');
  
      // Then create peer connection
      await createPeerConnection(stream);
  
      const response = await fetch(`${API_URL}/api/calls/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          callId: activeCall,
          action: 'accepted'
        })
      });
  
      if (!response.ok) throw new Error('Failed to accept call');
  
      setCallStatus('inCall');
      
    } catch (error) {
      console.error('Accept call error:', error);
      cleanupCall();
    }
  };

  const handleOffer = async ({ sdp, callerId, callId }) => {
    try {
      if (!peerConnection.current) {
        const stream = await initializeMediaStream(callType === 'video');
        if (!stream) throw new Error('Failed to get local media stream');
  
        const pc = await createPeerConnection(stream);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('answer', {
          callId,
          sdp: answer,
          receiverId: callerId
        });
      }
    } catch (error) {
      console.error('Error handling offer:', error);
      cleanupCall();
    }
  };
  
  const handleAnswer = async ({ sdp }) => {
    try {
      if (peerConnection.current && sdp) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
        setIsCallAccepted(true);
      }
    } catch (error) {
      console.error('Answer handling error:', error);
      cleanupCall();
    }
  };


   // Add this function to handle connection state changes
   const handleConnectionStateChange = () => {
    if (peerConnection.current) {
      console.log('Connection state:', peerConnection.current.connectionState);
      if (peerConnection.current.connectionState === 'failed') {
        Alert.alert('Connection Failed', 'Call connection failed');
        cleanupCall();
      }
    }
  };


  const handleIceCandidate = async ({ candidate }) => {
    try {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    } catch (error) {
      console.error('ICE candidate error:', error);
    }
  };

  const endCall = async () => {
    try {
      if (activeCall) {
        const userData = await AsyncStorage.getItem('userData');
        const { token } = JSON.parse(userData);

        await fetch(`${API_URL}/api/calls/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ callId: activeCall })
        });

        socket.emit('endCall', { callId: activeCall });
      }
    } catch (error) {
      console.error('End call error:', error);
    } finally {
      cleanupCall();
    }
  };

  const cleanupCall = () => {
    if (ringtone) ringtone.stop();

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }

    setCallStatus('idle');
    setActiveCall(null);
    setIsMuted(false);
    setIsVideoEnabled(true);
    callSetupInProgress.current = false;
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };



  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>
          {callStatus === 'idle' ? 'Start Call' : 
           callStatus === 'calling' ? 'Calling...' :
           callStatus === 'receiving' ? 'Incoming Call' : 'In Call'}
        </Text>
      </View>
      {callStatus === 'idle' && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => initiateCall(userId, 'audio')}
          >
            <Icon name="call-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => initiateCall(userId, 'video')}
          >
            <Icon name="videocam-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {callStatus === 'inCall' && (
        <View style={styles.callContainer}>
          {remoteStream && (
            <RTCView
              streamURL={remoteStream.toURL()}
              style={styles.remoteStream}
              objectFit="cover"
            />
          )}
          {localStream && (
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.localStream}
              objectFit="cover"
            />
          )}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleMute}>
              <Icon
                name={isMuted ? "mic-off-outline" : "mic-outline"}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, styles.endCall]} onPress={endCall}>
              <Icon name="call-outline" size={24} color="#fff" />
            </TouchableOpacity>
            {callType === 'video' && (
              <TouchableOpacity style={styles.iconButton} onPress={toggleVideo}>
                <Icon
                  name={isVideoEnabled ? "videocam-outline" : "videocam-off-outline"}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {callStatus === 'receiving' && (
        <View style={styles.incomingCall}>
          <Text style={styles.callText}>
            Incoming {callType} call from {remotePeerName}
          </Text>
          <View style={styles.controls}>
            <TouchableOpacity style={[styles.iconButton, styles.acceptCall]} onPress={acceptCall}>
              <Icon name="call-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, styles.endCall]} onPress={cleanupCall}>
              <Icon name="call-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  callContainer: {
    flex: 1,
  },
  remoteStream: {
    flex: 1,
  },
  localStream: {
    position: 'absolute',
    width: 100,
    height: 150,
    top: 10,
    right: 10,
    zIndex: 2,
  },
  callStatus: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
  },
  callStatusText: {
    color: '#fff',
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
  },
  iconButton: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: '#007AFF',
  },
  endCall: {
    backgroundColor: '#FF3B30',
  },
  acceptCall: {
    backgroundColor: '#34C759',
  },
  incomingCall: {
    padding: 20,
    alignItems: 'center',
  },
  callText: {
    marginBottom: 20,
    fontSize: 18,
  }
});

export default CallInterface;