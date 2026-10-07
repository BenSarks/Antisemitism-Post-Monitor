import { Box, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Panel from "./Panel";
import { Author } from "./PostBits";
import { ArrowRightIcon } from "./Icons";
import { COLORS } from "../theme";
import { timeAgo } from "../utils";
import { Sensitive } from "./Privacy";

const RecentPosts = ({ posts }) => {
  const navigate = useNavigate();
  return (
    <Panel
      title="Latest flags"
      subtitle="Most recent posts caught by the classifier"
      action={
        <Button size="small" endIcon={<ArrowRightIcon size={15} />} onClick={() => navigate("/posts")}>
          View all
        </Button>
      }
      sx={{ height: "100%" }}
    >
      <Stack divider={<Box borderTop={`1px solid ${COLORS.border}`} />} spacing={1.75}>
        {posts.map((p) => (
          <Box key={p.id}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} mb={0.75}>
              <Author name={p.user_name} size={24} />
              <Typography fontSize={12} color="text.secondary" flexShrink={0}>
                {timeAgo(p.timestamp)}
              </Typography>
            </Stack>
            <Typography
              fontSize={13}
              color="text.secondary"
              sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
            >
              <Sensitive>{p.title_text}</Sensitive>
            </Typography>
          </Box>
        ))}
      </Stack>
    </Panel>
  );
};

export default RecentPosts;
