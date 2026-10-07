import { Avatar, Stack, Typography } from "@mui/material";
import { COLORS } from "../theme";
import { avatarColor } from "../utils";
import { Sensitive } from "./Privacy";

export const Author = ({ name, size = 28, href }) => (
  <Stack direction="row" alignItems="center" spacing={1.25} minWidth={0}>
    <Avatar sx={{ width: size, height: size, fontSize: size * 0.42, fontWeight: 700, bgcolor: avatarColor(name) }}>
      <Sensitive>{name.replace(/[^a-z]/gi, "").charAt(0).toUpperCase()}</Sensitive>
    </Avatar>
    <Typography
      component={href ? "a" : "span"}
      href={href}
      target={href ? "_blank" : undefined}
      rel={href ? "noreferrer" : undefined}
      fontSize={13.5}
      fontWeight={500}
      noWrap
      sx={{ color: "text.primary", textDecoration: "none", "&:hover": href ? { color: COLORS.primary } : undefined }}
    >
      <Sensitive>@{name}</Sensitive>
    </Typography>
  </Stack>
);
