'use client';

import { Scenario } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function BlockListItem({
  scenario,
  index,
  isSelected,
  onSelect,
}: {
  scenario: Scenario;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scenario.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-grab active:cursor-grabbing transition-all ${
        isSelected
          ? 'bg-violet-600/20 ring-2 ring-violet-500'
          : 'bg-slate-800/50 hover:bg-slate-700/50'
      }`}
    >
      {/* 번호 */}
      <div className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
        isSelected ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-300'
      }`}>
        {index + 1}
      </div>

      {/* 썸네일 */}
      <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-slate-900">
        <img
          src={scenario.selected_image_url || ''}
          alt=""
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* 제목 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {scenario.title_text || `블록 ${index + 1}`}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {scenario.layout_preset || 'vertical'}
        </p>
      </div>
    </div>
  );
}
