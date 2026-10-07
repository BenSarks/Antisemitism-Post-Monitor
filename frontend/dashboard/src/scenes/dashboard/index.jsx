import { useEffect, useState } from "react";
import { Alert, Box, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import UsersTable from "../../components/UsersTable";
import StatBox from "../../components/StatBox";
import Chart from "../../components/LineChart";
import WordCloud from "../../components/WordCloud";
import RecentPosts from "../../components/RecentPosts";
import Panel from "../../components/Panel";
import { LiveDot, PageHeader } from "../../components/Layout";
import { FlagIcon, PercentIcon, ScanIcon } from "../../components/Icons";
import { COLORS } from "../../theme";
import { fetchJson } from "../../api";
import { formatNumber, periodChange } from "../../utils";

const REFRESH_INTERVAL_MS = 10000;

const Dashboard = () => {
  const navigate = useNavigate();

  const [totalPosts, setTotalPosts] = useState({ total_posts: 0, flagged_posts: 0 });
  const [wordCloudData, setWordCloudData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [reports, setReports] = useState({ dates: [], instagram: [] });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = () => {
      Promise.all([fetchJson("/dashboard"), fetchJson("/all_hashtags"), fetchJson("/posts")])
        .then(([dashboard, hashtags, posts]) => {
          setReports(dashboard.weekly_report);
          setTotalPosts(dashboard.total_posts_number);
          setUsersData(dashboard.top_users);
          setWordCloudData(hashtags);
          setRecentPosts(posts.slice(0, 5));
          setLastUpdated(new Date());
          setError(null);
        })
        .catch((e) => setError(`Could not reach the API server (${e.message}).`));
    };

    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const flagRate = totalPosts.total_posts ? (totalPosts.flagged_posts / totalPosts.total_posts) * 100 : 0;
  const dailyRate = reports.scanned
    ? reports.instagram.map((f, i) => (reports.scanned[i] ? (f / reports.scanned[i]) * 100 : 0))
    : null;
  const last = (arr, n = 14) => (arr ? arr.slice(-n) : null);

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Real-time monitoring of antisemitic content in public Instagram posts"
        actions={
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            sx={{ whiteSpace: "nowrap", flexShrink: 0, px: 1.75, py: 1, borderRadius: "10px", border: `1px solid ${COLORS.border}`, bgcolor: COLORS.surface }}
          >
            <LiveDot color={error ? COLORS.flagged : COLORS.success} pulsing={!error} />
            <Typography fontSize={13} fontWeight={500}>
              {error ? "Offline" : "Live"}
            </Typography>
            <Typography fontSize={13} color="text.secondary">
              · Updated {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
            </Typography>
          </Stack>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {error}
        </Alert>
      )}

      <Box
        display="grid"
        gap={2.5}
        sx={{ gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" } }}
      >
        <StatBox
          title="Posts scanned"
          value={formatNumber(totalPosts.total_posts)}
          icon={ScanIcon}
          color={COLORS.scanned}
          delta={periodChange(reports.scanned)}
          spark={last(reports.scanned)}
        />
        <StatBox
          title="Flagged posts"
          value={formatNumber(totalPosts.flagged_posts)}
          icon={FlagIcon}
          color={COLORS.flagged}
          delta={periodChange(reports.instagram)}
          goodWhenUp={false}
          spark={last(reports.instagram)}
          onClick={() => navigate("/posts")}
        />
        <StatBox
          title="Flag rate"
          value={`${flagRate.toFixed(2)}%`}
          icon={PercentIcon}
          color={COLORS.warning}
          delta={dailyRate ? periodChange(dailyRate) : null}
          goodWhenUp={false}
          spark={last(dailyRate)}
        />
      </Box>

      <Box mt={2.5}>
        <Chart reports={reports} />
      </Box>

      <Box
        display="grid"
        gap={2.5}
        mt={2.5}
        sx={{ gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1.25fr) minmax(0, 1fr)" } }}
      >
        <UsersTable users={usersData} />
        <Panel title="Trending hashtags" subtitle="Most frequent hashtags across scanned posts" sx={{ minHeight: 420, height: "100%" }}>
          <Box height="100%" minHeight={340}>
            <WordCloud data={wordCloudData} />
          </Box>
        </Panel>
      </Box>

      {recentPosts.length > 0 && (
        <Box mt={2.5}>
          <RecentPosts posts={recentPosts} />
        </Box>
      )}
    </>
  );
};

export default Dashboard;
