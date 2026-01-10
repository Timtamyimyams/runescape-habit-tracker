import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginModal = ({ isOpen, onClose }) => {
  const { signInWithGoogle, signInWithDiscord, signInWithGithub, error, loading } = useAuth();
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSignIn = async (provider) => {
    let result;
    switch (provider) {
      case 'google':
        result = await signInWithGoogle();
        break;
      case 'discord':
        result = await signInWithDiscord();
        break;
      case 'github':
        result = await signInWithGithub();
        break;
      default:
        return;
    }

    if (!result.error) {
      handleClose();
    }
  };

  // OSRS-style textures
  const stoneTexture = `url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='4' height='4' fill='%233d3226'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23352b1e' opacity='0.5'/%3E%3Crect x='2' y='2' width='1' height='1' fill='%23453929' opacity='0.5'/%3E%3C/svg%3E")`;

  const ProviderButton = ({ provider, icon, label, color, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    return (
      <button
        onClick={onClick}
        disabled={loading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          width: '100%',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          background: isPressed
            ? `linear-gradient(180deg, ${color}dd 0%, ${color} 100%)`
            : isHovered
              ? `linear-gradient(180deg, ${color} 0%, ${color}dd 100%)`
              : `linear-gradient(180deg, ${color}ee 0%, ${color}bb 100%)`,
          border: '2px solid',
          borderColor: isPressed
            ? `${color}88 ${color}cc ${color}cc ${color}88`
            : `${color}cc ${color}88 ${color}88 ${color}cc`,
          borderRadius: '0',
          color: '#fff',
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '8px',
          cursor: loading ? 'wait' : 'pointer',
          textShadow: '1px 1px 0 #000',
          opacity: loading ? 0.7 : 1,
          transform: isPressed ? 'scale(0.98)' : 'scale(1)',
          transition: 'transform 0.1s ease-out, background 0.1s ease-out',
          imageRendering: 'pixelated',
        }}
      >
        <span style={{ fontSize: '14px' }}>{icon}</span>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div
      className={isClosing ? 'modal-backdrop-exit' : 'modal-backdrop'}
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        background: 'rgba(0,0,0,0.8)',
      }}
    >
      <div
        className={isClosing ? 'modal-content-exit' : 'modal-content'}
        style={{
          width: '280px',
          backgroundImage: `linear-gradient(180deg, rgba(74,61,46,0.95) 0%, rgba(50,42,30,0.98) 100%), ${stoneTexture}`,
          backgroundSize: '4px 4px',
          border: '4px solid',
          borderColor: '#5c4d3d #2a231a #2a231a #5c4d3d',
          boxShadow: '0 0 0 1px #1a1610, 0 4px 20px rgba(0,0,0,0.5)',
          fontFamily: '"Press Start 2P", monospace',
          imageRendering: 'pixelated',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px',
          borderBottom: '2px solid #2a231a',
          background: 'linear-gradient(180deg, rgba(61,50,38,0.5) 0%, rgba(42,35,26,0.5) 100%)',
        }}>
          <span style={{
            color: '#ff981f',
            fontSize: '10px',
            textShadow: '1px 1px 0 #000',
          }}>
            Login
          </span>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ff981f',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          <p style={{
            color: '#c9b896',
            fontSize: '7px',
            textAlign: 'center',
            marginBottom: '16px',
            lineHeight: '1.6',
            textShadow: '1px 1px 0 #000',
          }}>
            Sign in to save your progress across devices
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <ProviderButton
              provider="google"
              icon="G"
              label="Sign in with Google"
              color="#4285f4"
              onClick={() => handleSignIn('google')}
            />

            <ProviderButton
              provider="discord"
              icon="D"
              label="Sign in with Discord"
              color="#5865f2"
              onClick={() => handleSignIn('discord')}
            />

            <ProviderButton
              provider="github"
              icon="⌥"
              label="Sign in with GitHub"
              color="#333"
              onClick={() => handleSignIn('github')}
            />
          </div>

          {error && (
            <p style={{
              color: '#ff4444',
              fontSize: '6px',
              textAlign: 'center',
              marginTop: '12px',
              textShadow: '1px 1px 0 #000',
            }}>
              {error}
            </p>
          )}

          <p style={{
            color: '#8a7e6d',
            fontSize: '6px',
            textAlign: 'center',
            marginTop: '16px',
            lineHeight: '1.5',
          }}>
            Your data stays private and secure
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
