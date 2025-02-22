import { useEffect, useRef, useState } from "react";
import logo from "/assets/openai-logomark.svg";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import ToolPanel from "./ToolPanel";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);

  // ✅ Fix: Ensure Resizing Works
  const [panelWidth, setPanelWidth] = useState(380); // Initial right panel width
  const isResizingRef = useRef(false);

  useEffect(() => {
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

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleMouseDown = () => {
    isResizingRef.current = true;
    document.addEventListener("mousemove", (event) => {
      if (!isResizingRef.current) return;
      const newWidth = window.innerWidth - event.clientX;
      if (newWidth > 200 && newWidth < window.innerWidth - 300) {
        setPanelWidth(newWidth);
      }
    });
  };

  // ✅ Fix: Ensure AI Connection Works
  async function startSession() {
    try {
      console.log("Fetching token from /token...");
      const tokenResponse = await fetch("/token");
      if (!tokenResponse.ok) {
        throw new Error(`HTTP Error: ${tokenResponse.status}`);
      }
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;
      console.log("Token received:", EPHEMERAL_KEY);

      // Create WebRTC connection
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

      console.log("✅ AI Session Started!");
    } catch (error) {
      console.error("🚨 Error starting AI session:", error);
    }
  }

  function stopSession() {
    if (dataChannel) dataChannel.close();
    if (peerConnection.current) {
      peerConnection.current.getSenders().forEach((sender) => sender.track?.stop());
      peerConnection.current.close();
    }
    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
    console.log("Session stopped.");
  }

  function sendClientEvent(message) {
    if (dataChannel) {
      message.event_id = message.event_id || crypto.randomUUID();
      dataChannel.send(JSON.stringify(message));
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error("No data channel available");
    }
  }

  function sendTextMessage(message) {
    sendClientEvent({
      type: "conversation.item.create",
      item: { type: "message", role: "user", content: [{ type: "input_text", text: message }] },
    });
    sendClientEvent({ type: "response.create" });
  }

  // ✅ Fix: Ensure Event Log Updates
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

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px" }} src={logo} alt="logo" />
          <h1>ChatSites™ AI Portal</h1>
        </div>
      </nav>
      <main className="absolute top-16 left-0 right-0 bottom-0 flex">
        {/* Left Panel (Event Log) */}
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
              events={events}
              isSessionActive={isSessionActive}
            />
          </div>
        </section>

        {/* Resizer */}
        <div
          onMouseDown={handleMouseDown}
          className="w-2 cursor-ew-resize bg-gray-400 hover:bg-gray-600"
          style={{ height: "100vh" }}
        />

        {/* Right Panel (Tool Panel) */}
        <section
          className="p-4 pt-0 overflow-y-auto"
          style={{ width: `${panelWidth}px` }}
        >
          <ToolPanel
            sendClientEvent={sendClientEvent}
            sendTextMessage={sendTextMessage}
            events={events}
            isSessionActive={isSessionActive}
          />
        </section>
      </main>
    </>
  );
}
