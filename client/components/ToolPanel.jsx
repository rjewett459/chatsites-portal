import React, { useEffect, useState } from "react";

export default function ToolPanel({ isSessionActive, sendClientEvent }) {
  const [isToolRegistered, setIsToolRegistered] = useState(false);

  useEffect(() => {
    if (!isSessionActive || isToolRegistered) return;

    console.log("✅ Registering tools...");

    const sessionUpdate = {
      type: "session.update",
      session: {
        tools: [
          {
            type: "function",
            name: "provide_chat_sites_info",
            description: "Fetches information about ChatSites from a structured knowledge base.",
            parameters: {
              type: "object",
              properties: {
                topic: {
                  type: "string",
                  description: "The topic the user is asking about (e.g., services, pricing, support).",
                },
              },
              required: ["topic"],
            },
          },
          {
            type: "function",
            name: "display_color_palette",
            description: "Provides a color palette based on a requested theme.",
            parameters: {
              type: "object",
              properties: {
                theme: {
                  type: "string",
                  description: "A descriptive theme (e.g., ocean, sunset, forest)",
                },
                colors: {
                  type: "array",
                  description: "A list of 5 hex color codes representing the theme",
                  items: { type: "string" },
                },
              },
              required: ["theme", "colors"],
            },
          },
        ],
        tool_choice: "auto",
      },
    };

    console.log("📤 Sending session update:", sessionUpdate);
    sendClientEvent(sessionUpdate);
    setIsToolRegistered(true);
  }, [isSessionActive, isToolRegistered, sendClientEvent]);

  return (
    <div className="p-4 border rounded-md bg-gray-100">
      <h2 className="text-lg font-bold">Tool Panel</h2>
      <p className="text-sm text-gray-600">Tools are registered when a session starts.</p>
    </div>
  );
}
