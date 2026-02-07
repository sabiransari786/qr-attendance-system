import { API_BASE_URL } from "../utils/constants";

// Initialize default users (Admin & Faculty)
const initializeDefaultUsers = () => {
	const defaultUsers = [
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
	];

	// Always overwrite to ensure defaults are available
	localStorage.setItem("mock_users", JSON.stringify(defaultUsers));
};

// Initialize on module load
initializeDefaultUsers();

// Mock user database in localStorage
const getMockUsers = () => {
	const stored = localStorage.getItem("mock_users");
	let users = [];
	
	if (stored) {
		try {
			users = JSON.parse(stored);
		} catch (e) {
			users = [];
		}
	}
	
	// Ensure default users (admin and faculty) are always present
	const defaultUserEmails = ["admin@attendance.com", "faculty@attendance.com"];
	const defaultUsers = [
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
	];
	
	// Add default users if they don't exist
	for (const defaultUser of defaultUsers) {
		if (!users.find(u => u.email === defaultUser.email)) {
			users.push(defaultUser);
		}
	}
	
	return users;
};

const saveMockUsers = (users) => {
	localStorage.setItem("mock_users", JSON.stringify(users));
};

const request = async (path, options = {}) => {
	try {
		console.log("API Request:", path, options.method);
		const response = await fetch(`${API_BASE_URL}${path}`, {
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

		console.log("API Response:", path, response.status, data);

		if (!response.ok) {
			console.log("Response not ok, throwing error");
			const message = data?.message || "Request failed. Please try again.";
			const error = new Error(message);
			error.status = response.status;
			error.data = data;
			throw error;
		}

		return data;
	} catch (error) {
		// Backend not available - use mock API
		console.log("Backend error caught, using mock API:", error.message);
		try {
			const mockResponse = await handleMockRequest(path, options);
			console.log("Mock API response:", mockResponse);
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
		console.log("Mock API - Users in storage:", users);
		console.log("Mock API - Login attempt:", body);
		const user = users.find((u) => u.email === body.email);
		console.log("Mock API - Found user:", user);

		if (!user || user.password !== body.password) {
			console.log("Mock API - Invalid credentials");
			throw new Error("Invalid email or password");
		}

		const token = "mock_token_" + Date.now();
		localStorage.setItem("auth_token", token);
		console.log("Mock API - Login successful, token:", token);

		return {
			success: true,
			token,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
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
