import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// load dotenv
import * as dotenv from 'dotenv'
dotenv.config()

interface CanvasConfig {
  baseUrl: string;
  accessToken: string;
}

interface Course {
  id: number;
  name: string;
  course_code: string;
  workflow_state: string;
  needs_grading_count?: number;
  enrollment_state?: string;
}

class CanvasAPI {
  private baseUrl: string;
  private accessToken: string;

  constructor(config: CanvasConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.accessToken = config.accessToken;
  }

  async getUserCourses(userId: string, params: { 
    include?: string[],
    enrollment_state?: string 
  } = {}): Promise<Course[]> {
    const url = new URL(`${this.baseUrl}/api/v1/users/${userId}/courses`);
    
    if (params.include) {
      params.include.forEach(item => {
        url.searchParams.append('include[]', item);
      });
    }
    
    if (params.enrollment_state) {
      url.searchParams.append('enrollment_state', params.enrollment_state);
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user courses: ${response.statusText}`);
    }

    return response.json();
  }
}

async function main() {
  const baseUrl = process.env.CANVAS_BASE_URL;
  const accessToken = process.env.CANVAS_ACCESS_TOKEN;

  if (!baseUrl || !accessToken) {
    throw new Error('CANVAS_BASE_URL and CANVAS_ACCESS_TOKEN environment variables are required');
  }

  // Initialize Canvas API client
  const canvasApi = new CanvasAPI({
    baseUrl,
    accessToken
  });

  // Create server instance
  const server = new McpServer(
    { 
      name: "canvas-mcp-server", 
      version: "1.0.0",
      description: "MCP server for Canvas LMS API integration"
    },
    { 
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      }
    }
  );

  // Register get_user_courses tool
  server.tool(
    "get_user_courses",
    "Get courses for a specific user with optional grading count",
    {
      user_id: z.string().describe("Canvas user ID"),
      include_grading_count: z.boolean().optional().default(false).describe("Include needs grading count"),
      enrollment_state: z.string().optional().default("active").describe("Filter by enrollment state (active, invited, etc)")
    },
    async (args) => {
      try {
        const includes = args.include_grading_count ? ['needs_grading_count'] : [];
        const courses = await canvasApi.getUserCourses(args.user_id, {
          include: includes,
          enrollment_state: args.enrollment_state
        });

        const formattedCourses = courses.map(course => ({
          id: course.id,
          name: course.name,
          code: course.course_code,
          state: course.workflow_state,
          needsGradingCount: course.needs_grading_count,
          enrollmentState: course.enrollment_state
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formattedCourses, null, 2)
            }
          ]
        };
      } catch (error) {
        if (error instanceof Error) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to get user courses: ${error.message}`
              }
            ],
            isError: true
          };
        }
        throw error;
      }
    }
  );

  // Add help prompt for the new tool
  server.prompt(
    "get-user-courses-help",
    "Get help with retrieving user courses",
    {},
    async () => ({
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: "I can help you get courses for a specific Canvas user. The get_user_courses tool accepts these parameters:\n\n" +
                  "- user_id: (required) The Canvas user ID\n" +
                  "- include_grading_count: (optional) Set to true to include needs grading count\n" +
                  "- enrollment_state: (optional) Filter by enrollment state (defaults to 'active')"
          }
        },
        {
          role: "user",
          content: {
            type: "text",
            text: "How do I get courses with grading count?"
          }
        },
        {
          role: "assistant",
          content: {
            type: "text",
            text: "Call get_user_courses with:\n" +
                  "- user_id: Your Canvas user ID\n" +
                  "- include_grading_count: true\n\n" +
                  "Example: get_user_courses with {\"user_id\": \"123\", \"include_grading_count\": true}"
          }
        }
      ],
      description: "Help with using the get_user_courses tool"
    })
  );

  // Connect to transport and start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('Canvas MCP server started');
}

main().catch(error => {
  console.error('Server error:', error);
  process.exit(1);
});


