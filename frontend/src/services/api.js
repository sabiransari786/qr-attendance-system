import { API_BASE_URL } from "../utils/constants";

const useMockApi = import.meta.env.VITE_USE_MOCK_API === "true";

// In-memory mock user database (more reliable than localStorage)
const MOCK_USERS = [
	{
		id: 1,
		name: "Admin User",
		email: "admin@attendance.com",
		rollNumber: null,
		password: "admin123",
		role: "admin",
	},
	{
		id: 2,
		name: "Faculty User",
		email: "faculty@attendance.com",
		rollNumber: null,
		password: "faculty123",
		role: "faculty",
	},
	{
		id: 3,
		name: "Student User",
		email: "student@attendance.com",
		rollNumber: "STU001",
		password: "student123",
		role: "student",
	},
];

// Also try to load from localStorage as backup
const loadMockUsersFromStorage = () => {
	try {
		const stored = localStorage.getItem("mock_users");
		if (stored) {
			const parsed = JSON.parse(stored);
			// Only use if it has users
			if (Array.isArray(parsed) && parsed.length > 0) {
				return parsed;
			}
		}
	} catch (e) {
	}
	return MOCK_USERS;
};

// Get all mock users (including any custom registered ones from localStorage)
const getMockUsers = () => {
	try {
		const stored = localStorage.getItem("mock_users");
		
		if (stored) {
			const parsed = JSON.parse(stored);
			return parsed;
		}
	} catch (e) {
		console.error("Error parsing localStorage users:", e);
	}
	
	return MOCK_USERS;
};

const saveMockUsers = (users) => {
	localStorage.setItem("mock_users", JSON.stringify(users));
};

const request = async (path, options = {}) => {
	try {
		const fullUrl = `${API_BASE_URL}${path}`;
		const response = await fetch(fullUrl, {
			headers: {
				"Content-Type": "application/json",
				...(options.headers || {}),
			},
			...options,
		});

		let data = null;
		try {
			data = await response.json();
		} catch (error) {
			data = null;
		}


		if (!response.ok) {
			const message = data?.message || "Request failed. Please try again.";
			const error = new Error(message);
			error.status = response.status;
			error.data = data;
			throw error;
		}

		return data;
	} catch (error) {
		if (!useMockApi) {
			throw error;
		}

		// Backend not available - use mock API
		try {
			const mockResponse = await handleMockRequest(path, options);
			return mockResponse;
		} catch (mockError) {
			console.error("Mock API also failed:", mockError);
			throw mockError;
		}
	}
};

// Mock API handler
const handleMockRequest = async (path, options) => {
	
	// Simulate network delay
	await new Promise((resolve) => setTimeout(resolve, 500));

	if (path === "/auth/login" && options.method === "POST") {
		const body = JSON.parse(options.body);
		
		const users = getMockUsers();
		
		// Trim and normalize inputs
		const email = (body.email || "").trim().toLowerCase();
		const password = (body.password || "").trim();
		
		// Find user by email
		let foundUser = null;
		for (let i = 0; i < users.length; i++) {
			const u = users[i];
			const userEmail = (u.email || "").trim().toLowerCase();
			if (userEmail === email) {
				foundUser = u;
				break;
			}
		}
		
		
		if (!foundUser) {
			throw new Error("Invalid email or password");
		}
		
		// Check password
		if (foundUser.password !== password) {
			throw new Error("Invalid email or password");
		}

		const token = "mock_token_" + Date.now();
		localStorage.setItem("auth_token", token);

		return {
			success: true,
			token,
			user: {
				id: foundUser.id,
				name: foundUser.name,
				email: foundUser.email,
				role: foundUser.role,
			},
		};
	}

	if (path === "/auth/register" && options.method === "POST") {
		const body = JSON.parse(options.body);
		const users = getMockUsers();

		// Check for duplicates
		if (users.find((u) => u.email === body.email)) {
			throw new Error("Email already registered");
		}
		if (users.find((u) => u.rollNumber === body.rollNumber)) {
			throw new Error("Roll number already registered");
		}

		const newUser = {
			id: users.length + 1,
			name: body.name,
			email: body.email,
			rollNumber: body.rollNumber,
			password: body.password, // In real app, this would be hashed
			role: "student", // Only students can self-register
		};

		users.push(newUser);
		saveMockUsers(users);

		return {
			success: true,
			message: "Registration successful! Please login.",
		};
	}

	if (path === "/auth/logout" && options.method === "POST") {
		localStorage.removeItem("auth_token");
		return { success: true, message: "Logged out successfully" };
	}

	throw new Error("Endpoint not found");
};

export const login = async (payload) => {
	return request("/auth/login", {
		method: "POST",
		body: JSON.stringify(payload),
	});
};

export const registerStudent = async (payload) => {
	return request("/auth/register", {
		method: "POST",
		body: JSON.stringify({
			...payload,
			role: "student",
		}),
	});
};

export const logout = async (token) => {
	return request("/auth/logout", {
		method: "POST",
		headers: token
			? {
					Authorization: `Bearer ${token}`,
				}
			: {},
	});
};
