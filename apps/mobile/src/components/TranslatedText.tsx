import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAtomValue } from "jotai";
import type { SourceID } from "@newsnow/shared/types";
import { useTranslateContent } from "../hooks/useTranslateContent";
import { translationModeAtom } from "../atoms/languageAtom";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  translatingText: {
    opacity: 0.6,
  },
  spinner: {
    marginLeft: 8,
  },
});

interface TranslatedTextProps {
  text: string;
  style?: any;
  preTranslated?: string; // For eager mode - pass pre-translated text
  sourceId?: SourceID; // Optional source ID to check disableTranslation flag
}

/**
 * Component that automatically translates text based on user's language preference
 * Shows the translated text with a loading indicator when translating
 * Supports both lazy (on-demand) and eager (pre-translated) modes
 */
export function TranslatedText({
  text,
  style,
  preTranslated,
  sourceId,
}: TranslatedTextProps) {
  const mode = useAtomValue(translationModeAtom);
  const { translatedText, isTranslating } = useTranslateContent(text, sourceId);

  // In eager mode, use pre-translated text if available
  const displayText =
    mode === "eager" && preTranslated ? preTranslated : translatedText;

  if (isTranslating && mode === "lazy") {
    return (
      <View style={styles.container}>
        <Text style={[style, styles.translatingText]}>{text}</Text>
        <ActivityIndicator size="small" style={styles.spinner} />
      </View>
    );
  }

  return <Text style={style}>{displayText}</Text>;
}
