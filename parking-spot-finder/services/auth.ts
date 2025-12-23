const BASE_URL = "http://YOUR_LOCAL_IP:8000"; 
// Example: http://192.168.1.5:8000

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return res.json();
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  role: "driver" | "admin"
) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role }),
  });

  return res.json();
}
