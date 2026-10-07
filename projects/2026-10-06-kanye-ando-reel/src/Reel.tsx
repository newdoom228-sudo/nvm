import React from 'react';
import {AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

const AMBER = '#FFCC33';
const FONT = 'Inter, "Inter Display", sans-serif';
const s = (sec: number) => Math.round(sec * 30);

// Emphasis text: amber with a dark stroke so it reads on light and dark beats.
const Big: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({
  children, size = 110, color = AMBER, style,
}) => (
  <div style={{
    fontFamily: FONT, fontWeight: 900, fontSize: size, color, lineHeight: 1.05, letterSpacing: -2,
    WebkitTextStroke: '6px #111', paintOrder: 'stroke fill', textAlign: 'center', ...style,
  }}>{children}</div>
);

const Pop: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, children, style}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - at, fps, config: {damping: 14, stiffness: 180}});
  if (f < at) return null;
  return <div style={{transform: `scale(${0.6 + 0.4 * p})`, opacity: p, ...style}}>{children}</div>;
};

// Marks where real footage goes; the editor swaps these for clips.
const Slot: React.FC<{label: string}> = ({label}) => (
  <div style={{
    position: 'absolute', top: 120, left: 60, padding: '10px 18px', borderRadius: 10,
    background: 'rgba(0,0,0,0.55)', color: '#fff', fontFamily: FONT, fontSize: 30, fontWeight: 600,
  }}>▶ ФУТАЖ: {label}</div>
);

// Voiceover subtitles, timed per line (local frames within the beat).
const Subs: React.FC<{lines: [number, number, string][]}> = ({lines}) => {
  const f = useCurrentFrame();
  const cur = lines.find(([a, b]) => f >= a && f < b);
  if (!cur) return null;
  return (
    <div style={{position: 'absolute', left: 70, right: 160, top: 1330, textAlign: 'center'}}>
      <span style={{
        fontFamily: FONT, fontWeight: 700, fontSize: 44, lineHeight: 1.3, color: '#fff',
        background: 'rgba(0,0,0,0.72)', padding: '8px 16px', borderRadius: 12,
        boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone',
      }}>{cur[2]}</span>
    </div>
  );
};

// Stylised Ando-like concrete facade; `gutted` 0→1 empties the windows.
const Facade: React.FC<{gutted: number}> = ({gutted}) => {
  const f = useCurrentFrame();
  const panels = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 3; c++) {
      const isWindow = r % 2 === 1;
      panels.push(
        <div key={`${r}-${c}`} style={{
          position: 'absolute', left: 90 + c * 310, top: 260 + r * 170, width: 290, height: 150,
          background: isWindow
            ? `linear-gradient(160deg, rgba(150,200,230,${1 - gutted}) 0%, rgba(60,110,150,${1 - gutted}) 100%), #0b0b0b`
            : `rgb(${190 - gutted * 70},${188 - gutted * 70},${182 - gutted * 70})`,
          boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.12)',
        }}>
          {!isWindow && [0, 1, 2].map((i) => (
            <div key={i} style={{position: 'absolute', top: 30 + (i % 2) * 80, left: 40 + i * 90, width: 10, height: 10, borderRadius: 5, background: 'rgba(0,0,0,0.18)'}} />
          ))}
        </div>,
      );
    }
  }
  const debris = Array.from({length: 40}, (_, i) => {
    const x = (i * 137) % 1000 + 40;
    const y = 300 + ((i * 89 + f * (6 + (i % 5))) % 1200);
    return <div key={i} style={{position: 'absolute', left: x, top: y, width: 8 + (i % 4) * 6, height: 8 + (i % 3) * 5, background: '#8a857c', opacity: gutted, transform: `rotate(${i * 40 + f * 3}deg)`}} />;
  });
  return (
    <AbsoluteFill style={{background: gutted > 0.5 ? '#2a2826' : '#d9dde0'}}>
      {panels}
      {debris}
    </AbsoluteFill>
  );
};

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const cut = s(1.2);
  const gutted = f >= cut ? 1 : 0;
  const shake = f >= cut && f < cut + 8 ? Math.sin(f * 3) * 14 : 0;
  const zoom = interpolate(f, [0, cut], [1.15, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{transform: `translateX(${shake}px)`}}>
      <AbsoluteFill style={{transform: `scale(${f < cut ? zoom : 1.05})`}}><Facade gutted={gutted} /></AbsoluteFill>
      <Slot label={f < cut ? 'фасад дома Андо, крупно' : 'пустой интерьер, мусор'} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingBottom: 260}}>
        <Big size={150}>$57 000 000</Big>
        <Pop at={cut}><Big size={130} color="#fff">→ без окон</Big></Pop>
      </AbsoluteFill>
      <Subs lines={[[0, s(2.6), 'Канье Уэст купил дом Тадао Андо за 57 миллионов долларов.'], [s(2.6), s(5), 'И решил, что окна там лишние.']]} />
    </AbsoluteFill>
  );
};

const Strike: React.FC<{at: number; text: string; strike?: boolean}> = ({at, text, strike = true}) => {
  const f = useCurrentFrame();
  const w = interpolate(f, [at + 8, at + 18], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Pop at={at} style={{position: 'relative', margin: '18px 0'}}>
      <Big size={84} color="#fff">{text}</Big>
      {strike && <div style={{position: 'absolute', left: '5%', top: '50%', height: 12, width: `${w * 0.9}%`, background: '#E5484D', borderRadius: 6}} />}
    </Pop>
  );
};

const Plan: React.FC = () => {
  const f = useCurrentFrame();
  const bgs = ['#30343a', '#3b3226', '#262b30'];
  const labels = ['фасад', 'интерьер до', 'стройка'];
  const i = Math.min(2, Math.floor(f / s(1)));
  return (
    <AbsoluteFill style={{background: bgs[i]}}>
      <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.07) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.07) 2px, transparent 2px)', backgroundSize: '60px 60px'}} />
      <Slot label={`быстрая нарезка: ${labels[i]}`} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingBottom: 300}}>
        <Strike at={s(2.4)} text="Окна" />
        <Strike at={s(3.1)} text="Электричество" />
        <Strike at={s(3.8)} text="Сантехника" />
        <Pop at={s(4.9)} style={{marginTop: 30}}><Big size={100}>Лестница → горка</Big></Pop>
      </AbsoluteFill>
      <Subs lines={[
        [0, s(2.3), 'По материалам суда, он хотел сделать из него бункер:'],
        [s(2.3), s(4.6), 'убрать окна, электричество, сантехнику.'],
        [s(4.6), s(6.2), 'А лестницу заменить горкой.'],
        [s(6.2), s(9), 'Концепт для фильма про апокалипсис — с бюджетом девелопера.'],
      ]} />
    </AbsoluteFill>
  );
};

const Generator: React.FC = () => {
  const f = useCurrentFrame();
  const vib = Math.sin(f * 2.2) * 3;
  return (
    <div style={{position: 'absolute', left: 340, top: 300, transform: `translateY(${vib}px)`}}>
      <div style={{width: 400, height: 260, background: '#c9a227', borderRadius: 24, border: '8px solid #111', position: 'relative'}}>
        <div style={{position: 'absolute', inset: 40, background: 'repeating-linear-gradient(90deg,#111 0 14px,transparent 14px 34px)', borderRadius: 8}} />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', top: -60 - ((f * 3 + i * 30) % 90), left: 300 + i * 26, width: 40, height: 40, borderRadius: 20, background: 'rgba(160,160,160,0.5)'}} />
      ))}
    </div>
  );
};

const Refusal: React.FC = () => (
  <AbsoluteFill style={{background: 'repeating-linear-gradient(135deg,#1c1c1c 0 60px,#232323 60px 120px)'}}>
    <Generator />
    <Slot label="генератор, кабели → фото/силуэт Саксона" />
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingTop: 260}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Pop at={s(1.2)}><Big size={96} color="#fff">Отказ</Big></Pop>
        <Pop at={s(4.4)}><Big size={96}>↓ «враг»</Big></Pop>
        <Pop at={s(5.4)}><Big size={96} color="#E5484D">↓ увольнение</Big></Pop>
      </div>
    </AbsoluteFill>
    <Subs lines={[
      [0, s(1.8), 'Прораб Тони Саксон отказался:'],
      [s(1.8), s(4.2), 'без разрешений и с генераторами в доме это опасно.'],
      [s(4.2), s(6.6), 'По его словам, Уэст назвал его врагом и уволил.'],
      [s(6.6), s(10), 'Обычно такое кончается письмом юриста. Здесь — судом.'],
    ]} />
  </AbsoluteFill>
);

const Verdict: React.FC = () => {
  const f = useCurrentFrame();
  const amount = Math.round(interpolate(f, [s(1.6), s(3)], [0, 140000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}));
  return (
    <AbsoluteFill style={{background: '#0d0d0f', justifyContent: 'center', alignItems: 'center', paddingBottom: 300}}>
      <Pop at={0}><Big size={70} color="#bbb">Март 2026 · присяжные</Big></Pop>
      {f >= s(1.6) && <Big size={170} style={{margin: '30px 0'}}>${amount.toLocaleString('ru-RU')}</Big>}
      <Pop at={s(3.4)}><Big size={60} color="#fff">$100 000 — лечение<br />$40 000 — страдания</Big></Pop>
      <Pop at={s(5.6)} style={{marginTop: 40}}><Big size={58} color="#E5484D">Незаконное увольнение — не признано</Big></Pop>
      <Pop at={s(7.6)} style={{marginTop: 30}}><Big size={50} color="#bbb">Уэст оспаривает решение</Big></Pop>
      <Subs lines={[
        [0, s(3.4), 'В марте 2026-го присяжные присудили Саксону 140 тысяч долларов —'],
        [s(3.4), s(5.4), 'на лечение и за перенесённые страдания.'],
        [s(5.4), s(7.8), 'Но незаконным увольнение не признали.'],
        [s(7.8), s(10), 'Победа — со звёздочкой.'],
      ]} />
    </AbsoluteFill>
  );
};

const Idea: React.FC = () => {
  const f = useCurrentFrame();
  const drift = interpolate(f, [0, s(7)], [1, 1.06]);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#e9e4dc,#cfc7bb)'}}>
      <div style={{position: 'absolute', left: 190, top: 330, width: 700, height: 820, borderRadius: 40, background: '#b9b0a3', transform: `scale(${drift})`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontFamily: FONT, fontSize: 40, fontWeight: 700, color: '#6e665c'}}>ВЕДУЩИЙ В КАДРЕ</div>
      </div>
      <Slot label="ведущий, спокойный план, окно с городом" />
      <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 1170}}>
        <Pop at={s(5)}><Big size={88} style={{whiteSpace: 'nowrap'}}>Идея ≠ готовый дом</Big></Pop>
      </AbsoluteFill>
      <Subs lines={[
        [0, s(1.8), 'Архитектура — это не только идея.'],
        [s(1.8), s(4.4), 'Это свет, инженерия, разрешения и люди внутри.'],
        [s(4.4), s(7), 'Дом может быть смелым. Но он должен работать.'],
      ]} />
    </AbsoluteFill>
  );
};

const Cta: React.FC = () => (
  <AbsoluteFill style={{background: '#111', justifyContent: 'center', alignItems: 'center', paddingBottom: 260}}>
    <Slot label="ведущий в камеру, лёгкая улыбка" />
    <Pop at={0}><Big size={78} color="#fff">Недвижимость,<br />в которой можно жить</Big></Pop>
    <Pop at={s(1.2)} style={{marginTop: 50}}><Big size={110}>Пишите — подберу</Big></Pop>
    <Pop at={s(1.8)} style={{marginTop: 50}}>
      <div style={{width: 260, height: 260, border: '6px dashed #888', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: 34, color: '#888', fontWeight: 700}}>QR / @контакт</div>
    </Pop>
    <Subs lines={[[0, s(1.8), 'Хотите жить, а не выживать?'], [s(1.8), s(4), 'Пишите — подберу дом, где окна уже в проекте.']]} />
  </AbsoluteFill>
);

export const Reel: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Sequence from={s(0)} durationInFrames={s(5)}><Hook /></Sequence>
    <Sequence from={s(5)} durationInFrames={s(9)}><Plan /></Sequence>
    <Sequence from={s(14)} durationInFrames={s(10)}><Refusal /></Sequence>
    <Sequence from={s(24)} durationInFrames={s(10)}><Verdict /></Sequence>
    <Sequence from={s(34)} durationInFrames={s(7)}><Idea /></Sequence>
    <Sequence from={s(41)} durationInFrames={s(4)}><Cta /></Sequence>
  </AbsoluteFill>
);
