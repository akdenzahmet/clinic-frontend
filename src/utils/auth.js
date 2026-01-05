import { jwtDecode } from "jwt-decode";

export function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const data = jwtDecode(token);
    return {
      username: data.sub,
      role: data.role
    };
  } catch {
    return null;
  }
}
