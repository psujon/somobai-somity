const apiHost = process.env.API_HOST || "http://localhost:5000";
fetch(`${apiHost}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@coop.com", password: "admin123" })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
