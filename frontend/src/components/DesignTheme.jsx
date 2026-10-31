/* eslint-disable react/prop-types */
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Notifications from "./Notifications";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useAppearance } from "../hooks/useAppearance";

export default function DesignTheme({ children }) {
  const { theme } = useAppearance();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const role = user?.role;
  const admin =
    pathname === "/admin-signin" ||
    pathname === "/admin-signup" ||
    (pathname !== "/" && pathname !== "/user-signin" && role === "Admin");
  const muiTheme = useMemo(() => {
    const dark = theme === "dark";
    const primary = admin
      ? dark
        ? "#a5b4fc"
        : "#4f46e5"
      : dark
        ? "#77cfad"
        : "#16734f";
    const paper = dark ? "#1a1e1c" : "#ffffff";
    const border = dark ? "#424946" : "#d8d9d5";
    const control = {
      borderRadius: 8,
      backgroundColor: paper,
      fontSize: 14,
      fontWeight: 500,
      minHeight: 46,
    };
    return createTheme({
      palette: {
        mode: theme,
        primary: { main: primary },
        background: { default: dark ? "#131615" : "#f9f8f5", paper },
        text: {
          primary: dark ? "#efeeea" : "#1d2521",
          secondary: dark ? "#a0aaa4" : "#67716a",
        },
        divider: dark ? "#343b37" : "#e3e3de",
      },
      typography: {
        fontFamily: 'Inter, "Segoe UI", sans-serif',
        fontSize: 14,
        htmlFontSize: 17,
        fontWeightRegular: 500,
        fontWeightMedium: 600,
        fontWeightBold: 700,
      },
      shape: { borderRadius: 8 },
      components: {
        MuiOutlinedInput: {
          styleOverrides: {
            root: control,
            notchedOutline: { borderColor: border },
          },
        },
        MuiPickersOutlinedInput: {
          styleOverrides: {
            root: control,
            notchedOutline: { borderColor: border },
          },
        },
        MuiInputLabel: {
          styleOverrides: { root: { fontSize: 14, fontWeight: 600 } },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              fontSize: 14,
              fontWeight: 500,
              minHeight: 38,
              borderRadius: 5,
              margin: "2px 6px",
            },
          },
        },
        MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
        MuiPopover: {
          defaultProps: {
            slotProps: {
              paper: {
                elevation: 4,
                sx: { border: "1px solid", borderColor: "divider", mt: 0.5 },
              },
            },
          },
        },
      },
    });
  }, [theme, admin]);
  return (
    <MuiThemeProvider theme={muiTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className={admin ? "workspace-admin" : "workspace-member"}>
          <Notifications>{children}</Notifications>
        </div>
      </LocalizationProvider>
    </MuiThemeProvider>
  );
}
