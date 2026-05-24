// Category color mapping for BrightPath-style cards
export const categoryColors: Record<string, { bg: string; light: string; text: string; accent: string; progress: string }> = {
  'Design': { 
    bg: 'bg-blue-600', 
    light: 'bg-blue-50', 
    text: 'text-blue-600',
    accent: 'bg-blue-500',
    progress: 'bg-blue-500'
  },
  'Business': { 
    bg: 'bg-orange-500', 
    light: 'bg-orange-50', 
    text: 'text-orange-600',
    accent: 'bg-orange-500',
    progress: 'bg-orange-500'
  },
  'Programming': { 
    bg: 'bg-purple-600', 
    light: 'bg-purple-50', 
    text: 'text-purple-600',
    accent: 'bg-purple-500',
    progress: 'bg-purple-500'
  },
  'Languages': { 
    bg: 'bg-gray-900', 
    light: 'bg-gray-50', 
    text: 'text-gray-900',
    accent: 'bg-gray-700',
    progress: 'bg-gray-700'
  },
  'Tiếng Anh': { 
    bg: 'bg-red-500', 
    light: 'bg-red-50', 
    text: 'text-red-600',
    accent: 'bg-red-500',
    progress: 'bg-red-500'
  },
  'Marketing': { 
    bg: 'bg-pink-500', 
    light: 'bg-pink-50', 
    text: 'text-pink-600',
    accent: 'bg-pink-500',
    progress: 'bg-pink-500'
  },
  'Data Science': { 
    bg: 'bg-emerald-600', 
    light: 'bg-emerald-50', 
    text: 'text-emerald-600',
    accent: 'bg-emerald-500',
    progress: 'bg-emerald-500'
  },
  'Photography': { 
    bg: 'bg-amber-500', 
    light: 'bg-amber-50', 
    text: 'text-amber-600',
    accent: 'bg-amber-500',
    progress: 'bg-amber-500'
  },
  'Music': { 
    bg: 'bg-indigo-600', 
    light: 'bg-indigo-50', 
    text: 'text-indigo-600',
    accent: 'bg-indigo-500',
    progress: 'bg-indigo-500'
  },
  'Writing': { 
    bg: 'bg-teal-600', 
    light: 'bg-teal-50', 
    text: 'text-teal-600',
    accent: 'bg-teal-500',
    progress: 'bg-teal-500'
  },
};

// Default color for unknown categories
export const defaultCategoryColor = { 
  bg: 'bg-slate-600', 
  light: 'bg-slate-50', 
  text: 'text-slate-600',
  accent: 'bg-slate-500',
  progress: 'bg-slate-500'
};

export function getCategoryColor(category: string) {
  // Normalize category name (handle Vietnamese)
  const normalized = Object.keys(categoryColors).find(key => 
    category.toLowerCase().includes(key.toLowerCase()) ||
    key.toLowerCase().includes(category.toLowerCase())
  );
  return categoryColors[normalized || category] || defaultCategoryColor;
}

// Avatar stack component helper
export function generateAvatarStack(_seed: string, count: number = 3): string[] {
  return Array.from({ length: count }, () => '/default-avatar.png');
}
