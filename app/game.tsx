import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { SlideInUp, SlideOutUp, ZoomIn } from 'react-native-reanimated';
import { GAME_COLORS, PaymentInfo } from '@/constants/game';
import { useGame } from '@/stores/GameContext';
import { CARDS_MAP } from '@/constants/cards';
import { GameBoard } from '@/components/game/GameBoard';
import { PlayerHand } from '@/components/game/PlayerHand';
import { PropertyArea } from '@/components/game/PropertyArea';
import { BankArea } from '@/components/game/BankArea';
import { TurnIndicator } from '@/components/game/TurnIndicator';
import { OpponentView } from '@/components/game/OpponentView';
import { TurnTimer } from '@/components/game/TurnTimer';
import { PaymentModal } from '@/components/game/PaymentModal';
import { ActionResponseModal } from '@/components/game/ActionResponseModal';

export default function GameScreen() {
  const { 
    gameState, 
    myPlayer, 
    opponents, 
    leaveRoom, 
    playerId,
    handleTimeout,
    respondToAction,
    error,
    clearError,
    isMyTurn
  } = useGame();

  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [displayError, setDisplayError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      setDisplayError(error);
      setShowErrorBanner(true);
      const timer = setTimeout(() => {
        setShowErrorBanner(false);
        setTimeout(() => {
          clearError();
          setDisplayError(null);
        }, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const isGameOver = !!gameState?.winner;
  
  const winnerInfo = useMemo(() => {
    if (!gameState?.winner) return null;
    const winnerPlayer = gameState.players.find(p => p.id === gameState.winner);
    const isMe = gameState.winner === playerId;
    return { 
      name: winnerPlayer?.name || 'Unknown', 
      isMe,
      completeSets: winnerPlayer?.properties.filter(s => {
        const required = { brown: 2, darkBlue: 2, utility: 2, railroad: 4 }[s.color] || 3;
        return s.cards.length >= required;
      }).length || 0
    };
  }, [gameState?.winner, gameState?.players, playerId]);
  
  const handleBackToMenu = useCallback(() => {
    leaveRoom();
    router.replace('/');
  }, [leaveRoom]);

  const timerResetKey = useMemo(() => {
    return `${gameState?.turnNumber}-${gameState?.currentTurn?.playerId}`;
  }, [gameState?.turnNumber, gameState?.currentTurn?.playerId]);

  const onTimeout = useCallback(() => {
    if (isMyTurn) {
      handleTimeout();
    }
  }, [isMyTurn, handleTimeout]);

  const showPaymentModal = useMemo(() => {
    if (!gameState?.pendingAction || !playerId) return false;
    if (gameState.phase !== 'payment') return false;
    return gameState.pendingAction.targetPlayers.includes(playerId) &&
           !gameState.pendingAction.responses?.[playerId];
  }, [gameState, playerId]);

  const paymentInfo = useMemo((): PaymentInfo | null => {
    const info = (gameState as any)?.paymentInfo;
    if (!info || !showPaymentModal) return null;
    return info;
  }, [gameState, showPaymentModal]);

  const fromPlayerName = useMemo(() => {
    if (!gameState?.pendingAction) return '';
    const player = gameState.players.find(p => p.id === gameState.pendingAction?.fromPlayer);
    return player?.name || 'Unknown';
  }, [gameState]);

  const hasJustSayNo = useMemo(() => {
    if (!myPlayer || !Array.isArray(myPlayer.hand)) return false;
    return myPlayer.hand.some(cardId => {
      const card = CARDS_MAP[cardId];
      return card?.actionType === 'justSayNo';
    });
  }, [myPlayer]);

  const handlePay = useCallback((cardIds: string[]) => {
    respondToAction('pay', cardIds);
  }, [respondToAction]);

  const handleUseJustSayNo = useCallback(() => {
    respondToAction('justSayNo');
  }, [respondToAction]);

  const handleAcceptAction = useCallback(() => {
    respondToAction('accept');
  }, [respondToAction]);

  const showActionResponseModal = useMemo(() => {
    if (!gameState?.pendingAction || !playerId) {
      return false;
    }
    console.log('ActionResponseModal check:', {
      phase: gameState.phase,
      actionType: gameState.pendingAction.type,
      targetPlayers: gameState.pendingAction.targetPlayers,
      playerId,
      responses: gameState.pendingAction.responses,
    });
    if (gameState.phase !== 'response') return false;
    const actionType = gameState.pendingAction.type;
    const responseActions = ['slyDeal', 'forcedDeal', 'dealBreaker'];
    if (!responseActions.includes(actionType)) return false;
    const shouldShow = gameState.pendingAction.targetPlayers.includes(playerId) &&
           !gameState.pendingAction.responses?.[playerId];
    console.log('ActionResponseModal shouldShow:', shouldShow);
    return shouldShow;
  }, [gameState, playerId]);

  const pendingActionInfo = useMemo(() => {
    if (!gameState?.pendingAction) return null;
    return {
      type: gameState.pendingAction.type,
      targetProperty: gameState.pendingAction.targetProperty,
      giverProperty: gameState.pendingAction.giverProperty,
      targetSet: gameState.pendingAction.targetSet,
    };
  }, [gameState?.pendingAction]);

  if (!gameState || !myPlayer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  const myCompleteSets = myPlayer.properties.filter(s => {
    const required = { brown: 2, darkBlue: 2, utility: 2, railroad: 4 }[s.color] || 3;
    return s.cards.length >= required;
  }).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {showErrorBanner && displayError && (
        <Animated.View 
          entering={SlideInUp} 
          exiting={SlideOutUp}
          style={styles.errorBanner}
        >
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{displayError}</Text>
          <Pressable onPress={() => setShowErrorBanner(false)}>
            <Text style={styles.errorClose}>✕</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Compact Header with integrated timer */}
      <View style={styles.header}>
        <Pressable 
          style={styles.menuButton}
          onPress={() => {
            Alert.alert('Leave Game?', 'Your progress will be lost.', [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Leave', 
                style: 'destructive',
                onPress: handleBackToMenu
              }
            ]);
          }}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isGameOver ? '🏆 Game Over' : `Turn ${gameState.turnNumber}`}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {!isGameOver && (
            <TurnTimer 
              isMyTurn={isMyTurn} 
              onTimeout={onTimeout}
              resetKey={timerResetKey}
              isPaused={gameState.phase === 'payment' || gameState.phase === 'response'}
            />
          )}
          <View style={[styles.setsIndicator, myCompleteSets >= 3 && styles.setsComplete]}>
            <Text style={styles.setsText}>{myCompleteSets}/3</Text>
            <Text style={styles.setsIcon}>🏠</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.gameArea}>
        <OpponentView 
          opponents={opponents} 
          currentPlayerId={currentPlayer?.id}
        />

        <GameBoard />

        {!isGameOver && <TurnIndicator />}

        <View style={styles.myArea}>
          <Text style={styles.sectionLabel}>Your Properties</Text>
          <PropertyArea properties={myPlayer.properties} isCurrentPlayer />
          
          <BankArea bank={myPlayer.bank} isCurrentPlayer />
        </View>
      </ScrollView>

      {!isGameOver && <PlayerHand />}

      {!isGameOver && (
        <PaymentModal
          visible={showPaymentModal}
          paymentInfo={paymentInfo}
          fromPlayerName={fromPlayerName}
          actionType={gameState.pendingAction?.type || ''}
          onPay={handlePay}
          onUseJustSayNo={hasJustSayNo ? handleUseJustSayNo : undefined}
          hasJustSayNo={hasJustSayNo}
        />
      )}

      {!isGameOver && (
        <ActionResponseModal
          visible={showActionResponseModal}
          actionType={pendingActionInfo?.type || ''}
          fromPlayerName={fromPlayerName}
          targetProperty={pendingActionInfo?.targetProperty}
          giverProperty={pendingActionInfo?.giverProperty}
          targetSet={pendingActionInfo?.targetSet}
          hasJustSayNo={hasJustSayNo}
          onAccept={handleAcceptAction}
          onUseJustSayNo={handleUseJustSayNo}
        />
      )}

      {/* Winner Overlay */}
      <Modal
        visible={isGameOver}
        transparent
        animationType="fade"
      >
        <View style={styles.winnerOverlay}>
          <Animated.View 
            entering={ZoomIn.springify()}
            style={styles.winnerCard}
          >
            <Text style={styles.winnerTrophy}>🏆</Text>
            <Text style={styles.winnerTitle}>
              {winnerInfo?.isMe ? 'You Won!' : 'Game Over'}
            </Text>
            <Text style={styles.winnerName}>
              {winnerInfo?.name}
            </Text>
            <Text style={styles.winnerSets}>
              Completed {winnerInfo?.completeSets} Property Sets
            </Text>
            <Pressable style={styles.winnerButton} onPress={handleBackToMenu}>
              <Text style={styles.winnerButtonText}>Back to Menu</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
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
    fontSize: 16,
  },
  errorBanner: {
    backgroundColor: '#B71C1C',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorIcon: {
    fontSize: 18,
  },
  errorText: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
  },
  errorClose: {
    color: '#FFF',
    fontSize: 18,
    paddingLeft: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: GAME_COLORS.border,
    backgroundColor: GAME_COLORS.surface,
    gap: 8,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    color: GAME_COLORS.text,
    fontSize: 18,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    color: GAME_COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GAME_COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
  },
  setsComplete: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderWidth: 1,
    borderColor: GAME_COLORS.primary,
  },
  setsText: {
    color: GAME_COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  setsIcon: {
    fontSize: 12,
  },
  gameArea: {
    flex: 1,
  },
  myArea: {
    padding: 8,
  },
  sectionLabel: {
    color: GAME_COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 8,
  },
  winnerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  winnerCard: {
    backgroundColor: GAME_COLORS.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    maxWidth: 340,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  winnerTrophy: {
    fontSize: 72,
    marginBottom: 16,
  },
  winnerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  winnerName: {
    fontSize: 24,
    fontWeight: '600',
    color: GAME_COLORS.text,
    marginBottom: 8,
  },
  winnerSets: {
    fontSize: 16,
    color: GAME_COLORS.textSecondary,
    marginBottom: 24,
  },
  winnerButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  winnerButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
