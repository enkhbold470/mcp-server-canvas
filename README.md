# Canvas MCP Server

A Model Context Protocol (MCP) server implementation for the Canvas LMS API. This server provides functionality to interact with Canvas LMS programmatically.

## Features

- List courses from Canvas LMS with optional enrollment type filtering
- Interactive help prompts for using the tools

## Prerequisites

- Node.js 18 or later
- A Canvas LMS instance
- Canvas API access token
- Cursor (for client integration)

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   export CANVAS_BASE_URL="https://your-canvas-instance.com"
   export CANVAS_ACCESS_TOKEN="your-api-token"
   ```
4. Build the project:
   ```bash
   npm run build
   ```
5. Start the server:
   ```bash
   npm start
   ```

## Connecting with Cursor

To use this MCP server with Cursor:

1. Open Cursor's settings
2. Navigate to the MCP configuration section
3. Add a new server configuration:
   ```json
   {
     "mcpServers": {
       "canvas": {
         "command": "npm",
         "args": [
           "start"
         ],
         "cwd": "/path/to/mcp-server-canvas"
       }
     }
   }
   ```
4. Save the configuration and restart Cursor
5. The Canvas tools will now be available in Cursor's MCP tools panel

## Available Tools

### list_courses

Lists all courses from Canvas LMS.

Parameters:
- `enrollment_type` (optional): Filter courses by enrollment type (teacher, student, ta)

Example response:
```json
{
  "content": [
    {
      "type": "text",
      "text": [
        {
          "id": 1234,
          "name": "Example Course",
          "code": "EX101",
          "state": "available",
          "startDate": "2024-01-01T00:00:00Z",
          "endDate": "2024-12-31T23:59:59Z"
        }
      ]
    }
  ]
}
```

### list-courses-help

An interactive prompt that provides help with using the list_courses tool.

## Development

The server is built using TypeScript and the MCP SDK. To add new features:

1. Add new API methods to the `CanvasAPI` class
2. Register new tools using `server.tool()`
3. Register help prompts using `server.prompt()`
4. Build and test your changes

## Troubleshooting

If you encounter issues:

1. Check that environment variables are set correctly
2. Verify your Canvas API token has the necessary permissions
3. Check Cursor's MCP server logs for any error messages
4. Ensure the server path in Cursor's configuration is correct

## License

MIT