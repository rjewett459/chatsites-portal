import React, { useEffect, useState, useRef } from "react"; // ✅ Add useRef
import knowledgeBase from "../data/knowledgeBase.json"; // Ensure knowledge base is imported

export default function WebsiteAttendant({ events = [], sendClientEvent, dataChannel, isSessionActive }) {
  const [functionCallOutput, setFunctionCallOutput] = useState(null);
  const [cache, setCache] = useState({});
  const hasSentSessionUpdate = useRef(false); // ✅ Prevents duplicate AI tool registration

  // ✅ Register the tool with AI session update
  const sessionUpdate = {
    type: "session.update",
    session: {
      tools: [
        {
          type: "function",
          name: "provide_chat_sites_info",
          description: `
          DO NOT generate a response from model knowledge.
          ALWAYS call this function when a user asks about ChatSites.
          ONLY return data from the knowledge base.
          If no relevant data is found, respond with: "I couldn't find that information."
          `,
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
      ],
      tool_choice: { type: "function", name: "provide_chat_sites_info" },  // 🔥 Forces knowledge base first
    },
  };
  
  useEffect(() => {
    if (!events || events.length === 0) return;
  
    const mostRecentEvent = events[0];
    console.log("Full AI Event Data:", mostRecentEvent);
  
    mostRecentEvent.response?.output?.forEach((output) => {
      if (output.type === "function_call" && output.name === "provide_chat_sites_info") {
        console.log("✅ AI called provide_chat_sites_info!");
  
        const topic = JSON.parse(output.arguments).topic.toLowerCase().trim();
        const answer = knowledgeBase[topic] 
          ? knowledgeBase[topic] 
          : "I'm sorry, I couldn't find information on that topic.";
  
        console.log("🔍 Using knowledge base:", answer);
        setFunctionCallOutput({ arguments: JSON.stringify({ topic, response: answer }) });
  
        sendClientEvent({
          type: "response.create",
          response: {
            instructions: `
            This response comes from the ChatSites knowledge base. 
            Do not override it with model knowledge. If the user needs more info, suggest checking support.
            `,
          },
        });
      }
    });
  }, [events]);
  
  
  

  useEffect(() => {
    if (!isSessionActive || !dataChannel || hasSentSessionUpdate.current) return;
  
    if (dataChannel.readyState === "open") {
      console.log("🔄 Sending session update from WebsiteAttendant...");
      sendClientEvent(sessionUpdate);
      hasSentSessionUpdate.current = true;
    } else {
      console.warn("⚠️ Data channel not open yet. Will retry when ready.");
    }
  }, [isSessionActive, dataChannel, sendClientEvent]);
  

  useEffect(() => {
    if (!isSessionActive || !dataChannel || hasSentSessionUpdate.current) return;
  
    if (dataChannel.readyState === "open") {
      console.log("✅ Data channel is open, sending session update.");
      sendClientEvent(sessionUpdate);
      hasSentSessionUpdate.current = true;
    } else {
      console.warn("⚠️ Data channel not open yet. Will retry...");
      setTimeout(() => {
        if (dataChannel.readyState === "open") {
          sendClientEvent(sessionUpdate);
          hasSentSessionUpdate.current = true;
        }
      }, 2000); // Retry after 2 seconds
    }
  }, [isSessionActive, dataChannel, sendClientEvent]);
  
  
  console.log("🔄 useEffect Triggered - isSessionActive:", isSessionActive);
  console.log("🔄 useEffect Triggered - hasSentSessionUpdate:", hasSentSessionUpdate.current);
  console.log("🔄 useEffect Triggered - dataChannel:", dataChannel);


  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">Website Attendant</h2>
        {isSessionActive ? (
          functionCallOutput ? (
            <p className="text-sm">Response: {JSON.parse(functionCallOutput.arguments).response}</p>
          ) : (
            <p className="text-sm">Waiting for a query...</p>
          )
        ) : (
          <p className="text-sm text-gray-500">Start the session to use this tool.</p>
        )}
      </div>
    </section>
  );
}
