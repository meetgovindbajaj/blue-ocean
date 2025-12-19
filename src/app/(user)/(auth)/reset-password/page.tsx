import { Suspense } from "react";
import styles from "../auth.module.css";
import { Loader2 } from "lucide-react";
import ResetPasswordClient from "./ResetPasswordClient";

const ResetPasswordPage = () => {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.card}>
              <div className={styles.loadingState}>
                <Loader2 size={48} className={styles.spinner} />
                <p>Loading...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
};

export default ResetPasswordPage;
