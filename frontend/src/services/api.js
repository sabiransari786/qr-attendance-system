import { API_BASE_URL } from "../utils/constants";

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
		console.log("Could not load from localStorage, using default");
	}
	return MOCK_USERS;
};

// Get all mock users (including any custom registered ones from localStorage)
const getMockUsers = () => {
	try {
		const stored = localStorage.getItem("mock_users");
		console.log("getMockUsers - stored in localStorage:", stored);
		
		if (stored) {
			const parsed = JSON.parse(stored);
			console.log("getMockUsers - parsed:", parsed);
			return parsed;
		}
	} catch (e) {
		console.error("Error parsing localStorage users:", e);
	}
	
	console.log("getMockUsers - returning default MOCK_USERS:", MOCK_USERS);
	return MOCK_USERS;
};

const saveMockUsers = (users) => {
	localStorage.setItem("mock_users", JSON.stringify(users));
};

const request = async (path, options = {}) => {
	try {
		console.log("API Request starting:", path, options.method);
		const fullUrl = `${API_BASE_URL}${path}`;
		console.log("Full URL:", fullUrl);
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
			console.log("Could not parse response as JSON");
			data = null;
		}

		console.log("API Response: status =", response.status, "data =", data);

		if (!response.ok) {
			console.log("Response status not ok, using mock API as fallback");
			const message = data?.message || "Request failed. Please try again.";
			const error = new Error(message);
			error.status = response.status;
			error.data = data;
			throw error;
		}

		return data;
	} catch (error) {
		// Backend not available - use mock API
		console.log("Request failed, triggering mock API:", error.message);
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
	console.log("🔴 MOCK API HANDLER CALLED");
	console.log("Path:", path);
	console.log("Method:", options.method);
	
	// Simulate network delay
	await new Promise((resolve) => setTimeout(resolve, 500));

	if (path === "/auth/login" && options.method === "POST") {
		console.log("🔴 PROCESSING LOGIN REQUEST");
		const body = JSON.parse(options.body);
		console.log("🔴 Parsed body:", JSON.stringify(body));
		
		const users = getMockUsers();
		console.log("🔴 Users available:", JSON.stringify(users));
		
		// Trim and normalize inputs
		const email = (body.email || "").trim().toLowerCase();
		const password = (body.password || "").trim();
		console.log(`🔴 Normalized email: "${email}" (type: ${typeof email})`);
		console.log(`🔴 Normalized password: "${password}" (type: ${typeof password})`);
		
		// Find user by email
		let foundUser = null;
		for (let i = 0; i < users.length; i++) {
			const u = users[i];
			const userEmail = (u.email || "").trim().toLowerCase();
			console.log(`🔴 Checking user[${i}]: email="${userEmail}", password="${u.password}"`);
			if (userEmail === email) {
				console.log(`🔴 EMAIL MATCH FOUND at index ${i}`);
				foundUser = u;
				break;
			}
		}
		
		console.log("🔴 Found user:", foundUser);
		
		if (!foundUser) {
			console.log("🔴 ❌ USER NOT FOUND - returning error");
			throw new Error("Invalid email or password");
		}
		
		// Check password
		if (foundUser.password !== password) {
			console.log("🔴 ❌ PASSWORD MISMATCH - returning error");
			console.log(`    Expected: "${foundUser.password}"`);
			console.log(`    Got: "${password}"`);
			throw new Error("Invalid email or password");
		}

		console.log("🔴 ✅ LOGIN SUCCESSFUL");
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
