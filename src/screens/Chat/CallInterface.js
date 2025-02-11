import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Text from '../../components/Text';
import io from 'socket.io-client';

const CallInterface = ({ userId, socket }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, inCall
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [activeCall, setActiveCall] = useState(null);
  
  const peerConnection = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
    ]
  };

  useEffect(() => {
    // Socket event listeners
    socket.on('incomingCall', handleIncomingCall);
    socket.on('callResponse', handleCallResponse);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('iceCandidate', handleIceCandidate);
    socket.on('callEnded', handleCallEnded);

    return () => {
      socket.off('incomingCall');
      socket.off('callResponse');
      socket.off('offer');
      socket.off('answer');
      socket.off('iceCandidate');
      socket.off('callEnded');
      cleanupCall();
    };
  }, []);

  const initializeMediaStream = async (isVideo) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      return null;
    }
  };

  const createPeerConnection = async (stream) => {
    const pc = new RTCPeerConnection(iceServers);
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('iceCandidate', {
          callId: activeCall,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    peerConnection.current = pc;
    return pc;
  };

  const initiateCall = async (receiverId, type) => {
    try {
      const stream = await initializeMediaStream(type === 'video');
      if (!stream) return;

      const response = await fetch('/api/calls/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId, type })
      });
      
      const { callId } = await response.json();
      setActiveCall(callId);
      setCallStatus('calling');
      
      socket.emit('joinCall', callId);
      const pc = await createPeerConnection(stream);
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socket.emit('offer', { callId, sdp: offer });
    } catch (error) {
      console.error('Error initiating call:', error);
      cleanupCall();
    }
  };

  const handleIncomingCall = async ({ callId, caller, type }) => {
    setActiveCall(callId);
    setCallStatus('receiving');
    // Show incoming call UI
  };

  const handleCallResponse = async ({ callId, action }) => {
    if (action === 'accepted') {
      setCallStatus('inCall');
    } else if (action === 'rejected' || action === 'ended') {
      cleanupCall();
    }
  };

  const handleOffer = async ({ callId, sdp }) => {
    try {
      const stream = await initializeMediaStream(true);
      const pc = await createPeerConnection(stream);
      
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket.emit('answer', { callId, sdp: answer });
    } catch (error) {
      console.error('Error handling offer:', error);
      cleanupCall();
    }
  };

  const handleAnswer = async ({ sdp }) => {
    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
    } catch (error) {
      console.error('Error handling answer:', error);
      cleanupCall();
    }
  };

  const handleIceCandidate = async ({ candidate }) => {
    try {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const acceptCall = async () => {
    try {
      await fetch('/api/calls/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: activeCall, action: 'accepted' })
      });
      setCallStatus('inCall');
    } catch (error) {
      console.error('Error accepting call:', error);
      cleanupCall();
    }
  };

  const endCall = async () => {
    try {
      await fetch('/api/calls/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: activeCall, action: 'ended' })
      });
      socket.emit('endCall', { callId: activeCall });
      cleanupCall();
    } catch (error) {
      console.error('Error ending call:', error);
      cleanupCall();
    }
  };

  const handleCallEnded = () => {
    cleanupCall();
  };

  const cleanupCall = () => {
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
            
            <TouchableOpacity style={styles.iconButton} onPress={toggleVideo}>
              <Icon 
                name={isVideoEnabled ? "camera-outline" : "camera-off-outline"} 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {callStatus === 'receiving' && (
        <View style={styles.incomingCall}>
          <Text variant="medium14" style={styles.callText}>Incoming Call...</Text>
          <View style={styles.controls}>
            <TouchableOpacity style={[styles.iconButton, styles.acceptCall]} onPress={acceptCall}>
              <Icon name="call-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, styles.endCall]} onPress={endCall}>
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
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  localVideo: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 100,
    height: 150,
    borderRadius: 8,
    objectFit: 'cover',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  endCall: {
    backgroundColor: '#FF4444',
  },
  acceptCall: {
    backgroundColor: '#4CAF50',
  },
  incomingCall: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callText: {
    color: '#fff',
    fontSize: 24,
    marginBottom: 20,
  }
});

export default CallInterface;