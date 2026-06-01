import { Gauge } from 'lucide-react';
import { useLanguage } from '../store/LanguageContext';
import { useState } from 'react';

export function UIOverlay() {
  const { lang, setLang, t } = useLanguage();
  const [routeSpeed, setRouteSpeed] = useState(1);
  const [cardScale, setCardScale] = useState(0.72);
  const [routeSpread, setRouteSpread] = useState(0.7);

  function updateRouteSpeed(nextSpeed: number) {
    setRouteSpeed(nextSpeed);
    window.dispatchEvent(new CustomEvent('route-speed-change', { detail: nextSpeed }));
  }

  function updateCardScale(nextScale: number) {
    setCardScale(nextScale);
    window.dispatchEvent(new CustomEvent('route-card-scale-change', { detail: nextScale }));
  }

  function updateRouteSpread(nextSpread: number) {
    setRouteSpread(nextSpread);
    window.dispatchEvent(new CustomEvent('route-spread-change', { detail: nextSpread }));
  }

  const sliders = [
    {
      label: t('speedLabel'),
      value: routeSpeed,
      min: 0.25,
      max: 3,
      step: 0.05,
      minLabel: t('speedSlow'),
      maxLabel: t('speedFast'),
      displayValue: `${routeSpeed.toFixed(2)}x`,
      onChange: updateRouteSpeed,
    },
    {
      label: t('cardScaleLabel'),
      value: cardScale,
      min: 0.38,
      max: 1.2,
      step: 0.02,
      minLabel: t('cardScaleSmall'),
      maxLabel: t('cardScaleLarge'),
      displayValue: `${Math.round(cardScale * 100)}%`,
      onChange: updateCardScale,
    },
    {
      label: t('routeSpreadLabel'),
      value: routeSpread,
      min: 0.35,
      max: 1,
      step: 0.02,
      minLabel: t('routeSpreadDense'),
      maxLabel: t('routeSpreadOpen'),
      displayValue: `${Math.round(routeSpread * 100)}%`,
      onChange: updateRouteSpread,
    },
  ];

  return (
    <div className="absolute inset-0 z-10 flex h-full w-full flex-col justify-between font-sans text-slate-200 pointer-events-none">
      <div
        className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen"
        style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
      <div
        className="absolute inset-0 pointer-events-none mix-blend-screen"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(30, 58, 138, 0.15) 0%, transparent 70%)' }}
      />

      <div className="pointer-events-auto absolute right-6 top-6 z-20 flex rounded-lg border border-white/10 bg-slate-900/50 p-1 backdrop-blur">
        {(['zh', 'en'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`rounded px-3 py-1.5 text-xs font-mono font-bold transition-colors ${
              lang === l ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <header className="pointer-events-auto relative z-10 w-max border-b border-white/5 bg-slate-950/40 p-6 backdrop-blur-md animate-fade-in">
        <h1 className="text-xl font-bold uppercase tracking-widest text-white">
          {t('title')} <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">{t('subtitle')}</span>
        </h1>
        <div className="mt-1 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-[10px] font-mono uppercase tracking-tighter text-emerald-500/80">{t('desc')}</span>
        </div>
      </header>

      <section className="pointer-events-auto absolute bottom-20 right-6 z-20 grid w-[min(19rem,calc(100vw-3rem))] gap-4 rounded-lg border border-white/10 bg-slate-950/80 px-4 py-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Gauge className="h-4 w-4 flex-none text-cyan-300" />
          <span className="truncate text-[10px] font-mono uppercase tracking-[0.22em] text-slate-300">
            {t('controlPanel')}
          </span>
        </div>

        {sliders.map((slider) => (
          <div key={slider.label}>
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-[10px] font-mono uppercase tracking-[0.22em] text-slate-300">
                {slider.label}
              </span>
              <span className="rounded border border-cyan-300/25 bg-cyan-400/10 px-2 py-1 text-[10px] font-mono font-bold text-cyan-100">
                {slider.displayValue}
              </span>
            </div>
            <input
              aria-label={slider.label}
              className="mt-3 h-2 w-full accent-cyan-300"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              type="range"
              value={slider.value}
              onChange={(event) => slider.onChange(Number(event.target.value))}
            />
            <div className="mt-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">
              <span>{slider.minLabel}</span>
              <span>{slider.maxLabel}</span>
            </div>
          </div>
        ))}
      </section>

      <footer className="pointer-events-auto relative z-10 flex items-center justify-between border-t border-white/5 bg-black/40 px-6 py-3 text-[10px] font-mono text-slate-500 backdrop-blur-sm">
        <div className="flex gap-6 uppercase">
          <span>
            {t('posLabel')}: {t('tracking')}
          </span>
          <span>
            {t('fovLabel')}: 60&deg;
          </span>
        </div>
        <div className="flex gap-4">
          <span>{t('sysStatus')}</span>
          <span className="text-cyan-500/70">{t('viewLogs')}</span>
        </div>
      </footer>
    </div>
  );
}
