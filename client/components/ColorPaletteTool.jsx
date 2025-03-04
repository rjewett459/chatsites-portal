import { useEffect, useState } from "react";

const functionDescription = `
Call this function when a user asks for a color palette.`;

const sessionUpdate = {
  type: "session.update",
  session: {
    tools: [
      {
        type: "function",
        name: "display_color_palette",
        description: functionDescription,
        parameters: {
          type: "object",
          strict: true,
          properties: {
            theme: {
              type: "string",
              description: "Description of the theme for the color scheme.",
            },
            colors: {
              type: "array",
              description: "Array of five hex color codes based on the theme.",
              items: {
                type: "string",
                description: "Hex color code",
              },
            },
          },
          required: ["theme", "colors"],
        },
      },
    ],
    tool_choice: "auto",
  },
};

function FunctionCallOutput({ functionCallOutput }) {
  try {
    const { theme, colors } = JSON.parse(functionCallOutput.arguments);

    return (
      <div className="flex flex-col gap-2">
        <p className="font-bold">Theme: {theme}</p>
        <div className="grid grid-cols-5 gap-2">
          {colors.map((color) => (
            <div
              key={color}
              className="w-full h-16 rounded-md flex items-center justify-center border border-gray-200"
              style={{ backgroundColor: color }}
            >
              <p className="text-sm font-bold text-black bg-white px-2 py-1 rounded-md">
                {color}
              </p>
            </div>
          ))}
        </div>
        <pre className="text-xs bg-gray-100 rounded-md p-2 overflow-x-auto">
          {JSON.stringify(functionCallOutput, null, 2)}
        </pre>
      </div>
    );
  } catch (error) {
    console.error("🚨 Error parsing function output:", error);
    return <p className="text-red-600">Error displaying color palette.</p>;
  }
}

export default function ColorPaletteTool({
  isSessionActive,
  sendClientEvent,
  events,
  dataChannel,
}) {
  const [functionAdded, setFunctionAdded] = useState(false);
  const [functionCallOutput, setFunctionCallOutput] = useState(null);

  useEffect(() => {
    if (!isSessionActive || !sendClientEvent || !dataChannel || functionAdded) return;

    console.log("✅ Registering color palette tool...");
    sendClientEvent(sessionUpdate);
    setFunctionAdded(true);
  }, [isSessionActive, sendClientEvent, dataChannel, functionAdded]);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const mostRecentEvent = events[0];
    console.log("📩 AI Event Data:", mostRecentEvent);

    mostRecentEvent.response?.output?.forEach((output) => {
      if (
        output.type === "function_call" &&
        output.name === "display_color_palette"
      ) {
        console.log("🎨 AI called display_color_palette!");
        setFunctionCallOutput(output);

        setTimeout(() => {
          sendClientEvent({
            type: "response.create",
            response: {
              instructions: "Ask the user if they like the color palette.",
            },
          });
        }, 500);
      }
    });
  }, [events, sendClientEvent]);

  useEffect(() => {
    if (!isSessionActive) {
      setFunctionAdded(false);
      setFunctionCallOutput(null);
    }
  }, [isSessionActive]);

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">Color Palette Tool</h2>
        {isSessionActive ? (
          functionCallOutput ? (
            <FunctionCallOutput functionCallOutput={functionCallOutput} />
          ) : (
            <p>Ask for a color palette...</p>
          )
        ) : (
          <p>Start the session to use this tool...</p>
        )}
      </div>
    </section>
  );
}
