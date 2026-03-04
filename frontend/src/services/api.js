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
