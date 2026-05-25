import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { GAME_COLORS } from '@/constants/game';
import { useGame } from '@/stores/GameContext';

export default function LobbyScreen() {
  const {
    room,
    playerId,
    playerName,
    toggleReady,
    startGame,
    leaveRoom,
    gameState,
  } = useGame();

  useEffect(() => {
    if (room?.status === 'playing' || gameState) {
      router.replace('/game');
    }
  }, [room?.status, gameState]);

  if (!room) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={GAME_COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isHost = room.host === playerId;
  const currentPlayer = room.players.find((p) => p.id === playerId);
  const allReady = room.players.every((p) => p.isReady);
  const canStart = isHost && allReady && room.players.length >= 2;

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(room.code);
    Alert.alert('Copied!', `Room code ${room.code} copied to clipboard`);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my Monopoly Deal game! Room code: ${room.code}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleLeave = () => {
    Alert.alert('Leave Room', 'Are you sure you want to leave?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          leaveRoom();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleLeave} style={styles.backButton}>
          <Text style={styles.backText}>← Leave</Text>
        </Pressable>
        <Text style={styles.title}>Game Lobby</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.codeSection}>
        <Text style={styles.codeLabel}>Room Code</Text>
        <Pressable style={styles.codeContainer} onPress={handleCopyCode}>
          <Text style={styles.code}>{room.code}</Text>
          <Text style={styles.copyHint}>Tap to copy</Text>
        </Pressable>
        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareText}>📤 Share Invite</Text>
        </Pressable>
      </View>

      <View style={styles.playersSection}>
        <Text style={styles.sectionTitle}>
          Players ({room.players.length}/{room.maxPlayers})
        </Text>
        <View style={styles.playersList}>
          {room.players.map((player) => (
            <View key={player.id} style={styles.playerCard}>
              <View style={styles.playerInfo}>
                <View
                  style={[
                    styles.connectionIndicator,
                    player.isConnected && styles.connected,
                  ]}
                />
                <Text style={styles.playerName}>
                  {player.name}
                  {player.id === room.host && ' 👑'}
                  {player.id === playerId && ' (You)'}
                </Text>
              </View>
              <View
                style={[
                  styles.readyBadge,
                  player.isReady && styles.readyBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.readyText,
                    player.isReady && styles.readyTextActive,
                  ]}
                >
                  {player.isReady ? '✓ Ready' : 'Not Ready'}
                </Text>
              </View>
            </View>
          ))}

          {Array.from({ length: room.maxPlayers - room.players.length }).map(
            (_, i) => (
              <View key={`empty-${i}`} style={styles.emptySlot}>
                <Text style={styles.emptyText}>Waiting for player...</Text>
              </View>
            )
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[
            styles.readyButton,
            currentPlayer?.isReady && styles.readyButtonActive,
          ]}
          onPress={toggleReady}
        >
          <Text style={[
            styles.readyButtonText,
            currentPlayer?.isReady && styles.readyButtonTextActive,
          ]}>
            {currentPlayer?.isReady ? '✓ Ready!' : 'Ready Up'}
          </Text>
        </Pressable>

        {isHost && (
          <Pressable
            style={[styles.startButton, !canStart && styles.buttonDisabled]}
            onPress={startGame}
            disabled={!canStart}
          >
            <Text style={styles.startButtonText}>
              {canStart ? '▶ Start Game' : 'Waiting for players...'}
            </Text>
          </Pressable>
        )}

        {!isHost && (
          <View style={styles.waitingMessage}>
            <Text style={styles.waitingText}>
              Waiting for host to start the game...
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GAME_COLORS.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: GAME_COLORS.textSecondary,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: GAME_COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: GAME_COLORS.secondary,
    fontSize: 16,
  },
  title: {
    color: GAME_COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  codeSection: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: GAME_COLORS.border,
  },
  codeLabel: {
    color: GAME_COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  codeContainer: {
    backgroundColor: GAME_COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  code: {
    color: GAME_COLORS.accent,
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  copyHint: {
    color: GAME_COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  shareButton: {
    marginTop: 12,
    padding: 10,
  },
  shareText: {
    color: GAME_COLORS.secondary,
    fontSize: 14,
  },
  playersSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    color: GAME_COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  playersList: {
    gap: 10,
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: GAME_COLORS.surface,
    padding: 14,
    borderRadius: 10,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  connectionIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GAME_COLORS.danger,
  },
  connected: {
    backgroundColor: GAME_COLORS.primary,
  },
  playerName: {
    color: GAME_COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
  readyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: GAME_COLORS.surfaceLight,
  },
  readyBadgeActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  readyText: {
    color: GAME_COLORS.textSecondary,
    fontSize: 12,
  },
  readyTextActive: {
    color: GAME_COLORS.primary,
  },
  emptySlot: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyText: {
    color: GAME_COLORS.textSecondary,
    fontSize: 14,
  },
  actions: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: GAME_COLORS.border,
  },
  readyButton: {
    backgroundColor: GAME_COLORS.surface,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GAME_COLORS.primary,
  },
  readyButtonActive: {
    backgroundColor: GAME_COLORS.primary,
  },
  readyButtonText: {
    color: GAME_COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  readyButtonTextActive: {
    color: '#FFFFFF',
  },
  startButton: {
    backgroundColor: GAME_COLORS.accent,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: GAME_COLORS.surfaceLight,
    opacity: 0.6,
  },
  waitingMessage: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  waitingText: {
    color: GAME_COLORS.textSecondary,
    fontSize: 14,
  },
});
