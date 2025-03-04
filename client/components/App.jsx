import React, { useEffect, useRef, useState } from "react";  
import logo from "/assets/chatsites_favicon.svg";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import ToolPanel from "./ToolPanel";
import ColorPaletteTool from "./ColorPaletteTool";
import WebsiteAttendant from "./WebsiteAttendant";

const tools = {
  color_palette: { name: "Color Palette Tool", component: ColorPaletteTool },
  website_attendant: { name: "Website Attendant", component: WebsiteAttendant },
};

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const [selectedTool, setSelectedTool] = useState("color_palette");

  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const [panelWidth, setPanelWidth] = useState(380);
  const isResizingRef = useRef(false);

  // ✅ Resize Handlers
  const handleMouseMove = (event) => {
    if (!isResizingRef.current) return;
    const newWidth = window.innerWidth - event.clientX;
    if (newWidth > 200 && newWidth < window.innerWidth - 300) {
      setPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isResizingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseDown = () => {
    isResizingRef.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // ✅ Start AI Session
  async function startSession() {
    try {
      if (isSessionActive) {
        console.warn("🔄 AI session is already active. Skipping redundant start.");
        return;
      }
  
      console.log("🔄 Requesting WebRTC token from OpenAI...");
      const tokenResponse = await fetch("/token");
      const data = await tokenResponse.json();
  
      console.log("🔍 Token API Response:", data);
  
      const EPHEMERAL_KEY = data.client_secret?.value || data.token;
  
      if (!EPHEMERAL_KEY) {
        throw new Error(`❌ No client secret received from server. API Response: ${JSON.stringify(data)}`);
      }
  
      console.log("✅ WebRTC client secret received:", EPHEMERAL_KEY);

      const pc = new RTCPeerConnection();
      audioElement.current = document.createElement("audio");
      audioElement.current.autoplay = true;
      pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);
  
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(ms.getTracks()[0]);
  
      const dc = pc.createDataChannel("oai-events");
      setDataChannel(dc);
  
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
  
      const sdpResponse = await fetch("https://api.openai.com/v1/realtime", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });
  
      const answer = { type: "answer", sdp: await sdpResponse.text() };
      await pc.setRemoteDescription(answer);
      peerConnection.current = pc;
      setIsSessionActive(true);
    } catch (error) {
      console.error("Error starting AI session:", error);
    }
  }

  // ✅ Stop AI Session
  function stopSession() {
    if (dataChannel) dataChannel.close();
    if (peerConnection.current) {
      peerConnection.current.getSenders().forEach((sender) => sender.track?.stop());
      peerConnection.current.close();
    }
    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  // ✅ Send AI Event
  function sendClientEvent(message) {
    if (dataChannel) {
      message.event_id = message.event_id || crypto.randomUUID();
      dataChannel.send(JSON.stringify(message));
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error("❌ No data channel available to send event:", message);
    }
  }

  // ✅ Send Text Message
  function sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: message }],
      },
    };
    sendClientEvent(event);
  }

  useEffect(() => {
    if (dataChannel) {
      dataChannel.addEventListener("message", (e) => {
        setEvents((prev) => [JSON.parse(e.data), ...prev]);
      });

      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
      });
    }
  }, [dataChannel]);

  console.log("🔍 isSessionActive:", isSessionActive);
  console.log("🔍 dataChannel:", dataChannel);
  console.log("🔍 selectedTool:", selectedTool);

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "34px" }} src={logo} alt="logo" />
          <h1 style={{ fontWeight: "bold" }}>ChatSites™ AI Portal</h1>
        </div>
      </nav>

      <main className="absolute top-16 left-0 right-0 bottom-0 flex">
        {/* Left Section */}
        <section className="flex-grow flex flex-col">
          <section className="w-full px-4 flex-grow overflow-y-auto">
            <EventLog events={events} />
          </section>
          <div className="w-full p-4 flex justify-center">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              isSessionActive={isSessionActive}
              events={events} 
            />
          </div>
        </section>

        {/* Resizable Divider */}
        <div onMouseDown={handleMouseDown} className="w-2 cursor-ew-resize bg-gray-400 hover:bg-gray-600" style={{ height: "100vh" }} />

        {/* Right Section - Tools Panel */}
        <section className="p-4 pt-0 overflow-y-auto" style={{ width: `${panelWidth}px` }}>
          <h2 className="text-lg font-bold">Select Tool</h2>
          <select
            className="p-2 border rounded-md"
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
          >
            {Object.entries(tools).map(([key, tool]) => (
              <option key={key} value={key}>
                {tool.name}
              </option>
            ))}
          </select>

          {/* Display Selected Tool */}
          {tools[selectedTool] && (
            <div className="mt-4">
              {React.createElement(tools[selectedTool].component, {
                isSessionActive,
                sendClientEvent,
                sendTextMessage,
                events,
                dataChannel,
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
