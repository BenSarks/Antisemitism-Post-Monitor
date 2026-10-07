import React, { useEffect, useMemo, useState } from "react";
import { Alert, InputAdornment, TablePagination, TextField } from "@mui/material";
import PostsTable from "../../components/PostsTable";
import { PageHeader } from "../../components/Layout";
import { SearchIcon } from "../../components/Icons";
import { fetchJson } from "../../api";
import { formatNumber } from "../../utils";

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchJson("/posts")
      .then(setPosts)
      .catch((e) => setError(`Could not reach the API server (${e.message}).`));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(
      (p) =>
        !q || [p.title_text, p.ocr_text, p.user_name].some((f) => f && f.toLowerCase().includes(q))
    );
  }, [posts, query]);

  const visible = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <PageHeader
        title="Flagged posts"
        subtitle={`${formatNumber(posts.length)} most recent posts flagged for review`}
        actions={
          <TextField
            size="small"
            placeholder="Search text, OCR or author…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: "100%", sm: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ color: "text.secondary" }}>
                  <SearchIcon size={16} />
                </InputAdornment>
              ),
            }}
          />
        }
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {error}
        </Alert>
      )}
      <PostsTable
        posts={visible}
        footer={
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
          />
        }
      />
    </>
  );
};

export default Posts;
