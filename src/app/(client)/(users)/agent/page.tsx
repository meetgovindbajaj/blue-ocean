import { AgentChat } from "@/components/agent";
import styles from "./page.module.scss";

export const metadata = {
  title: "AI Assistant - Blue Ocean Copilot",
  description: "Chat with our intelligent AI assistant for product recommendations and support",
};

export default function AgentPage() {
  return (
    <div className={styles.agentPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Blue Ocean Copilot</h1>
          <p>Your intelligent assistant for furniture and more</p>
        </div>

        <div className={styles.chatContainer}>
          <AgentChat />
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <h3>🔍 Smart Search</h3>
            <p>Find products using natural language</p>
          </div>
          <div className={styles.feature}>
            <h3>💡 Recommendations</h3>
            <p>Get personalized product suggestions</p>
          </div>
          <div className={styles.feature}>
            <h3>📊 Insights</h3>
            <p>Access business analytics and data</p>
          </div>
          <div className={styles.feature}>
            <h3>🔧 Technical Help</h3>
            <p>Get assistance with code and APIs</p>
          </div>
        </div>

        <div className={styles.examples}>
          <h3>Try asking:</h3>
          <ul>
            <li>&quot;Show me modern sofas&quot;</li>
            <li>&quot;What are the best selling products?&quot;</li>
            <li>&quot;Recommend furniture for a small living room&quot;</li>
            <li>&quot;How do I use the product API?&quot;</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
