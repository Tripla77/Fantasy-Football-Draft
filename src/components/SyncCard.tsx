import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useDraftStore, SyncState } from '../store/draftStore';
import { syncConfigured, formatSyncCode } from '../lib/sync';
import { colors } from '../theme';

const STATUS_LABEL: Record<SyncState, string> = {
  idle: '',
  saving: 'Saving…',
  synced: 'Saved to cloud ✓',
  error: 'Sync error — will retry on your next edit',
};

/** Cloud-sync controls for Settings: enable, show/copy the code, and restore. */
export function SyncCard() {
  const syncCode = useDraftStore((s) => s.syncCode);
  const syncState = useDraftStore((s) => s.syncState);
  const enableSync = useDraftStore((s) => s.enableSync);
  const restoreFromCode = useDraftStore((s) => s.restoreFromCode);
  const disableSync = useDraftStore((s) => s.disableSync);

  const [input, setInput] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!syncCode || Platform.OS !== 'web' || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(syncCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked; the code is selectable as a fallback.
    }
  };

  const restore = async () => {
    setMsg('Restoring…');
    const result = await restoreFromCode(input);
    setMsg(
      result === 'ok'
        ? 'Restored your team ✓'
        : result === 'notfound'
        ? 'No team found for that code.'
        : result === 'disabled'
        ? 'Cloud sync isn’t configured.'
        : 'Couldn’t restore — double-check the code.'
    );
    if (result === 'ok') setInput('');
  };

  if (!syncConfigured) {
    return (
      <View style={styles.card}>
        <Text style={styles.note}>
          Cloud sync isn’t configured yet. Add your Supabase URL + anon key (see the
          README “Cloud sync” section) to let your team survive clearing your browser
          and sync across devices.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {syncCode ? (
        <>
          <Text style={styles.note}>
            Your team is backed up to the cloud. Save this code — enter it to restore
            after clearing your browser, or on another device:
          </Text>
          <View style={styles.codeRow}>
            <Text selectable style={styles.code}>
              {formatSyncCode(syncCode)}
            </Text>
            {Platform.OS === 'web' && (
              <Pressable onPress={copyCode} style={styles.smallBtn}>
                <Text style={styles.smallBtnText}>{copied ? 'Copied' : 'Copy'}</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.status}>{STATUS_LABEL[syncState]}</Text>
            <Pressable onPress={disableSync}>
              <Text style={styles.turnOff}>Turn off</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.note}>
            Save your team to the cloud so it survives clearing your browser and syncs
            across devices. You’ll get a code to restore it anywhere.
          </Text>
          <Pressable onPress={enableSync} style={styles.enableBtn}>
            <Text style={styles.enableText}>Enable cloud sync</Text>
          </Pressable>
        </>
      )}

      <View style={styles.divider} />
      <Text style={styles.restoreLabel}>Restore from a code</Text>
      <View style={styles.restoreRow}>
        <TextInput
          value={input}
          onChangeText={(t) => {
            setInput(t);
            setMsg(null);
          }}
          placeholder="XXXX-XXXX-XXXX"
          placeholderTextColor={colors.textDim}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
        />
        <Pressable
          onPress={restore}
          disabled={!input.trim()}
          style={[styles.smallBtn, !input.trim() && styles.smallBtnDisabled]}
        >
          <Text style={styles.smallBtnText}>Restore</Text>
        </Pressable>
      </View>
      {msg ? <Text style={styles.status}>{msg}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
  },
  note: { color: colors.textDim, fontSize: 13, lineHeight: 18 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  code: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.select({ web: 'monospace', default: undefined }),
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  status: { color: colors.textDim, fontSize: 12 },
  turnOff: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  enableBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  enableText: { color: '#0b1220', fontWeight: '800', fontSize: 14 },
  divider: { height: 1, backgroundColor: colors.border },
  restoreLabel: { color: colors.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  restoreRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  smallBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallBtnDisabled: { opacity: 0.5 },
  smallBtnText: { color: colors.text, fontWeight: '700', fontSize: 12 },
});
