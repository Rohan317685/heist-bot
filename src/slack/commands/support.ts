import { App } from '@slack/bolt';
import { config } from '../../config';
import { addSupportMember, removeSupportMember } from '../../db/support';

function extractUserId(text: string): string | null {
  const mentionMatch = text.match(/<@([A-Z0-9]+)(?:\|[^>]+)?>/);
  if (mentionMatch) return mentionMatch[1];

  const idMatch = text.match(/\b(U[A-Z0-9]{8,})\b/);
  if (idMatch) return idMatch[1];

  return null;
}

export function registerSupportCommand(app: App): void {
  app.command('/support', async ({ command, ack, respond }) => {
    try {
      await ack();

      const commandUserId = command.user_id;
      const isOwner = commandUserId === config.slack.ownerUserId;
      const isAdmin = !isOwner && config.slack.adminUserIds.includes(commandUserId);

      if (!isOwner && !isAdmin) {
        await respond({
          text: 'You do not have permission to use this command.',
          response_type: 'ephemeral',
        });
        return;
      }

      const text = command.text.trim();

      const isEnable = /^enable\b/i.test(text);
      const isDisable = /^disable\b/i.test(text);

      if (!isEnable && !isDisable) {
        const hint = isOwner
          ? '`/support enable @user` or `/support disable @user`'
          : '`/support enable @user` or `/support disable @user` (you cannot disable the owner or other admins)';
        await respond({
          text: `Usage: ${hint}\nYou can also use a raw user ID: \`/support enable U0A17JG84G6\``,
          response_type: 'ephemeral',
        });
        return;
      }

      const targetUserId = extractUserId(text);

      if (!targetUserId) {
        await respond({
          text: 'Could not find a user ID. Use `@user` (with autocomplete) or a raw user ID like `U0A17JG84G6`.',
          response_type: 'ephemeral',
        });
        return;
      }

      if (isDisable && !isOwner) {
        if (targetUserId === config.slack.ownerUserId) {
          await respond({
            text: 'You cannot disable the owner.',
            response_type: 'ephemeral',
          });
          return;
        }
        if (config.slack.adminUserIds.includes(targetUserId)) {
          await respond({
            text: 'You cannot disable another admin.',
            response_type: 'ephemeral',
          });
          return;
        }
      }

      if (isEnable) {
        const added = addSupportMember(targetUserId, commandUserId);
        if (added) {
          await respond({
            text: `<@${targetUserId}> has been added to the support team.`,
            response_type: 'ephemeral',
          });
        } else {
          await respond({
            text: `<@${targetUserId}> is already on the support team.`,
            response_type: 'ephemeral',
          });
        }
      } else {
        const removed = removeSupportMember(targetUserId);
        if (removed) {
          await respond({
            text: `<@${targetUserId}> has been removed from the support team.`,
            response_type: 'ephemeral',
          });
        } else {
          await respond({
            text: `<@${targetUserId}> is not on the support team.`,
            response_type: 'ephemeral',
          });
        }
      }
    } catch (err) {
      console.error('[/support] Error:', err);
    }
  });
}
