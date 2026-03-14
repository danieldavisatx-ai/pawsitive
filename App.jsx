import { useState, useRef, useEffect, useCallback } from "react";

const TRAINING_TIPS = [
  {
    category: "Getting Started",
    icon: "\u{1F43E}",
    tips: [
      { title: "The 1\u20132 Second Rule", body: "Rewards must come within 1 to 2 seconds of the desired behavior. Use a marker word like \"yes!\" to bridge the gap between the behavior and the treat." },
      { title: "High Value Treats", body: "Small pieces of chicken, cheese, or soft training treats work best for initial learning. As behaviors become reliable, transition to kibble or praise." },
      { title: "Short Sessions Win", body: "Puppies learn best in 3 to 5 minute training sessions. Multiple short sessions throughout the day beat one long marathon." },
    ]
  },
  {
    category: "Socialization",
    icon: "\u{1F30D}",
    tips: [
      { title: "The Critical Window", body: "Ages 8 to 16 weeks is the prime socialization period. Safely expose your puppy to diverse people, animals, surfaces, and sounds, pairing each new experience with treats." },
      { title: "Quality Over Quantity", body: "One calm, positive encounter with a new person is worth more than ten overwhelming ones. Watch your puppy's body language and go at their pace." },
    ]
  },
  {
    category: "Kids & Dogs",
    icon: "\u{1F476}",
    tips: [
      { title: "Always Supervise", body: "Children under 6 should never be left alone with any dog, regardless of temperament. Active supervision means an adult is watching and ready to intervene." },
      { title: "Teach 'Be a Tree'", body: "When a puppy gets too excited or nippy, kids should stand still, fold their arms, and look away. This removes the stimulus and teaches the puppy that wild behavior ends the fun." },
      { title: "Dog Safe Zones", body: "Set up a crate or gated area where your dog can retreat. Teach children that when the dog is in their safe zone, they are not to be disturbed." },
      { title: "Stress Signals", body: "Help kids recognize discomfort: lip licking, yawning, whale eye (showing whites), tucked tail, turning away, or freezing." },
    ]
  },
  {
    category: "Common Challenges",
    icon: "\u{1F4A1}",
    tips: [
      { title: "Jumping Up", body: "Jumping earns attention, even negative attention like \"no!\" Instead, turn away completely and only engage when all four paws are on the ground." },
      { title: "Picky Eating", body: "Offering better food when your puppy refuses kibble accidentally teaches them that holding out works. Offer meals for 15 to 20 minutes, then pick up. No treats between meals." },
      { title: "Leash Pulling", body: "When your dog pulls, stop walking. Movement is the reward. Only move forward when the leash is loose. Start practicing indoors first." },
      { title: "Puppy Biting", body: "Mouthing is normal development, not aggression. Redirect to a chew toy. If biting is too hard, briefly withdraw attention. Biting too hard = fun stops." },
    ]
  },
  {
    category: "Science Corner",
    icon: "\u{1F52C}",
    tips: [
      { title: "Positive Reinforcement", body: "Adding something pleasant (treat, praise) to increase a desired behavior. This is your primary training tool." },
      { title: "Negative Punishment", body: "Removing something pleasant (attention, play) to decrease an unwanted behavior. Example: walking away when a puppy jumps." },
      { title: "Accidental Reinforcement", body: "When you unknowingly reward unwanted behavior. Giving food to stop barking teaches the dog that barking produces food." },
      { title: "Extinction", body: "When a previously reinforced behavior stops being reinforced, it will gradually decrease. Expect an 'extinction burst' where behavior temporarily gets worse before improving." },
    ]
  },
];

const PawSvg = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <ellipse cx="14" cy="19" rx="5" ry="4.5" fill="currentColor" opacity="0.9"/>
    <ellipse cx="7.5" cy="12" rx="3" ry="3.5" fill="currentColor" opacity="0.75" transform="rotate(-15 7.5 12)"/>
    <ellipse cx="20.5" cy="12" rx="3" ry="3.5" fill="currentColor" opacity="0.75" transform="rotate(15 20.5 12)"/>
    <ellipse cx="11" cy="7" rx="2.5" ry="3" fill="currentColor" opacity="0.65" transform="rotate(-8 11 7)"/>
    <ellipse cx="17" cy="7" rx="2.5" ry="3" fill="currentColor" opacity="0.65" transform="rotate(8 17 7)"/>
  </svg>
);

const TypingIndicator = () => (
  <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 7, height: 7, borderRadius: "50%", backgroundColor: "#8B7355",
        animation: `typingBounce 1.2s ease-in-out ${i * 0.15}s infinite`
      }}/>
    ))}
  </div>
);

const suggestedQuestions = [
  "My puppy keeps biting my toddler's hands",
  "How do I crate train a 10 week old puppy?",
  "My dog barks every time someone knocks",
  "Best breeds for families with small kids?",
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getPreview(messages) {
  const first = messages.find(m => m.role === "user");
  if (!first) return "New conversation";
  return first.content.length > 48 ? first.content.slice(0, 48) + "\u2026" : first.content;
}

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [expandedTipCat, setExpandedTipCat] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const activeConv = conversations.find(c => c.id === activeConvId);
  const messages = activeConv?.messages || [];
  const showWelcome = !activeConvId || messages.length === 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const startNewConversation = useCallback(() => {
    const id = generateId();
    setConversations(prev => [{ id, messages: [], createdAt: Date.now(), updatedAt: Date.now() }, ...prev]);
    setActiveConvId(id);
    setLeftOpen(false);
  }, []);

  const switchConversation = useCallback((id) => {
    setActiveConvId(id);
    setLeftOpen(false);
  }, []);

  const deleteConversation = useCallback((id, e) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) setActiveConvId(null);
  }, [activeConvId]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || isLoading) return;

    let convId = activeConvId;
    let currentConvs = conversations;

    if (!convId) {
      const id = generateId();
      const newConv = { id, messages: [], createdAt: Date.now(), updatedAt: Date.now() };
      currentConvs = [newConv, ...conversations];
      setConversations(currentConvs);
      setActiveConvId(id);
      convId = id;
    }

    const newMsg = { role: "user", content: userMsg };
    const conv = currentConvs.find(c => c.id === convId);
    const prevMsgs = conv?.messages || [];

    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, messages: [...c.messages, newMsg], updatedAt: Date.now() } : c
    ));
    setInput("");
    setIsLoading(true);

    try {
      const allMessages = [...prevMsgs, newMsg];

      // Calls YOUR serverless function, not Anthropic directly
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages.map(m => ({ role: m.role, content: m.content })) }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.reply || "I had trouble generating a response. Could you try rephrasing your question?";
      const assistantMsg = { role: "assistant", content: reply };

      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, messages: [...prevMsgs, newMsg, assistantMsg], updatedAt: Date.now() } : c
      ));
    } catch {
      const errMsg = { role: "assistant", content: "Something went wrong on my end. Please try again in a moment." };
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, messages: [...prevMsgs, newMsg, errMsg], updatedAt: Date.now() } : c
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const sidebarBase = {
    position: "fixed", top: 0, bottom: 0, width: 310, zIndex: 50,
    background: "rgba(253,248,243,0.98)", backdropFilter: "blur(16px)",
    boxShadow: "0 0 40px rgba(0,0,0,0.08)",
    transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
    display: "flex", flexDirection: "column",
  };

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      fontFamily: "'DM Sans', 'Nunito', system-ui, sans-serif",
      background: "linear-gradient(170deg, #FDF8F3 0%, #F5EDE3 40%, #EDE4D8 100%)",
      color: "#3D3226",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes typingBounce{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-6px);opacity:1}}
        @keyframes fadeSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pawPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        *{box-sizing:border-box;margin:0;padding:0}
        textarea::placeholder{color:#A89880}textarea:focus{outline:none}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#C4B5A3;border-radius:10px}
      `}</style>

      {(leftOpen || rightOpen) && (
        <div onClick={() => { setLeftOpen(false); setRightOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.12)", zIndex: 40 }} />
      )}

      {/* Left Sidebar: History */}
      <div style={{ ...sidebarBase, left: 0, transform: leftOpen ? "translateX(0)" : "translateX(-100%)" }}>
        <div style={{ padding: "18px 18px 12px", borderBottom: "1px solid rgba(139,115,85,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700 }}>Conversations</span>
          <button onClick={() => setLeftOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#8B7355", lineHeight: 1 }}>{"\u00D7"}</button>
        </div>
        <div style={{ padding: "10px 10px 4px", flexShrink: 0 }}>
          <button onClick={startNewConversation} style={{
            width: "100%", padding: "9px 12px", borderRadius: 11, border: "1.5px dashed rgba(139,115,85,0.22)",
            background: "transparent", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
            color: "#8B7355", fontWeight: 600, display: "flex", alignItems: "center", gap: 7,
          }} onMouseEnter={e => e.currentTarget.style.background="rgba(139,115,85,0.05)"}
             onMouseLeave={e => e.currentTarget.style.background="transparent"}>
            <span style={{ fontSize: 17, lineHeight: 1 }}>+</span> New Conversation
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 10px 14px" }}>
          {conversations.length === 0 && (
            <div style={{ textAlign: "center", padding: "28px 14px", color: "#A89880", fontSize: 13 }}>
              No conversations yet. Start chatting to see your history here.
            </div>
          )}
          {conversations.map(c => (
            <div key={c.id} onClick={() => switchConversation(c.id)} style={{
              padding: "11px 12px", borderRadius: 11, marginBottom: 4, cursor: "pointer",
              background: c.id === activeConvId ? "rgba(139,115,85,0.1)" : "transparent",
              border: c.id === activeConvId ? "1px solid rgba(139,115,85,0.14)" : "1px solid transparent",
              transition: "all 0.15s", position: "relative",
            }} onMouseEnter={e => { if (c.id !== activeConvId) e.currentTarget.style.background="rgba(139,115,85,0.04)"; }}
               onMouseLeave={e => { if (c.id !== activeConvId) e.currentTarget.style.background="transparent"; }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#3D3226", lineHeight: 1.35, paddingRight: 22 }}>
                {getPreview(c.messages)}
              </div>
              <div style={{ fontSize: 11, color: "#A89880", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                <span>{formatTime(c.updatedAt)}</span>
                <span style={{ color: "#C4B5A3" }}>{"\u00B7"}</span>
                <span>{c.messages.length} msgs</span>
              </div>
              <button onClick={(e) => deleteConversation(c.id, e)} title="Delete" style={{
                position: "absolute", top: 8, right: 8, background: "none", border: "none",
                cursor: "pointer", color: "#C4B5A3", fontSize: 15, lineHeight: 1, padding: 2, borderRadius: 4,
              }} onMouseEnter={e => e.currentTarget.style.color="#8B7355"}
                 onMouseLeave={e => e.currentTarget.style.color="#C4B5A3"}>
                {"\u00D7"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar: Training Tips */}
      <div style={{ ...sidebarBase, right: 0, transform: rightOpen ? "translateX(0)" : "translateX(100%)" }}>
        <div style={{ padding: "18px 18px 12px", borderBottom: "1px solid rgba(139,115,85,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700 }}>Training Tips</span>
          <button onClick={() => setRightOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#8B7355", lineHeight: 1 }}>{"\u00D7"}</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px 18px" }}>
          {TRAINING_TIPS.map((cat, ci) => (
            <div key={ci} style={{ marginBottom: 6 }}>
              <button onClick={() => setExpandedTipCat(expandedTipCat === ci ? null : ci)} style={{
                width: "100%", padding: "11px 12px", borderRadius: 11,
                border: "1px solid rgba(139,115,85,0.08)",
                background: expandedTipCat === ci ? "rgba(139,115,85,0.07)" : "rgba(255,255,255,0.45)",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 9, fontFamily: "inherit",
              }}>
                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                <span style={{ flex: 1, textAlign: "left", fontSize: 13.5, fontWeight: 600, color: "#3D3226" }}>{cat.category}</span>
                <span style={{ fontSize: 12, color: "#A89880", transition: "transform 0.2s", transform: expandedTipCat === ci ? "rotate(180deg)" : "rotate(0)" }}>{"\u25BE"}</span>
              </button>
              {expandedTipCat === ci && (
                <div style={{ padding: "6px 2px", animation: "fadeSlideUp 0.25s ease" }}>
                  {cat.tips.map((tip, ti) => (
                    <div key={ti} style={{
                      padding: "10px 12px", marginBottom: 5, borderRadius: 9,
                      background: "rgba(255,255,255,0.55)", border: "1px solid rgba(139,115,85,0.06)",
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#5A4A3A", marginBottom: 4 }}>{tip.title}</div>
                      <div style={{ fontSize: 12, color: "#7A6A5A", lineHeight: 1.5 }}>{tip.body}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div style={{
            marginTop: 12, padding: "12px 14px", borderRadius: 11,
            background: "linear-gradient(135deg, rgba(139,115,85,0.07), rgba(139,115,85,0.03))",
            border: "1px solid rgba(139,115,85,0.08)",
          }}>
            <div style={{ fontSize: 12, color: "#8B7355", lineHeight: 1.5 }}>
              <strong>Remember:</strong> Training is a marathon, not a sprint. Celebrate small wins, stay consistent, and trust the process.
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{
        padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
        borderBottom: "1px solid rgba(139,115,85,0.12)",
        background: "rgba(253,248,243,0.85)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <button onClick={() => { setLeftOpen(true); setRightOpen(false); }} title="Conversation history" style={{
          width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(139,115,85,0.1)",
          background: "rgba(255,255,255,0.45)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#8B7355", transition: "all 0.2s",
        }} onMouseEnter={e => e.currentTarget.style.background="rgba(139,115,85,0.07)"}
           onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.45)"}>
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="12" y2="15"/>
          </svg>
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, #8B7355, #A0895F)", color: "#FDF8F3",
          boxShadow: "0 2px 8px rgba(139,115,85,0.2)",
        }}>
          <PawSvg size={19} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: "#3D3226", lineHeight: 1.2 }}>Pawsitive</div>
          <div style={{ fontSize: 10.5, color: "#8B7355", fontWeight: 500 }}>Science backed puppy training</div>
        </div>
        <button onClick={() => { setRightOpen(true); setLeftOpen(false); }} title="Training tips" style={{
          width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(139,115,85,0.1)",
          background: "rgba(255,255,255,0.45)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#8B7355", transition: "all 0.2s",
        }} onMouseEnter={e => e.currentTarget.style.background="rgba(139,115,85,0.07)"}
           onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.45)"}>
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="10" r="7.5"/><line x1="10" y1="9" x2="10" y2="14"/><circle cx="10" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 14px" }}>
        {showWelcome && (
          <div style={{ maxWidth: 500, margin: "0 auto", animation: "fadeSlideUp 0.5s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 26, paddingTop: 16 }}>
              <div style={{
                width: 60, height: 60, borderRadius: 17, margin: "0 auto 12px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg, #8B7355, #A0895F)", color: "#FDF8F3",
                boxShadow: "0 4px 18px rgba(139,115,85,0.18)", animation: "pawPulse 3s ease-in-out infinite",
              }}>
                <PawSvg size={32} />
              </div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "#3D3226", marginBottom: 6 }}>
                Welcome to Pawsitive
              </h2>
              <p style={{ fontSize: 13.5, color: "#8B7355", lineHeight: 1.5, maxWidth: 360, margin: "0 auto" }}>
                Your positive reinforcement training coach. Ask me anything about puppy training, behavior, or keeping kids and dogs safe together.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {suggestedQuestions.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)} style={{
                  padding: "11px 13px", borderRadius: 13, border: "1.5px solid rgba(139,115,85,0.12)",
                  background: "rgba(255,255,255,0.5)", cursor: "pointer", textAlign: "left",
                  fontSize: 12.5, color: "#5A4A3A", lineHeight: 1.4, fontFamily: "inherit", fontWeight: 500,
                  transition: "all 0.2s",
                }} onMouseEnter={e => { e.target.style.background="rgba(139,115,85,0.06)"; e.target.style.borderColor="rgba(139,115,85,0.22)"; }}
                   onMouseLeave={e => { e.target.style.background="rgba(255,255,255,0.5)"; e.target.style.borderColor="rgba(139,115,85,0.12)"; }}>
                  {q}
                </button>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 18, display: "flex", justifyContent: "center", gap: 14 }}>
              <button onClick={() => { setLeftOpen(true); setRightOpen(false); }} style={{
                background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#A89880",
                fontFamily: "inherit", fontWeight: 500, display: "flex", alignItems: "center", gap: 4,
              }}>
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="12" y2="15"/>
                </svg>
                Past chats
              </button>
              <button onClick={() => { setRightOpen(true); setLeftOpen(false); }} style={{
                background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#A89880",
                fontFamily: "inherit", fontWeight: 500, display: "flex", alignItems: "center", gap: 4,
              }}>
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="10" r="7.5"/><line x1="10" y1="9" x2="10" y2="14"/><circle cx="10" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                </svg>
                Training tips
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            maxWidth: 600, margin: "0 auto 11px", animation: "fadeSlideUp 0.3s ease",
          }}>
            {msg.role === "assistant" && (
              <div style={{
                width: 26, height: 26, borderRadius: 8, flexShrink: 0, marginRight: 8, marginTop: 2,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg, #8B7355, #A0895F)", color: "#FDF8F3",
              }}>
                <PawSvg size={13} />
              </div>
            )}
            <div style={{
              padding: "10px 14px", maxWidth: "78%", fontSize: 13.5, lineHeight: 1.6,
              borderRadius: msg.role === "user" ? "15px 15px 4px 15px" : "15px 15px 15px 4px",
              background: msg.role === "user" ? "linear-gradient(135deg, #8B7355, #7A6348)" : "rgba(255,255,255,0.65)",
              color: msg.role === "user" ? "#FDF8F3" : "#3D3226",
              boxShadow: msg.role === "user" ? "0 2px 8px rgba(139,115,85,0.16)" : "0 1px 4px rgba(0,0,0,0.03)",
              border: msg.role === "assistant" ? "1px solid rgba(139,115,85,0.06)" : undefined,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: "flex", maxWidth: 600, margin: "0 auto 11px", animation: "fadeSlideUp 0.3s ease" }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8, flexShrink: 0, marginRight: 8, marginTop: 2,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, #8B7355, #A0895F)", color: "#FDF8F3",
            }}>
              <PawSvg size={13} />
            </div>
            <div style={{
              padding: "12px 15px", borderRadius: "15px 15px 15px 4px",
              background: "rgba(255,255,255,0.65)", border: "1px solid rgba(139,115,85,0.06)",
            }}>
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "9px 14px 13px", borderTop: "1px solid rgba(139,115,85,0.1)",
        background: "rgba(253,248,243,0.9)", backdropFilter: "blur(12px)",
      }}>
        <div style={{
          maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "flex-end", gap: 7,
          background: "rgba(255,255,255,0.6)", borderRadius: 15, padding: "4px 4px 4px 13px",
          border: "1.5px solid rgba(139,115,85,0.12)",
        }}>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown} placeholder="Ask about puppy training, behavior, or safety..."
            rows={1}
            style={{
              flex: 1, border: "none", background: "transparent", resize: "none",
              fontSize: 13.5, fontFamily: "inherit", color: "#3D3226", padding: "7px 0",
              lineHeight: 1.5, minHeight: 22, maxHeight: 96,
            }}
            onInput={e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,96)+"px"; }}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || isLoading}
            style={{
              width: 34, height: 34, borderRadius: 10, border: "none",
              cursor: input.trim() && !isLoading ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              background: input.trim() && !isLoading ? "linear-gradient(135deg, #8B7355, #A0895F)" : "rgba(139,115,85,0.1)",
              color: input.trim() && !isLoading ? "#FDF8F3" : "#A89880",
              transition: "all 0.2s",
            }}>
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="10" x2="15" y2="10"/><polyline points="10 5 15 10 10 15"/>
            </svg>
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 5, fontSize: 10, color: "#B0A090" }}>
          Powered by positive reinforcement science
        </div>
      </div>
    </div>
  );
}
