import { useEffect, useRef } from 'react';
import { useCall } from '../context/CallContext';
import './CallOverlay.css';

function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function CallOverlay() {
  const {
    callState, callInfo, localStream, remoteStream,
    isMuted, isVideoOff, callDuration,
    acceptCall, rejectCall, endCall, toggleMute, toggleVideo,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream && (callState === 'connected' || callState === 'outgoing')) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(e => console.warn('Local play failed:', e));
    }
  }, [localStream, callState]);

  useEffect(() => {
    if (callState === 'connected' && remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(e => console.warn('Remote video play failed:', e));
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(e => console.warn('Remote audio play failed:', e));
      }
    }
  }, [remoteStream, callState]);

  if (callState === 'idle' || !callInfo) return null;

  const isVideo = callInfo.type === 'VIDEO';
  const name = callInfo.remoteName || callInfo.caller?.displayName || 'Unknown';
  const avatar = callInfo.remoteAvatar || callInfo.caller?.avatarUrl;

  return (
    <div className={`call-overlay ${isVideo && callState === 'connected' ? 'video-mode' : ''}`}>
      {/* Remote Video (full screen background) */}
      {isVideo && callState === 'connected' && remoteStream && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="call-remote-video"
        />
      )}

      {/* Remote Audio */}
      {!isVideo && callState === 'connected' && remoteStream && (
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
        />
      )}

      {/* Top bar */}
      <div className="call-top-bar">
        <div className="call-encryption">🔒 End-to-end encrypted</div>
      </div>

      {/* Center content */}
      <div className="call-center">
        {/* Avatar (shown when no video or not connected) */}
        {(!isVideo || callState !== 'connected') && (
          <div className="call-avatar-large">
            {avatar ? (
              <img src={avatar} alt="" />
            ) : (
              <span>{getInitials(name)}</span>
            )}
            {callState === 'outgoing' && <div className="call-avatar-ring" />}
            {callState === 'incoming' && <div className="call-avatar-pulse" />}
          </div>
        )}

        <div className="call-name">{name}</div>
        <div className="call-status-text">
          {callState === 'outgoing' && 'Ringing...'}
          {callState === 'incoming' && `Incoming ${isVideo ? 'video' : 'voice'} call`}
          {callState === 'connected' && formatDuration(callDuration)}
        </div>
      </div>

      {/* Local Video (PiP) */}
      {isVideo && localStream && (callState === 'connected' || callState === 'outgoing') && (
        <div className="call-local-video-container">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="call-local-video"
          />
        </div>
      )}

      {/* Controls */}
      <div className="call-controls">
        {/* Incoming call: Accept / Reject */}
        {callState === 'incoming' && (
          <>
            <button className="call-control-btn reject" onClick={rejectCall} title="Decline">
              <span>📞</span>
            </button>
            <button className="call-control-btn accept" onClick={acceptCall} title="Accept">
              <span>📞</span>
            </button>
          </>
        )}

        {/* Outgoing: Cancel */}
        {callState === 'outgoing' && (
          <button className="call-control-btn reject" onClick={endCall} title="Cancel">
            <span>📞</span>
          </button>
        )}

        {/* Connected: Mute, Video, End */}
        {callState === 'connected' && (
          <>
            <button
              className={`call-control-btn ${isMuted ? 'active' : ''}`}
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              <span>{isMuted ? '🔇' : '🎤'}</span>
            </button>

            {isVideo && (
              <button
                className={`call-control-btn ${isVideoOff ? 'active' : ''}`}
                onClick={toggleVideo}
                title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
              >
                <span>{isVideoOff ? '📷' : '📹'}</span>
              </button>
            )}

            <button className="call-control-btn reject" onClick={endCall} title="End call">
              <span>📞</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
