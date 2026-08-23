import React, { useState } from 'react';
import {
  Layers,
  X,
  ArrowRight,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useCompare } from '../context/CompareContext';

export const CompareFloatingBar: React.FC = () => {
  const {
    comparedProducts,
    removeFromCompare,
    clearCompare,
    openCompareModal,
    compareToast,
  } = useCompare();

  const [isCollapsed, setIsCollapsed] = useState(false);

  if (comparedProducts.length === 0 && !compareToast) return null;

  return (
    <>
      {/* Toast Notification for Compare actions */}
      {compareToast && (
        <div className="fixed bottom-24 right-4 sm:right-8 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs flex items-center gap-2 animate-slide-up max-w-sm">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="leading-snug">{compareToast}</span>
        </div>
      )}

      {/* Floating Compare Bar */}
      {comparedProducts.length > 0 && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-slide-up"
          id="compare-floating-bar"
        >
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-3 sm:p-4 shadow-2xl border border-slate-700/60 transition-all">
            {/* Header & Controls */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-tight">Compare Products</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                      {comparedProducts.length}/3 selected
                    </span>
                  </div>
                  {!isCollapsed && (
                    <p className="text-[11px] text-slate-400 hidden sm:block">
                      {comparedProducts.length === 1
                        ? 'Select up to 2 more items to compare side-by-side'
                        : 'Ready to compare specs, prices, and verified ratings'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearCompare}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                  title="Clear all selected"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title={isCollapsed ? 'Expand bar' : 'Minimize bar'}
                >
                  {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={openCompareModal}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                  id="open-compare-modal-btn"
                >
                  <span>Compare Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Thumbnail Slots Row (Expanded View) */}
            {!isCollapsed && (
              <div className="grid grid-cols-3 gap-2.5 pt-3 mt-3 border-t border-slate-800">
                {[0, 1, 2].map((slotIdx) => {
                  const prod = comparedProducts[slotIdx];

                  if (prod) {
                    return (
                      <div
                        key={prod.id}
                        className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-2 flex items-center gap-2 relative group overflow-hidden"
                      >
                        <img
                          src={prod.images[0]}
                          alt={prod.title}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-700"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-100 truncate">{prod.title}</p>
                          <p className="text-[11px] text-indigo-400 font-semibold">
                            ${prod.price.toFixed(2)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCompare(prod.id)}
                          className="p-1 rounded-lg bg-slate-700/70 hover:bg-rose-500 hover:text-white text-slate-300 transition cursor-pointer"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={slotIdx}
                      className="border border-dashed border-slate-700/80 rounded-2xl p-2 flex items-center justify-center text-center bg-slate-800/30 text-slate-500 text-[11px]"
                    >
                      <span>+ Add item ({slotIdx + 1}/3)</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
