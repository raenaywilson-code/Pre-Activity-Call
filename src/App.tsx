import React, { useCallback, useEffect, useMemo, useRef, useState, Component } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  auth, 
  db,
  logout, 
  signInAnonymously
} from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, addDoc, getDocs, query, orderBy, where } from 'firebase/firestore';
import {
  Phone,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  ChevronRight,
  Award,
  AlertCircle,
  LogOut,
  Settings,
  ChevronLeft,
  Lock,
  BarChart3,
  Loader2,
  Activity,
  Car,
  Clock,
  Home,
  History,
  Mic,
  Volume2
} from 'lucide-react';

import { Dashboard } from './components/Dashboard';

// ==========================================/
// APP CONFIG & CONSTANTS
// ==========================================/

const LOGO_URL = 'https://image2url.com/r2/default/images/1773942607988-c4f7e207-ba52-4fab-ab6f-d02aa79ff43b.png';

const COLORS = {
  darkBlue: '#0D375E',
  blue: '#228BE6',
  gray: '#A7A8AA'
};

const LOCATIONS = [
  'Albany NY - Loudon', 'Albuquerque NM - Karsten', 'Asheville NC', 'Atlanta - Chamblee',
  'Atlanta VM - Midtown', 'Atlanta GA - Fairburn', 'Atlanta GA - Winder', 'Augusta',
  'Austin - North Austin', 'Austin VM', 'Bakersfield', 'Baltimore MD - Holabird',
  'Bessemer IC', 'Birmingham VM', 'Blue Mound Hub', 'Fort Worth VM', 'Boise ID',
  'Boston - Norfolk', 'Boston - Colonial CDJR', 'Boston MA - Western', 'Bridgeport CT - Fairfield',
  'New York City NY - Bronx', 'Buffalo NY - Akron Hub', 'Cape Girardeau MO', 'Casa Grande CDJR',
  'Charlotte VM', 'Concord Hub', 'Chattanooga TN - Relocation Way', 'Chicago IL - University Park Hub',
  'Chicago - Penny VM', 'Chicago VM', 'Trenton Hub', 'Cleveland VM', 'Elyria Hub',
  'Colorado Springs CO - Charter', 'Columbia SC - Augusta', 'Columbus GA', 'Heath Hub',
  'Dallas TX - Hutchins', 'Dallas VM', 'Dallas TX - Park Cities CDJR', 'Washington DC VA - Dulles',
  'Denver', 'Denver VM', 'Des Moines IA', 'Detroit VM', 'El Paso TX - Northwestern',
  'Eugene OR Hub', 'Flint MI', 'Grand Rapids MI - Wyoming', 'Burlington NC', 'Greensboro VM',
  'Greenville SC - Plemmons', 'Haines City Hub', 'Hammond LA', 'Hartford', 'Houston TX - Sam Houston',
  'Houston - Spring VM', 'Houston VM', 'Indianapolis Hub', 'Indianapolis IN - Plainfield',
  'Jacksonville FL - Kings Rd.', 'Jacksonville VM', 'Kansas City MO - Belton', 'Kansas City VM',
  'Lexington KY', 'Knoxville TN - Lenoir', 'Lafayette LA - Old Spanish', 'Las Vegas NV - Gowan',
  'Las Vegas VM', 'Little Rock AR - McNeil', 'Long Island NY - Patchogue', 'Long Island NY VM',
  'Los Angeles - Chatsworth', 'Los Angeles - Montebello', 'Los Angeles - Westminster VM',
  'Los Angeles - Ontario VM', 'Riverside CA - Fleetwood', 'Louisville VM', 'Memphis',
  'Memphis VM', 'Miami FL - Terrace VM', 'Miami VM', 'Milwaukee WI - Delafield Hub',
  'Milwaukee - Oak Creek', 'Minneapolis MN - Collins', 'Mobile - Theodore', 'Myrtle Beach SC - Conway',
  'Nashville TN - Burnett', 'Nashville VM', 'Newark - Manville', 'Newark - Midland Park',
  'Beacon NY', 'Oklahoma City OK Hub', 'Oklahoma City VM', 'Omaha NE', 'Orlando FL - Sanford',
  'Orlando VM', 'Peoria IL', 'Delanco Hub', 'Philadelphia VM', 'Phoenix AZ - Beck',
  'Tempe VM', 'Glendale VM', 'Tolleson Hub', 'Pittsburgh PA - Hunker', 'Pittsburgh VM',
  'Portland OR', 'Raleigh VM', 'Reno NV - Echo', 'Chesterfield Hub', 'Richmond VM',
  'Rocklin Hub', 'Sacramento CDJR', 'Salt Lake City VM', 'San Antonio Hub', 'San Antonio VM',
  'San Diego', 'San Diego CA - Cactus', 'San Diego CDJR', 'San Diego - Escondido',
  'San Francisco - Daly City VM', 'San Jose CA - Monterey', 'Sarasota FL Hub', 'Savannah',
  'Scranton', 'Seattle WA - Auburn', 'Shreveport', 'South Atlanta CDJR', 'Springfield MO',
  'St. Louis - Hazelwood', 'Syracuse NY', 'Tampa - West', 'Tampa VM', 'Tooele IC',
  'Tracy CA', 'Tulsa OK', 'Virginia Beach - Norfolk', 'Washington DC VM', 'Wichita KS',
  'York PA'
];

const SCENARIOS = [
  {
    id: 'taylor',
    level: 1,
    name: 'Taylor',
    subTitle: 'The Scattered Enthusiast',
    difficulty: 'Easy/Friendly',
    voice: 'Kore',
    customerName: 'Taylor',
    vehicle: '2020 Tesla Model Y',
    address: '1234 Jay Bird St.',
    appointment: '10:00 AM',
    eta: '10:05 AM',
    window: '9:00 - 12:00',
    departTime: '9:30 AM',
    pid: '63990801',
    type: 'Delivery',
    description:
      "Taylor. They live at 1234 Jay Bird St. They are excited about the delivery of their Tesla Model Y but very disorganized. They have misplaced their physical driver's license and only have a photo of it on their phone. Taylor is also not sure if their new insurance policy has started yet. The Advocate is calling to ensure you are cleared for delivery. During the call, Taylor will eventually find their driver's license and confirm they have proof of insurance. Taylor will be friendly, positive, and a bit scattered. CRITICAL: Taylor must listen to the user's responses and not prompt the response or lead the learner to the right answer. Let the learner figure out what information they need to ask for."
  },
  {
    id: 'morgan',
    level: 2,
    name: 'Morgan',
    subTitle: 'The Nervous Trader',
    difficulty: 'Medium/Anxious',
    voice: 'Puck',
    customerName: 'Morgan',
    vehicle: '2024 Toyota Supra',
    tradeVehicle: 'Toyota Rav4',
    address: '1234 Mockingbird Lane',
    appointment: '3:00 PM',
    eta: '3:00 PM',
    window: '2:00 - 5:00',
    departTime: '2:30 PM',
    pid: '63990800',
    type: 'Delivery w/ Trade',
    collectingTitle: 'Yes (Toyota Rav4)',
    description:
      "You are Morgan. You are trading in a Toyota Rav4 for a Toyota Supra. You live on 1234 Mockingbird Lane. Since you did the online appraisal, you accidentally backed into a pole and left a small dent on the bumper, but you're hoping it won't change the sale price. You are nervous because you can't find the spare key."
  },
  {
    id: 'casey',
    level: 3,
    name: 'Casey',
    subTitle: 'The Impatient Professional',
    difficulty: 'Hard/Impatient',
    voice: 'Fenrir',
    customerName: 'Casey',
    vehicle: '2019 Mazda 3',
    address: '54 Quail Trail road',
    appointment: '12:00 PM',
    eta: '12:05 PM',
    window: '11:00 - 2:00',
    departTime: '11:30 AM',
    pid: '63990802',
    type: 'Delivery',
    description:
      "You are Casey. You are extremely busy and currently on a very tight lunch break. You expect your Mazda 3 to be dropped off exactly at 12:00 PM at your apartment complex (54 Quail Trail road). You have a high-stakes meeting at 12:30 PM and zero patience for delays. When the Advocate calls to tell you the hauler can't fit and you need to meet elsewhere, start the conversation escalated, impatient, and frustrated. Use short, sharp sentences. Demand to know why this wasn't figured out sooner. CRITICAL: You MUST NOT hang up on the Advocate. You are difficult but you want your car. You will de-escalate if the Advocate is genuinely helpful, empathetic, and offers a solution that respects your time (like a very close location or a quick hand-off). If they are helpful and accommodating, gradually become more professional and cooperative. If they are dismissive or vague, stay frustrated but continue the conversation to find a solution."
  },
  {
    id: 'cameron',
    level: 4,
    name: 'Cameron',
    subTitle: 'The Secretive Strategist',
    difficulty: 'Expert/Secretive',
    voice: 'Aoede',
    customerName: 'Cameron',
    vehicle: '2017 Nissan Leaf',
    tradeVehicle: 'BMW i3',
    address: '123 Main St.',
    appointment: '4:30 PM',
    eta: '4:36 PM',
    window: '3:30 - 6:30',
    departTime: '4:00 PM',
    pid: '63990803',
    type: 'Delivery w/ Trade',
    coBuyer: 'Required (Running Late)',
    collectingTitle: 'Yes (BMW i3)',
    description:
      "You are Cameron. You're pulling off a huge surprise: a 2017 Nissan Leaf for your spouse's birthday. Your spouse is in the next room, so you MUST speak in a low, hushed whisper. You are anxious but excited. Coordinate two things: the co-buyer is running late, and the delivery truck CANNOT pull up to the house—it must park down the street. CRITICAL: Do NOT use descriptive words like 'whispers', 'nervously', or 'hushed tone' in your speech. Do NOT describe your actions or state of mind (e.g., don't say 'I am speaking quietly'). Just ACT it out. Use natural phrases like 'Hold on, let me step away...' or 'I'm trying to keep this a surprise.' If the Advocate is too loud, ask them to lower their voice. Focus entirely on the logistics of the surprise without ever breaking character or explaining your behavior."
  }
];

const FEEDBACK_CRITERIA = [
  { id: 'intro', text: 'Introduced yourself by name and that you are with Carvana' },
  { id: 'address', text: 'Confirmed delivery address' },
  { id: 'vehicle', text: 'Confirmed year, make, & model' },
  { id: 'eta', text: 'Provided ETA' },
  { id: 'insurance', text: 'Requested Proof of Insurance (POI)' },
  { id: 'license', text: 'Requested Driver’s License' },
  { id: 'special_occasion', text: 'Asked if this purchase is for a special occasion or event' },
  { id: 'co_buyer', text: 'Addressed Co-Buyer presence requirement' },
  { id: 'title', text: 'Confirmed collection of trade-in title' },
  { id: 'excitement', text: 'Building Excitement: Include at least 2 congratulatory statements or compliments about the vehicle during the call' }
];

// ==========================================/
// AUDIO UTILITIES
// ==========================================/

function floatTo16BitPCM(input: Float32Array) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}

function pcmToFloat32(base64: string) {
  if (!base64) return new Float32Array(0);
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer, 0, Math.floor(bytes.length / 2));
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }
    return float32;
  } catch (e) {
    console.error("Error in pcmToFloat32:", e);
    return new Float32Array(0);
  }
}

// ==========================================/
// MAIN COMPONENT
// ==========================================/

function SimulatorApp() {
  const [empId, setEmpId] = useState('');
  const [location, setLocation] = useState('');
  const [screen, setScreen] = useState<'login' | 'menu' | 'chat' | 'results' | 'dashboard'>('login');
  const [tab, setTab] = useState('home');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  const [activeScenario, setActiveScenario] = useState<any>(null);
  const [callStarted, setCallStarted] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [completedCriteria, setCompletedCriteria] = useState<string[]>([]);
  const [isCheckingCriteria, setIsCheckingCriteria] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const currentCriteria = useMemo(() => {
    if (!activeScenario) return FEEDBACK_CRITERIA;
    if (activeScenario.id === 'cameron') return FEEDBACK_CRITERIA;
    if (activeScenario.id === 'morgan') {
      return FEEDBACK_CRITERIA.filter(c => c.id !== 'co_buyer');
    }
    return FEEDBACK_CRITERIA.filter(c => c.id !== 'co_buyer' && c.id !== 'title');
  }, [activeScenario]);

  // WebSocket for Live API via Proxy
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isCallActiveRef = useRef(false);
  const nextPlayTimeRef = useRef(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const fetchSessions = async () => {
    try {
      const q = query(collection(db, 'sessions'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      setAllSessions(data);
      if (empId) {
        setSessions(data.filter((s: any) => s.empId === empId));
      }
    } catch (e) {
      console.error("Failed to fetch sessions from Firestore:", e);
    }
  };

  useEffect(() => {
    if (screen === 'menu' || screen === 'dashboard') {
      fetchSessions();
    }
  }, [screen, tab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId.trim() || !location.trim()) return;
    setIsLoading(true);
    try {
      await signInAnonymously();
      setScreen('menu');
    } catch (err: any) {
      setErrorMsg(`Login Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startScenario = (scenario: any) => {
    setActiveScenario(scenario);
    setMessages([]);
    setFeedback(null);
    setCompletedCriteria([]);
    setScreen('chat');
    setCallStarted(false);
    setIsLoading(false);
    setIsRinging(false);
    setErrorMsg('');
  };

  const stopAudio = useCallback(() => {
    isCallActiveRef.current = false;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch {}
    });
    activeSourcesRef.current = [];
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
    setIsListening(false);
    setIsSpeaking(false);
  }, []);

  const handleInterruption = useCallback(() => {
    console.log("Interrupting vocal playback - User is speaking");
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (err) {
        // Source already ended or not started yet
      }
    });
    activeSourcesRef.current = [];
    if (audioContextRef.current) {
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
    }
    setIsSpeaking(false);
  }, []);

  const initiateCall = async () => {
    if (!activeScenario || isLoading || callStarted) return;
    
    console.log("Initiating call...");
    setIsLoading(true);
    setIsRinging(true);
    setErrorMsg('');

    // Safety timeout for connection
    const connectTimeout = setTimeout(() => {
      if (!callStarted && screen === 'chat') {
        console.warn("Call connection timeout reached");
        setErrorMsg("Connection timed out. Please try again.");
        setIsLoading(false);
        setIsRinging(false);
        stopAudio();
      }
    }, 15000);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      audioContextRef.current = audioContext;
      nextPlayTimeRef.current = audioContext.currentTime;

      // Using window.location.host since server and client are on same port 3000
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected to proxy");
        ws.send(JSON.stringify({ type: 'setup', scenario: activeScenario }));
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ready') {
          clearTimeout(connectTimeout);
          console.log("Gemini session ready - Transitioning to active call state");
          setIsRinging(false);
          setIsLoading(false);
          setCallStarted(true);
          isCallActiveRef.current = true;

          // Start Mic Buffer
          const source = audioContext.createMediaStreamSource(stream);
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            if (!isCallActiveRef.current || ws.readyState !== WebSocket.OPEN) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const pcm16 = floatTo16BitPCM(inputData);
            const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
            ws.send(JSON.stringify({ type: 'audio', data: base64 }));
            setIsListening(true);
          };
          source.connect(processor);
          processor.connect(audioContext.destination);
          processorRef.current = processor;

          // Start Initial Nudge after 3 seconds
          setTimeout(() => {
            if (isCallActiveRef.current && ws.readyState === WebSocket.OPEN) {
              console.log("Sending initial nudge");
              ws.send(JSON.stringify({ type: 'nudge' }));
            }
          }, 3000);
        } else if (msg.type === 'error') {
          console.error("WebSocket received error:", msg.message);
          setErrorMsg(msg.message);
          setIsRinging(false);
          setIsLoading(false);
          stopAudio();
        } else if (msg.type === 'audio') {
          setIsSpeaking(true);
          playAudioChunk(msg.data);
        } else if (msg.type === 'interrupted') {
          handleInterruption();
        } else if (msg.type === 'text') {
          setMessages(prev => [...prev, { role: 'ai', text: msg.text }]);
        } else if (msg.type === 'transcript') {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'user' && last.text === msg.text) return prev;
            return [...prev, { role: 'user', text: msg.text }];
          });
        }
      };

      ws.onclose = () => {
        console.log("WebSocket closed locally or remotely");
        stopAudio();
      };
    } catch (err: any) {
      console.error("initiateCall failed:", err);
      setErrorMsg("Failed to start call. Check microphone permissions.");
      setIsLoading(false);
      setIsRinging(false);
      stopAudio();
    }
  };

  const playAudioChunk = async (base64: string) => {
    if (!audioContextRef.current) return;
    try {
      const float32 = pcmToFloat32(base64);
      if (float32.length === 0) return;

      const buffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      activeSourcesRef.current.push(source);

      const now = audioContextRef.current.currentTime;
      const startTime = Math.max(now, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + buffer.duration;
      
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
        if (audioContextRef.current && audioContextRef.current.currentTime >= nextPlayTimeRef.current - 0.1) {
          setIsSpeaking(false);
        }
      };
    } catch (e) {
      console.error("playAudioChunk error:", e);
    }
  };

  const endScenario = async () => {
    console.log("Ending call via button click");
    stopAudio();
    setScreen('results');
    setIsFinishing(false); 
    
    // If we're already processing, don't start again
    if (feedback) return;

    try {
      console.log("Starting AI evaluation of transcript...");
      const transcript = messages.map(m => `${m.role === 'user' ? 'Advocate' : 'Customer'}: ${m.text}`).join('\n');
      
      const controller = new AbortController();
      const signal = controller.signal;
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({ 
          transcript, 
          scenario: activeScenario, 
          criteria: currentCriteria 
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.details || result.error || "Evaluation failed");
      }
      
      const scores = result.scores || {};
      const criteriaCount = currentCriteria.length || 1;
      const earned = Object.values(scores).reduce((sum: number, val: any) => sum + (val ? 1 : 0), 0) as number;
      const rating = Math.round((earned / criteriaCount) * 100);

      const feedbackData = {
        scores,
        rating,
        summary: result.summary || "Evaluation complete."
      };

      setFeedback(feedbackData);

      try {
        await addDoc(collection(db, 'sessions'), {
          empId,
          location,
          scenarioId: activeScenario?.id,
          scenarioName: activeScenario?.name,
          transcript: messages,
          scores: feedbackData.scores,
          summary: feedbackData.summary,
          rating,
          createdAt: new Date().toISOString(),
          userId: user?.uid || null
        });
        console.log("Session saved to Firestore successfully");
      } catch (saveErr) {
        console.error("Failed to save session to Firestore:", saveErr);
      }
    } catch (err: any) {
      console.error("Evaluation error:", err);
      setFeedback({
        scores: {},
        rating: 0,
        summary: `Feedback currently unavailable: ${err.message || "Connection issues"}`
      });
    }
  };

  if (!isAuthReady || isFinishing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D375E]">
        <div className="text-white flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="font-bold tracking-widest uppercase text-xs">
            {isFinishing ? 'Generating Performance Report...' : 'Initializing Secure Session...'}
          </p>
        </div>
      </div>
    );
  }

  if (screen === 'dashboard') {
    return <Dashboard sessions={allSessions} onBack={() => setScreen('menu')} logoUrl={LOGO_URL} />;
  }

  if (screen === 'login') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-950">
        <div className="w-full max-w-sm space-y-12">
          <div className="flex flex-col items-center gap-6">
            <img src={LOGO_URL} alt="Carvana" className="h-16 object-contain" />
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">Pre-Call Practice</h1>
              <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Training Simulator</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                <input
                  required
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  placeholder="Employee ID"
                  className="w-full pl-12 pr-4 py-4 bg-gray-900 border border-gray-800 rounded-2xl outline-none text-white transition-all focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                <select
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-900 border border-gray-800 rounded-2xl outline-none text-white appearance-none"
                >
                  <option value="">Select Location</option>
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="w-full py-5 bg-blue-600 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Sign In"}
            </button>
          </form>
          <button onClick={() => setScreen('dashboard')} className="w-full text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
            Manager Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'menu') {
    return (
      <div className="h-[100dvh] flex flex-col bg-gray-950">
        <header className="px-6 pt-12 pb-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs font-black uppercase tracking-widest">Welcome back</span>
            <h2 className="text-2xl font-black text-white tracking-tight">Advocate {empId}</h2>
          </div>
          <button onClick={() => setScreen('login')} className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-800 text-gray-500">
            <LogOut className="w-6 h-6" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto px-6 pb-24 space-y-8 no-scrollbar">
          {tab === 'home' && (
            <>
              <div className="bg-gradient-to-br from-blue-600 to-blue-900 rounded-[32px] p-8 space-y-4 shadow-2xl relative overflow-hidden">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black text-white">Welcome to your Pre-Activity Call practice app!</h3>
                <p className="text-blue-100 text-sm font-medium">Select the Delivery below to complete a Pre-Activity Call for the activities. Successfully cruise through all scenarios to complete your training with a focus on building excitement.</p>
              </div>
              <div className="space-y-4">
                {SCENARIOS.map((s) => (
                  <button 
                    key={s.id} 
                    onClick={() => startScenario(s)} 
                    className="w-full bg-white border border-gray-100 rounded-xl p-5 text-left active:scale-[0.99] transition-all relative group shadow-sm"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">
                        DEPART FROM HUB NO LATER THAN {s.departTime}
                      </div>
                      
                      <div className="flex items-start justify-between pr-8">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                          <span className="text-gray-950 font-bold text-sm">
                            {s.appointment} ({s.window}) | {s.type}
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-end text-right">
                          <div className="text-xs text-gray-500">
                             {s.vehicle} • <span className="font-bold text-gray-900">{s.customerName}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-1">
                             PID: {s.pid} • Phoenix
                          </div>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                  </button>
                ))}
              </div>
            </>
          )}
          {tab === 'history' && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Recent Sessions</h4>
              {sessions.map(s => (
                <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-5 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-white mb-1">{s.scenarioName}</h5>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{new Date(s.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-lg font-black text-blue-500">{s.rating}%</span>
                </div>
              ))}
            </div>
          )}
        </main>
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-950/80 backdrop-blur-xl border-t border-gray-900 px-8 py-4 flex items-center justify-around">
          <button onClick={() => setTab('home')} className={`flex flex-col items-center gap-1 ${tab === 'home' ? 'text-blue-500' : 'text-gray-600'}`}>
            <Home className="w-6 h-6" />
            <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
          </button>
          <button onClick={() => setTab('history')} className={`flex flex-col items-center gap-1 ${tab === 'history' ? 'text-blue-500' : 'text-gray-600'}`}>
            <History className="w-6 h-6" />
            <span className="text-[9px] font-black uppercase tracking-widest">History</span>
          </button>
          <button onClick={() => setTab('settings')} className={`flex flex-col items-center gap-1 ${tab === 'settings' ? 'text-blue-500' : 'text-gray-600'}`}>
            <Settings className="w-6 h-6" />
            <span className="text-[9px] font-black uppercase tracking-widest">Settings</span>
          </button>
        </nav>
      </div>
    );
  }

  if (screen === 'chat') {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="h-[100dvh] flex flex-col bg-gray-950 text-white"
      >
        <header className="px-6 pt-10 pb-6 border-b border-gray-900 flex items-center justify-between shrink-0">
          <button onClick={() => setScreen('menu')} className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center border border-gray-800">
            <ChevronLeft className="w-6 h-6 text-gray-400" />
          </button>
          <div className="text-center">
            <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest block mb-1">
              {isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'In Call'}
            </span>
            <h3 className="font-bold whitespace-nowrap">{activeScenario?.name}</h3>
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 overflow-y-auto p-6 no-scrollbar">
          <div className="flex flex-col items-center space-y-8 py-4">
            <motion.div 
              animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}} transition={{ repeat: Infinity, duration: 1 }}
              className={`w-36 h-36 rounded-[40px] bg-gray-900 border-2 flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'border-brand-blue shadow-2xl shadow-brand-blue/20' : 'border-gray-800'}`}
            >
              <Phone className={`w-12 h-12 ${isSpeaking ? 'text-brand-blue' : 'text-gray-600'}`} />
            </motion.div>
            
            <div className="text-center space-y-4 w-full max-w-sm">
              <h4 className="text-xl font-bold text-white">{activeScenario?.subTitle}</h4>
              
              <div className="p-5 bg-white rounded-2xl border border-gray-100 text-left shadow-sm">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Activity Details</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Customer:</span>
                    <span className="text-gray-900 font-bold">{activeScenario?.customerName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Address:</span>
                    <span className="text-gray-900 font-bold">{activeScenario?.address}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Vehicle:</span>
                    <span className="text-gray-900 font-bold">{activeScenario?.vehicle}</span>
                  </div>
                  {activeScenario?.tradeVehicle && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Trade Vehicle:</span>
                      <span className="text-gray-900 font-bold">{activeScenario?.tradeVehicle}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">ETA:</span>
                    <span className="text-gray-900 font-bold">{activeScenario?.eta}</span>
                  </div>
                </div>
              </div>
              
              {errorMsg && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            <div className="w-full max-w-xs space-y-3 pb-8">
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest text-center mb-2">Success Criteria</p>
              {currentCriteria.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-900/30 border border-gray-800/50 rounded-xl text-[10px] font-bold text-gray-500 uppercase">
                  <Activity className="w-3.5 h-3.5 text-brand-gray" />
                  <span className="flex-1">{c.text}</span>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="p-8 bg-gray-950 border-t border-gray-900 shrink-0">
          {!callStarted ? (
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={initiateCall} 
              disabled={isLoading || isRinging}
              className="w-full py-6 bg-brand-blue rounded-[32px] font-black uppercase text-xl shadow-2xl shadow-brand-blue/30 flex items-center justify-center gap-4 text-white disabled:opacity-50"
            >
              {isLoading || isRinging ? <Loader2 className="w-6 h-6 animate-spin" /> : <Phone className="w-6 h-6" />}
              <span>{isRinging ? 'Ringing...' : isLoading ? 'Connecting...' : 'Start Call'}</span>
            </motion.button>
          ) : (
            <div className="flex items-center justify-center gap-6">
              <button 
                onClick={() => wsRef.current?.send(JSON.stringify({ type: 'nudge' }))}
                className="w-16 h-16 bg-gray-900 rounded-full flex flex-col items-center justify-center border border-gray-800 text-blue-500 active:bg-gray-800 transition-colors"
                title="Nudge Customer"
              >
                <Activity className="w-5 h-5" />
                <span className="text-[8px] font-black uppercase mt-1">Nudge</span>
              </button>
              
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={endScenario} 
                className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/40 active:bg-red-600 transition-all border-4 border-red-400/20"
              >
                <XCircle className="w-12 h-12 text-white" />
              </motion.button>

              <button 
                onClick={() => {
                  if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
                }}
                className="w-16 h-16 bg-gray-900 rounded-full flex flex-col items-center justify-center border border-gray-800 text-gray-500 active:bg-gray-800 transition-colors"
              >
                <Volume2 className="w-5 h-5" />
                <span className="text-[8px] font-black uppercase mt-1">Audio</span>
              </button>
            </div>
          )}
        </footer>
      </motion.div>
    );
  }

  if (screen === 'results') {
    return (
      <div className="min-h-screen bg-gray-950 p-6 flex flex-col">
        <header className="py-12 text-center">
          <Award className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-white uppercase italic">Call Report</h2>
        </header>
        <main className="flex-1 space-y-8">
           {!feedback ? (
             <div className="flex flex-col items-center py-20 bg-gray-900 rounded-[40px] border border-gray-800 animate-pulse">
               <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
               <span className="text-sm font-black uppercase text-gray-500">Generating AI Feedback...</span>
             </div>
           ) : (
             <>
               <div className="flex flex-col items-center py-8 bg-gray-900 rounded-[40px] border border-gray-800">
                  <span className="text-7xl font-black text-blue-500">{feedback.rating}%</span>
                  <span className="text-xs font-black uppercase text-gray-600 mt-2">Score</span>
               </div>
               <div className="space-y-3">
                  {currentCriteria.map(c => (
                    <div key={c.id} className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800 flex items-center justify-between">
                       <span className="text-xs font-bold text-gray-300">{c.text}</span>
                       {feedback.scores?.[c.id] ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  ))}
               </div>
               <div className="p-6 bg-blue-600/10 rounded-3xl border border-blue-600/20 italic text-blue-100 text-sm">
                 "{feedback.summary}"
               </div>
             </>
           )}
        </main>
        <button onClick={() => setScreen('menu')} className="w-full py-5 bg-white text-black font-black uppercase rounded-2xl mt-8">Finish</button>
      </div>
    );
  }

  return null;
}

export default function App() {
  return <SimulatorApp />;
}
