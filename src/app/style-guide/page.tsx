'use client';

/**
 * MAC Design System - Style Guide
 * A comprehensive visual reference for the MAC Design System
 * By Matthew Adam Carpenter
 */

import { useState } from 'react';

export default function StyleGuidePage() {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'spacing' | 'components' | 'effects'>('colors');

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white overflow-x-hidden">
      {/* Floating Orbs Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full bg-[#4a9eff]/10 blur-[100px] animate-float" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-[#a855f7]/10 blur-[120px] animate-float-delayed" />
        <div className="absolute top-[60%] left-[40%] w-[300px] h-[300px] rounded-full bg-[#3b82f6]/8 blur-[80px] animate-float-slow" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4a9eff] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="text-2xl font-extralight tracking-tight">MAC</span>
            </div>
            <div>
              <h1 className="text-5xl font-[100] tracking-tight bg-gradient-to-r from-white via-[#e0e7ff] to-[#c7d2fe] bg-clip-text text-transparent">
                Design System
              </h1>
              <p className="text-[#a3a3a3] font-light text-sm mt-1">
                Professional Design Standards by Matthew Adam Carpenter
              </p>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <nav className="flex gap-1">
            {(['colors', 'typography', 'spacing', 'components', 'effects'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg font-light text-sm capitalize transition-all duration-150 ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-[#4a9eff]/20 to-[#a855f7]/20 text-white border border-white/10'
                    : 'text-[#a3a3a3] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        {activeTab === 'colors' && <ColorsSection />}
        {activeTab === 'typography' && <TypographySection />}
        {activeTab === 'spacing' && <SpacingSection />}
        {activeTab === 'components' && <ComponentsSection />}
        {activeTab === 'effects' && <EffectsSection />}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] py-8">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p className="text-[#737373] font-light text-sm">
            "Design is not just what it looks like. Design is how it works."
          </p>
          <p className="text-[#a3a3a3] font-light text-xs mt-2">
            The MAC Design System — Where Professional Meets Perfect
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.02); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.08); }
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 12s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 15s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COLORS SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

function ColorsSection() {
  const colorGroups = [
    {
      title: 'Primary Palette',
      description: 'Professional blues and purples that define the MAC aesthetic',
      colors: [
        { name: 'Blue 400', value: '#4a9eff', variable: '--mac-primary-blue-400', usage: 'Primary actions, focus states' },
        { name: 'Blue 600', value: '#3b82f6', variable: '--mac-primary-blue-600', usage: 'Button gradients, emphasis' },
        { name: 'Purple 400', value: '#a855f7', variable: '--mac-accent-purple-400', usage: 'Accent highlights, gradients' },
        { name: 'Purple 600', value: '#9333ea', variable: '--mac-accent-purple-600', usage: 'Deep accents, hover states' },
      ],
    },
    {
      title: 'Surface Hierarchy',
      description: 'Dark theme excellence with depth and elevation',
      colors: [
        { name: 'Background', value: '#0c0c0c', variable: '--mac-surface-background', usage: 'Page background' },
        { name: 'Elevated', value: '#141414', variable: '--mac-surface-elevated', usage: 'Cards, panels, elevated surfaces' },
        { name: 'Card', value: 'rgba(20, 20, 20, 0.9)', variable: '--mac-surface-card', usage: 'Glass cards with transparency' },
      ],
    },
    {
      title: 'Text Hierarchy',
      description: 'Crystal clear typography with purpose',
      colors: [
        { name: 'Primary', value: '#ffffff', variable: '--mac-text-primary', usage: 'Headlines, important text' },
        { name: 'Secondary', value: '#a3a3a3', variable: '--mac-text-secondary', usage: 'Body text, descriptions' },
        { name: 'Muted', value: '#737373', variable: '--mac-text-muted', usage: 'Labels, placeholders' },
      ],
    },
    {
      title: 'Status Colors',
      description: 'Semantic feedback with professional subtlety',
      colors: [
        { name: 'Success', value: '#10b981', variable: '--mac-success-green', usage: 'Success states, positive feedback' },
        { name: 'Warning', value: '#eab308', variable: '--mac-warning-yellow', usage: 'Warning states, cautions' },
        { name: 'Error', value: '#ef4444', variable: '--mac-error-red', usage: 'Error states, destructive actions' },
        { name: 'Info', value: '#60a5fa', variable: '--mac-info', usage: 'Informational states, tips' },
      ],
    },
  ];

  return (
    <div className="space-y-12">
      <SectionHeader
        title="Color Architecture"
        description="A sophisticated dark-first palette designed for professional applications and extended use."
      />

      {colorGroups.map((group) => (
        <div key={group.title} className="space-y-4">
          <div className="mb-6">
            <h3 className="text-xl font-[200] text-white mb-1">{group.title}</h3>
            <p className="text-[#a3a3a3] font-light text-sm">{group.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {group.colors.map((color) => (
              <div
                key={color.name}
                className="group bg-[#141414] border border-white/[0.08] rounded-xl overflow-hidden hover:border-[#4a9eff]/30 transition-all duration-150"
              >
                <div
                  className="h-24 relative"
                  style={{ backgroundColor: color.value }}
                >
                  <div className="absolute bottom-2 right-2 text-[10px] font-mono opacity-80 px-2 py-1 bg-black/30 rounded backdrop-blur-sm">
                    {color.value}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-white font-light text-sm mb-1">{color.name}</p>
                  <code className="text-[#a855f7] text-xs font-mono block mb-2 opacity-80">
                    {color.variable}
                  </code>
                  <p className="text-[#737373] text-xs">{color.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Gradient Rule */}
      <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-6 mt-8">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4a9eff] to-[#a855f7] flex items-center justify-center shrink-0">
            <span className="text-lg">⚡</span>
          </div>
          <div>
            <h4 className="text-white font-light text-lg mb-2">The Gradient Rule</h4>
            <p className="text-[#a3a3a3] font-light text-sm leading-relaxed">
              <strong className="text-white">Gradients are reserved for buttons ONLY.</strong> All other elements must use solid colors.
              This maintains visual hierarchy and ensures buttons stand out as actionable elements.
            </p>
            <div className="mt-4 flex gap-4">
              <button className="px-6 py-2 bg-gradient-to-r from-[#4a9eff] to-[#a855f7] rounded-lg text-sm font-normal transition-all duration-150 hover:brightness-110">
                Gradient Button
              </button>
              <div className="px-6 py-2 bg-[#1a1a1a] border border-white/[0.08] rounded-lg text-sm font-light text-[#a3a3a3]">
                ✗ Solid Card
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TYPOGRAPHY SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

function TypographySection() {
  const typographyScale = [
    { name: 'Display', size: '60px (3.75rem)', weight: '100', lineHeight: '1.2', sample: 'Ultra Light Impact', className: 'text-[60px] font-[100] leading-[1.2] tracking-tight' },
    { name: 'Heading', size: '36px (2.25rem)', weight: '200', lineHeight: '1.2', sample: 'Elegant Hierarchy', className: 'text-[36px] font-[200] leading-[1.2]' },
    { name: 'Title', size: '24px (1.5rem)', weight: '300', lineHeight: '1.5', sample: 'Section Titles & Labels', className: 'text-[24px] font-[300] leading-[1.5]' },
    { name: 'Body', size: '16px (1rem)', weight: '300', lineHeight: '1.75', sample: 'Perfect readability for extended reading. This is the default text style for paragraphs and general content.', className: 'text-[16px] font-[300] leading-[1.75] text-[#a3a3a3]' },
    { name: 'Small', size: '14px (0.875rem)', weight: '300', lineHeight: '1.5', sample: 'Supporting text, captions, and metadata', className: 'text-[14px] font-[300] leading-[1.5] text-[#a3a3a3]' },
    { name: 'Tiny', size: '12px (0.75rem)', weight: '300', lineHeight: '1.5', sample: 'Labels, badges, and fine print', className: 'text-[12px] font-[300] leading-[1.5] text-[#737373]' },
  ];

  return (
    <div className="space-y-12">
      <SectionHeader
        title="Typography Excellence"
        description="Ultra-light weights (100-400) create elegance and sophistication. Never exceed 400 weight except for buttons."
      />

      {/* Weight Philosophy */}
      <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-6">
        <h3 className="text-white font-[200] text-xl mb-4">The Light Typography Philosophy</h3>
        <div className="grid grid-cols-4 gap-6">
          {[
            { weight: 100, label: 'Ultra Light', usage: 'Display text' },
            { weight: 200, label: 'Extra Light', usage: 'Headings' },
            { weight: 300, label: 'Light', usage: 'Titles, Body' },
            { weight: 400, label: 'Regular', usage: 'Buttons only' },
          ].map((item) => (
            <div key={item.weight} className="text-center">
              <div className={`text-4xl mb-2 font-[${item.weight}]`} style={{ fontWeight: item.weight }}>
                Aa
              </div>
              <p className="text-white text-sm font-light">{item.weight}</p>
              <p className="text-[#a855f7] text-xs">{item.label}</p>
              <p className="text-[#737373] text-xs mt-1">{item.usage}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Typography Scale */}
      <div className="space-y-6">
        {typographyScale.map((type) => (
          <div
            key={type.name}
            className="bg-[#141414] border border-white/[0.08] rounded-xl p-6 hover:border-[#4a9eff]/20 transition-colors duration-150"
          >
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <span className="px-3 py-1 bg-[#4a9eff]/10 text-[#4a9eff] rounded-full text-xs font-normal">
                    {type.name}
                  </span>
                  <span className="text-[#737373] text-xs font-mono">
                    {type.size} · weight {type.weight} · line-height {type.lineHeight}
                  </span>
                </div>
                <p className={type.className}>{type.sample}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SPACING SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

function SpacingSection() {
  const spacingScale = [0, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96];

  return (
    <div className="space-y-12">
      <SectionHeader
        title="8px Grid System"
        description="Strictly enforced spacing creates visual harmony. Only use values from the scale: 0, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96."
      />

      {/* Visual Scale */}
      <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-8">
        <h3 className="text-white font-[200] text-lg mb-6">Spacing Scale</h3>
        <div className="space-y-4">
          {spacingScale.map((size) => (
            <div key={size} className="flex items-center gap-6">
              <span className="text-[#737373] text-sm font-mono w-16 text-right">{size}px</span>
              <div className="flex-1 flex items-center gap-4">
                <div
                  className="bg-gradient-to-r from-[#4a9eff] to-[#a855f7] rounded-sm transition-all duration-200"
                  style={{ width: `${Math.max(size, 4)}px`, height: '24px' }}
                />
                <span className="text-[#a3a3a3] text-xs">
                  {size === 0 && 'Zero spacing'}
                  {size === 2 && 'Micro adjustment'}
                  {size === 4 && 'Tight spacing (icons, inline)'}
                  {size === 8 && 'Base unit'}
                  {size === 12 && 'Compact spacing'}
                  {size === 16 && 'Standard spacing'}
                  {size === 24 && 'Card padding'}
                  {size === 32 && 'Section gaps'}
                  {size === 48 && 'Large sections'}
                  {size === 64 && 'Page sections'}
                  {size === 96 && 'Major divisions'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Component Standards */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-6">
          <h3 className="text-white font-[200] text-lg mb-4">Component Standards</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#4a9eff]" />
              <span className="text-[#a3a3a3]">Button padding: <code className="text-[#a855f7]">12px 24px</code></span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#4a9eff]" />
              <span className="text-[#a3a3a3]">Input height: <code className="text-[#a855f7]">40px</code> minimum</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#4a9eff]" />
              <span className="text-[#a3a3a3]">Card padding: <code className="text-[#a855f7]">24px</code></span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#4a9eff]" />
              <span className="text-[#a3a3a3]">Section spacing: <code className="text-[#a855f7]">32px</code> minimum</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#4a9eff]" />
              <span className="text-[#a3a3a3]">Touch targets: <code className="text-[#a855f7]">44×44px</code> minimum</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-6">
          <h3 className="text-white font-[200] text-lg mb-4">Border Radius</h3>
          <div className="space-y-4">
            {[
              { name: 'Small', value: '6px', usage: 'Inputs, buttons' },
              { name: 'Medium', value: '8px', usage: 'Cards, dropdowns' },
              { name: 'Large', value: '12px', usage: 'Modals, containers' },
              { name: 'Full', value: '9999px', usage: 'Pills, badges' },
            ].map((radius) => (
              <div key={radius.name} className="flex items-center gap-4">
                <div
                  className="w-12 h-12 bg-gradient-to-br from-[#4a9eff]/30 to-[#a855f7]/30 border border-white/[0.08]"
                  style={{ borderRadius: radius.value === '9999px' ? '9999px' : radius.value }}
                />
                <div>
                  <p className="text-white text-sm font-light">{radius.name}</p>
                  <p className="text-[#737373] text-xs">{radius.value} · {radius.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTS SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

function ComponentsSection() {
  return (
    <div className="space-y-12">
      <SectionHeader
        title="Component Library"
        description="Professional components that embody the MAC design philosophy. Each component is crafted for elegance and functionality."
      />

      {/* Buttons */}
      <div className="space-y-6">
        <h3 className="text-xl font-[200] text-white">Buttons</h3>
        <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-8">
          <div className="flex flex-wrap gap-4 items-center">
            <button className="px-6 py-3 bg-gradient-to-r from-[#4a9eff] to-[#a855f7] rounded-lg text-sm font-normal transition-all duration-150 hover:brightness-110">
              Primary Action
            </button>
            <button className="px-6 py-3 bg-[#141414] border border-white/[0.12] rounded-lg text-sm font-normal text-white hover:bg-white/[0.04] hover:border-[#4a9eff] transition-all duration-150">
              Secondary
            </button>
            <button className="px-6 py-3 rounded-lg text-sm font-light text-[#a3a3a3] hover:text-white hover:bg-white/[0.04] transition-all duration-150">
              Ghost
            </button>
            <button className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm font-normal text-red-400 hover:bg-red-500/20 transition-all duration-150">
              Destructive
            </button>
          </div>
          <p className="text-[#737373] text-xs mt-6">
            Note: Only Primary buttons may use gradients. All other buttons use solid colors.
          </p>
        </div>
      </div>

      {/* Form Elements */}
      <div className="space-y-6">
        <h3 className="text-xl font-[200] text-white">Form Elements</h3>
        <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-light text-white mb-2">Text Input</label>
                <input
                  type="text"
                  placeholder="Enter your name..."
                  className="w-full px-4 py-3 bg-[#0c0c0c] border border-white/[0.08] rounded-lg text-white placeholder-[#737373] font-light text-sm focus:outline-none focus:border-[#4a9eff] focus:ring-2 focus:ring-[#4a9eff]/20 transition-all duration-150"
                />
              </div>
              <div>
                <label className="block text-sm font-light text-white mb-2">With Error</label>
                <input
                  type="text"
                  defaultValue="Invalid input"
                  className="w-full px-4 py-3 bg-[#0c0c0c] border border-red-500/50 rounded-lg text-white font-light text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
                <p className="text-red-400 text-xs mt-2">This field is required</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-light text-white mb-2">Textarea</label>
                <textarea
                  placeholder="Enter description..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[#0c0c0c] border border-white/[0.08] rounded-lg text-white placeholder-[#737373] font-light text-sm focus:outline-none focus:border-[#4a9eff] focus:ring-2 focus:ring-[#4a9eff]/20 transition-all duration-150 resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-6">
        <h3 className="text-xl font-[200] text-white">Cards</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-[#4a9eff]/10 flex items-center justify-center mb-4">
              <span className="text-[#4a9eff]">✦</span>
            </div>
            <h4 className="text-white font-light text-lg mb-2">Standard Card</h4>
            <p className="text-[#a3a3a3] text-sm font-light">Elevated surface with hover lift effect and border highlight.</p>
          </div>

          <div className="mac-glass p-6">
            <div className="w-10 h-10 rounded-lg bg-[#a855f7]/10 flex items-center justify-center mb-4">
              <span className="text-[#a855f7]">◈</span>
            </div>
            <h4 className="text-white font-light text-lg mb-2">Glass Card</h4>
            <p className="text-[#a3a3a3] text-sm font-light">Glassmorphism with backdrop blur for layered interfaces.</p>
          </div>

          <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-6 shadow-lg shadow-black/50">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4a9eff] to-[#a855f7] flex items-center justify-center mb-4">
              <span className="text-white">★</span>
            </div>
            <h4 className="text-white font-light text-lg mb-2">Elevated Card</h4>
            <p className="text-[#a3a3a3] text-sm font-light">Deep shadow for prominent placement in the visual hierarchy.</p>
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="space-y-6">
        <h3 className="text-xl font-[200] text-white">Status Badges</h3>
        <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-8">
          <div className="flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-300">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Connected
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-300">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Warning
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-orange-500/30 rounded-lg text-xs text-orange-300">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              Error
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Info
            </span>
          </div>
          <p className="text-[#737373] text-xs mt-6">
            Status badges use subtle transparent backgrounds. The pulsing dot communicates urgency, not alarming background colors.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EFFECTS SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

function EffectsSection() {
  return (
    <div className="space-y-12">
      <SectionHeader
        title="Visual Effects & Polish"
        description="Subtle animations and effects that create a premium feel. Every animation has functional purpose."
      />

      {/* Animation Timing */}
      <div className="space-y-6">
        <h3 className="text-xl font-[200] text-white">Animation Timing</h3>
        <div className="grid grid-cols-4 gap-6">
          {[
            { name: 'Fast', duration: '100ms', usage: 'Micro-interactions, hover' },
            { name: 'Base', duration: '150ms', usage: 'Standard transitions' },
            { name: 'Slow', duration: '300ms', usage: 'Page transitions' },
            { name: 'Slower', duration: '500ms', usage: 'Complex animations' },
          ].map((timing) => (
            <div key={timing.name} className="bg-[#141414] border border-white/[0.08] rounded-xl p-6 text-center">
              <div
                className="w-full h-3 bg-gradient-to-r from-[#4a9eff] to-[#a855f7] rounded-full mb-4 origin-left animate-scale"
                style={{
                  animation: `scaleX ${timing.duration} ease-in-out infinite alternate`,
                }}
              />
              <p className="text-white font-light">{timing.name}</p>
              <p className="text-[#a855f7] text-sm font-mono">{timing.duration}</p>
              <p className="text-[#737373] text-xs mt-2">{timing.usage}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Glassmorphism */}
      <div className="space-y-6">
        <h3 className="text-xl font-[200] text-white">Glassmorphism</h3>
        <div className="relative h-64 rounded-xl overflow-hidden">
          {/* Background with colors */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#4a9eff]/30 via-[#0c0c0c] to-[#a855f7]/30" />
          <div className="absolute top-8 left-8 w-32 h-32 rounded-full bg-[#4a9eff]/40 blur-xl" />
          <div className="absolute bottom-8 right-8 w-40 h-40 rounded-full bg-[#a855f7]/40 blur-xl" />
          
          {/* Glass panel */}
          <div className="absolute inset-8 flex items-center justify-center">
            <div className="mac-glass p-8 max-w-md">
              <h4 className="text-white font-[200] text-xl mb-2">Glass Effect</h4>
              <p className="text-[#a3a3a3] text-sm font-light">
                backdrop-filter: blur(24px) creates depth while maintaining readability. 
                Use rgba backgrounds with 40-85% opacity depending on backdrop support.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Glow Effects */}
      <div className="space-y-6">
        <h3 className="text-xl font-[200] text-white">Glow Effects</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-8 text-center">
            <div className="inline-block p-8 rounded-2xl shadow-[0_0_30px_rgba(74,158,255,0.3),0_0_60px_rgba(168,85,247,0.2)]">
              <span className="text-4xl">✦</span>
            </div>
            <p className="text-white font-light mt-4">Blue-Purple Glow</p>
            <p className="text-[#737373] text-xs mt-1">For highlighted elements and focal points</p>
          </div>
          <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-8 text-center">
            <input
              type="text"
              placeholder="Focused input glow"
              className="px-4 py-3 bg-[#0c0c0c] border border-[#4a9eff] rounded-lg text-white placeholder-[#737373] font-light text-sm shadow-[0_0_12px_rgba(74,158,255,0.15),0_0_4px_rgba(74,158,255,0.1)] ring-2 ring-[#4a9eff]/20"
            />
            <p className="text-white font-light mt-4">Focus Glow</p>
            <p className="text-[#737373] text-xs mt-1">3px ring with subtle shadow</p>
          </div>
        </div>
      </div>

      {/* Floating Orbs Demo */}
      <div className="space-y-6">
        <h3 className="text-xl font-[200] text-white">Floating Orbs Background</h3>
        <div className="relative h-48 rounded-xl overflow-hidden bg-[#0c0c0c] border border-white/[0.08]">
          <div className="absolute top-[10%] left-[20%] w-24 h-24 rounded-full bg-[#4a9eff]/20 blur-[40px] animate-[float_6s_ease-in-out_infinite]" />
          <div className="absolute bottom-[10%] right-[20%] w-32 h-32 rounded-full bg-[#a855f7]/20 blur-[50px] animate-[float_8s_ease-in-out_infinite_reverse]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[#a3a3a3] text-sm font-light">Ambient floating orbs create depth and atmosphere</p>
          </div>
        </div>
      </div>

      {/* Animation Principles */}
      <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-6">
        <h3 className="text-white font-[200] text-lg mb-4">Animation Principles</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-[#4a9eff] text-sm mb-2">✓ GPU-Accelerated Properties</h4>
            <ul className="space-y-1 text-sm text-[#a3a3a3]">
              <li className="font-mono">transform (translate, scale, rotate)</li>
              <li className="font-mono">opacity</li>
            </ul>
          </div>
          <div>
            <h4 className="text-red-400 text-sm mb-2">✗ Avoid Animating</h4>
            <ul className="space-y-1 text-sm text-[#a3a3a3]">
              <li className="font-mono">width / height</li>
              <li className="font-mono">left / top / right / bottom</li>
              <li className="font-mono">margin / padding</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleX {
          from { transform: scaleX(0.3); }
          to { transform: scaleX(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-[200] text-white mb-2">{title}</h2>
      <p className="text-[#a3a3a3] font-light text-lg max-w-2xl">{description}</p>
    </div>
  );
}




