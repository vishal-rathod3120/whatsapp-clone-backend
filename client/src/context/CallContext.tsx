import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { socketService } from '../services/socket';

type CallState = 'idle' | 'outgoing' | 'incoming' | 'connected';

interface CallInfo {
  callId: string;
  chatId: string;
  type: 'AUDIO' | 'VIDEO';
  caller?: { id: string; displayName: string; avatarUrl?: string };
  remoteName?: string;
  remoteAvatar?: string;
}

interface CallContextType {
  callState: CallState;
  callInfo: CallInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  callDuration: number;
  initiateCall: (chatId: string, type: 'AUDIO' | 'VIDEO', remoteName: string, remoteAvatar?: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const ICE_SERVERS = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

export function CallProvider({ children }: { children: ReactNode }) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [callInfo, setCallInfo] = useState<CallInfo | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  
  // Refs for signaling to avoid useEffect re-registration races
  const callStateRef = useRef<CallState>(callState);
  const callInfoRef = useRef<CallInfo | null>(callInfo);
  const localStreamRef = useRef<MediaStream | null>(localStream);

  useEffect(() => { callStateRef.current = callState; }, [callState]);
  useEffect(() => { callInfoRef.current = callInfo; }, [callInfo]);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  // Cleanup helper
  const cleanup = useCallback(() => {
    console.log('Call cleanup triggered');
    peerConnection.current?.close();
    peerConnection.current = null;
    
    // Stop all tracks in the current localStreamRef
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    callStateRef.current = 'idle';
    setCallInfo(null);
    callInfoRef.current = null;
    localStreamRef.current = null;
    setIsMuted(false);
    setIsVideoOff(false);
    setCallDuration(0);
    if (durationInterval.current) clearInterval(durationInterval.current);
    durationInterval.current = null;
    ringtoneRef.current?.pause();
  }, []);

  // Create peer connection
  const createPeer = useCallback(() => {
    console.log('Creating RTCPeerConnection');
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate && callInfoRef.current?.callId) {
        socketService.emit('call:ice-candidate', {
          callId: callInfoRef.current.callId,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      console.log('Remote track received');
      setRemoteStream(e.streams[0]);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        endCall();
      }
    };

    peerConnection.current = pc;
    return pc;
  }, []);

  // Get media stream
  const getMedia = useCallback(async (type: 'AUDIO' | 'VIDEO') => {
    try {
      console.log(`Getting media: ${type}`);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'VIDEO',
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error('Failed to get media:', err);
      alert('Could not access camera/microphone. Please check permissions and ensure you have media devices connected.');
      return null;
    }
  }, []);

  // Initiate outgoing call
  const initiateCall = useCallback(async (chatId: string, type: 'AUDIO' | 'VIDEO', remoteName: string, remoteAvatar?: string) => {
    console.log(`Initiating ${type} call to ${chatId}`);
    const stream = await getMedia(type);
    if (!stream) return;

    const info: CallInfo = { callId: '', chatId, type, remoteName, remoteAvatar };
    setCallInfo(info);
    callInfoRef.current = info;
    setCallState('outgoing');
    callStateRef.current = 'outgoing';

    socketService.emit('call:initiate', { chatId, type });
  }, [getMedia]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!callInfoRef.current) return;
    console.log('Accepting call:', callInfoRef.current.callId);

    const stream = await getMedia(callInfoRef.current.type);
    if (!stream) return;

    const pc = createPeer();
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    socketService.emit('call:accept', { callId: callInfoRef.current.callId });
    setCallState('connected');
    callStateRef.current = 'connected';

    durationInterval.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, [getMedia, createPeer]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (callInfoRef.current?.callId) {
      console.log('Rejecting call:', callInfoRef.current.callId);
      socketService.emit('call:reject', { callId: callInfoRef.current.callId, reason: 'rejected' });
    }
    cleanup();
  }, [cleanup]);

  // End active call
  const endCall = useCallback(() => {
    if (callInfoRef.current?.callId) {
      console.log('Ending call:', callInfoRef.current.callId);
      socketService.emit('call:end', { callId: callInfoRef.current.callId, reason: 'hangup' });
    }
    cleanup();
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsMuted(prev => !prev);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsVideoOff(prev => !prev);
    }
  }, []);

  // Socket event listeners - STABLE listener group
  useEffect(() => {
    const onCallInitiated = (data: { callId: string }) => {
      console.log('Call initiated acknowledgment received:', data.callId);
      setCallInfo(prev => {
        const next = prev ? { ...prev, callId: data.callId } : null;
        callInfoRef.current = next;
        return next;
      });
    };

    const onIncomingCall = (data: { callId: string; chatId: string; caller: any; type: 'AUDIO' | 'VIDEO' }) => {
      console.log('Incoming call received:', data.callId);
      if (callStateRef.current !== 'idle') {
        console.log('User is busy, rejecting incoming call automatically');
        socketService.emit('call:reject', { callId: data.callId, reason: 'busy' });
        return;
      }
      
      const info: CallInfo = {
        callId: data.callId,
        chatId: data.chatId,
        type: data.type,
        caller: data.caller,
        remoteName: data.caller.displayName,
        remoteAvatar: data.caller.avatarUrl,
      };
      
      setCallInfo(info);
      callInfoRef.current = info;
      setCallState('incoming');
      callStateRef.current = 'incoming';
    };

    const onCallAccepted = async (data: { callId: string }) => {
      console.log('Call was accepted by remote user');
      const stream = localStreamRef.current;
      if (!stream) {
        console.error('No local stream available when call was accepted');
        return;
      }
      
      const pc = createPeer();
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketService.emit('call:offer', { callId: data.callId, sdp: offer.sdp });
        console.log('WebRTC offer sent to callee');
      } catch (err) {
        console.error('Offer creation failed:', err);
      }

      setCallState('connected');
      callStateRef.current = 'connected';
      durationInterval.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    };

    const onCallRejected = () => { console.log('Call rejected by remote'); cleanup(); };
    const onCallEnded = () => { console.log('Call ended by remote'); cleanup(); };
    const onCallTimeout = () => { console.log('Call timed out'); cleanup(); };

    const onOffer = async (data: { callId: string; sdp: string }) => {
      console.log('WebRTC offer received');
      const pc = peerConnection.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketService.emit('call:answer', { callId: data.callId, sdp: answer.sdp });
        console.log('WebRTC answer sent to caller');
      } catch (err) {
        console.error('Answer failed:', err);
      }
    };

    const onAnswer = async (data: { sdp: string }) => {
      console.log('WebRTC answer received');
      const pc = peerConnection.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
        console.log('WebRTC session description completed');
      } catch (err) {
        console.error('Set answer failed:', err);
      }
    };

    const onIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
      const pc = peerConnection.current;
      if (!pc) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error('ICE candidate failed:', err);
      }
    };

    socketService.on('call:initiated', onCallInitiated);
    socketService.on('call:incoming', onIncomingCall);
    socketService.on('call:accepted', onCallAccepted);
    socketService.on('call:rejected', onCallRejected);
    socketService.on('call:ended', onCallEnded);
    socketService.on('call:timeout', onCallTimeout);
    socketService.on('call:offer', onOffer);
    socketService.on('call:answer', onAnswer);
    socketService.on('call:ice-candidate', onIceCandidate);

    return () => {
      socketService.off('call:initiated', onCallInitiated);
      socketService.off('call:incoming', onIncomingCall);
      socketService.off('call:accepted', onCallAccepted);
      socketService.off('call:rejected', onCallRejected);
      socketService.off('call:ended', onCallEnded);
      socketService.off('call:timeout', onCallTimeout);
      socketService.off('call:offer', onOffer);
      socketService.off('call:answer', onAnswer);
      socketService.off('call:ice-candidate', onIceCandidate);
    };
  }, [cleanup, createPeer]); // Stabilized dependencies

  return (
    <CallContext.Provider value={{
      callState, callInfo, localStream, remoteStream,
      isMuted, isVideoOff, callDuration,
      initiateCall, acceptCall, rejectCall, endCall,
      toggleMute, toggleVideo,
    }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within CallProvider');
  return ctx;
}
