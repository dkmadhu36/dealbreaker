import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GAME_COLORS } from '@/constants/game';
import { useGame } from '@/stores/GameContext';
import { api } from '@/services/api';
import { socket } from '@/services/socket';

const DEFAULT_SERVER = '10.159.111.171';
const SERVER_STORAGE_KEY = '@monopoly_deal_server';

export default function HomeScreen() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER);
  const [tempServerUrl, setTempServerUrl] = useState(DEFAULT_SERVER);
  const { createRoom, joinRoom } = useGame();

  const applyServerUrl = (url: string) => {
    console.log('Applying server URL:', url);
    api.setBaseUrl(`http://${url}:8000`);
    socket.setBaseUrl(`ws://${url}:8000`);
  };

  useEffect(() => {
    const loadServerUrl = async () => {
      try {
        const saved = await AsyncStorage.getItem(SERVER_STORAGE_KEY);
        if (saved) {
          console.log('Loaded saved server URL:', saved);
          setServerUrl(saved);
          setTempServerUrl(saved);
          applyServerUrl(saved);
        } else {
          console.log('Using default server URL:', DEFAULT_SERVER);
          applyServerUrl(DEFAULT_SERVER);
        }
      } catch (err) {
        console.log('Failed to load server URL:', err);
        applyServerUrl(DEFAULT_SERVER);
      }
    };
    loadServerUrl();
  }, []);

  const saveServerUrl = async () => {
    try {
      await AsyncStorage.setItem(SERVER_STORAGE_KEY, tempServerUrl);
      setServerUrl(tempServerUrl);
      applyServerUrl(tempServerUrl);
      setShowSettings(false);
    } catch {
      Alert.alert('Error', 'Failed to save server URL');
    }
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      await createRoom(playerName.trim(), maxPlayers);
      router.push('/lobby');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      Alert.alert('Error', 'Please enter room code');
      return;
    }

    console.log('Attempting to join room:', roomCode.trim().toUpperCase(), 'as', playerName.trim());
    setIsLoading(true);
    try {
      await joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
      console.log('Join room successful, navigating to lobby');
      router.push('/lobby');
    } catch (error: any) {
      console.log('Join room error:', error);
      Alert.alert('Error', error.message || 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Settings Button */}
          <Pressable style={styles.settingsButton} onPress={() => setShowSettings(true)}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>

          {/* Logo Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoCards}>🃏</Text>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>
                  MONOPOLY <Text style={styles.titleAccent}>DEAL</Text>
                </Text>
                <Text style={styles.tagline}>The Card Game</Text>
              </View>
            </View>
          </View>

          <View style={styles.form}>
            {/* Player Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                value={playerName}
                onChangeText={setPlayerName}
                placeholder="Enter your name"
                placeholderTextColor={GAME_COLORS.textSecondary}
                maxLength={20}
              />
            </View>

            {/* Create Game Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Create New Game</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.labelSmall}>Players</Text>
                <View style={styles.playerSelector}>
                  {[2, 3, 4, 5].map((num) => (
                    <Pressable
                      key={num}
                      style={[
                        styles.playerOption,
                        maxPlayers === num && styles.playerOptionActive,
                      ]}
                      onPress={() => setMaxPlayers(num)}
                    >
                      <Text
                        style={[
                          styles.playerOptionText,
                          maxPlayers === num && styles.playerOptionTextActive,
                        ]}
                      >
                        {num}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable
                style={[styles.button, styles.createButton]}
                onPress={handleCreateRoom}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Create Room</Text>
                )}
              </Pressable>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Join Game Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Join Existing Game</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.labelSmall}>Room Code</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  value={roomCode}
                  onChangeText={(text) => setRoomCode(text.toUpperCase())}
                  placeholder="XXXXXX"
                  placeholderTextColor={GAME_COLORS.textSecondary}
                  maxLength={6}
                  autoCapitalize="characters"
                />
              </View>

              <Pressable
                style={[styles.button, styles.joinButton]}
                onPress={handleJoinRoom}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Join Room</Text>
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Collect 3 complete property sets to win!
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Settings</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Server IP Address</Text>
              <TextInput
                style={styles.input}
                value={tempServerUrl}
                onChangeText={setTempServerUrl}
                placeholder="192.168.1.100"
                placeholderTextColor={GAME_COLORS.textSecondary}
                keyboardType="numeric"
              />
              <Text style={styles.helpText}>
                Enter the IP address of the game server
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable 
                style={[styles.modalButton, styles.modalButtonCancel]} 
                onPress={() => {
                  setTempServerUrl(serverUrl);
                  setShowSettings(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalButton, styles.modalButtonSave]} 
                onPress={saveServerUrl}
              >
                <Text style={styles.modalButtonTextSave}>Save</Text>
              </Pressable>
            </View>
          </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  settingsButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    zIndex: 10,
  },
  settingsIcon: {
    fontSize: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCards: {
    fontSize: 48,
  },
  titleContainer: {
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: GAME_COLORS.text,
    letterSpacing: 2,
  },
  titleAccent: {
    color: GAME_COLORS.accent,
  },
  tagline: {
    fontSize: 13,
    color: GAME_COLORS.textSecondary,
    marginTop: 2,
    letterSpacing: 1,
  },
  form: {
    gap: 16,
  },
  sectionCard: {
    backgroundColor: GAME_COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
  },
  sectionTitle: {
    color: GAME_COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    color: GAME_COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  labelSmall: {
    color: GAME_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    backgroundColor: GAME_COLORS.surfaceLight,
    borderRadius: 12,
    padding: 14,
    color: GAME_COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 20,
    fontWeight: '600',
  },
  playerSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  playerOption: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: GAME_COLORS.surfaceLight,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
  },
  playerOptionActive: {
    backgroundColor: GAME_COLORS.primary,
    borderColor: GAME_COLORS.primary,
  },
  playerOptionText: {
    color: GAME_COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  playerOptionTextActive: {
    color: '#FFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: GAME_COLORS.border,
  },
  dividerText: {
    color: GAME_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    backgroundColor: GAME_COLORS.primary,
  },
  joinButton: {
    backgroundColor: GAME_COLORS.secondary,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
    alignItems: 'center',
  },
  footerText: {
    color: GAME_COLORS.textSecondary,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: GAME_COLORS.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GAME_COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  helpText: {
    color: GAME_COLORS.textSecondary,
    fontSize: 11,
    marginTop: 6,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: GAME_COLORS.surfaceLight,
  },
  modalButtonSave: {
    backgroundColor: GAME_COLORS.primary,
  },
  modalButtonText: {
    color: GAME_COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonTextSave: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
