const fs = require("fs");
let content = fs.readFileSync("app/(drawer)/parties/index.tsx", "utf-8");

content = content.replace(
  /<View style=\{styles.cardRight\}>[\s\S]*?<Ionicons name="chevron-forward" size=\{18\} color="#9CA3AF" style=\{\{ marginTop: 8 \}\} \/>\r?\n\s*<\/View>/,
  `<View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {stats.totalPending > 0 ? (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>?{stats.totalPending.toFixed(0)} due</Text>
            </View>
          ) : stats.billCount > 0 ? (
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>Cleared</Text>
            </View>
          ) : null}
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>`
);

fs.writeFileSync("app/(drawer)/parties/index.tsx", content);

