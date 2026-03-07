import { useState } from 'react';
import { FiPlus, FiTrash2, FiImage, FiStar } from 'react-icons/fi';

export default function ImageUploader({ images = [], onChange }) {
  const [input, setInput] = useState('');

  const addImage = () => {
    const url = input.trim();
    if (!url) return;
    if (images.includes(url)) return;
    if (images.length >= 5) { alert('Max 5 images'); return; }
    onChange([...images, url]);
    setInput('');
  };

  const removeImage = (idx) => onChange(images.filter((_, i) => i !== idx));
  const setMain = (idx) => {
    const reordered = [...images];
    const [moved] = reordered.splice(idx, 1);
    reordered.unshift(moved);
    onChange(reordered);
  };

  return (
    <div>
      <label className="text-xs text-white/40 mb-1.5 block font-medium">
        Product Images <span className="text-white/20">(up to 5 — first image is main)</span>
      </label>

      {/* Add input */}
      <div className="flex gap-2 mb-3">
        <input
          type="url"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())}
          placeholder="Paste image URL and press Add"
          className="input-field flex-1 text-sm"
        />
        <button type="button" onClick={addImage}
          disabled={images.length >= 5}
          className="btn-primary px-4 text-sm flex items-center gap-1.5 disabled:opacity-40">
          <FiPlus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Image previews */}
      {images.length > 0 ? (
        <div className="grid grid-cols-5 gap-2">
          {images.map((url, i) => (
            <div key={i} className={`relative group rounded-xl overflow-hidden border-2 transition-all ${i === 0 ? 'border-primary-500' : 'border-white/8'}`}>
              <img src={url} alt={`img-${i}`} className="w-full aspect-square object-cover"
                onError={e => { e.target.src = 'https://picsum.photos/200'; }} />
              {/* Overlay */}
              <div className="absolute inset-0 bg-dark-900/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-1">
                {i !== 0 && (
                  <button type="button" onClick={() => setMain(i)}
                    className="w-7 h-7 bg-yellow-500/90 rounded-lg flex items-center justify-center" title="Set as main">
                    <FiStar className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
                <button type="button" onClick={() => removeImage(i)}
                  className="w-7 h-7 bg-red-500/90 rounded-lg flex items-center justify-center">
                  <FiTrash2 className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              {i === 0 && (
                <div className="absolute top-1 left-1 bg-primary-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">MAIN</div>
              )}
            </div>
          ))}
          {/* Add more placeholder */}
          {images.length < 5 && (
            <div className="border-2 border-dashed border-white/10 rounded-xl aspect-square flex items-center justify-center text-white/20">
              <FiImage className="w-5 h-5" />
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-white/8 rounded-xl p-6 text-center">
          <FiImage className="w-8 h-8 text-white/15 mx-auto mb-1" />
          <p className="text-white/25 text-xs">No images added yet</p>
        </div>
      )}
      <p className="text-white/15 text-xs mt-1.5">{images.length}/5 images · Hover to set main or remove</p>
    </div>
  );
}