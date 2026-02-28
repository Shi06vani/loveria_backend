const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "datingappbackend_postman_collection.json");

try {
  const data = fs.readFileSync(filePath, "utf-8");
  const collection = JSON.parse(data);

  const authFolder = collection.item.find(i => i.name === "Auth");

  if (authFolder) {
    const forgotPasswordRequest = {
      name: "Forgot Password",
      request: {
        method: "POST",
        header: [],
        body: {
          mode: "raw",
          raw: "{\n    \"email\": \"test@example.com\"\n}",
          options: { raw: { language: "json" } }
        },
        url: {
          raw: "{{baseUrl}}/api/auth/forgotpassword",
          host: ["{{baseUrl}}"],
          path: ["api", "auth", "forgotpassword"]
        }
      },
      response: []
    };

    const resetPasswordRequest = {
      name: "Reset Password",
      request: {
        method: "PUT",
        header: [],
        body: {
          mode: "raw",
          raw: "{\n    \"email\": \"test@example.com\",\n    \"otp\": \"123456\",\n    \"password\": \"newpassword123\"\n}",
          options: { raw: { language: "json" } }
        },
        url: {
          raw: "{{baseUrl}}/api/auth/resetpassword",
          host: ["{{baseUrl}}"],
          path: ["api", "auth", "resetpassword"]
        }
      },
      response: []
    };

    const googleLoginRequest = {
      name: "Google Login",
      request: {
        method: "POST",
        header: [],
        body: {
          mode: "raw",
          raw: "{\n    \"token\": \"YOUR_GOOGLE_ID_TOKEN\"\n}",
          options: { raw: { language: "json" } }
        },
        url: {
          raw: "{{baseUrl}}/api/auth/google",
          host: ["{{baseUrl}}"],
          path: ["api", "auth", "google"]
        }
      },
      response: []
    };

    // Prevent duplicates
    const names = authFolder.item.map(i => i.name);
    if (!names.includes("Forgot Password")) authFolder.item.push(forgotPasswordRequest);
    if (!names.includes("Reset Password")) authFolder.item.push(resetPasswordRequest);
    if (!names.includes("Google Login")) authFolder.item.push(googleLoginRequest);

    fs.writeFileSync(filePath, JSON.stringify(collection, null, 4));
    console.log("Successfully updated collection!");
  } else {
    console.log("Could not find Auth folder in collection.");
  }
} catch (error) {
  console.error("Error updating collection:", error);
}
