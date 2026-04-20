  /**
   * Shared constants and utility functions for all PDF generators.
   * Single source of truth for company info, brand colors, and reusable helpers.
   */

  // --- COMPANY CONFIGURATION (superset of all fields used across PDF files) ---
  export const COMPANY = {
    NAME: 'KAIVALYA ENGINEERING',
    TAGLINE: 'Manufacturing & Supply of SPM, Precision Tools, Die & Components',
    ADDRESS: 'Pavana Industrial Premises, Bhoseri, PCMC, Pune 411044',
    ADDRESS_L1: 'Pavana Industrial Premises, Bhoseri, PCMC, Pune 411044',
    ADDRESS_L2: '',
    PHONE: '9527352858',
    EMAIL: 'info@kaivalya.co.in',
    GSTIN: '27AAKPF1080D1Z4',
    STATE: 'Maharashtra CODE:27'
  };

  // --- BRAND COLOR PALETTE ---
  export const COLORS = {
    PRIMARY: [0, 102, 51],      // Brand Green
    TEXT_DARK: [24, 24, 27],    // Zinc 900
    TEXT_LIGHT: [82, 82, 91],   // Zinc 600
    BG_LIGHT: [250, 250, 250],  // Almost White
    BORDER: [212, 212, 216]     // Zinc 300
  };

  // --- DEFAULT PDF LAYOUT ---
  export const PDF_DEFAULTS = {
    MARGIN: 15
  };

  // --- NUMBER → INDIAN WORDS CONVERTER ---
  export function numberToWords(num) {
    if (num === 0) return "Zero";

    const a = [
      "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ",
      "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ",
      "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return "";

    let str = "";
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "Crore " : "";
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "Lakh " : "";
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "Thousand " : "";
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "Hundred " : "";
    str += (n[5] != 0) ? ((str != "") ? "and " : "") + (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) : "";

    return str.trim() + " Only";
  }

  // --- APPWRITE-AWARE IMAGE LOADER ---
  export async function loadImage(src) {
    if (!src) return { dataUrl: null };

    try {
      // Use no-cache to avoid some browser-level CORS issues hitting cached responses
      const response = await fetch(src, { mode: 'cors' });
      if (!response.ok) {
        console.warn(`loadImage: Server returned ${response.status} for ${src}`);
        return { dataUrl: null };
      }
      const blob = await response.blob();

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result;
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve({ dataUrl, width: img.width, height: img.height });
          img.onerror = () => {
            console.warn("loadImage: Image decode failed for", src);
            resolve({ dataUrl: null });
          };
          img.src = dataUrl;
        };
        reader.onerror = () => resolve({ dataUrl: null });
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("loadImage failed (likely CORS or Network):", src);
      return { dataUrl: null }; // Return object so destructuring { dataUrl } doesn't fail
    }
  }

  // --- SAFE JSON PARSERS ---
  export function safeParseItems(raw) {
    try {
      return JSON.parse(raw || '[]');
    } catch {
      return [];
    }
  }

  export function safeParseBreakdown(raw) {
    try {
      return JSON.parse(raw || '{}');
    } catch {
      return {};
    }
  }
