import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { sources } from "@newsnow/shared/sources";
import type { NewsItem, SourceID, SourceResponse } from "@newsnow/shared/types";
import { client } from "../../src/utils";
import { cacheSources, refetchSources } from "../../src/utils/data";
import { useRelativeTime } from "../../src/hooks/useRelativeTime";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
});

export default function ColumnScreen() {
  const { column } = useLocalSearchParams<{ column: string }>();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t(`columns.${column}`)}</Text>
    </View>
  );
}
