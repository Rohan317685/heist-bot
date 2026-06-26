<script lang="ts">
  import { api, esc, fmt } from '$lib/api';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  interface Ticket {
    ticket_number: number;
    thread_ts: string;
    user_id: string;
    user_name?: string;
    status: string;
    created_at: string;
    resolved_at: string | null;
    resolved_by: string | null;
  }

  interface Message {
    ts: string;
    user: string;
    text: string;
    isBot: boolean;
  }

  let ticket = $state<Ticket | null>(null);
  let messages = $state<Message[]>([]);
  let msgText = $state('');
  let anon = $state(false);
  let sending = $state(false);

  onMount(async () => {
    const num = $page.params.number;
    try { ticket = await api<Ticket>(`/api/tickets/number/${num}`); } catch (e) { /* */ }
    if (ticket) {
      try { messages = await api<Message[]>(`/api/tickets/${ticket.thread_ts}/messages`); } catch (e) { /* */ }
    }
  });

  async function toggleStatus() {
    if (!ticket) return;
    const endpoint = ticket.status === 'open' ? 'resolve' : 'reopen';
    await fetch(`/api/tickets/${ticket.thread_ts}/${endpoint}`, { method: 'POST' });
    window.location.reload();
  }

  async function send() {
    if (!msgText.trim() || !ticket || sending) return;
    sending = true;
    try {
      await fetch(`/api/tickets/${ticket.thread_ts}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgText.trim(), anonymous: anon }),
      });
      msgText = '';
      // Reload messages
      try { messages = await api<Message[]>(`/api/tickets/${ticket.thread_ts}/messages`); } catch (e) { /* */ }
    } catch (e) { /* */ }
    sending = false;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  onMount(() => {
    setTimeout(() => {
      const el = document.getElementById('msgList');
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  });
</script>

<svelte:head><title>{ticket ? `Ticket #${ticket.ticket_number}` : 'Loading...'} — Support</title></svelte:head>

{#if !ticket}
  <div class="empty">Loading...</div>
{:else}
  <a href="/dashboard" class="back">&larr; Back to Dashboard</a>

  <div class="header">
    <div class="info">
      <div class="tnum">#{ticket.ticket_number} <span class="badge {ticket.status}">{ticket.status}</span></div>
      <div class="meta">Created {fmt(ticket.created_at)} by {@html esc(ticket.user_name || ticket.user_id)}</div>
      {#if ticket.resolved_at}
        <div class="meta">Resolved {fmt(ticket.resolved_at)} by {@html esc(ticket.resolved_by || '')}</div>
      {/if}
    </div>
    <button class="action-btn {ticket.status}" onclick={toggleStatus}>
      {ticket.status === 'open' ? 'Resolve' : 'Reopen'}
    </button>
  </div>

  <div class="thread-list" id="msgList">
    {#if messages.length === 0}
      <div class="empty-inner">No messages yet.</div>
    {:else}
      {#each messages as m}
        <div class="msg">
          <div class="author">{m.isBot ? 'Bot' : m.user} <span class="time">{fmt(m.ts)}</span></div>
          <div class="body">{@html esc(m.text || '')}</div>
        </div>
      {/each}
    {/if}
  </div>

  <div class="send-box">
    <textarea
      bind:value={msgText}
      placeholder="Type a reply..."
      rows="2"
      onkeydown={onKeydown}
    ></textarea>
    <div class="send-actions">
      <label class="anon-label"><input type="checkbox" bind:checked={anon}> Anonymous</label>
      <button class="send-btn" onclick={send} disabled={sending}>{sending ? '...' : 'Send'}</button>
    </div>
  </div>
{/if}

<style>
  .header { background: rgba(255, 255, 255, 0.04); backdrop-filter: blur(4px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
  .info { display: flex; flex-direction: column; gap: 4px; }
  .tnum { font-size: 18px; font-weight: 700; }
  .meta { font-size: 13px; color: #888; }
  .badge { font-size: 13px; padding: 3px 10px; border-radius: 4px; font-weight: 600; }
  .badge.open { background: rgba(255, 255, 255, 0.1); }
  .badge.resolved { background: rgba(255, 255, 255, 0.04); color: #888; }
  .action-btn { padding: 8px 20px; border-radius: 4px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; }
  .action-btn.open { background: rgba(255, 255, 255, 0.12); color: #fff; }
  .action-btn.open:hover { background: rgba(255, 255, 255, 0.2); }
  .action-btn.resolved { background: rgba(255, 255, 255, 0.06); color: #ccc; border: 1px solid rgba(255, 255, 255, 0.12); }
  .action-btn.resolved:hover { background: rgba(255, 255, 255, 0.15); }
  .thread-list { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; padding: 16px; margin-bottom: 20px; max-height: 500px; overflow-y: auto; }
  .msg { padding: 10px 12px; margin-bottom: 6px; border-radius: 6px; background: rgba(255, 255, 255, 0.04); line-height: 1.5; }
  .msg .author { font-weight: 700; color: #ccc; font-size: 13px; margin-bottom: 3px; }
  .msg .time { font-weight: 400; color: #555; font-size: 11px; margin-left: 8px; }
  .msg .body { white-space: pre-wrap; word-break: break-word; color: #fff; font-size: 14px; }
  .send-box { display: flex; gap: 10px; align-items: flex-start; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; padding: 16px; }
  .send-box textarea { flex: 1; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; padding: 10px; border-radius: 6px; font-size: 14px; resize: vertical; min-height: 48px; font-family: inherit; }
  .send-box textarea:focus { outline: 0; border-color: rgba(255, 255, 255, 0.2); }
  .send-actions { display: flex; flex-direction: column; gap: 8px; align-items: center; }
  .anon-label { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #888; cursor: pointer; white-space: nowrap; }
  .send-btn { background: rgba(255, 255, 255, 0.12); color: #fff; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 700; }
  .send-btn:hover { background: rgba(255, 255, 255, 0.2); }
  .send-btn:disabled { opacity: 0.4; cursor: default; }
  .empty, .empty-inner { color: #555; padding: 24px; text-align: center; }
  .back { color: #aaa; text-decoration: none; font-size: 13px; display: inline-block; margin-bottom: 12px; }
  .back:hover { color: #fff; }
</style>
