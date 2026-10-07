import { useEffect, useState } from "react";
import { Box, Stack, Typography, alpha, keyframes } from "@mui/material";
import { NavLink } from "react-router-dom";
import { COLORS } from "../theme";
import { FlagIcon, GridIcon, ShieldIcon } from "./Icons";
import { PrivacyToggle } from "./Privacy";
import { fetchJson } from "../api";

const CONTENT_MAX_WIDTH = 1480;

const NAV = [
  { to: "/", label: "Overview", icon: GridIcon, end: true },
  { to: "/posts", label: "Flagged posts", icon: FlagIcon },
];

const STATUS_INTERVAL_MS = 10000;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 ${alpha(COLORS.success, 0.6)}; }
  70% { box-shadow: 0 0 0 8px ${alpha(COLORS.success, 0)}; }
  100% { box-shadow: 0 0 0 0 ${alpha(COLORS.success, 0)}; }
`;

export const LiveDot = ({ size = 8, color = COLORS.success, pulsing = true }) => (
  <Box
    component="span"
    sx={{
      width: size,
      height: size,
      borderRadius: "50%",
      bgcolor: color,
      display: "inline-block",
      flexShrink: 0,
      animation: pulsing ? `${pulse} 2s infinite` : "none",
    }}
  />
);

const Brand = () => (
  <Stack direction="row" alignItems="center" spacing={1.25} flexShrink={0}>
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: "10px",
        display: "grid",
        placeItems: "center",
        color: "#fff",
        background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.flagged})`,
        boxShadow: `0 6px 20px ${alpha(COLORS.primary, 0.35)}`,
      }}
    >
      <ShieldIcon size={19} />
    </Box>
    <Box lineHeight={1.15} display={{ xs: "none", sm: "block" }}>
      <Typography fontWeight={700} fontSize={15} lineHeight={1.2}>
        Antisemitism
      </Typography>
      <Typography fontSize={12} color="text.secondary" lineHeight={1.2}>
        Post Monitor
      </Typography>
    </Box>
  </Stack>
);

const navLinkSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  px: { xs: 1.25, md: 1.75 },
  py: 0.9,
  borderRadius: "10px",
  color: COLORS.muted,
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 500,
  whiteSpace: "nowrap",
  transition: "all .15s",
  "&:hover": { color: COLORS.text, bgcolor: alpha("#fff", 0.04) },
  "&.active": {
    color: COLORS.text,
    bgcolor: alpha(COLORS.primary, 0.16),
    boxShadow: `inset 0 0 0 1px ${alpha(COLORS.primary, 0.3)}`,
  },
};

const Nav = () => (
  <Stack
    direction="row"
    spacing={0.5}
    sx={{ p: 0.5, borderRadius: "12px", border: `1px solid ${COLORS.border}`, bgcolor: alpha(COLORS.surface, 0.7) }}
  >
    {NAV.map(({ to, label, icon: NavIcon, end }) => (
      <Box key={to} component={NavLink} to={to} end={end} aria-label={label} sx={navLinkSx}>
        <NavIcon size={17} />
        <Box component="span" display={{ xs: "none", sm: "inline" }}>
          {label}
        </Box>
      </Box>
    ))}
  </Stack>
);

const ApiStatus = () => {
  const [online, setOnline] = useState(null);

  useEffect(() => {
    const check = () =>
      fetchJson("/")
        .then(() => setOnline(true))
        .catch(() => setOnline(false));

    check();
    const interval = setInterval(check, STATUS_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const label = online === null ? "Connecting…" : online ? "API online" : "API offline";
  const color = online === false ? COLORS.flagged : online ? COLORS.success : COLORS.muted;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        px: 1.75,
        py: 0.9,
        borderRadius: "12px",
        border: `1px solid ${COLORS.border}`,
        bgcolor: alpha(COLORS.surface, 0.7),
        flexShrink: 0,
      }}
    >
      <LiveDot size={7} color={color} pulsing={online === true} />
      <Typography fontSize={13} fontWeight={500} whiteSpace="nowrap">
        {label}
      </Typography>
    </Stack>
  );
};

const TopBar = () => (
  <Box
    component="header"
    sx={{
      position: "sticky",
      top: 0,
      zIndex: 10,
      borderBottom: `1px solid ${COLORS.border}`,
      bgcolor: alpha(COLORS.bg, 0.8),
      backdropFilter: "blur(12px)",
    }}
  >
    <Stack
      direction="row"
      alignItems="center"
      spacing={{ xs: 1.5, md: 3 }}
      sx={{ px: { xs: 2, sm: 3, lg: 4 }, py: 1.5, maxWidth: CONTENT_MAX_WIDTH, mx: "auto" }}
    >
      <Brand />
      <Nav />
      <Box flex={1} />
      <Box display={{ xs: "none", sm: "block" }}>
        <ApiStatus />
      </Box>
      <PrivacyToggle />
    </Stack>
  </Box>
);

const Layout = ({ children }) => (
  <Box
    minHeight="100vh"
    sx={{
      background: `radial-gradient(1200px 600px at 85% -10%, ${alpha(COLORS.primary, 0.12)}, transparent 60%),
                   radial-gradient(900px 500px at -10% 110%, ${alpha(COLORS.flagged, 0.07)}, transparent 60%),
                   ${COLORS.bg}`,
    }}
  >
    <TopBar />
    <Box component="main" sx={{ px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 2.5, md: 4 }, maxWidth: CONTENT_MAX_WIDTH, mx: "auto" }}>
      {children}
    </Box>
  </Box>
);

export const PageHeader = ({ title, subtitle, actions }) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    justifyContent="space-between"
    alignItems={{ xs: "flex-start", sm: "flex-end" }}
    spacing={2}
    mb={3.5}
  >
    <Box>
      <Typography variant="h4" fontSize={{ xs: 24, md: 30 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography color="text.secondary" mt={0.5} fontSize={14}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {actions}
  </Stack>
);

export default Layout;
