export const theme = {
  colors: {
    // Core Backgrounds
    background: '#111113', // Very dark, barely off-black for reduced eye strain
    card: '#1A1A1D', // Slightly elevated surface for cards and modals
    cardHover: '#1E1E22', // Subtle highlight for interactive cards
    
    // Borders
    border: '#2C2C30', // Minimal subtle gray separator
    borderHover: '#3A3A40',
    
    // Brand & Status
    primary: '#818CF8', // Modern premium indigo (soft, not harsh blue)
    primaryMuted: 'rgba(129, 140, 248, 0.1)',
    success: '#34D399', // Premium soft green
    successMuted: 'rgba(52, 211, 153, 0.1)',
    warning: '#FB923C', // Modern amber/orange
    warningMuted: 'rgba(251, 146, 60, 0.1)',
    danger: '#F87171', // Soft coral red
    
    // Typography
    textPrimary: '#F3F4F6', // Crisp white/gray for readability
    textSecondary: '#9CA3AF', // Softer gray for descriptions
    textMuted: '#6B7280', // Deep gray for placeholders/metadata
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  borderRadius: {
    sm: '6px',
    md: '10px', // Standard modern pill-like radius
    lg: '14px', // Soft rounded premium cards
    xl: '20px',
    full: '9999px',
  },
  shadows: {
    // Subtle elevation without dirtying the dark theme
    sm: '0 2px 4px rgba(0, 0, 0, 0.2)',
    md: '0 4px 12px rgba(0, 0, 0, 0.3)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.4)',
    
    // Premium subtle glows
    glowPrimary: '0 0 15px rgba(129, 140, 248, 0.15)',
    glowSuccess: '0 0 15px rgba(52, 211, 153, 0.15)',
  }
};
