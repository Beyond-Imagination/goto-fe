import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { AuthResult, login, refresh } from "./src/authApi";

type RequestState = "idle" | "loading";

export default function App() {
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [result, setResult] = useState<AuthResult | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoading = requestState === "loading";

  async function handleLogin() {
    await runAuthRequest(async () => {
      const nextResult = await login();

      if (nextResult.type === "login") {
        setRefreshToken(nextResult.response.refreshToken);
      }

      return nextResult;
    });
  }

  async function handleRefresh() {
    if (!refreshToken) {
      return;
    }

    await runAuthRequest(() => refresh(refreshToken));
  }

  async function runAuthRequest(request: () => Promise<AuthResult>) {
    setRequestState("loading");
    setErrorMessage(null);

    try {
      setResult(await request());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setRequestState("idle");
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.buttonRow}>
            <AuthButton disabled={isLoading} label="로그인" onPress={handleLogin} />
            {refreshToken ? (
              <AuthButton disabled={isLoading} label="리프레시" onPress={handleRefresh} />
            ) : null}
          </View>

          {isLoading ? <ActivityIndicator style={styles.loading} /> : null}

          {errorMessage || result ? (
            <ScrollView
              contentContainerStyle={styles.resultContent}
              style={styles.resultPanel}
            >
              {errorMessage ? (
                <Text selectable style={styles.errorText}>
                  {errorMessage}
                </Text>
              ) : null}

              {result ? (
                <Text selectable style={styles.tokenText}>
                  {JSON.stringify(result, null, 2)}
                </Text>
              ) : null}
            </ScrollView>
          ) : null}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

type AuthButtonProps = {
  disabled: boolean;
  label: string;
  onPress: () => void;
};

function AuthButton({ disabled, label, onPress }: AuthButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed ? styles.buttonPressed : null,
        disabled ? styles.buttonDisabled : null
      ]}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f7f9"
  },
  container: {
    flex: 1,
    gap: 16,
    padding: 20
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10
  },
  button: {
    alignItems: "center",
    backgroundColor: "#1f2937",
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 18
  },
  buttonDisabled: {
    opacity: 0.55
  },
  buttonPressed: {
    backgroundColor: "#374151"
  },
  buttonLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700"
  },
  loading: {
    alignSelf: "flex-start"
  },
  resultPanel: {
    flex: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "#ffffff"
  },
  resultContent: {
    flexGrow: 1,
    padding: 14
  },
  tokenText: {
    color: "#111827",
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18
  },
  errorText: {
    color: "#b91c1c",
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18
  }
});
