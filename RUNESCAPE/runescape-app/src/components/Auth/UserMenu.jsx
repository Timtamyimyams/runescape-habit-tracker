import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const UserMenu = () => {
  const { user, profile, signOut, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName = profile?.username || user.email?.split('@')[0] || 'Player';
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  const stoneTexture = `url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='4' height='4' fill='%233d3226'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23352b1e' opacity='0.5'/%3E%3Crect x='2' y='2' width='1' height='1' fill='%23453929' opacity='0.5'/%3E%3C/svg%3E")`;

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          border: '2px solid',
          borderColor: isHovered ? '#ff981f' : '#00ff00',
          background: avatarUrl ? 'none' : 'linear-gradient(180deg, #4a3d2e 0%, #2a231a 100%)',
          cursor: 'pointer',
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color 0.15s ease-out, box-shadow 0.15s ease-out',
          boxShadow: isHovered ? '0 0 8px rgba(255,152,31,0.6)' : '0 0 6px rgba(0,255,0,0.5)',
          position: 'relative',
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              imageRendering: 'pixelated',
            }}
          />
        ) : (
          <User size={12} color="#ff981f" />
        )}
        {/* Online indicator dot */}
        <div style={{
          position: 'absolute',
          bottom: '-1px',
          right: '-1px',
          width: '8px',
          height: '8px',
          background: '#00ff00',
          borderRadius: '50%',
          border: '2px solid #1a1610',
          boxShadow: '0 0 4px rgba(0,255,0,0.8)',
        }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="modal-content"
          style={{
            position: 'absolute',
            top: '28px',
            right: '0',
            width: '140px',
            backgroundImage: `linear-gradient(180deg, rgba(74,61,46,0.98) 0%, rgba(50,42,30,0.99) 100%), ${stoneTexture}`,
            backgroundSize: '4px 4px',
            border: '3px solid',
            borderColor: '#5c4d3d #2a231a #2a231a #5c4d3d',
            boxShadow: '0 0 0 1px #1a1610, 0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 100,
            fontFamily: '"Press Start 2P", monospace',
            imageRendering: 'pixelated',
          }}
        >
          {/* User Info */}
          <div style={{
            padding: '10px',
            borderBottom: '2px solid #2a231a',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '2px solid #5c4d3d',
                  imageRendering: 'pixelated',
                }}
              />
            ) : (
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '2px solid #5c4d3d',
                background: 'linear-gradient(180deg, #4a3d2e 0%, #2a231a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <User size={12} color="#ff981f" />
              </div>
            )}
            <div style={{
              flex: 1,
              overflow: 'hidden',
            }}>
              <p style={{
                color: '#ff981f',
                fontSize: '6px',
                textShadow: '1px 1px 0 #000',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {displayName}
              </p>
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ padding: '6px' }}>
            <MenuButton
              icon={<LogOut size={10} />}
              label="Sign Out"
              onClick={handleSignOut}
              disabled={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const MenuButton = ({ icon, label, onClick, disabled }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: isHovered ? 'rgba(255,152,31,0.2)' : 'transparent',
        border: 'none',
        color: isHovered ? '#ff981f' : '#c9b896',
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        cursor: disabled ? 'wait' : 'pointer',
        textShadow: '1px 1px 0 #000',
        textAlign: 'left',
        transition: 'background 0.1s ease-out, color 0.1s ease-out',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

export default UserMenu;
