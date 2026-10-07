import { CssBaseline, ThemeProvider } from "@mui/material";
import { Route, Routes } from "react-router-dom";
import Dashboard from "./scenes/dashboard";
import Posts from "./scenes/posts";
import Layout from "./components/Layout";
import theme from "./theme";
import { PrivacyProvider } from "./components/Privacy";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PrivacyProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/posts" element={<Posts />} />
          </Routes>
        </Layout>
      </PrivacyProvider>
    </ThemeProvider>
  );
}

export default App;
