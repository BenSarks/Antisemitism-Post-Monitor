import { Box, Paper, Stack, Typography } from "@mui/material";

const Panel = ({ title, subtitle, action, children, sx, bodySx }) => (
  <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, display: "flex", flexDirection: "column", minWidth: 0, ...sx }}>
    {(title || action) && (
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} mb={2}>
        <Box>
          <Typography variant="h6" fontSize={16}>
            {title}
          </Typography>
          {subtitle && (
            <Typography fontSize={13} color="text.secondary" mt={0.25}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
    )}
    <Box flex={1} minHeight={0} sx={bodySx}>
      {children}
    </Box>
  </Paper>
);

export default Panel;
