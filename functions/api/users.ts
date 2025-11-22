// Example Cloudflare Pages function for user API
// File: functions/api/users.ts

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  MY_KV_NAMESPACE: unknown;
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
  // MY_SERVICE: Fetcher;
  // Example variable binding. Learn more at https://developers.cloudflare.com/workers/runtime-apis/environment-variables/
  // MY_VARIABLE: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

// In-memory user store for example purposes
// In a real application, you would use a database like D1, KV, or Firestore
const users: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    createdAt: new Date().toISOString(),
  },
];

export async function onRequest(context: {
  request: Request;
  env: Env;
  params: unknown;
  waitUntil: (promise: Promise<unknown>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  data: Record<string, unknown>;
}) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Extract user ID from URL if present in path like /api/users/:id
  const pathParts = path.split("/");
  const userId = pathParts[pathParts.length - 1];

  // Handle different HTTP methods
  switch (method) {
    case "GET":
      if (userId && userId !== "users") {
        // Get single user
        const user = users.find(u => u.id === userId);
        if (user) {
          return new Response(JSON.stringify(user), {
            headers: { "Content-Type": "application/json" },
          });
        } else {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
      } else {
        // Get all users
        return new Response(JSON.stringify(users), {
          headers: { "Content-Type": "application/json" },
        });
      }

    case "POST":
      try {
        const userData = await request.json();
        const newUser: User = {
          id: Math.random().toString(36).substring(2, 9),
          name: userData.name,
          email: userData.email,
          createdAt: new Date().toISOString(),
        };
        users.push(newUser);
        return new Response(JSON.stringify(newUser), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Invalid JSON in request body" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

    case "PUT":
      if (userId && userId !== "users") {
        try {
          const index = users.findIndex(u => u.id === userId);
          if (index !== -1) {
            const updatedData = await request.json();
            users[index] = { ...users[index], ...updatedData };
            return new Response(JSON.stringify(users[index]), {
              headers: { "Content-Type": "application/json" },
            });
          } else {
            return new Response(JSON.stringify({ error: "User not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "Invalid JSON in request body" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: "User ID required for update" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

    case "DELETE":
      if (userId && userId !== "users") {
        const initialLength = users.length;
        const filteredUsers = users.filter(u => u.id !== userId);
        if (filteredUsers.length < initialLength) {
          // Update the users array
          users.length = 0;
          filteredUsers.forEach(u => users.push(u));

          return new Response(
            JSON.stringify({ message: "User deleted successfully" }),
            {
              headers: { "Content-Type": "application/json" },
            }
          );
        } else {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
      } else {
        return new Response(
          JSON.stringify({ error: "User ID required for deletion" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

    default:
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
  }
}
