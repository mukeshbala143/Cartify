import { useState } from 'react';
import { FiStar } from 'react-icons/fi';

export function StarDisplay({ rating = 0, count }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1,2,3,4,5].map(star => (
          <FiStar key={star} className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-white/20'}`} />
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-white/40">({count})</span>}
    </div>
  );
}

export function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(star => (
        <button key={star} type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <FiStar className={`w-7 h-7 transition-colors ${star <= (hover || value) ? 'text-yellow-400 fill-current' : 'text-white/20'}`} />
        </button>
      ))}
    </div>
  );
}
