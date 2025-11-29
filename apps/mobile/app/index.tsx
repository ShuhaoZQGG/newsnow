import {
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAtomValue, useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { sources } from "@newsnow/shared/sources";
import { fixedColumnIds } from "@newsnow/shared/metadata";
import type { NewsItem, SourceID, SourceResponse } from "@newsnow/shared/types";
import { useQuery } from "@tanstack/react-query";
import { client } from "../src/utils";
import {
  currentColumnIDAtom,
  currentSourcesAtom,
  focusSourcesAtom,
} from "../src/atoms";
import { cacheSources, refetchSources } from "../src/utils/data";
import { useRelativeTime } from "../src/hooks/useRelativeTime";
import { TranslatedText } from "../src/components/TranslatedText";
import { useEagerTranslation } from "../src/hooks/useEagerTranslation";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  tabContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tabContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  tabActive: {
    backgroundColor: "#007AFF",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  columnContainer: {
    flex: 1,
    padding: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 12,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
  },
  badge: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#999",
  },
  newsContainer: {
    maxHeight: 400,
  },
  newsItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  newsItemContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  indexContainer: {
    width: 30,
    marginRight: 8,
    alignItems: "center",
  },
  newsIndex: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },
  diffNumber: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 2,
  },
  newsTextContainer: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    marginBottom: 4,
  },
  newsTime: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  newsExtra: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
});

export default function Index() {
  const { t } = useTranslation();
  const focusSources = useAtomValue(focusSourcesAtom);
  const [selectedColumn, setSelectedColumn] = useState<string>(
    focusSources.length ? "focus" : "hottest",
  );
  const setCurrentColumnID = useSetAtom(currentColumnIDAtom);

  const handleColumnSelect = (columnId: string) => {
    setSelectedColumn(columnId);
    setCurrentColumnID(columnId as any);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>NewsNow</Text>
      </View>

      {/* Column Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        {fixedColumnIds.map((columnId) => (
          <TouchableOpacity
            key={columnId}
            style={[
              styles.tab,
              selectedColumn === columnId && styles.tabActive,
            ]}
            onPress={() => handleColumnSelect(columnId)}
          >
            <Text
              style={[
                styles.tabText,
                selectedColumn === columnId && styles.tabTextActive,
              ]}
            >
              {t(`columns.${columnId}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* News Column */}
      <ColumnView columnId={selectedColumn} />
    </View>
  );
}

function ColumnView({ columnId: _columnId }: { columnId: string }) {
  const currentSources = useAtomValue(currentSourcesAtom);

  return (
    <ScrollView style={styles.columnContainer}>
      {currentSources.map((sourceId) => (
        <NewsCard key={sourceId} sourceId={sourceId} />
      ))}
    </ScrollView>
  );
}

function NewsCard({ sourceId }: { sourceId: SourceID }) {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["source", sourceId],
    queryFn: async ({ queryKey }) => {
      const id = queryKey[1] as SourceID;

      // Check if we need to force refresh
      const shouldRefetch = refetchSources.has(id);

      if (cacheSources.has(id) && !refreshing && !shouldRefetch) {
        return cacheSources.get(id);
      }

      if (shouldRefetch) {
        // TODO: Add auth header when login is implemented
        // const jwt = await AsyncStorage.getItem("jwt")
        // if (jwt) headers.Authorization = `Bearer ${jwt}`
        refetchSources.delete(id);
      }

      const response: SourceResponse = await client.getSource(
        id,
        shouldRefetch,
      );

      // Calculate rank changes for hottest items
      function diff() {
        try {
          if (
            response.items &&
            sources[id].type === "hottest" &&
            cacheSources.has(id)
          ) {
            response.items.forEach((item, i) => {
              const previousItems = cacheSources.get(id)!.items;
              const o = previousItems.findIndex((k) => k.id === item.id);
              item.extra = {
                ...item?.extra,
                diff: o === -1 ? undefined : o - i,
              };
            });
          }
        } catch (e) {
          console.error(e);
        }
      }

      diff();

      cacheSources.set(id, response);
      return response;
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    refetchSources.add(sourceId);
    await refetch();
    setRefreshing(false);
  };

  const source = sources[sourceId];
  const relativeTime = useRelativeTime(data?.updatedTime ?? "");
  const { translations } = useEagerTranslation(data?.items || [], sourceId);

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{source.name}</Text>
          {source.title && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{source.title}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardSubtitle}>
          {relativeTime
            ? t("status.updated", { time: relativeTime })
            : isError
              ? t("status.fetchFailed")
              : t("common.loading")}
        </Text>
      </View>

      {/* News Items */}
      <ScrollView
        style={styles.newsContainer}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
        }
      >
        {data?.items?.map((item, index) => (
          <NewsItemView
            key={item.id}
            item={item}
            index={index}
            isHottest={source.type === "hottest"}
            sourceId={sourceId}
            preTranslated={translations.get(item.title)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function DiffNumber({ diff }: { diff: number }) {
  const [shown, setShown] = useState(true);

  // Hide after 5 seconds like web
  useEffect(() => {
    setShown(true);
    const timer = setTimeout(() => {
      setShown(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [diff]);

  if (!shown) return null;

  return (
    <Text
      style={[
        styles.diffNumber,
        { color: diff < 0 ? "#4caf50" : "#f44336" }, // Green for negative (moved up/closer to 1?), Red for positive (moved down?)
        // Actually in ranking, smaller index is better.
        // Web: diff < 0 ? "text-green" : "text-red".
        // If diff is (oldIndex - newIndex).
        // If old was 5, new is 2. diff = 3. Positive means climbed up?
        // Wait, web logic:
        // const o = cacheSources.get(id)!.items.findIndex(k => k.id === item.id) (Old Index)
        // item.extra.diff = o - i (Old - New)
        // If Old=5, New=2 (Improved). Diff = 3.
        // Web: diff < 0 ? "text-green" : "text-red"
        // So Diff > 0 is Red? That seems counter-intuitive for "improvement" usually being green.
        // But maybe "Green" means "New" or "Good"?
        // Let's stick to web logic: diff < 0 is Green, else Red.
      ]}
    >
      {diff > 0 ? `+${diff}` : diff}
    </Text>
  );
}

function NewsItemView({
  item,
  index,
  isHottest,
  sourceId,
  preTranslated,
}: {
  item: NewsItem;
  index: number;
  isHottest: boolean;
  sourceId: SourceID;
  preTranslated?: string;
}) {
  const handlePress = () => {
    if (item.url) {
      Linking.openURL(item.url);
    }
  };

  const relativeTime = useRelativeTime(item.pubDate || item?.extra?.date || "");

  return (
    <TouchableOpacity onPress={handlePress} style={styles.newsItem}>
      <View style={styles.newsItemContent}>
        {isHottest && (
          <View style={styles.indexContainer}>
            <Text style={styles.newsIndex}>{index + 1}</Text>
            {!!item.extra?.diff && <DiffNumber diff={item.extra.diff} />}
          </View>
        )}
        <View style={styles.newsTextContainer}>
          <TranslatedText
            text={item.title}
            style={styles.newsTitle}
            preTranslated={preTranslated}
            sourceId={sourceId}
          />
          {(item.pubDate || item?.extra?.date) && (
            <Text style={styles.newsTime}>{relativeTime}</Text>
          )}
          {item?.extra?.info && (
            <Text style={styles.newsExtra}>{item.extra.info}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
