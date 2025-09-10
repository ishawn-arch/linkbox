import type { Convo } from './db';
import { extractEmailAddress } from './messageColors';

/**
 * Extract all unique email addresses from incoming messages in a conversation
 */
export function getIncomingEmailAddresses(conversation: Convo): string[] {
  const emailSet = new Set<string>();

  // Go through all messages in the conversation
  conversation.messages.forEach((message) => {
    // Only consider incoming messages from non-OPS roles
    if (message.direction === 'IN' && message.fromRole !== 'OPS') {
      const email = extractEmailAddress(message.from);
      if (email && email !== message.from) {
        // Only add if we extracted a valid email
        emailSet.add(email);
      }
    }
  });

  // Convert to array and sort for consistent ordering
  return Array.from(emailSet).sort();
}

/**
 * Get a human-readable display name for an email address from conversation messages
 */
export function getDisplayNameForEmail(
  conversation: Convo,
  emailAddress: string,
): string {
  // Find the first message from this email address to get the display name
  for (const message of conversation.messages) {
    if (message.direction === 'IN' && message.fromRole !== 'OPS') {
      const messageEmail = extractEmailAddress(message.from);
      if (messageEmail === emailAddress) {
        // Extract name from "Name <email>" format
        const nameMatch = message.from.match(/^(.+?)\s*</);
        if (nameMatch) {
          return nameMatch[1].trim();
        }
        // If no name found, return the email
        return emailAddress;
      }
    }
  }

  return emailAddress;
}

/**
 * Create autocomplete options with both email and display name
 */
export function createEmailAutocompleteOptions(conversation: Convo): Array<{
  email: string;
  label: string;
  displayName: string;
}> {
  const emails = getIncomingEmailAddresses(conversation);

  return emails.map((email) => {
    const displayName = getDisplayNameForEmail(conversation, email);
    const label = displayName !== email ? `${displayName} <${email}>` : email;

    return {
      email,
      label,
      displayName,
    };
  });
}
