import React, { useState, useEffect } from "react";
import { Search, Plus, FileText, Info, AlertTriangle, Calendar, Users, ArrowRight, ChevronDown, ChevronUp, MessageSquare, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Markdown from "react-markdown";
import { Law, Category } from "./types";
import { compressChunk, generateFinalSummary, queryLaw, extractMetadata } from "./services/ai";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mock initial data
const INITIAL_LAWS: Law[] = [
  {
    id: "1",
    title: "Digital Personal Data Protection Act (DPDP), 2023",
    category: "Digital Law",
    date: "2023-08-11",
    compressedChunks: [],
    summary: {
      oneLiner: "A comprehensive framework for protecting personal data of Indian citizens while ensuring lawful processing.",
      shortPoints: [
        "Establishes rights for data principals (citizens).",
        "Defines obligations for data fiduciaries (companies).",
        "Creates a Data Protection Board of India.",
        "Imposes significant penalties for non-compliance (up to ₹250 crore).",
        "Regulates cross-border data transfers."
      ],
      detailed: "The Digital Personal Data Protection Act (DPDP), 2023, is India's first dedicated legislation for data privacy. It applies to the processing of digital personal data within India, and outside India if it involves offering goods or services to persons in India. The Act emphasizes 'Consent' as the primary ground for processing, with specific exemptions for 'Legitimate Uses'. Citizens have the right to access, correct, and erase their data. Companies must implement security safeguards and appoint a Data Protection Officer if they are 'Significant Data Fiduciaries'.",
      impact: {
        who: "Every Indian citizen (Data Principals) and any entity processing their data (Data Fiduciaries).",
        whatChanges: "Citizens now have legal control over their data; companies must be transparent and accountable for data usage.",
        whenApplies: "Phased implementation expected starting 2024-2025."
      },
      faqs: [
        { q: "Can a company use my data without consent?", a: "Generally no, except for 'Legitimate Uses' like medical emergencies, employment, or government services." },
        { q: "What happens if my data is leaked?", a: "The company must notify the Data Protection Board and you. They could face penalties up to ₹250 crore." }
      ]
    }
  },
  {
    id: "2",
    title: "National Education Policy (NEP) 2020",
    category: "Education",
    date: "2020-07-29",
    compressedChunks: [],
    summary: {
      oneLiner: "A transformative policy to overhaul India's education system from school to higher education.",
      shortPoints: [
        "Introduces 5+3+3+4 school structure.",
        "Focuses on foundational literacy and numeracy.",
        "Encourages multidisciplinary higher education with multiple entry/exit points.",
        "Promotes mother tongue/regional language as medium of instruction up to Grade 5.",
        "Aims for 50% Gross Enrolment Ratio in higher education by 2035."
      ],
      detailed: "The NEP 2020 replaces the 34-year-old National Policy on Education (1986). It aims to create an education system that is rooted in Indian ethos and contributes directly to transforming India into an equitable and vibrant knowledge society. Key reforms include the abolition of rigid streams (Science/Arts/Commerce), introduction of vocational education from Grade 6, and a common entrance exam for universities (CUET).",
      impact: {
        who: "Students, teachers, parents, and educational institutions across India.",
        whatChanges: "Shift from rote learning to holistic, flexible, and skill-based education.",
        whenApplies: "Ongoing implementation across various states and institutions."
      },
      faqs: [
        { q: "Is the 10+2 system gone?", a: "Yes, it is replaced by the 5+3+3+4 structure (Foundational, Preparatory, Middle, Secondary)." },
        { q: "Will my child have to study in regional language?", a: "The policy 'encourages' it up to Grade 5, but it is not mandatory for all schools (especially private ones)." }
      ]
    }
  }
];

export default function App() {
  const [laws, setLaws] = useState<Law[]>(INITIAL_LAWS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">("All");
  const [selectedLaw, setSelectedLaw] = useState<Law | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [newLawText, setNewLawText] = useState("");
  const [ingestionStep, setIngestionStep] = useState<"idle" | "extracting" | "chunking" | "compressing" | "summarizing" | "done">("idle");
  const [chatQuery, setChatQuery] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [isChatting, setIsChatting] = useState(false);

  const filteredLaws = laws.filter(law => {
    const matchesSearch = law.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         law.summary.oneLiner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || law.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleIngest = async () => {
    if (!newLawText) return;
    
    setIsIngesting(true);
    setIngestionStep("extracting");
    
    try {
      const metadata = await extractMetadata(newLawText);
      
      setIngestionStep("chunking");
      // Simulate chunking (in a real app, we'd split by ~10k tokens)
      const chunks = [newLawText.slice(0, 5000), newLawText.slice(5000, 10000)].filter(c => c.length > 0);
      
      setIngestionStep("compressing");
      const compressedChunks = await Promise.all(chunks.map(c => compressChunk(c)));
      
      setIngestionStep("summarizing");
      const finalSummary = await generateFinalSummary(compressedChunks);
      
      const newLaw: Law = {
        id: Date.now().toString(),
        title: metadata.title,
        category: metadata.category,
        date: metadata.date,
        compressedChunks,
        summary: finalSummary
      };
      
      setLaws([newLaw, ...laws]);
      setIngestionStep("done");
      setTimeout(() => {
        setIsIngesting(false);
        setIngestionStep("idle");
        setNewLawText("");
      }, 1500);
    } catch (error) {
      console.error("Ingestion failed:", error);
      setIngestionStep("idle");
      setIsIngesting(false);
    }
  };

  const handleChat = async () => {
    if (!chatQuery || !selectedLaw) return;
    setIsChatting(true);
    const response = await queryLaw(chatQuery, selectedLaw.compressedChunks);
    setChatResponse(response);
    setIsChatting(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-[#E6E6E6]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#1A1A1A]/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">AI Legislative Analyzer</h1>
              <p className="text-xs text-[#1A1A1A]/50 uppercase tracking-widest font-medium">Citizen's Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsIngesting(true)}
              className="flex items-center gap-2 bg-[#1A1A1A] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#333] transition-colors"
            >
              <Plus size={18} />
              Ingest New Law
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 italic font-serif"
          >
            Law for the People.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-[#1A1A1A]/60 max-w-2xl mx-auto leading-relaxed"
          >
            Demystifying complex Indian legislation through high-density token compression and citizen-friendly AI analysis.
          </motion.p>
        </section>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30" size={20} />
            <input 
              type="text" 
              placeholder="Search laws, keywords, or provisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-[#1A1A1A]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/5 transition-all text-lg"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {["All", "Tax", "Education", "Digital Law", "Environment", "Labor"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as any)}
                className={cn(
                  "px-6 py-4 rounded-2xl text-sm font-medium whitespace-nowrap transition-all border",
                  selectedCategory === cat 
                    ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" 
                    : "bg-white text-[#1A1A1A]/60 border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Law Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredLaws.map((law) => (
              <motion.div
                key={law.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelectedLaw(law)}
                className="group bg-white border border-[#1A1A1A]/10 rounded-3xl p-8 cursor-pointer hover:shadow-2xl hover:shadow-[#1A1A1A]/5 transition-all relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="px-3 py-1 bg-[#1A1A1A]/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/60">
                    {law.category}
                  </span>
                  <span className="text-xs text-[#1A1A1A]/40 font-mono">{law.date}</span>
                </div>
                <h3 className="text-2xl font-bold leading-tight mb-4 group-hover:text-[#1A1A1A] transition-colors">
                  {law.title}
                </h3>
                <p className="text-[#1A1A1A]/60 line-clamp-3 mb-8 text-sm leading-relaxed">
                  {law.summary.oneLiner}
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold group-hover:gap-4 transition-all">
                  Analyze Details <ArrowRight size={16} />
                </div>
                
                {/* Decorative background element */}
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <FileText size={120} strokeWidth={1} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Law Detail Modal */}
      <AnimatePresence>
        {selectedLaw && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLaw(null)}
              className="absolute inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="relative w-full max-w-5xl max-h-[90vh] bg-[#FDFCFB] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-[#1A1A1A]/5 flex items-start justify-between bg-white">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-[#1A1A1A] text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {selectedLaw.category}
                    </span>
                    <span className="text-xs text-[#1A1A1A]/40 font-mono flex items-center gap-1">
                      <Calendar size={12} /> {selectedLaw.date}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{selectedLaw.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedLaw(null)}
                  className="w-12 h-12 rounded-full border border-[#1A1A1A]/10 flex items-center justify-center hover:bg-[#1A1A1A] hover:text-white transition-all"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  {/* Left Column: Summaries */}
                  <div className="lg:col-span-2 space-y-12">
                    <section>
                      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/40 mb-6 flex items-center gap-2">
                        <Zap size={14} className="text-amber-500" /> Executive Summary
                      </h4>
                      <div className="bg-[#1A1A1A] text-white p-8 rounded-3xl mb-8">
                        <p className="text-2xl font-medium leading-relaxed italic font-serif">
                          "{selectedLaw.summary.oneLiner}"
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedLaw.summary.shortPoints.map((point, i) => (
                          <div key={i} className="flex gap-4 p-4 bg-white border border-[#1A1A1A]/5 rounded-2xl">
                            <div className="w-6 h-6 rounded-full bg-[#1A1A1A]/5 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {i + 1}
                            </div>
                            <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">{point}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/40 mb-6 flex items-center gap-2">
                        <FileText size={14} /> Detailed Analysis
                      </h4>
                      <div className="prose prose-sm max-w-none text-[#1A1A1A]/80 leading-relaxed">
                        <Markdown>{selectedLaw.summary.detailed}</Markdown>
                      </div>
                    </section>

                    <section>
                      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/40 mb-6 flex items-center gap-2">
                        <MessageSquare size={14} /> Frequently Asked Questions
                      </h4>
                      <div className="space-y-4">
                        {selectedLaw.summary.faqs.map((faq, i) => (
                          <div key={i} className="bg-white border border-[#1A1A1A]/5 rounded-2xl overflow-hidden">
                            <div className="p-5 font-bold text-sm flex items-center justify-between">
                              {faq.q}
                            </div>
                            <div className="px-5 pb-5 text-sm text-[#1A1A1A]/60 leading-relaxed">
                              {faq.a}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  {/* Right Column: Impact & Chat */}
                  <div className="space-y-8">
                    <div className="bg-[#F3F4F6] p-8 rounded-[2rem] border border-[#1A1A1A]/5">
                      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/40 mb-6 flex items-center gap-2">
                        <Users size={14} /> Citizen Impact
                      </h4>
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-[#1A1A1A]/30 mb-1">Who is affected?</p>
                          <p className="text-sm font-medium">{selectedLaw.summary.impact.who}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-[#1A1A1A]/30 mb-1">What changes?</p>
                          <p className="text-sm font-medium">{selectedLaw.summary.impact.whatChanges}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-[#1A1A1A]/30 mb-1">When does it apply?</p>
                          <p className="text-sm font-medium">{selectedLaw.summary.impact.whenApplies}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
                      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/40 mb-6 flex items-center gap-2">
                        <Info size={14} /> Ask the Analyzer
                      </h4>
                      <div className="space-y-4">
                        <textarea 
                          placeholder="Ask a specific question about this law..."
                          value={chatQuery}
                          onChange={(e) => setChatQuery(e.target.value)}
                          className="w-full p-4 bg-[#FDFCFB] border border-[#1A1A1A]/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/5 h-24 resize-none"
                        />
                        <button 
                          onClick={handleChat}
                          disabled={isChatting || !chatQuery}
                          className="w-full py-3 bg-[#1A1A1A] text-white rounded-xl text-sm font-bold hover:bg-[#333] transition-all disabled:opacity-50"
                        >
                          {isChatting ? "Analyzing..." : "Query Law"}
                        </button>
                        {chatResponse && (
                          <div className="p-4 bg-[#FDFCFB] border border-[#1A1A1A]/5 rounded-2xl text-xs text-[#1A1A1A]/70 leading-relaxed animate-in fade-in slide-in-from-top-2">
                            <p className="font-bold text-[#1A1A1A] mb-2">AI Response:</p>
                            {chatResponse}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ingestion Modal */}
      <AnimatePresence>
        {isIngesting && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => ingestionStep === "idle" && setIsIngesting(false)}
              className="absolute inset-0 bg-[#1A1A1A]/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] p-12 shadow-2xl"
            >
              {ingestionStep === "idle" ? (
                <>
                  <h2 className="text-4xl font-bold tracking-tight mb-2">Ingest New Legislation</h2>
                  <p className="text-[#1A1A1A]/50 mb-8">Paste the legal text below. Our AI will automatically extract metadata, compress, and summarize it for citizens.</p>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40 mb-2 block">Legal Text (Full Document)</label>
                      <textarea 
                        placeholder="Paste the 100k+ token document here..."
                        value={newLawText}
                        onChange={(e) => setNewLawText(e.target.value)}
                        className="w-full p-6 bg-[#FDFCFB] border border-[#1A1A1A]/10 rounded-3xl h-80 focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/5 resize-none"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setIsIngesting(false)}
                        className="flex-1 py-4 border border-[#1A1A1A]/10 rounded-2xl font-bold hover:bg-[#1A1A1A]/5 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleIngest}
                        disabled={!newLawText}
                        className="flex-[2] py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold hover:bg-[#333] transition-all disabled:opacity-50"
                      >
                        Start Compression Pipeline
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-4 border-[#1A1A1A]/5 border-t-[#1A1A1A] rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap size={32} className="text-[#1A1A1A]" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold mb-4 capitalize">{ingestionStep}...</h2>
                  <p className="text-[#1A1A1A]/60 max-w-sm mx-auto">
                    {ingestionStep === "extracting" && "Identifying title, category, and enactment date from the document."}
                    {ingestionStep === "chunking" && "Dividing document into semantic chunks for parallel processing."}
                    {ingestionStep === "compressing" && "Extracting key provisions and removing legal boilerplate."}
                    {ingestionStep === "summarizing" && "Generating multi-level citizen-friendly summaries."}
                    {ingestionStep === "done" && "Legislation successfully analyzed and added to dashboard."}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="mt-12 w-full bg-[#1A1A1A]/5 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ 
                        width: ingestionStep === "extracting" ? "15%" :
                               ingestionStep === "chunking" ? "35%" : 
                               ingestionStep === "compressing" ? "65%" : 
                               ingestionStep === "summarizing" ? "90%" : "100%" 
                      }}
                      className="h-full bg-[#1A1A1A]"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-[#1A1A1A]/5 py-12 px-6 mt-24">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1A1A1A] rounded-lg flex items-center justify-center text-white">
              <ShieldCheck size={18} />
            </div>
            <span className="font-bold tracking-tight">AI Legislative Analyzer</span>
          </div>
          <div className="flex gap-8 text-sm text-[#1A1A1A]/40 font-medium">
            <a href="#" className="hover:text-[#1A1A1A] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#1A1A1A] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#1A1A1A] transition-colors">Government Sources</a>
            <a href="#" className="hover:text-[#1A1A1A] transition-colors">API Documentation</a>
          </div>
          <div className="text-xs text-[#1A1A1A]/30 font-mono">
            v1.0.4-stable • Built for Indian Citizens
          </div>
        </div>
      </footer>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(26, 26, 26, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(26, 26, 26, 0.2); }
      `}</style>
    </div>
  );
}
