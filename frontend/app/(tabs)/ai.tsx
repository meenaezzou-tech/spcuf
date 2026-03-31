import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { aiAPI, caseAPI } from '../../src/services/api';
import { Case, AIChatMessage } from '../../src/types';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function AIAdvisorScreen() {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: 'assistant',
      content:
        "I'm SPCUF, your AI legal assistant — here to support you, your children, and your family. I provide legal information, not legal advice — I'm not a licensed attorney and this is not a substitute for one. That said, I will give you every piece of knowledge I can to help you protect your family. What would you like to know?",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadActiveCase();
  }, []);

  const loadActiveCase = async () => {
    try {
      const cases = await caseAPI.getCases();
      if (cases.length > 0) {
        setActiveCase(cases[0]);
      }
    } catch (error) {
      console.log('No cases yet');
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: AIChatMessage = {
      role: 'user',
      content: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await aiAPI.chat(userMessage.content, activeCase?.id);
      const assistantMessage: AIChatMessage = {
        role: 'assistant',
        content: response.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI chat error:', error);
      const statusCode = error?.response?.status;
      let errorContent = 'I apologize, but I encountered an error. Please try again.';
      
      if (statusCode === 402 || (error?.response?.data?.detail && String(error.response.data.detail).toLowerCase().includes('budget'))) {
        errorContent = 'The AI service budget has been exceeded. SPCUF Intelligence is temporarily unavailable. Please contact your administrator to restore service, or browse the Legal Library for pre-loaded Texas CPS information.';
      } else if (statusCode === 503 || statusCode === 500) {
        errorContent = 'The AI service is temporarily unavailable. Please try again in a few moments, or browse the Legal Library for immediate legal information.';
      }

      const errorMessage: AIChatMessage = {
        role: 'assistant',
        content: errorContent,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="chatbubbles" size={24} color={Colors.accent.teal} />
          <Text style={styles.headerTitle}>SPCUF AI Advisor</Text>
        </View>
        {activeCase && (
          <Text style={styles.headerSubtitle}>Case: {activeCase.case_id_display}</Text>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.role === 'user' ? styles.userText : styles.assistantText,
              ]}
            >
              {message.content}
            </Text>
          </View>
        ))}
        {isLoading && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <ActivityIndicator size="small" color={Colors.accent.teal} />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask about your rights, laws, or case..."
          placeholderTextColor={Colors.silver.light}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons name="send" size={20} color={Colors.white.pure} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black.primary,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.black.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.silver.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: Typography.sizes.xl,
    color: Colors.white.pure,
    marginLeft: Spacing.sm,
  },
  headerSubtitle: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: Typography.sizes.xs,
    color: Colors.silver.mid,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: BorderRadius.modal,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.accent.steel,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.black.card,
    borderWidth: 1,
    borderColor: Colors.accent.tealBorder,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.teal,
  },
  messageText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.base,
    lineHeight: 22,
  },
  userText: {
    color: Colors.white.pure,
  },
  assistantText: {
    color: Colors.silver.bright,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.black.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.silver.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.black.card,
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.base,
    color: Colors.white.soft,
    maxHeight: 100,
    marginRight: Spacing.sm,
  },
  sendButton: {
    backgroundColor: Colors.accent.steel,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
