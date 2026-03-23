import { API_BASE_URL } from "../utils/constants";

const request = async (path, options = {}) => {
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
};

export const login = async (payload) => {
	return request("/auth/login", {
		method: "POST",
		body: JSON.stringify(payload),
	});
};

export const registerStudent = async (payload) => {
	const normalizedPayload = {
		name: payload?.name,
		email: payload?.email,
		password: payload?.password,
		role: "student",
		contactNumber: payload?.contactNumber || payload?.contact_number,
		studentId: payload?.studentId || payload?.student_id,
		department: payload?.department,
		semester: payload?.semester,
		section: payload?.section,
	};

	return request("/auth/signup-request", {
		method: "POST",
		body: JSON.stringify(normalizedPayload),
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
