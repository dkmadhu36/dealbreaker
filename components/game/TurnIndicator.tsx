import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { GAME_COLORS } from '@/constants/game';
import { useGame } from '@/stores/GameContext';
import { CARDS_MAP } from '@/constants/cards';
import { TargetSelectionModal } from './TargetSelectionModal';

const CARDS_NEEDING_TARGET = ['debtCollector', 'slyDeal', 'forcedDeal', 'dealBreaker'];

export function TurnIndicator() {
  const { gameState, isMyTurn, endTurn, playCard, selectedCard, selectCard, opponents, myPlayer, playerId } = useGame();
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
  const [targetActionType, setTargetActionType] = useState<string>('');
  const [showDoubleRentPrompt, setShowDoubleRentPrompt] = useState(false);
  const [pendingRentCardId, setPendingRentCardId] = useState<string | null>(null);
  const [pendingRentOptions, setPendingRentOptions] = useState<{targetPlayerId?: string; targetColor?: string} | null>(null);

  const myHand = useMemo(() => {
    if (!myPlayer) return [];
    return Array.isArray(myPlayer.hand) ? myPlayer.hand : [];
  }, [myPlayer]);

  const doubleRentCardId = useMemo(() => {
    for (const cardId of myHand) {
      const card = CARDS_MAP[cardId];
      if (card?.actionType === 'doubleRent') {
        return cardId;
      }
    }
    return null;
  }, [myHand]);

  if (!gameState) return null;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const playsLeft = 3 - (gameState.currentTurn?.cardsPlayed || 0);
  const hasDrawn = gameState.currentTurn?.cardsDrawn || false;
  const canUseDoubleRent = playsLeft >= 2 && doubleRentCardId !== null;

  const handlePlayCard = (asBank: boolean) => {
    if (!selectedCard) return;
    
    const card = CARDS_MAP[selectedCard];
    
    if (asBank) {
      playCard(selectedCard, { asBank: true });
      return;
    }
    
    // Check if it's an action card that needs target selection
    if (card?.actionType && CARDS_NEEDING_TARGET.includes(card.actionType)) {
      setPendingCardId(selectedCard);
      setTargetActionType(card.actionType);
      setShowTargetModal(true);
      return;
    }
    
    // Check if it's a wild rent card (more than 2 colors)
    const isWildRent = card?.type === 'rent' && (card.colors?.length || 0) > 2;
    if (isWildRent) {
      setPendingCardId(selectedCard);
      setTargetActionType('wildRent');
      setShowTargetModal(true);
      return;
    }
    
    // Check if it's a normal rent card - show double rent prompt if applicable
    const isNormalRent = card?.type === 'rent' && (card.colors?.length || 0) <= 2;
    if (isNormalRent) {
      if (canUseDoubleRent) {
        setPendingRentCardId(selectedCard);
        setPendingRentOptions(null);
        setShowDoubleRentPrompt(true);
        return;
      }
    }
    
    playCard(selectedCard, { asBank: false });
  };
  
  const handleDoubleRentConfirm = (useDoubleRent: boolean) => {
    if (pendingRentCardId) {
      playCard(pendingRentCardId, {
        asBank: false,
        doubleRent: useDoubleRent,
        doubleRentCardId: useDoubleRent ? doubleRentCardId || undefined : undefined,
        ...pendingRentOptions,
      });
    }
    setShowDoubleRentPrompt(false);
    setPendingRentCardId(null);
    setPendingRentOptions(null);
    selectCard(null);
  };

  const handleTargetSelect = (targetPlayerId: string, targetCardId?: string, myCardId?: string, targetColor?: string) => {
    if (pendingCardId) {
      const card = CARDS_MAP[pendingCardId];
      const isRentCard = card?.type === 'rent';
      
      // For wild rent, check if we should show double rent prompt
      if (isRentCard && canUseDoubleRent) {
        setPendingRentCardId(pendingCardId);
        setPendingRentOptions({ targetPlayerId, targetColor });
        setShowTargetModal(false);
        setPendingCardId(null);
        setTargetActionType('');
        setShowDoubleRentPrompt(true);
        return;
      }
      
      playCard(pendingCardId, {
        asBank: false,
        targetPlayerId,
        targetCardId,
        targetColor,
        giverCardId: myCardId,
      });
    }
    setShowTargetModal(false);
    setPendingCardId(null);
    setTargetActionType('');
    selectCard(null);
  };

  const handleCancelTarget = () => {
    setShowTargetModal(false);
    setPendingCardId(null);
    setTargetActionType('');
  };

  const renderPlaysIndicator = () => (
    <View style={styles.playsRow}>
      {[...Array(3)].map((_, i) => (
        <View key={i} style={[styles.playDot, i < playsLeft && styles.playDotActive]} />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Turn Status Card */}
      <View style={[styles.turnCard, isMyTurn ? styles.turnCardActive : styles.turnCardWaiting]}>
        <View style={styles.turnHeader}>
          <Text style={[styles.turnTitle, isMyTurn && styles.turnTitleActive]}>
            {isMyTurn ? 'YOUR TURN' : `${currentPlayer?.name}'s Turn`}
          </Text>
          {isMyTurn && renderPlaysIndicator()}
        </View>

        {/* Draw Phase Prompt */}
        {isMyTurn && gameState.phase === 'draw' && !hasDrawn && (
          <View style={styles.promptRow}>
            <Text style={styles.promptIcon}>👆</Text>
            <Text style={styles.promptText}>Tap draw pile for 2 cards</Text>
          </View>
        )}

        {/* Action Phase Buttons */}
        {isMyTurn && gameState.phase === 'action' && hasDrawn && (
          <View style={styles.actionsRow}>
            {selectedCard ? (
              <>
                <Pressable style={[styles.actionBtn, styles.playBtn]} onPress={() => handlePlayCard(false)}>
                  <Text style={styles.actionBtnText}>Play</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, styles.bankBtn]} onPress={() => handlePlayCard(true)}>
                  <Text style={styles.actionBtnText}>Bank</Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.selectHint}>Select a card to play</Text>
            )}
            {playsLeft > 0 && (
              <Pressable style={[styles.actionBtn, styles.endBtn]} onPress={endTurn}>
                <Text style={styles.actionBtnText}>End</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Discard Phase */}
        {gameState.phase === 'discard' && isMyTurn && (
          <View style={styles.discardSection}>
            <Text style={styles.discardText}>⚠️ Discard to 7 cards</Text>
            {selectedCard && playsLeft > 0 && (
              <View style={styles.actionsRow}>
                <Pressable style={[styles.actionBtn, styles.playBtn]} onPress={() => handlePlayCard(false)}>
                  <Text style={styles.actionBtnText}>Play</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, styles.bankBtn]} onPress={() => handlePlayCard(true)}>
                  <Text style={styles.actionBtnText}>Bank</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Auto-end notice */}
        {isMyTurn && gameState.phase === 'action' && hasDrawn && playsLeft === 0 && (
          <Text style={styles.autoEndText}>Turn ending...</Text>
        )}
      </View>

      {/* Payment/Response Status */}
      {gameState.phase === 'payment' && gameState.pendingAction && (
        <View style={styles.statusCard}>
          <Text style={styles.statusIcon}>💰</Text>
          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>Waiting for payments</Text>
            <Text style={styles.statusSub}>
              {gameState.pendingAction.targetPlayers.length - Object.keys(gameState.pendingAction.responses || {}).length} remaining
            </Text>
          </View>
        </View>
      )}

      {gameState.phase === 'response' && gameState.pendingAction && (
        <View style={[styles.statusCard, styles.statusResponse]}>
          <Text style={styles.statusIcon}>
            {gameState.pendingAction.targetPlayers.includes(playerId || '') ? '🔔' : '⏳'}
          </Text>
          <Text style={styles.statusTitle}>
            {gameState.pendingAction.targetPlayers.includes(playerId || '') 
              ? 'Respond to action!'
              : 'Waiting for response...'}
          </Text>
        </View>
      )}

      <TargetSelectionModal
        visible={showTargetModal}
        actionType={targetActionType as 'debtCollector' | 'slyDeal' | 'forcedDeal' | 'dealBreaker' | 'wildRent'}
        opponents={opponents}
        myProperties={myPlayer?.properties || []}
        onSelect={handleTargetSelect}
        onCancel={handleCancelTarget}
      />
      
      {/* Double Rent Prompt Modal */}
      <Modal visible={showDoubleRentPrompt} transparent animationType="fade">
        <View style={styles.doubleRentOverlay}>
          <View style={styles.doubleRentModal}>
            <Text style={styles.doubleRentIcon}>💰✨</Text>
            <Text style={styles.doubleRentTitle}>Double Rent?</Text>
            <Text style={styles.doubleRentDesc}>
              You have a Double Rent card! Apply it to charge double the rent amount?
            </Text>
            <Text style={styles.doubleRentNote}>
              This will use 2 card plays ({playsLeft} plays remaining)
            </Text>
            <View style={styles.doubleRentActions}>
              <Pressable 
                style={[styles.doubleRentBtn, styles.doubleRentBtnNo]}
                onPress={() => handleDoubleRentConfirm(false)}
              >
                <Text style={styles.doubleRentBtnText}>No, Single Rent</Text>
              </Pressable>
              <Pressable 
                style={[styles.doubleRentBtn, styles.doubleRentBtnYes]}
                onPress={() => handleDoubleRentConfirm(true)}
              >
                <Text style={styles.doubleRentBtnTextYes}>Yes, Double It!</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  turnCard: {
    backgroundColor: GAME_COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
  },
  turnCardActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderColor: GAME_COLORS.primary,
  },
  turnCardWaiting: {
    backgroundColor: GAME_COLORS.surfaceLight,
    opacity: 0.8,
  },
  turnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  turnTitle: {
    color: GAME_COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  turnTitleActive: {
    color: GAME_COLORS.primary,
    fontSize: 14,
  },
  playsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  playDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GAME_COLORS.border,
  },
  playDotActive: {
    backgroundColor: GAME_COLORS.primary,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    borderRadius: 8,
    gap: 6,
  },
  promptIcon: {
    fontSize: 16,
  },
  promptText: {
    color: GAME_COLORS.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  playBtn: {
    backgroundColor: GAME_COLORS.primary,
  },
  bankBtn: {
    backgroundColor: GAME_COLORS.money,
  },
  endBtn: {
    backgroundColor: GAME_COLORS.secondary,
    flex: 0.6,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  selectHint: {
    color: GAME_COLORS.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  discardSection: {
    marginTop: 8,
  },
  discardText: {
    color: '#FFA500',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  autoEndText: {
    color: GAME_COLORS.primary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  statusResponse: {
    backgroundColor: 'rgba(156, 39, 176, 0.15)',
    borderColor: '#9C27B0',
  },
  statusIcon: {
    fontSize: 18,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    color: GAME_COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  statusSub: {
    color: GAME_COLORS.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  doubleRentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  doubleRentModal: {
    backgroundColor: GAME_COLORS.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GAME_COLORS.accent,
  },
  doubleRentIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  doubleRentTitle: {
    color: GAME_COLORS.accent,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  doubleRentDesc: {
    color: GAME_COLORS.text,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  doubleRentNote: {
    color: GAME_COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  doubleRentActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  doubleRentBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  doubleRentBtnNo: {
    backgroundColor: GAME_COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
  },
  doubleRentBtnYes: {
    backgroundColor: GAME_COLORS.accent,
  },
  doubleRentBtnText: {
    color: GAME_COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  doubleRentBtnTextYes: {
    color: '#000',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
