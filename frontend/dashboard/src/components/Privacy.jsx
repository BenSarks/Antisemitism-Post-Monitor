import { createContext, useContext, useState } from "react";
import { Box, IconButton, Tooltip, alpha } from "@mui/material";
import { COLORS } from "../theme";
import { EyeIcon, EyeOffIcon } from "./Icons";

const STORAGE_KEY = "privacy-blur";

const PrivacyContext = createContext({ blurred: true, toggle: () => {} });

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export const PrivacyProvider = ({ children }) => {
  const [blurred, setBlurred] = useState(readStored);
  const toggle = () =>
    setBlurred((b) => {
      try {
        localStorage.setItem(STORAGE_KEY, b ? "off" : "on");
      } catch {}
      return !b;
    });
  return <PrivacyContext.Provider value={{ blurred, toggle }}>{children}</PrivacyContext.Provider>;
};

export const usePrivacy = () => useContext(PrivacyContext);

export const Sensitive = ({ children, component = "span", sx }) => {
  const { blurred } = usePrivacy();
  return (
    <Box
      component={component}
      aria-hidden={blurred || undefined}
      sx={{
        transition: "filter .2s",
        ...(blurred && { filter: "blur(6px)", userSelect: "none", pointerEvents: "none" }),
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export const PrivacyToggle = () => {
  const { blurred, toggle } = usePrivacy();
  return (
    <Tooltip title={blurred ? "Show usernames and posts" : "Blur usernames and posts"}>
      <IconButton
        onClick={toggle}
        aria-label={blurred ? "Show usernames and posts" : "Blur usernames and posts"}
        sx={{
          flexShrink: 0,
          borderRadius: "12px",
          border: `1px solid ${COLORS.border}`,
          bgcolor: alpha(COLORS.surface, 0.7),
          color: blurred ? COLORS.primary : COLORS.muted,
          width: 42,
          height: 42,
        }}
      >
        {blurred ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </IconButton>
    </Tooltip>
  );
};
