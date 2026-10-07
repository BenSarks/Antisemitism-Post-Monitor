import { alpha, createTheme } from "@mui/material";

export const COLORS = {
  bg: "#0A0C13",
  surface: "#111421",
  surfaceRaised: "#171B2B",
  border: "rgba(148, 163, 214, 0.10)",
  text: "#E7E9F2",
  muted: "#8A90A8",
  primary: "#7C5CFF",
  flagged: "#F43F5E",
  scanned: "#38BDF8",
  success: "#22C55E",
  warning: "#F59E0B",
};

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: COLORS.primary },
    error: { main: COLORS.flagged },
    success: { main: COLORS.success },
    warning: { main: COLORS.warning },
    background: { default: COLORS.bg, paper: COLORS.surface },
    text: { primary: COLORS.text, secondary: COLORS.muted },
    divider: COLORS.border,
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: '"Inter", "Nunito Sans", system-ui, sans-serif',
    h4: { fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.02em" },
    h6: { fontWeight: 600, letterSpacing: "-0.01em" },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none", border: `1px solid ${COLORS.border}` },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: `1px solid ${COLORS.border}`, padding: "14px 16px" },
        head: {
          color: COLORS.muted,
          fontSize: 12,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          backgroundColor: COLORS.surface,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&.MuiTableRow-hover:hover": { backgroundColor: alpha(COLORS.primary, 0.05) },
          "&:last-child td": { borderBottom: 0 },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: COLORS.surface,
          borderRadius: 10,
          "& fieldset": { borderColor: COLORS.border },
        },
      },
    },
  },
});

export default theme;
