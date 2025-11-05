"use client";

import React, { useState, useRef, useEffect } from "react";
import { AgentMessage, AgentResponse } from "@/types/agent";
import styles from "./AgentChat.module.scss";

interface AgentChatProps {
  conversationId?: string;
  userId?: string;
  onConversationIdChange?: (conversationId: string) => void;
}

export default function AgentChat({
  conversationId: initialConversationId,
  userId,
  onConversationIdChange,
}: AgentChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId
  );
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load conversation history if conversationId provided
  useEffect(() => {
    if (conversationId) {
      loadConversationHistory(conversationId);
    }
  }, [conversationId]);

  const loadConversationHistory = async (convId: string) => {
    try {
      const response = await fetch(
        `/api/v1/agent/chat?conversationId=${convId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error loading conversation history:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: AgentMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setSuggestions([]);

    try {
      const response = await fetch("/api/v1/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data: AgentResponse = await response.json();

      // Update conversation ID if new
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
        onConversationIdChange?.(data.conversationId);
      }

      // Add agent response
      const agentMessage: AgentMessage = {
        id: Date.now().toString() + "-agent",
        role: "agent",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentMessage]);

      // Set suggestions if available
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: AgentMessage = {
        id: Date.now().toString() + "-error",
        role: "agent",
        content: "I&apos;m sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const clearConversation = async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      await fetch(`/api/v1/agent/chat?conversationId=${conversationId}`, {
        method: "DELETE",
      });
      setMessages([]);
      setSuggestions([]);
      setConversationId(undefined);
    } catch (error) {
      console.error("Error clearing conversation:", error);
    }
  };

  return (
    <div className={styles.agentChat}>
      <div className={styles.header}>
        <h3>Blue Ocean Copilot</h3>
        {messages.length > 0 && (
          <button onClick={clearConversation} className={styles.clearButton}>
            Clear
          </button>
        )}
      </div>

      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.welcomeMessage}>
            <h4>👋 Hello! I&apos;m Blue Ocean Copilot</h4>
            <p>I can help you with:</p>
            <ul>
              <li>Finding and recommending products</li>
              <li>Answering questions about our furniture</li>
              <li>Providing business insights</li>
              <li>Code and technical assistance</li>
            </ul>
            <p>How can I assist you today?</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${styles[message.role]}`}
            >
              <div className={styles.messageContent}>
                <div className={styles.messageText}>{message.content}</div>
                <div className={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className={`${styles.message} ${styles.agent}`}>
            <div className={styles.messageContent}>
              <div className={styles.typing}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(suggestion)}
              className={styles.suggestionButton}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div className={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything..."
          disabled={loading}
          className={styles.input}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className={styles.sendButton}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
