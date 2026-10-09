import React, { useState } from 'react';
import { X, Tag, Plus, Trash2, Check, Image as ImageIcon } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { Category } from '../../types/finance.ts';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#2ECC71', // emerald green
  '#27AE60',
  '#FFD700', // yellow gold
  '#F39C12', // orange
  '#E74C3C', // coral red
  '#C0392B',
  '#3498DB', // blue
  '#2980B9',
  '#9B59B6', // purple
  '#8E44AD',
  '#1ABC9C', // teal
  '#7F8C8D', // gray
];

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose }) => {
  const { data, addCategory, deleteCategory } = useFinance();
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2ECC71');
  const [imageUrl, setImageUrl] = useState('');

  if (!isOpen) return null;

  const currentCategories = data.categories.filter((c) => c.type === activeTab);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCategory({
      name: name.trim(),
      type: activeTab,
      color,
      imageUrl: imageUrl.trim() || undefined,
    });
    setName('');
    setImageUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-[#1E1E1E] border border-neutral-700/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#FFD700]" />
          Administrar Categorías
        </h3>
        <p className="text-xs text-neutral-400 mt-1">
          Crea nuevas categorías personalizadas y asígnales colores e iconos o URLs de imágenes.
        </p>

        {/* Tab switch */}
        <div className="mt-4 flex rounded-xl bg-[#121212] p-1 border border-neutral-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('income');
              setColor('#2ECC71');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'income'
                ? 'bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Categorías de Ingresos
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('expense');
              setColor('#E74C3C');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'expense'
                ? 'bg-[#E74C3C]/20 text-[#E74C3C] border border-[#E74C3C]/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Categorías de Egresos
          </button>
        </div>

        {/* Form to add new */}
        <form onSubmit={handleAdd} className="mt-4 p-3 bg-[#151515] border border-neutral-800 rounded-xl space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Nueva categoría de ${activeTab === 'income' ? 'ingreso' : 'egreso'}...`}
              className="flex-1 bg-[#1E1E1E] border border-neutral-700 focus:border-[#FFD700] rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-1.5 bg-[#FFD700] hover:bg-yellow-400 text-black text-xs font-bold rounded-xl transition-colors shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Color picker */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-neutral-400 mr-1">Color:</span>
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-[#151515]' : 'opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>

            {/* Optional Image URL */}
            <div className="flex-1">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="URL de logo/icono (opcional)"
                className="w-full bg-[#1E1E1E] border border-neutral-700 rounded-xl px-2.5 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none text-[11px]"
              />
            </div>
          </div>
        </form>

        {/* List of existing categories */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-60">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Existentes ({currentCategories.length})
          </span>
          {currentCategories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-2 rounded-xl bg-[#151515] border border-neutral-800/80 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.imageUrl && (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-5 h-5 rounded object-cover border border-neutral-700"
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                )}
                <span className="text-xs text-neutral-200 font-medium">{cat.name}</span>
              </div>

              {currentCategories.length > 1 && (
                <button
                  type="button"
                  onClick={() => deleteCategory(cat.id)}
                  title="Eliminar categoría"
                  className="p-1 text-neutral-500 hover:text-[#E74C3C] hover:bg-neutral-800 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
