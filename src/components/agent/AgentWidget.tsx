"use client";

import React, { useState } from "react";
import AgentChat from "./AgentChat";
import styles from "./AgentWidget.module.scss";

export default function AgentWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div className={`${styles.agentWidget} ${isOpen ? styles.open : ""}`}>
        <div className={styles.widgetContainer}>
          <div className={styles.widgetHeader}>
            <span>AI Assistant</span>
            <button onClick={toggleWidget} className={styles.closeButton}>
              ✕
            </button>
          </div>
          <div className={styles.widgetContent}>
            <AgentChat />
          </div>
        </div>
      </div>

      <button
        onClick={toggleWidget}
        className={styles.widgetButton}
        aria-label="Open AI Assistant"
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </>
  );
}
