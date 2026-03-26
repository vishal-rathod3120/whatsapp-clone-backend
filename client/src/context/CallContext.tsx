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

interface PeerEntry {
  pc: RTCPeerConnection;
  stream: MediaStream | null;
}

interface CallContextType {
  callState: CallState;
  callInfo: CallInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
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
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Multi-peer map: userId -> PeerEntry
  const peers = useRef<Map<string, PeerEntry>>(new Map());
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

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
    // Close all peer connections
    peers.current.forEach((entry) => entry.pc.close());
    peers.current.clear();

    // Stop all tracks in the current localStreamRef
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    
    setLocalStream(null);
    setRemoteStream(null);
    setRemoteStreams(new Map());
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
  }, []);

  // Create peer connection for a specific remote user
  const createPeerForUser = useCallback((remoteUserId: string) => {
    console.log(`Creating RTCPeerConnection for user: ${remoteUserId}`);
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate && callInfoRef.current?.callId) {
        socketService.emit('call:ice-candidate', {
          callId: callInfoRef.current.callId,
          candidate: e.candidate,
          targetUserId: remoteUserId,
        });
      }
    };

    pc.ontrack = (e) => {
      console.log(`Remote track received from user: ${remoteUserId}`);
      const stream = e.streams[0];
      // Update the single remoteStream for backward compatibility (1:1 calls)
      setRemoteStream(stream);
      // Also update the multi-peer remoteStreams map
      setRemoteStreams(prev => {
        const next = new Map(prev);
        next.set(remoteUserId, stream);
        return next;
      });
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state (${remoteUserId}):`, pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        // Remove this peer silently; if all peers disconnect, end the call
        peers.current.delete(remoteUserId);
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.delete(remoteUserId);
          return next;
        });
        if (peers.current.size === 0) {
          endCall();
        }
      }
    };

    // Add local tracks
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
    }

    peers.current.set(remoteUserId, { pc, stream: null });
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

    socketService.emit('call:accept', { callId: callInfoRef.current.callId });
    setCallState('connected');
    callStateRef.current = 'connected';

    durationInterval.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, [getMedia]);

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
      console.log('Incoming call received:', data.callId, '| current state:', callStateRef.current);
      if (callStateRef.current !== 'idle') {
        if (!peers.current.size && !localStreamRef.current) {
          console.warn('State was non-idle but no active call found — force resetting to accept.');
          callStateRef.current = 'idle';
        } else {
          console.log('User is genuinely busy, rejecting incoming call automatically');
          socketService.emit('call:reject', { callId: data.callId, reason: 'busy' });
          return;
        }
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

    const onCallAccepted = async (data: { callId: string; acceptedBy: string }) => {
      console.log('Call was accepted by remote user:', data.acceptedBy);
      const stream = localStreamRef.current;
      if (!stream) {
        console.error('No local stream available when call was accepted');
        return;
      }
      
      // Create a peer connection for this specific user
      const pc = createPeerForUser(data.acceptedBy);

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketService.emit('call:offer', { callId: data.callId, sdp: offer.sdp, targetUserId: data.acceptedBy });
        console.log(`WebRTC offer sent to ${data.acceptedBy}`);
      } catch (err) {
        console.error('Offer creation failed:', err);
      }

      setCallState('connected');
      callStateRef.current = 'connected';
      if (!durationInterval.current) {
        durationInterval.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      }
    };

    const onCallRejected = () => { console.log('Call rejected by remote'); cleanup(); };
    const onCallEnded = (data: any) => { console.log('Call ended by remote', data); cleanup(); };
    const onCallTimeout = () => { console.log('Call timed out'); cleanup(); };

    const onOffer = async (data: { callId: string; sdp: string; from: string }) => {
      console.log(`WebRTC offer received from ${data.from}`);
      // Create a peer connection for the caller
      const pc = createPeerForUser(data.from);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketService.emit('call:answer', { callId: data.callId, sdp: answer.sdp, targetUserId: data.from });
        console.log(`WebRTC answer sent to ${data.from}`);
      } catch (err) {
        console.error('Answer failed:', err);
      }
    };

    const onAnswer = async (data: { sdp: string; from: string }) => {
      console.log(`WebRTC answer received from ${data.from}`);
      const entry = peers.current.get(data.from);
      if (!entry) return;
      try {
        await entry.pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
        console.log('WebRTC session description completed');
      } catch (err) {
        console.error('Set answer failed:', err);
      }
    };

    const onIceCandidate = async (data: { candidate: RTCIceCandidateInit; from: string }) => {
      const entry = peers.current.get(data.from);
      if (!entry) return;
      try {
        await entry.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
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
  }, [cleanup, createPeerForUser]);

  return (
    <CallContext.Provider value={{
      callState, callInfo, localStream, remoteStream, remoteStreams,
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
