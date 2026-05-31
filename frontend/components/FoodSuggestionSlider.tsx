import React, { useEffect, useMemo, useState } from 'react';
import { Transaction } from '../types';

interface FoodSuggestionSliderProps {
  transactions: Transaction[];
}

interface FoodSuggestion {
  id: string;
  dish: string;
  shop: string;
  keyword: string;
  imageUrl: string;
  sourceUrl: string;
  count: number;
  reason: 'frequent' | 'rare';
}

interface FoodGroup {
  id: string;
  dish: string;
  shop: string;
  keyword: string;
  imageUrl?: string | null;
  sourceUrl?: string | null;
  count: number;
  firstEatenAt: number;
  lastEatenAt: number;
}

const TOP_K = 3;

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80'
];

const ARC_POSITIONS = [
  { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, zIndex: 40 },
  { x: 66, y: 22, scale: 0.66, rotate: 12, opacity: 0.78, zIndex: 30 },
  { x: 110, y: 62, scale: 0.44, rotate: 22, opacity: 0.34, zIndex: 20 },
  { x: -110, y: 62, scale: 0.44, rotate: -22, opacity: 0.34, zIndex: 20 },
  { x: -66, y: 22, scale: 0.66, rotate: -12, opacity: 0.78, zIndex: 30 }
];

const normalizeText = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const getShopeeFoodUrl = (keyword: string) => {
  const query = encodeURIComponent(keyword);
  return `https://shopeefood.vn/ho-chi-minh/dia-diem?q=${query}`;
};

const getFallbackImage = (key: string) => {
  const normalized = normalizeText(key);
  const hash = [...normalized].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return FALLBACK_IMAGES[hash % FALLBACK_IMAGES.length];
};

const getReasonLabel = (reason: FoodSuggestion['reason']) => {
  if (reason === 'frequent') {
    return `Ăn nhiều lần`;
  }

  return `Lâu rồi chưa ăn`;
};

const buildSuggestion = (group: FoodGroup, reason: FoodSuggestion['reason']): FoodSuggestion => ({
  id: `${reason}-${group.id}`,
  dish: group.dish,
  shop: group.shop,
  keyword: group.keyword,
  imageUrl: group.imageUrl || getFallbackImage(group.keyword),
  sourceUrl: group.sourceUrl || getShopeeFoodUrl(group.keyword),
  count: group.count,
  reason
});

const FoodSuggestionSlider: React.FC<FoodSuggestionSliderProps> = ({ transactions }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const suggestions = useMemo(() => {
    const groupsByFood = transactions.reduce<Record<string, FoodGroup>>((groups, transaction) => {
      const dish = (transaction.food_name || transaction.description || '').trim();
      if (!dish) {
        return groups;
      }

      const key = normalizeText(dish);
      const restaurantName = (transaction.restaurant_name || transaction.description || dish).trim();
      const transactionTime = new Date(transaction.transaction_date || transaction.created_at).getTime() || 0;
      const existing = groups[key];

      if (!existing) {
        groups[key] = {
          id: key,
          dish,
          shop: restaurantName,
          keyword: `${dish} ${restaurantName}`,
          imageUrl: transaction.image_url,
          sourceUrl: transaction.source_url,
          count: 1,
          firstEatenAt: transactionTime,
          lastEatenAt: transactionTime
        };
        return groups;
      }

      existing.count += 1;
      if (transactionTime && transactionTime < existing.firstEatenAt) {
        existing.firstEatenAt = transactionTime;
      }
      if (transactionTime >= existing.lastEatenAt) {
        existing.shop = restaurantName;
        existing.keyword = `${dish} ${restaurantName}`;
        existing.imageUrl = transaction.image_url || existing.imageUrl;
        existing.sourceUrl = transaction.source_url || existing.sourceUrl;
        existing.lastEatenAt = transactionTime;
      }

      return groups;
    }, {});

    const groups = Object.values(groupsByFood);
    const frequent = groups
      .filter(group => group.count > 1)
      .sort((a, b) => b.count - a.count || b.lastEatenAt - a.lastEatenAt)
      .slice(0, TOP_K);

    const frequentIds = new Set(frequent.map(group => group.id));
    const rare = groups
      .filter(group => !frequentIds.has(group.id))
      .sort((a, b) => a.count - b.count || a.firstEatenAt - b.firstEatenAt)
      .slice(0, TOP_K);

    return [
      ...rare.map(group => buildSuggestion(group, 'rare')),
      ...frequent.map(group => buildSuggestion(group, 'frequent'))
    ];
  }, [transactions]);

  useEffect(() => {
    setActiveIndex(0);
  }, [suggestions.length]);

  useEffect(() => {
    if (suggestions.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex(current => (current + 1) % suggestions.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [suggestions.length]);

  const activeSuggestion = suggestions[activeIndex] || suggestions[0];

  const getArcStyle = (index: number) => {
    if (suggestions.length === 0) {
      return ARC_POSITIONS[0];
    }

    const offset = (index - activeIndex + suggestions.length) % suggestions.length;
    if (offset === 0) {
      return ARC_POSITIONS[0];
    }
    if (offset === 1) {
      return ARC_POSITIONS[1];
    }
    if (offset === 2) {
      return ARC_POSITIONS[2];
    }
    if (offset === suggestions.length - 1) {
      return ARC_POSITIONS[4];
    }
    if (offset === suggestions.length - 2) {
      return ARC_POSITIONS[3];
    }

    return { x: 0, y: 92, scale: 0.38, rotate: 0, opacity: 0, zIndex: 0 };
  };

  return (
    <section className="relative aspect-square rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white text-slate-800">
      <img
        src={activeSuggestion?.imageUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-10 blur-sm scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/95 via-white/90 to-orange-50/95"></div>

      <div className="relative p-4 border-b border-slate-100 flex flex-col gap-3">
        <div>
          <h3 className="font-black text-xl leading-tight bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Gợi ý hôm nay</h3>
        </div>
      </div>

      <div className="relative p-3">
        <div className="relative h-[250px] overflow-hidden rounded-2xl">
          <div className="absolute left-1/2 top-[44%] w-[280px] h-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-100"></div>
            {suggestions.map((suggestion, index) => {
              const arc = getArcStyle(index);
              const isActive = index === activeIndex;

              return (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => {
                    if (isActive) {
                      window.open(suggestion.sourceUrl, '_blank', 'noopener,noreferrer');
                      return;
                    }

                    setActiveIndex(index);
                  }}
                  className="absolute left-1/2 top-[42%] w-[156px] h-[198px] rounded-[22px] overflow-hidden border border-white shadow-xl shadow-blue-100/60 transition-all duration-700 ease-out text-left bg-white"
                  style={{
                    transform: `translate(-50%, -50%) translate(${arc.x}px, ${arc.y}px) scale(${arc.scale}) rotate(${arc.rotate}deg)`,
                    opacity: arc.opacity,
                    zIndex: arc.zIndex,
                    pointerEvents: arc.opacity === 0 ? 'none' : 'auto'
                  }}
                >
                  <img src={suggestion.imageUrl} alt={suggestion.shop} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${suggestion.reason === 'frequent' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      {getReasonLabel(suggestion.reason)}
                    </span>
                  </div>
                  <div className="absolute left-3 right-3 bottom-3">
                    <p className="text-xs font-bold text-white/70 mb-1">{suggestion.shop}</p>
                    <h4 className={`${isActive ? 'text-xl' : 'text-lg'} font-black text-white leading-none`}>
                      {suggestion.dish}
                    </h4>
                    {isActive && (
                      <span className="mt-3 inline-flex w-full justify-center rounded-lg bg-gradient-to-r from-blue-600 to-orange-500 px-2 py-2 text-[11px] font-black text-white">
                        Mở ShopeeFood
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-3 z-50">
            <button
              type="button"
              onClick={() => setActiveIndex(current => (current - 1 + suggestions.length) % suggestions.length)}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-blue-600 border border-blue-100 shadow-sm font-black transition-colors"
              aria-label="Món trước"
            >
              ‹
            </button>
            <div className="flex gap-1.5">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-6 bg-orange-500' : 'w-2 bg-blue-200'}`}
                  aria-label={`Chọn ${suggestion.dish}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActiveIndex(current => (current + 1) % suggestions.length)}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-blue-600 border border-blue-100 shadow-sm font-black transition-colors"
              aria-label="Món sau"
            >
              ›
            </button>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`shrink-0 flex items-center gap-2 rounded-full border px-2 py-1.5 transition-all ${index === activeIndex ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/80 text-slate-600 border-slate-200 hover:border-orange-200 hover:bg-orange-50'}`}
            >
              <img src={suggestion.imageUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
              <span className="text-[11px] font-bold whitespace-nowrap">{suggestion.dish}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FoodSuggestionSlider;
