import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Check,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  Users,
  Briefcase,
  Building2,
  TrendingUp,
  Tag,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { UserProfile } from '../../types/finance.ts';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

const PRESET_COLORS = [
  { label: 'Oro BCV', color: '#FFD700' },
  { label: 'Esmeralda', color: '#2ECC71' },
  { label: 'Zafiro', color: '#3498DB' },
  { label: 'Amatista', color: '#9B59B6' },
  { label: 'Carmesí', color: '#E74C3C' },
  { label: 'Naranja', color: '#E67E22' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    data,
    updateProfile,
    profiles,
    activeProfileId,
    activeProfile,
    switchProfile,
    createProfile,
    deleteProfile,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'edit' | 'manage'>('edit');

  // Edit current profile fields
  const [name, setName] = useState(data.profile.name);
  const [title, setTitle] = useState(data.profile.title);
  const [avatarUrl, setAvatarUrl] = useState(data.profile.avatarUrl);
  const [accountType, setAccountType] = useState<UserProfile['accountType']>(
    data.profile.accountType || 'personal'
  );
  const [colorTag, setColorTag] = useState<string>(data.profile.colorTag || '#FFD700');

  // New profile creation fields
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileTitle, setNewProfileTitle] = useState('');
  const [newProfileAccountType, setNewProfileAccountType] = useState<UserProfile['accountType']>('negocio');
  const [newProfileColor, setNewProfileColor] = useState('#2ECC71');
  const [newProfileAvatar, setNewProfileAvatar] = useState(PRESET_AVATARS[1]);
  const [copyCategories, setCopyCategories] = useState(true);

  // Status message
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(data.profile.name);
    setTitle(data.profile.title);
    setAvatarUrl(data.profile.avatarUrl);
    setAccountType(data.profile.accountType || 'personal');
    setColorTag(data.profile.colorTag || '#FFD700');
  }, [data.profile, activeProfileId]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isNew = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (isNew) {
            setNewProfileAvatar(reader.result);
          } else {
            setAvatarUrl(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || 'Usuario',
      title: title.trim() || 'Administrador',
      avatarUrl: avatarUrl.trim(),
      accountType,
      colorTag,
    });
    setFeedbackMsg({ text: 'Perfil actualizado con éxito.' });
    setTimeout(() => {
      setFeedbackMsg(null);
      onClose();
    }, 1200);
  };

  const handleCreateNewProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    createProfile(
      {
        name: newProfileName.trim(),
        title: newProfileTitle.trim() || 'Administrador',
        avatarUrl: newProfileAvatar,
        accountType: newProfileAccountType,
        colorTag: newProfileColor,
      },
      copyCategories
    );

    setShowCreateForm(false);
    setNewProfileName('');
    setNewProfileTitle('');
    setFeedbackMsg({ text: `¡Perfil "${newProfileName.trim()}" creado y activado!` });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleDelete = (id: string, profileName: string) => {
    if (window.confirm(`¿Seguro que deseas eliminar el perfil "${profileName}" y TODOS sus registros? Esta acción es irreversible.`)) {
      const res = deleteProfile(id);
      if (res.success) {
        setFeedbackMsg({ text: res.message });
      } else {
        setFeedbackMsg({ text: res.message, error: true });
      }
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const getAccountTypeIcon = (type?: string) => {
    switch (type) {
      case 'negocio':
        return <Briefcase className="w-3.5 h-3.5" />;
      case 'empresa':
        return <Building2 className="w-3.5 h-3.5" />;
      case 'inversion':
        return <TrendingUp className="w-3.5 h-3.5" />;
      default:
        return <User className="w-3.5 h-3.5" />;
    }
  };

  const getAccountTypeLabel = (type?: string) => {
    switch (type) {
      case 'negocio':
        return 'Negocio / Comercio';
      case 'empresa':
        return 'Empresa / Corporativo';
      case 'inversion':
        return 'Inversiones & Activos';
      default:
        return 'Personal & Familiar';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-[#1A1A1A] border border-neutral-700/80 rounded-2xl sm:rounded-3xl w-full max-w-xl p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.85)] z-10 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-black shadow-md shrink-0"
              style={{ backgroundColor: colorTag || '#FFD700' }}
            >
              {getAccountTypeIcon(accountType)}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Gestión de Perfiles de Usuario
              </h3>
              <p className="text-xs text-neutral-400">
                Almacena datos, ingresos y egresos independientes por cada perfil
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-[#121212] rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'edit'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#E6B800] text-black shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Editar Perfil Activo</span>
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#E6B800] text-black shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Mis Perfiles ({profiles.length})</span>
          </button>
        </div>

        {feedbackMsg && (
          <div
            className={`mt-3 p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in duration-200 ${
              feedbackMsg.error
                ? 'bg-red-950/40 border-red-500/50 text-red-200'
                : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
            }`}
          >
            {feedbackMsg.error ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
          {/* ========================================================
              TAB 1: EDIT ACTIVE PROFILE
             ======================================================== */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveCurrent} className="space-y-4 animate-in fade-in duration-200">
              {/* Avatar Preview & Actions */}
              <div className="flex items-center gap-4 p-3 bg-[#151515] border border-neutral-800 rounded-2xl">
                <div
                  className="relative w-16 h-16 rounded-2xl overflow-hidden bg-neutral-800 border-2 shrink-0 flex items-center justify-center shadow-md"
                  style={{ borderColor: colorTag || '#FFD700' }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={() => setAvatarUrl('')}
                    />
                  ) : (
                    <User className="w-7 h-7 text-neutral-500" />
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload(e, false)}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#FFD700]" />
                    <span>Subir Logotipo / Foto</span>
                  </button>
                  <p className="text-[10px] text-neutral-400">
                    PNG, JPG o WebP guardado localmente
                  </p>
                </div>
              </div>

              {/* Name & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Nombre del Perfil
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Josmar Puerta"
                    className="w-full bg-[#121212] border border-neutral-700 focus:border-[#FFD700] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Cargo / Descripción
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Finanzas Personales / Negocio"
                    className="w-full bg-[#121212] border border-neutral-700 focus:border-[#FFD700] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Account Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Tipo de Cuenta / Rubro
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['personal', 'negocio', 'empresa', 'inversion'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setAccountType(t)}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        accountType === t
                          ? 'bg-yellow-500/15 border-[#FFD700] text-white shadow-sm'
                          : 'bg-[#141414] border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="text-[#FFD700]">{getAccountTypeIcon(t)}</div>
                      <span className="text-[11px] font-semibold capitalize">{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Tag Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Color Distintivo del Perfil
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c.color}
                      onClick={() => setColorTag(c.color)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        colorTag === c.color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    >
                      {colorTag === c.color && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Presets */}
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1.5">
                  Avatares predeterminados:
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setAvatarUrl(url)}
                      className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        avatarUrl === url
                          ? 'border-[#FFD700] scale-105 shadow-md'
                          : 'border-neutral-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold text-black bg-gradient-to-r from-[#FFD700] to-[#E6B800] hover:from-yellow-400 hover:to-yellow-500 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================
              TAB 2: MANAGE PROFILES & CREATE
             ======================================================== */}
          {activeTab === 'manage' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Header with New Profile button */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Perfiles Almacenados en este Dispositivo
                  </span>
                  <p className="text-[11px] text-neutral-400">
                    Cada perfil posee su propia base de datos de ingresos, egresos y deudas.
                  </p>
                </div>

                {!showCreateForm && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#E6B800] text-black text-xs font-extrabold shadow-sm hover:from-yellow-400 hover:to-yellow-500 transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Crear Nuevo Perfil</span>
                  </button>
                )}
              </div>

              {/* Inline Create Form */}
              {showCreateForm && (
                <form
                  onSubmit={handleCreateNewProfile}
                  className="p-4 rounded-2xl bg-[#151515] border border-yellow-500/40 space-y-3 shadow-lg animate-in slide-in-from-top-3 duration-200"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <span className="text-xs font-bold text-[#FFD700] flex items-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      Registrar Nuevo Perfil Financiero
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="text-neutral-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Nombre del Perfil *
                      </label>
                      <input
                        type="text"
                        required
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                        placeholder="Ej. Mi Negocio / Tienda, Consultoría..."
                        className="w-full bg-[#1F1F1F] border border-neutral-700 focus:border-[#FFD700] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Descripción o Rubro
                      </label>
                      <input
                        type="text"
                        value={newProfileTitle}
                        onChange={(e) => setNewProfileTitle(e.target.value)}
                        placeholder="Ej. Venta de Repuestos, Servicios..."
                        className="w-full bg-[#1F1F1F] border border-neutral-700 focus:border-[#FFD700] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Account Type and Color */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Tipo de Cuenta
                      </label>
                      <select
                        value={newProfileAccountType}
                        onChange={(e) => setNewProfileAccountType(e.target.value as any)}
                        className="w-full bg-[#1F1F1F] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFD700]"
                      >
                        <option value="personal">Personal / Familiar</option>
                        <option value="negocio">Negocio / Emprendimiento</option>
                        <option value="empresa">Empresa / Corporativo</option>
                        <option value="inversion">Inversiones & Activos</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Color Distintivo
                      </label>
                      <div className="flex items-center gap-2 pt-0.5">
                        {PRESET_COLORS.map((c) => (
                          <button
                            type="button"
                            key={c.color}
                            onClick={() => setNewProfileColor(c.color)}
                            className={`w-6 h-6 rounded-lg transition-transform ${
                              newProfileColor === c.color ? 'ring-2 ring-white scale-110' : 'opacity-70'
                            }`}
                            style={{ backgroundColor: c.color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={copyCategories}
                      onChange={(e) => setCopyCategories(e.target.checked)}
                      className="rounded border-neutral-700 text-[#FFD700] focus:ring-0"
                    />
                    <span>Copiar categorías existentes al nuevo perfil</span>
                  </label>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold text-black bg-[#FFD700] hover:bg-yellow-400 rounded-xl shadow-md cursor-pointer"
                    >
                      Crear y Cambiar a este Perfil
                    </button>
                  </div>
                </form>
              )}

              {/* Profiles List */}
              <div className="space-y-2.5">
                {profiles.map((p) => {
                  const isActive = p.id === activeProfileId;

                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-neutral-800/90 border-[#FFD700] shadow-[0_4px_20px_rgba(255,215,0,0.15)] ring-1 ring-[#FFD700]/30'
                          : 'bg-[#151515] border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 border-2 shrink-0 flex items-center justify-center shadow-inner"
                          style={{ borderColor: p.colorTag || '#FFD700' }}
                        >
                          {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 text-neutral-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-white truncate">
                              {p.name}
                            </span>
                            {isActive && (
                              <span className="text-[9px] font-bold text-[#FFD700] bg-yellow-500/20 border border-yellow-500/30 px-1.5 py-0.2 rounded-full">
                                ACTIVO AHORA
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                            <span>{p.title || 'Administrador'}</span>
                            <span>·</span>
                            <span className="capitalize text-neutral-300 font-medium">
                              {getAccountTypeLabel(p.accountType)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isActive ? (
                          <button
                            type="button"
                            onClick={() => setActiveTab('edit')}
                            className="px-3 py-1.5 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-xs font-semibold text-white transition-colors cursor-pointer"
                          >
                            Editar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              switchProfile(p.id);
                              setFeedbackMsg({ text: `Cambiado al perfil "${p.name}". Datos cargados.` });
                              setTimeout(() => setFeedbackMsg(null), 2500);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#E6B800] hover:from-yellow-400 hover:to-yellow-500 text-black text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                          >
                            <span>Cambiar</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {profiles.length > 1 && !isActive && (
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-2 rounded-xl text-neutral-400 hover:text-[#E74C3C] hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Eliminar este perfil y sus datos"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#FFD700]" />
            Almacenamiento segmentado en LocalStorage
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
