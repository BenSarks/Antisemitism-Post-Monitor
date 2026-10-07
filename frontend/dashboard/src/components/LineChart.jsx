import { useState } from "react";
import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import Panel from "./Panel";
import { COLORS } from "../theme";
import { shortDate } from "../utils";

const RANGES = [7, 14, 30];

const LegendItem = ({ color, label }) => (
  <Stack direction="row" alignItems="center" spacing={0.75}>
    <Box width={10} height={10} borderRadius="3px" bgcolor={color} />
    <Typography fontSize={12.5} color="text.secondary">
      {label}
    </Typography>
  </Stack>
);

const Chart = ({ reports }) => {
  const available = reports.dates.length;
  const [range, setRange] = useState(30);
  const days = Math.min(range, available);
  const slice = (arr) => (arr || []).slice(-days);

  const dates = slice(reports.dates).map(shortDate);
  const hasScanned = Array.isArray(reports.scanned);

  const series = [
    {
      id: "flagged",
      data: slice(reports.instagram),
      label: "Flagged posts",
      color: COLORS.flagged,
      area: true,
      showMark: false,
      curve: "monotoneX",
      yAxisKey: "flagged",
    },
  ];
  if (hasScanned) {
    series.unshift({
      id: "scanned",
      data: slice(reports.scanned),
      label: "Posts scanned",
      color: COLORS.scanned,
      area: true,
      showMark: false,
      curve: "monotoneX",
      yAxisKey: "scanned",
    });
  }

  return (
    <Panel
      title="Activity"
      subtitle="Instagram posts processed per day"
      action={
        available > 7 && (
        <ToggleButtonGroup
          size="small"
          exclusive
          value={range}
          onChange={(_, v) => v && setRange(v)}
          sx={{ "& .MuiToggleButton-root": { px: 1.5, py: 0.4, fontSize: 12.5, border: `1px solid ${COLORS.border}` } }}
        >
          {RANGES.filter((r) => r <= Math.max(available, 7)).map((r) => (
            <ToggleButton key={r} value={r}>
              {r}d
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        )
      }
      sx={{ height: "100%" }}
    >
      <Stack direction="row" spacing={2.5} mb={1}>
        {hasScanned && <LegendItem color={COLORS.scanned} label="Posts scanned (left axis)" />}
        <LegendItem color={COLORS.flagged} label={hasScanned ? "Flagged (right axis)" : "Flagged posts"} />
      </Stack>
      <Box height={320}>
        <LineChart
          xAxis={[{ scaleType: "point", data: dates, tickLabelStyle: { fontSize: 11, fill: COLORS.muted } }]}
          yAxis={[
            { id: "scanned", tickLabelStyle: { fontSize: 11, fill: COLORS.muted } },
            { id: "flagged", tickLabelStyle: { fontSize: 11, fill: COLORS.muted } },
          ]}
          leftAxis={hasScanned ? "scanned" : "flagged"}
          rightAxis={hasScanned ? "flagged" : null}
          series={series}
          margin={{ top: 16, right: hasScanned ? 48 : 16, bottom: 28, left: 52 }}
          slotProps={{ legend: { hidden: true } }}
          sx={{
            "& .MuiAreaElement-root": { fillOpacity: 0.12 },
            "& .MuiLineElement-root": { strokeWidth: 2.25 },
            "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": { stroke: `${COLORS.border} !important` },
          }}
        />
      </Box>
    </Panel>
  );
};

export default Chart;
