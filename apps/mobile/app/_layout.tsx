import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { initializeTranslationService } from "../src/utils/translate";
import "../src/i18n";

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    initializeTranslationService();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ title: "NewsNow", headerShown: false }}
        />
        <Stack.Screen name="c/[column]" options={{ title: "Column" }} />
      </Stack>
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
