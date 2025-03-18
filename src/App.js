import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Html } from '@react-three/drei';
import { Model } from "./Explorer";
import { ConvaiClient } from 'convai-web-sdk';
import { SETTINGS } from './constants';

const convaiClient = new ConvaiClient({
  apiKey: SETTINGS['CONVAI-API-KEY'],
  characterId: SETTINGS['CHARACTER-ID'],
  enableAudio: true, // Enable voice interaction
});

export default function App() {
  const [userText, setUserText] = useState("Hold the Button to Talk!");
  const finalizedUserText = useRef("");
  const [npcText, setNpcText] = useState("");
  const npcTextRef = useRef("");
  const [isTalking, setIsTalking] = useState(false);
  const [isHolding, setIsHolding] = useState(false);

  convaiClient.setResponseCallback((response) => {
    if (response.hasUserQuery()) {
      let transcript = response.getUserQuery();
      let isFinal = transcript.getIsFinal();
      if (isFinal) {
        finalizedUserText.current += " " + transcript.getTextData();
      }
      setUserText(finalizedUserText.current + (isFinal ? "" : transcript.getTextData()));
    }
    if (response.hasAudioResponse()) {
      let audioResponse = response?.getAudioResponse();
      npcTextRef.current += " " + audioResponse.getTextData();
      setNpcText(npcTextRef.current);
    }
  });

  convaiClient.onAudioPlay(() => setIsTalking(true));
  convaiClient.onAudioStop(() => setIsTalking(false));

  const startListening = () => {
    setIsHolding(true);
    finalizedUserText.current = "";
    npcTextRef.current = "";
    setUserText("");
    setNpcText("");
    convaiClient.startAudioChunk();
  };

  const stopListening = () => {
    setIsHolding(false);
    convaiClient.endAudioChunk();
  };

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <Canvas shadows camera={{ position: [0, 0, 15], fov: 30 }} style={{ width: "100%", height: "80%" }}>
        <Environment files="/snowy_forest_path_01_4k.hdr" ground={{ height: 5, radius: 30, scale: 20 }} />
        <Model position={[0, 0, 3]} scale={1.8} animationName={isTalking ? "talk" : "idle"} />
        
        <Html position={[-1.5, -0.75, 3]}>
          {userText && (
            <div style={{ width: '300px', borderRadius: '10px', background: 'rgba(115, 117, 109, 0.5)', padding: '10px', textAlign: 'center' }}>
              <p>{userText}</p>
            </div>
          )}
        </Html>

        <Html position={[1, 3, 3]}>
          {npcText && (
            <div style={{ width: '300px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.7)', padding: '10px', textAlign: 'center' }}>
              <p>{npcText}</p>
            </div>
          )}
        </Html>

        <OrbitControls enableZoom={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2.25} />
      </Canvas>

      {/* Hold-to-Talk Button */}
      <button 
        style={{
          marginTop: "20px",
          padding: "15px 30px",
          fontSize: "18px",
          backgroundColor: isHolding ? "red" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          outline: "none",
          transition: "background-color 0.2s ease-in-out"
        }} 
        onMouseDown={startListening} 
        onMouseUp={stopListening} 
        onTouchStart={startListening} 
        onTouchEnd={stopListening}
      >
        {isHolding ? "Listening..." : "Hold to Talk"}
      </button>
    </div>
  );
}
