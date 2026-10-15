import { useId } from 'react';

type HardwareIllustrationProps = {
  category: string;
  name?: string;
  className?: string;
};

const accents: Record<string, string> = {
  cpu: '#73e1dc',
  gpu: '#a392ff',
  motherboard: '#77d4b2',
  ram: '#63cae6',
  storage: '#f2c36c',
  psu: '#93a9bb',
  case: '#88cdeb',
  cooler: '#a7d98e',
  fans: '#71cce1',
  monitor: '#8baeff',
  keyboard: '#c39aff',
  mouse: '#ffc786',
};

export function HardwareIllustration({ category, name, className = '' }: HardwareIllustrationProps) {
  const rawId = useId();
  const id = rawId.replace(/:/g, '');
  const accent = accents[category] ?? '#76d8df';
  const metal = `${id}-metal`;
  const glow = `${id}-glow`;

  const art = (() => {
    switch (category) {
      case 'cpu':
        return (
          <g>
            <path d="M100 48h120v104H100z" fill={`url(#${metal})`} stroke={accent} strokeWidth="2" />
            <path d="M112 58h96v84h-96z" fill="#111f2c" stroke="#92d4df" strokeOpacity=".5" />
            <path d="M125 70h70v60h-70z" fill={`url(#${glow})`} stroke="#d1f5f0" strokeOpacity=".7" />
            <path d="M136 81h48v38h-48z" fill="#142332" stroke="#d6f3ef" strokeOpacity=".35" />
            {Array.from({ length: 8 }, (_, i) => <path key={`cpu-pin-${i}`} d={`M${108 + i * 15} 43v5m0 104v5`} stroke={accent} strokeOpacity=".8" />)}
            {Array.from({ length: 6 }, (_, i) => <path key={`cpu-side-${i}`} d={`M94 ${59 + i * 16}h6m120 0h6`} stroke={accent} strokeOpacity=".8" />)}
          </g>
        );
      case 'gpu':
        return (
          <g>
            <path d="M43 68h218v77H43z" rx="8" fill={`url(#${metal})`} stroke={accent} strokeWidth="2" />
            <path d="M56 78h192v56H56z" fill="#101b29" stroke="#d8e8ff" strokeOpacity=".24" />
            {[98, 151, 204].map((x, i) => <g key={x} transform={`translate(${x} 106)`}>
              <circle r="21" fill="#162637" stroke={accent} strokeOpacity=".8" />
              <circle r="5" fill={accent} fillOpacity=".8" />
              {[0, 60, 120, 180, 240, 300].map((angle) => <path key={angle} d="M0-7c11-7 13-3 9 4L3 5z" fill={accent} fillOpacity=".45" transform={`rotate(${angle})`} />)}
              <circle r="21" fill="none" stroke="#dce8ff" strokeOpacity=".22" />
            </g>)}
            <path d="M49 146h74v6H49zm190-67 17 7v51l-17 8z" fill={accent} fillOpacity=".35" />
            <path d="M85 151v13h96v-13" fill="none" stroke="#dce8ff" strokeOpacity=".5" />
          </g>
        );
      case 'motherboard':
        return (
          <g>
            <path d="M83 31h155l13 13v120H69V45z" fill="#142c2c" stroke={accent} strokeWidth="2" />
            <path d="M101 48h63v60h-63z" fill="#1a2635" stroke={accent} />
            <path d="M112 58h41v40h-41z" fill={`url(#${glow})`} />
            {[176, 190, 204, 218].map((x, i) => <path key={x} d={`M${x} 48h8v74h-8z`} fill={i % 2 ? '#35444d' : '#63717b'} stroke={accent} strokeOpacity=".5" />)}
            <path d="M98 120h62v13H98zm0 19h45v8H98zm78-20h38v20h-38z" fill="#233b48" stroke="#84d1ce" strokeOpacity=".45" />
            <circle cx="84" cy="47" r="3" fill="#c4d8d8" /><circle cx="238" cy="151" r="3" fill="#c4d8d8" />
            <path d="M163 79h11m0 0v29m-11 0h11m24 18h18v11" fill="none" stroke={accent} strokeOpacity=".6" />
          </g>
        );
      case 'ram':
        return (
          <g>
            {[91, 162].map((x, i) => <g key={x} transform={`translate(${x} ${i ? 39 : 50})`}>
              <path d="M0 0h51v104H0z" rx="5" fill={`url(#${metal})`} stroke={accent} strokeWidth="1.7" />
              <path d="M7 10h37v73H7z" fill="#111f2c" stroke="#c2e9ef" strokeOpacity=".34" />
              {[0, 1, 2, 3].map((chip) => <path key={chip} d={`M${12 + chip * 8} ${19 + (chip % 2) * 31}h6v18h-6z`} fill={accent} fillOpacity=".6" />)}
              <path d="M5 92h41m-36 0v8m9-8v8m9-8v8m9-8v8" stroke="#e5d39b" strokeWidth="2" />
              <path d="M7 12h37" stroke="#eefcff" strokeOpacity=".5" />
            </g>)}
          </g>
        );
      case 'storage':
        return (
          <g>
            <path d="M69 78h180v40H69z" rx="7" fill={`url(#${metal})`} stroke={accent} strokeWidth="2" />
            <path d="M82 86h145v24H82z" fill="#111e2b" stroke="#f4dfa8" strokeOpacity=".4" />
            {[97, 128, 159, 190].map((x, i) => <g key={x}>
              <rect x={x} y="91" width="23" height="14" rx="2" fill={i === 1 ? accent : '#657d8a'} fillOpacity=".72" />
              <path d={`M${x + 4} 96h14m-14 4h9`} stroke="#f5f6eb" strokeOpacity=".35" />
            </g>)}
            <circle cx="77" cy="98" r="2" fill="#f4dfa8" /><circle cx="241" cy="98" r="2" fill="#f4dfa8" />
            <path d="M67 118h12v10m168-10h-12v10" fill="none" stroke={accent} />
          </g>
        );
      case 'psu':
        return (
          <g>
            <path d="M90 38h141l14 14v100H76V52z" fill={`url(#${metal})`} stroke={accent} strokeWidth="2" />
            <circle cx="155" cy="91" r="35" fill="#111d29" stroke="#b6c9d5" strokeOpacity=".6" />
            <circle cx="155" cy="91" r="7" fill={accent} fillOpacity=".8" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => <path key={angle} d="M155 84c16-14 24-6 13 7-5 5-9 7-13 7z" fill={accent} fillOpacity=".33" transform={`rotate(${angle} 155 91)`} />)}
            <circle cx="155" cy="91" r="34" fill="none" stroke={accent} strokeOpacity=".65" />
            <path d="M89 133h132" stroke="#dde9ed" strokeOpacity=".5" />
            {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${97 + i * 20} 135v9`} stroke={accent} strokeOpacity=".65" />)}
          </g>
        );
      case 'case':
        return (
          <g>
            <path d="M100 21h117l12 12v145H91V31z" fill={`url(#${metal})`} stroke={accent} strokeWidth="2" />
            <path d="M111 34h92v128h-92z" fill="#0d1925" stroke="#d7edf3" strokeOpacity=".25" />
            <path d="M103 39h4v114h-4z" fill={accent} fillOpacity=".45" />
            <circle cx="157" cy="76" r="24" fill="#132638" stroke={accent} strokeOpacity=".8" />
            <circle cx="157" cy="76" r="5" fill={accent} fillOpacity=".8" />
            {[0, 60, 120, 180, 240, 300].map((angle) => <path key={angle} d="M157 70c13-12 19-4 11 7-4 4-7 6-11 6z" fill={accent} fillOpacity=".45" transform={`rotate(${angle} 157 76)`} />)}
            <path d="M132 114h51v22h-51z" fill="#203449" stroke="#a0cfdb" strokeOpacity=".5" />
            <circle cx="174" cy="125" r="6" fill="none" stroke={accent} />
            <path d="M121 175h81" stroke="#d6e8ed" strokeOpacity=".45" />
          </g>
        );
      case 'cooler':
        return (
          <g>
            <path d="M91 47h91v97H91z" fill={`url(#${metal})`} stroke={accent} strokeWidth="2" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => <path key={i} d={`M${100 + i * 11} 51v88`} stroke="#e1eaf0" strokeOpacity=".26" />)}
            <path d="M99 145v14h75v-14" fill="none" stroke="#e8c77b" strokeWidth="3" />
            <circle cx="204" cy="96" r="37" fill="#152536" stroke={accent} strokeWidth="2" />
            <circle cx="204" cy="96" r="7" fill={accent} fillOpacity=".8" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => <path key={angle} d="M204 89c16-14 23-6 12 7-5 5-8 7-12 7z" fill={accent} fillOpacity=".42" transform={`rotate(${angle} 204 96)`} />)}
            <path d="M99 160h79" stroke="#d7e8ee" strokeOpacity=".6" />
          </g>
        );
      case 'fans':
        return (
          <g>
            {[91, 157, 223].map((x, i) => <g key={x} transform={`translate(${x} 98)`}>
              <rect x="-28" y="-36" width="56" height="72" rx="9" fill={`url(#${metal})`} stroke={accent} strokeOpacity=".75" />
              <circle r="23" fill="#101d2b" stroke={accent} strokeOpacity=".85" />
              <circle r="5" fill={accent} fillOpacity=".9" />
              {[0, 60, 120, 180, 240, 300].map((angle) => <path key={angle} d="M0-7c10-10 17-4 12 5-3 5-8 7-12 8z" fill={accent} fillOpacity=".47" transform={`rotate(${angle})`} />)}
              <circle r="22" fill="none" stroke="#d5eaf0" strokeOpacity=".24" />
            </g>)}
          </g>
        );
      case 'monitor':
        return (
          <g>
            <path d="M55 38h210v104H55z" rx="7" fill={`url(#${metal})`} stroke={accent} strokeWidth="2" />
            <path d="M65 48h190v84H65z" fill="#101b2a" stroke="#ddedff" strokeOpacity=".4" />
            <path d="M74 120 118 77l29 28 27-34 70 61H74z" fill={accent} fillOpacity=".23" />
            <path d="M147 142v23m-30 4h60" stroke="#b9d4dd" strokeWidth="4" strokeLinecap="round" />
          </g>
        );
      case 'keyboard':
        return (
          <g transform="rotate(-3 160 100)">
            <path d="M50 56h220v94H50z" rx="10" fill={`url(#${metal})`} stroke={accent} strokeWidth="2" />
            {Array.from({ length: 5 }, (_, row) => Array.from({ length: row === 4 ? 9 : 13 }, (_, col) => {
              const x = 61 + col * 15 + (row === 4 ? 15 : row === 3 ? 5 : 0);
              const y = 67 + row * 15;
              const width = row === 4 && col === 4 ? 48 : 10;
              return <rect key={`${row}-${col}`} x={x} y={y} width={width} height="10" rx="2" fill={row === 0 && col === 0 ? accent : '#253748'} stroke="#d9eeef" strokeOpacity=".22" />;
            }))}
            <path d="M71 143h178" stroke="#f1d58e" strokeWidth="2" />
          </g>
        );
      case 'mouse':
        return (
          <g>
            <path d="M160 30c-35 0-57 28-57 68v30c0 31 24 53 57 53s57-22 57-53V98c0-40-22-68-57-68z" fill={`url(#${metal})`} stroke={accent} strokeWidth="2" />
            <path d="M160 31v55m-56 13h112" fill="none" stroke="#e4edf0" strokeOpacity=".4" />
            <path d="M158 51h4v20h-4z" rx="2" fill={accent} />
            <path d="M111 100v26c0 25 18 44 45 48-24-17-22-54-18-83m69 9v26c0 25-18 44-45 48 24-17 22-54 18-83" fill={accent} fillOpacity=".1" />
          </g>
        );
      default:
        return <circle cx="160" cy="98" r="42" fill={accent} fillOpacity=".5" />;
    }
  })();

  return (
    <div className={`hardware-illustration ${className}`} aria-hidden="true" data-hardware-illustration={category}>
      <svg viewBox="0 0 320 196" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={metal} x1="58" y1="33" x2="263" y2="165" gradientUnits="userSpaceOnUse">
            <stop stopColor="#45596b" />
            <stop offset=".48" stopColor="#1c2b3a" />
            <stop offset="1" stopColor="#101a27" />
          </linearGradient>
          <radialGradient id={glow} cx="0" cy="0" r="1" gradientTransform="translate(159 100) rotate(90) scale(65 80)" gradientUnits="userSpaceOnUse">
            <stop stopColor={accent} stopOpacity=".72" />
            <stop offset="1" stopColor={accent} stopOpacity=".16" />
          </radialGradient>
        </defs>
        <rect x="1" y="1" width="318" height="194" rx="9" fill="#0d1722" />
        <circle cx="250" cy="34" r="77" fill={accent} fillOpacity=".09" />
        <circle cx="67" cy="168" r="46" fill="#78d7d9" fillOpacity=".035" />
        <path d="M0 155h320M0 165h320M0 175h320M0 185h320M25 0v196M45 0v196M275 0v196M295 0v196" stroke="#b9d9eb" strokeOpacity=".045" />
        <g filter={`drop-shadow(0 12px 10px ${accent}20)`}>{art}</g>
        <path d="M30 20h30M30 20v13m260 143h-25m25 0v-13" stroke={accent} strokeOpacity=".45" />
        <path d="M40 180h46" stroke={accent} strokeOpacity=".75" />
        <circle cx="92" cy="180" r="1.5" fill={accent} />
        <text x="272" y="181" textAnchor="end" fill="#b8c9d4" fontFamily="monospace" fontSize="7" letterSpacing="1">ILLUSTRATION</text>
        {name && <title>{name} — illustrative component art, not an exact product photo</title>}
      </svg>
    </div>
  );
}
