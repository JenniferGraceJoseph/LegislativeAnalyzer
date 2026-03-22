export interface Law {
  id: string;
  title: string;
  category: string;
  date: string;
  compressedChunks: any[];
  summary: {
    oneLiner: string;
    shortPoints: string[];
    detailed: string;
    impact: {
      who: string;
      whatChanges: string;
      whenApplies: string;
    };
    faqs: { q: string; a: string }[];
  };
}

export type Category = "Tax" | "Education" | "Digital Law" | "Environment" | "Labor" | "Other";
