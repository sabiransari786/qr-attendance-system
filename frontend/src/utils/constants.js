export const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const ROLE_ROUTES = {
	student: "/student-dashboard",
	faculty: "/faculty-dashboard",
	admin: "/admin-dashboard",
};
