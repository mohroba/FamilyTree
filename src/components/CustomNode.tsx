/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Handle, Position } from '@xyflow/react';
import { User, Palette, Image as ImageIcon, Trash2, Settings } from 'lucide-react';
import { FamilyMember } from '../types';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { toPersianDigits } from '../utils';

interface CustomNodeProps {
  data: FamilyMember;
  selected: boolean;
  id: string;
}

export default function CustomNode({ data, selected, id }: CustomNodeProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <div 
          className={`
            relative px-4 py-3 rounded-xl shadow-lg transition-all duration-200 border-2
            ${selected ? 'scale-105 shadow-xl ring-2 ring-app-sage/20' : ''}
            w-[200px] text-center overflow-hidden
          `}
          style={{ 
            backgroundColor: data.bgColor || 'var(--color-app-sidebar)',
            borderColor: data.borderColor || (selected ? 'var(--color-app-sage)' : 'var(--color-app-accent)'),
            color: data.textColor || 'var(--color-app-text)'
          }}
        >
          <Handle type="target" position={Position.Top} className="!bg-app-accent" />
          
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-14 h-14 rounded-full bg-app-bg/50 border border-app-border flex items-center justify-center overflow-hidden">
              {data.image ? (
                <img src={data.image} alt={data.name} className="w-full h-full object-cover" />
              ) : data.avatar ? (
                <span className="text-3xl">{data.avatar}</span>
              ) : (
                <User className="w-7 h-7 text-app-accent opacity-50" />
              )}
            </div>
            
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-sm leading-tight">{data.name}</span>
              {(data.birthDate || data.deathDate) && (
                <span className="text-[10px] opacity-60 font-mono flex flex-col items-center">
                  {data.birthDate && <span>تولد: {toPersianDigits(data.birthDate.replace(/-/g, '/'))}</span>}
                  {data.deathDate && <span>فوت: {toPersianDigits(data.deathDate.replace(/-/g, '/'))}</span>}
                </span>
              )}
              {data.relation && (
                <span className="text-[9px] bg-app-accent/10 dark:bg-app-accent/20 px-2 py-0.5 rounded-full font-medium mt-1 inline-block mx-auto">
                  {data.relation}
                </span>
              )}
            </div>
          </div>

          <Handle type="source" position={Position.Bottom} className="!bg-app-accent" />
        </div>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className="z-50 min-w-[160px] bg-app-sidebar rounded-lg p-1 shadow-2xl border border-app-border animate-in fade-in zoom-in duration-100">
          <ContextMenu.Label className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            تنظیمات عضو
          </ContextMenu.Label>
          
          <ContextMenu.Item className="flex items-center gap-2 px-2 py-2 text-xs rounded hover:bg-app-bg cursor-pointer transition-colors"
            onSelect={() => {
              const input = document.createElement('input');
              input.type = 'color';
              input.oninput = (e: any) => {
                window.dispatchEvent(new CustomEvent('node-action', { detail: { type: 'color', id, value: e.target.value } }));
              };
              input.click();
            }}>
            <Palette className="w-3.5 h-3.5 text-app-accent" />
            تغییر رنگ پس‌زمینه
          </ContextMenu.Item>

          <ContextMenu.Item className="flex items-center gap-2 px-2 py-2 text-xs rounded hover:bg-app-bg cursor-pointer transition-colors"
            onSelect={() => window.dispatchEvent(new CustomEvent('node-action', { detail: { type: 'edit', id } }))}>
            <Settings className="w-3.5 h-3.5 text-app-accent" />
            ویرایش مشخصات
          </ContextMenu.Item>
          
          <ContextMenu.Item className="flex items-center gap-2 px-2 py-2 text-xs rounded hover:bg-app-bg cursor-pointer transition-colors"
            onSelect={() => window.dispatchEvent(new CustomEvent('node-action', { detail: { type: 'image', id } }))}>
            <ImageIcon className="w-3.5 h-3.5 text-app-accent" />
            تغییر تصویر
          </ContextMenu.Item>
          
          <ContextMenu.Separator className="h-px bg-app-border my-1" />
          
          <ContextMenu.Item className="flex items-center gap-2 px-2 py-2 text-xs rounded hover:bg-red-50 text-red-500 cursor-pointer transition-colors"
            onSelect={() => window.dispatchEvent(new CustomEvent('node-action', { detail: { type: 'delete', id } }))}>
            <Trash2 className="w-3.5 h-3.5" />
            حذف نود
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
