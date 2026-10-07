import { Box, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { Author } from "./PostBits";
import { CommentIcon, ExternalIcon, HeartIcon, ImageTextIcon } from "./Icons";
import { COLORS } from "../theme";
import { compactNumber, timeAgo } from "../utils";
import { Sensitive } from "./Privacy";

const PostsTable = ({ posts, footer }) => (
  <Paper elevation={0} sx={{ overflow: "hidden" }}>
    <TableContainer>
      <Table aria-label="flagged posts" sx={{ minWidth: 760 }}>
        <TableHead>
          <TableRow>
            <TableCell>Post</TableCell>
            <TableCell>Author</TableCell>
            <TableCell>Engagement</TableCell>
            <TableCell>Flagged</TableCell>
            <TableCell align="right" sx={{ width: 56 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {posts.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 8, color: "text.secondary" }}>
                No flagged posts match your filters.
              </TableCell>
            </TableRow>
          )}
          {posts.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell sx={{ width: "50%", minWidth: 300 }}>
                <Typography fontSize={13.5} lineHeight={1.5}>
                  <Sensitive>{row.title_text}</Sensitive>
                </Typography>
                {row.ocr_text && (
                  <Stack direction="row" spacing={0.75} alignItems="center" mt={1} sx={{ color: "text.secondary" }}>
                    <ImageTextIcon size={14} />
                    <Typography fontSize={12} fontStyle="italic" noWrap>
                      <Sensitive>“{row.ocr_text}”</Sensitive>
                    </Typography>
                  </Stack>
                )}
              </TableCell>
              <TableCell sx={{ maxWidth: 190 }}>
                <Author name={row.user_name} href={`https://instagram.com/${row.user_name}`} />
              </TableCell>
              <TableCell>
                <Stack spacing={0.5} sx={{ color: "text.secondary", fontSize: 12.5 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <HeartIcon size={14} />
                    <Box component="span" color="text.primary" fontWeight={600}>
                      {compactNumber(row.like_count)}
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <CommentIcon size={14} />
                    <Box component="span" color="text.primary" fontWeight={600}>
                      {compactNumber(row.comment_count)}
                    </Box>
                  </Stack>
                </Stack>
              </TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>
                <Typography fontSize={13}>{timeAgo(row.timestamp)}</Typography>
                <Typography fontSize={11.5} color="text.secondary">
                  {new Date(row.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Open on Instagram">
                  <IconButton
                    size="small"
                    component="a"
                    href={`https://instagram.com/p/${row.code}`}
                    target="_blank"
                    rel="noreferrer"
                    sx={{ color: COLORS.muted, border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}
                  >
                    <ExternalIcon size={16} />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    {footer}
  </Paper>
);

export default PostsTable;
