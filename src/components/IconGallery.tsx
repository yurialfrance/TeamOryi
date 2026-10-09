import { Icon, type IconName } from './Icon'
import { ICON_NAMES } from './iconNames'

export function IconGallery() {
  return (
    <div className="p-4 grid grid-cols-6 gap-3 bg-white">
      {ICON_NAMES.map((n) => (
        <div key={n} className="flex flex-col items-center gap-1 text-[10px] font-bold text-ink-soft">
          <Icon name={n as IconName} size={44} />
          {n}
        </div>
      ))}
      {(['pizza', 'scale', 'jeep', 'sunflower'] as IconName[]).map((n) => (
        <div key={n + 'w'} className="flex flex-col items-center gap-1 text-[10px] font-bold bg-sky rounded-full p-2"><Icon name={n} size={36} white /></div>
      ))}
    </div>
  )
}
