import axios from "axios";

const BASE_URL = "http://127.0.0.1:8787/api/v1";

async function runTests() {
  try {
    console.log("Starting tests...");

    // 1. Sign up new user
    console.log("\n--- Testing Signup ---");
    const signupRes = await axios.post(`${BASE_URL}/admin/usersignup`, {
      name: `TestUser_${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: "password123",
    });
    console.log("Signup success:", signupRes.data);
    const token = signupRes.data.token;
    const orgId = signupRes.data.defaultOrgId;

    if (!token || !orgId) throw new Error("Missing token or orgId from signup");

    const authHeaders = {
      Authorization: token,
      "x-organization-id": orgId.toString(),
    };

    // 2. Fetch Organizations
    console.log("\n--- Testing Fetch Organizations ---");
    const orgsRes = await axios.get(`${BASE_URL}/user/organizations`, {
      headers: { Authorization: token },
    });
    console.log("Organizations list:", orgsRes.data);

    // 3. Create a Task
    console.log("\n--- Testing Create Task ---");
    const taskRes = await axios.post(
      `${BASE_URL}/admin/task`,
      {
        id: signupRes.data.id, // Assign to self
        description: "Test SaaS Task",
        dueDate: "2026-12-31",
        status: "Not Started",
      },
      { headers: authHeaders }
    );
    console.log("Create Task success:", taskRes.data);

    // 4. Fetch Tasks
    console.log("\n--- Testing Fetch Tasks ---");
    const getTasksRes = await axios.get(`${BASE_URL}/user/bulk`, {
      headers: authHeaders,
    });
    console.log("Fetch tasks success:", JSON.stringify(getTasksRes.data, null, 2));

    console.log("\nALL TESTS PASSED ✅");
  } catch (error) {
    console.error("Test Failed:", error.response ? error.response.data : error.message);
  }
}

runTests();
