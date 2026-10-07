import { Box, Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography, alpha } from "@mui/material";
import Panel from "./Panel";
import { Author } from "./PostBits";
import { COLORS } from "../theme";
import { formatNumber } from "../utils";

const StatusChip = ({ active }) => {
  const color = active ? COLORS.success : COLORS.muted;
  return (
    <Chip
      size="small"
      label={active ? "Active" : "Inactive"}
      sx={{ height: 22, fontSize: 11.5, color, bgcolor: alpha(color, 0.12) }}
    />
  );
};

const UsersTable = ({ users }) => (
  <Panel title="Top flagged accounts" subtitle="Ranked by number of flagged posts" sx={{ height: "100%" }} bodySx={{ mx: { xs: -2, md: -2.5 }, mb: { xs: -2, md: -2.5 } }}>
    <TableContainer>
      <Table size="small" aria-label="top users">
        <TableHead>
          <TableRow>
            <TableCell>Account</TableCell>
            <TableCell align="right">Flagged</TableCell>
            <TableCell sx={{ minWidth: 140 }}>Flag rate</TableCell>
            <TableCell align="center">Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((row) => {
            const rate = row.processed_posts ? row.flagged_posts / row.processed_posts : 0;
            const color = rate > 0.3 ? COLORS.flagged : rate > 0.1 ? COLORS.warning : COLORS.scanned;
            return (
              <TableRow key={row.name} hover>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Author name={row.name} href={`https://instagram.com/${row.name}`} />
                    {row.is_verified && (
                      <Tooltip title="Verified account">
                        <Box component="span" sx={{ color: COLORS.scanned, fontSize: 13 }}>✓</Box>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Typography fontSize={13.5} fontWeight={700}>
                    {formatNumber(row.flagged_posts)}
                  </Typography>
                  <Typography fontSize={11.5} color="text.secondary">
                    of {formatNumber(row.processed_posts)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1.25}>
                    <Box flex={1} height={6} borderRadius={3} bgcolor={alpha("#fff", 0.07)} overflow="hidden">
                      <Box height="100%" width={`${Math.min(rate * 100, 100)}%`} bgcolor={color} borderRadius={3} />
                    </Box>
                    <Typography fontSize={12.5} fontWeight={600} width={38} textAlign="right">
                      {Math.round(rate * 100)}%
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <StatusChip active={row.is_active} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  </Panel>
);

export default UsersTable;
