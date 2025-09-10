/**
 * Utility functions for generating distinct colors for different firm email addresses
 */

// Light theme color palette for firm emails
const LIGHT_THEME_PALETTE = [
  { background: '#e3f2fd', border: '#2196f3', text: '#0d47a1' }, // Blue
  { background: '#f3e5f5', border: '#9c27b0', text: '#4a148c' }, // Purple
  { background: '#e8f5e8', border: '#4caf50', text: '#1b5e20' }, // Green
  { background: '#fff3e0', border: '#ff9800', text: '#e65100' }, // Orange
  { background: '#fce4ec', border: '#e91e63', text: '#880e4f' }, // Pink
  { background: '#e0f2f1', border: '#009688', text: '#004d40' }, // Teal
  { background: '#f1f8e9', border: '#8bc34a', text: '#33691e' }, // Light Green
  { background: '#fff8e1', border: '#ffc107', text: '#f57f17' }, // Amber
  { background: '#e8eaf6', border: '#3f51b5', text: '#1a237e' }, // Indigo
  { background: '#efebe9', border: '#795548', text: '#3e2723' }, // Brown
];

// Dark theme color palette for firm emails - darker backgrounds with brighter borders/text
const DARK_THEME_PALETTE = [
  { background: '#0d1929', border: '#42a5f5', text: '#90caf9' }, // Blue
  { background: '#1a0e1a', border: '#ba68c8', text: '#ce93d8' }, // Purple
  { background: '#0e1a0e', border: '#66bb6a', text: '#a5d6a7' }, // Green
  { background: '#1f1611', border: '#ffa726', text: '#ffcc02' }, // Orange
  { background: '#1f0e17', border: '#f06292', text: '#f8bbd9' }, // Pink
  { background: '#0e1a1a', border: '#26a69a', text: '#80cbc4' }, // Teal
  { background: '#151a0e', border: '#9ccc65', text: '#c5e1a5' }, // Light Green
  { background: '#1f1c0e', border: '#ffca28', text: '#fff59d' }, // Amber
  { background: '#0e1019', border: '#5c6bc0', text: '#9fa8da' }, // Indigo
  { background: '#1a1411', border: '#8d6e63', text: '#bcaaa4' }, // Brown
];

/**
 * Generate a hash code for a string (email address)
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get a consistent color for a firm email address based on theme
 */
export function getFirmEmailColor(
  emailAddress: string,
  isDarkMode: boolean = false,
): {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
} {
  const hash = hashCode(emailAddress.toLowerCase());
  const palette = isDarkMode ? DARK_THEME_PALETTE : LIGHT_THEME_PALETTE;
  const colorIndex = hash % palette.length;
  const color = palette[colorIndex];

  return {
    backgroundColor: color.background,
    borderColor: color.border,
    textColor: color.text,
  };
}

/**
 * Check if an email should be treated as a firm email (not OPS/internal)
 */
export function isFirmEmail(email: string, fromRole: string): boolean {
  // Only apply firm colors to incoming emails from ADMIN, FUND, or CLIENT roles
  return fromRole === 'ADMIN' || fromRole === 'FUND' || fromRole === 'CLIENT';
}

/**
 * Extract email address from a "Name <email@domain.com>" format
 */
export function extractEmailAddress(fromString: string): string {
  const match = fromString.match(/<(.+)>/);
  return match ? match[1] : fromString;
}
