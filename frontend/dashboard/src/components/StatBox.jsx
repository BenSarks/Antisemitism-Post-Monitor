import { Box, Paper, Stack, Typography, alpha } from "@mui/material";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { COLORS } from "../theme";
import { ArrowDownIcon, ArrowUpIcon } from "./Icons";

const Delta = ({ value, goodWhenUp }) => {
  if (value == null) return null;
  const up = value >= 0;
  const good = up === goodWhenUp;
  const color = good ? COLORS.success : COLORS.flagged;
  const ArrowIcon = up ? ArrowUpIcon : ArrowDownIcon;
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.25}
      sx={{ color, bgcolor: alpha(color, 0.12), px: 0.75, py: 0.25, borderRadius: "6px", fontSize: 12, fontWeight: 600 }}
    >
      <ArrowIcon size={13} />
      <span>{Math.abs(value).toFixed(1)}%</span>
    </Stack>
  );
};

const StatBox = ({ title, value, icon: StatIcon, color, delta, goodWhenUp = true, spark, onClick }) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 2.5,
      position: "relative",
      overflow: "hidden",
      cursor: onClick ? "pointer" : "default",
      transition: "border-color .15s, transform .15s",
      "&:hover": onClick ? { borderColor: alpha(color, 0.45), transform: "translateY(-2px)" } : undefined,
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: "10px",
          display: "grid",
          placeItems: "center",
          color,
          bgcolor: alpha(color, 0.14),
        }}
      >
        <StatIcon size={19} />
      </Box>
      <Delta value={delta} goodWhenUp={goodWhenUp} />
    </Stack>
    <Typography fontSize={13} color="text.secondary" mt={2}>
      {title}
    </Typography>
    <Stack direction="row" alignItems="flex-end" justifyContent="space-between" spacing={1}>
      <Typography fontSize={28} fontWeight={700} letterSpacing="-0.02em" lineHeight={1.2}>
        {value}
      </Typography>
      {spark && spark.length > 1 && (
        <Box width={96} height={36} flexShrink={0}>
          <SparkLineChart data={spark} height={36} curve="natural" area colors={[color]} margin={{ top: 4, bottom: 2, left: 0, right: 0 }} sx={{ "& .MuiAreaElement-root": { fillOpacity: 0.18 } }} />
        </Box>
      )}
    </Stack>
    {delta != null && (
      <Typography fontSize={12} color="text.secondary" mt={0.5}>
        vs. previous 7 days
      </Typography>
    )}
  </Paper>
);

export default StatBox;
